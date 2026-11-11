// Per-step state and helpers: register and memory access, and the phases the board shows.
import { hex, memText } from "./assembler.ts";
import { mask, toSigned } from "./alu.ts";
import type { Flags, Instr, MemOperand, MemWrite, Operand, Phase, Reg16, Regs, SReg, Size, WireRef } from "./types.ts";

export const h = (v: number, size: Size = 16) => `${hex(v, size === 8 ? 2 : 4)}h`;
export const h5 = (v: number) => `${hex(v, 5)}h`;
export const phys = (seg: number, off: number) => (seg * 16 + off) & 0xfffff;

export class CpuFault extends Error {}

/** A resolved memory operand: which segment, the effective address and the physical address. */
export type MemRef = { seg: SReg; segVal: number; ea: number; phys: number; regs: string[]; disp: number };

type PhaseInput = Omit<Phase, "roles"> & { roles?: Phase["roles"] };
type Source = { nodes: string[]; wires: WireRef[]; roles?: Phase["roles"] };

const isByteReg = (name: string) => name.length === 2 && (name[1] === "L" || name[1] === "H") && "ABCD".includes(name[0]);
export const bytesOf = (v: number, size: Size) => (size === 8 ? [v & 0xff] : [v & 0xff, (v >> 8) & 0xff]);
export const bytesText = (b: number[]) => b.map((x) => hex(x, 2)).join(" ");

export class StepContext {
  readonly writes: MemWrite[] = [];
  readonly reads: number[] = [];
  readonly phases: Phase[] = [];
  halted = false;

  readonly r: Regs;
  readonly mem: Uint8Array;
  readonly instr: Instr;
  /** Address of the next instruction (IP after decode). */
  readonly next: number;

  constructor(r: Regs, mem: Uint8Array, instr: Instr, next: number) {
    this.r = r;
    this.mem = mem;
    this.instr = instr;
    this.next = next;
  }

  get f(): Flags {
    return this.r.flags;
  }
  get size(): Size {
    return this.instr.size ?? 16;
  }

  // ---- registers ----
  get(name: string): number {
    if (isByteReg(name)) {
      const full = this.r[`${name[0]}X` as Reg16];
      return name[1] === "L" ? full & 0xff : full >> 8;
    }
    return this.r[name as Reg16 | SReg];
  }
  set(name: string, v: number) {
    if (isByteReg(name)) {
      const k = `${name[0]}X` as Reg16;
      const r = this.r;
      r[k] = name[1] === "L" ? (r[k] & 0xff00) | (v & 0xff) : (r[k] & 0xff) | ((v & 0xff) << 8);
    } else this.r[name as Reg16 | SReg] = v & 0xffff;
  }

  // ---- memory ----
  memRef(o: MemOperand): MemRef {
    const regs = [o.base, o.index].filter((x): x is NonNullable<typeof x> => !!x);
    const ea = (regs.reduce((s, k) => s + this.r[k], 0) + o.disp) & 0xffff;
    const seg: SReg = o.base === "BP" ? "SS" : "DS";
    return { seg, segVal: this.r[seg], ea, phys: phys(this.r[seg], ea), regs, disp: toSigned(o.disp, 16) };
  }
  stackRef(sp: number): MemRef {
    return { seg: "SS", segVal: this.r.SS, ea: sp, phys: phys(this.r.SS, sp), regs: ["SP"], disp: 0 };
  }
  /** The high byte of a word is at offset + 1 in the same segment, wrapping at FFFFh. */
  private highAddr(ref: MemRef) {
    return phys(ref.segVal, (ref.ea + 1) & 0xffff);
  }
  private readMem(ref: MemRef, size: Size) {
    this.reads.push(ref.phys);
    if (size === 8) return this.mem[ref.phys];
    const hi = this.highAddr(ref);
    this.reads.push(hi);
    return this.mem[ref.phys] | (this.mem[hi] << 8);
  }
  private writeByte(p: number, v: number) {
    this.writes.push({ addr: p, old: this.mem[p], value: v & 0xff });
    this.mem[p] = v & 0xff;
  }
  private writeMem(ref: MemRef, v: number, size: Size) {
    this.writeByte(ref.phys, v);
    if (size === 16) this.writeByte(this.highAddr(ref), v >> 8);
  }

  // ---- operands on the board ----
  static node(o: Operand) {
    return o.kind === "reg" || o.kind === "sreg" ? o.name : o.kind === "imm" ? "QUEUE" : "MEM";
  }
  /** Wires a value travels on when it is read from this operand. */
  static wiresFrom(o: Operand): WireRef[] {
    if (o.kind === "reg") return ["regs_bus"];
    if (o.kind === "imm") return ["queue_bus"];
    if (o.kind === "mem") return ["mem_bus"];
    if (o.kind === "sreg") return [`bus_${o.name.toLowerCase()}` as WireRef];
    return [];
  }
  /** Wires a value travels on when it is written into this operand. */
  static wiresInto(o: Operand): WireRef[] {
    if (o.kind === "reg") return ["~regs_bus"];
    if (o.kind === "sreg") return [`~bus_${o.name.toLowerCase()}` as WireRef];
    return [];
  }
  describe(o: Operand, size: Size) {
    if (o.kind === "imm") return `the immediate ${h(o.value & mask(size), size)}`;
    if (o.kind === "mem") return memText(o);
    return o.name;
  }

  // ---- phases ----
  push(p: PhaseInput) {
    this.phases.push({ roles: {}, ...p });
  }

  addressPhase(ref: MemRef, what: string) {
    const r = this.r;
    const parts = ref.regs.map((k) => `${k} (${h(r[k as Reg16])})`);
    if (ref.disp) parts.push(ref.disp < 0 ? `(−${h(-ref.disp)})` : h(ref.disp));
    const eaText = !ref.regs.length
      ? `EA = ${h(ref.ea)}, a direct address from the instruction`
      : ref.regs[0] === "SP"
        ? `EA = SP = ${h(ref.ea)}`
        : `EA = ${parts.join(" + ")} = ${h(ref.ea)}`;
    const roles: Phase["roles"] = {};
    ref.regs.forEach((k) => (roles[k] = "src"));
    this.push({
      kind: "address",
      title: "Address",
      text: `${what}: ${eaText}. Σ adds ${ref.seg} × 16, so ${ref.seg}:EA = ${hex(ref.segVal)}:${hex(ref.ea)} → ${h5(ref.phys)}.`,
      wires: [ref.regs.length ? "regs_bus" : "queue_bus", "ea_sigma", `${ref.seg.toLowerCase()}_sigma` as WireRef],
      nodes: ["SIGMA", ref.seg, ...ref.regs, ...(ref.regs.length ? [] : ["QUEUE"])],
      roles,
      stage: 1,
      sigma: { seg: ref.seg, segVal: ref.segVal, off: ref.ea, phys: ref.phys },
    });
  }

  readPhase(ref: MemRef, size: Size) {
    const v = this.readMem(ref, size);
    this.push({
      kind: "read",
      title: "Read memory",
      text: `The bus reads ${size === 8 ? "the byte" : "the word"} at ${h5(ref.phys)}: ${bytesText(bytesOf(v, size))}${size === 16 ? `, so ${h(v)} (little-endian)` : ""}.`,
      wires: ["sigma_mem", "mem_bus"],
      nodes: ["SIGMA", "MEM"],
      stage: 1,
      sigma: { seg: ref.seg, segVal: ref.segVal, off: ref.ea, phys: ref.phys },
      bus: { phys: ref.phys, bytes: bytesOf(v, size), dir: "read" },
    });
    return v;
  }

  writePhase(ref: MemRef, v: number, size: Size, from: Source, text?: string) {
    this.writeMem(ref, v, size);
    this.push({
      kind: "write",
      title: "Write memory",
      text: text ?? `${h(v, size)} goes over the bus to ${h5(ref.phys)} as ${bytesText(bytesOf(v, size))}${size === 16 ? " (low byte first)" : ""}.`,
      wires: [...from.wires, "~mem_bus", "sigma_mem"],
      nodes: ["SIGMA", "MEM", ...from.nodes],
      roles: { MEM: "dst", ...from.roles },
      stage: 3,
      sigma: { seg: ref.seg, segVal: ref.segVal, off: ref.ea, phys: ref.phys },
      bus: { phys: ref.phys, bytes: bytesOf(v, size), dir: "write" },
    });
  }

  /** Read an operand, adding address and read phases when it is in memory. */
  load(o: Operand, size: Size, what: string): number {
    if (o.kind === "imm") return o.value & mask(size);
    if (o.kind === "mem") {
      const ref = this.memRef(o);
      this.addressPhase(ref, what);
      return this.readPhase(ref, size);
    }
    if (o.kind === "reg" || o.kind === "sreg") return this.get(o.name);
    return 0;
  }

  /** Store an ALU result: a write-memory phase for memory, a write-back phase for a register. */
  store(o: Operand, ref: MemRef | null, res: number, size: Size) {
    if (ref) return this.writePhase(ref, res, size, { nodes: ["ALU"], wires: ["alu_bus"] });
    const name = (o as { name: string }).name;
    this.set(name, res);
    this.push({
      kind: "write",
      title: "Write back",
      text: `The result ${h(res, size)} goes back into ${name}.`,
      wires: ["alu_bus", "~regs_bus"],
      nodes: ["ALU", name],
      roles: { [name]: "dst" },
      stage: 3,
    });
  }
}
