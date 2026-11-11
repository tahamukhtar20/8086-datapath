import { ALU_OPS, JCC, ORIGIN, hex, memText } from "./assembler.ts";
import { FLAG_NAMES } from "./types.ts";
import type {
  Flags,
  MemOperand,
  MemWrite,
  Operand,
  Phase,
  Program,
  Reg16,
  Regs,
  Role,
  SReg,
  Size,
  StepResult,
  WireRef,
} from "./types.ts";

const INITIAL_SEGMENTS = { CS: 0x1000, DS: 0x2000, ES: 0x2000, SS: 0x3000 };
const INITIAL_SP = 0xfffe;

export const h = (v: number, size: Size = 16) => `${hex(v, size === 8 ? 2 : 4)}h`;
const h5 = (v: number) => `${hex(v, 5)}h`;
const mask = (size: Size) => (size === 8 ? 0xff : 0xffff);
const sign = (size: Size) => (size === 8 ? 0x80 : 0x8000);
const toSigned = (v: number, size: Size) => (v & sign(size) ? v - (mask(size) + 1) : v);
export const phys = (seg: number, off: number) => (seg * 16 + off) & 0xfffff;

const cloneRegs = (r: Regs): Regs => ({ ...r, flags: { ...r.flags } });

function initialRegs(): Regs {
  return {
    AX: 0, BX: 0, CX: 0, DX: 0, SP: INITIAL_SP, BP: 0, SI: 0, DI: 0,
    ...INITIAL_SEGMENTS,
    IP: ORIGIN,
    flags: { OF: false, SF: false, ZF: false, AF: false, PF: false, CF: false },
  };
}

export class Machine {
  regs = initialRegs();
  mem = new Uint8Array(1 << 20);
  constructor(program: Program) {
    for (const i of program.instrs) i.bytes.forEach((b, k) => (this.mem[phys(this.regs.CS, i.addr + k)] = b));
  }
}

class CpuFault extends Error {}

const parity = (v: number) => {
  let c = 0;
  for (let x = v & 0xff; x; x >>= 1) c += x & 1;
  return c % 2 === 0;
};
function szp(f: Flags, r: number, size: Size) {
  f.ZF = r === 0;
  f.SF = (r & sign(size)) !== 0;
  f.PF = parity(r);
}
function add(f: Flags, a: number, b: number, carry: number, size: Size, setCF = true) {
  const full = a + b + carry;
  const r = full & mask(size);
  if (setCF) f.CF = full > mask(size);
  f.OF = ((a ^ r) & (b ^ r) & sign(size)) !== 0;
  f.AF = ((a ^ b ^ r) & 0x10) !== 0;
  szp(f, r, size);
  return r;
}
function sub(f: Flags, a: number, b: number, borrow: number, size: Size, setCF = true) {
  const full = a - b - borrow;
  const r = full & mask(size);
  if (setCF) f.CF = full < 0;
  f.OF = ((a ^ b) & (a ^ r) & sign(size)) !== 0;
  f.AF = ((a ^ b ^ r) & 0x10) !== 0;
  szp(f, r, size);
  return r;
}
function logic(f: Flags, r: number, size: Size) {
  f.CF = f.OF = f.AF = false;
  szp(f, r, size);
  return r;
}

const CONDITIONS: Record<number, [string, (f: Flags) => boolean]> = {
  0x70: ["OF = 1", (f) => f.OF],
  0x71: ["OF = 0", (f) => !f.OF],
  0x72: ["CF = 1", (f) => f.CF],
  0x73: ["CF = 0", (f) => !f.CF],
  0x74: ["ZF = 1", (f) => f.ZF],
  0x75: ["ZF = 0", (f) => !f.ZF],
  0x76: ["CF = 1 or ZF = 1", (f) => f.CF || f.ZF],
  0x77: ["CF = 0 and ZF = 0", (f) => !f.CF && !f.ZF],
  0x78: ["SF = 1", (f) => f.SF],
  0x79: ["SF = 0", (f) => !f.SF],
  0x7a: ["PF = 1", (f) => f.PF],
  0x7b: ["PF = 0", (f) => !f.PF],
  0x7c: ["SF ≠ OF", (f) => f.SF !== f.OF],
  0x7d: ["SF = OF", (f) => f.SF === f.OF],
  0x7e: ["ZF = 1 or SF ≠ OF", (f) => f.ZF || f.SF !== f.OF],
  0x7f: ["ZF = 0 and SF = OF", (f) => !f.ZF && f.SF === f.OF],
};

function flagChanges(a: Flags, b: Flags) {
  return FLAG_NAMES.filter((n) => a[n] !== b[n]).map((n) => `${n} ${+a[n]}→${+b[n]}`);
}

const ALU_SYMBOL: Record<string, string> = {
  ADD: "+", ADC: "+", SUB: "−", SBB: "−", CMP: "−", AND: "AND", OR: "OR", XOR: "XOR", TEST: "AND",
};

const MULDIV_TEXT: Record<string, string> = {
  MUL8: "AL × operand goes into AX",
  MUL16: "AX × operand goes into DX:AX",
  DIV8: "AX ÷ operand puts the quotient in AL and the remainder (r) in AH",
  DIV16: "DX:AX ÷ operand puts the quotient in AX and the remainder (r) in DX",
};

type MemRef = { seg: SReg; segVal: number; ea: number; phys: number; regs: string[]; disp: number };

export function step(m: Machine, program: Program): StepResult | null {
  const r = m.regs;
  const instr = program.byAddr.get(r.IP);
  if (!instr) return null;
  const before = cloneRegs(r);
  const writes: MemWrite[] = [];
  const reads: number[] = [];
  const phases: Phase[] = [];
  const f = r.flags;
  const len = instr.bytes.length;
  const next = (r.IP + len) & 0xffff;
  let halted = false;
  let error: string | undefined;

  // ---- register and memory access ----
  const get = (name: string): number => {
    if (name.length === 2 && (name[1] === "L" || name[1] === "H") && "ABCD".includes(name[0])) {
      const full = r[`${name[0]}X` as Reg16];
      return name[1] === "L" ? full & 0xff : full >> 8;
    }
    return r[name as Reg16 | SReg];
  };
  const set = (name: string, v: number) => {
    if (name.length === 2 && (name[1] === "L" || name[1] === "H") && "ABCD".includes(name[0])) {
      const k = `${name[0]}X` as Reg16;
      r[k] = name[1] === "L" ? (r[k] & 0xff00) | (v & 0xff) : (r[k] & 0xff) | ((v & 0xff) << 8);
    } else r[name as Reg16 | SReg] = v & 0xffff;
  };
  // The high byte of a word lives at offset + 1 in the same segment: at offset FFFFh it
  // wraps to offset 0000h of that segment, not to the next physical address.
  const highAddr = (ref: MemRef) => phys(ref.segVal, (ref.ea + 1) & 0xffff);
  const readMem = (ref: MemRef, size: Size) => {
    reads.push(ref.phys);
    if (size === 8) return m.mem[ref.phys];
    const hi = highAddr(ref);
    reads.push(hi);
    return m.mem[ref.phys] | (m.mem[hi] << 8);
  };
  const writeByte = (p: number, v: number) => {
    writes.push({ addr: p, old: m.mem[p], value: v & 0xff });
    m.mem[p] = v & 0xff;
  };
  const writeMem = (ref: MemRef, v: number, size: Size) => {
    writeByte(ref.phys, v);
    if (size === 16) writeByte(highAddr(ref), v >> 8);
  };
  const bytesOf = (v: number, size: Size) => (size === 8 ? [v & 0xff] : [v & 0xff, (v >> 8) & 0xff]);
  const bytesText = (b: number[]) => b.map((x) => hex(x, 2)).join(" ");

  const memRef = (o: MemOperand): MemRef => {
    const regs = [o.base, o.index].filter((x): x is NonNullable<typeof x> => !!x);
    const ea = (regs.reduce((s, k) => s + r[k], 0) + o.disp) & 0xffff;
    const seg: SReg = o.base === "BP" ? "SS" : "DS";
    return { seg, segVal: r[seg], ea, phys: phys(r[seg], ea), regs, disp: toSigned(o.disp, 16) };
  };
  const stackRef = (sp: number): MemRef => ({ seg: "SS", segVal: r.SS, ea: sp, phys: phys(r.SS, sp), regs: ["SP"], disp: 0 });

  // ---- phases ----
  const push = (p: Omit<Phase, "roles"> & { roles?: Phase["roles"] }) => phases.push({ roles: {}, ...p });
  const segWire = (s: SReg) => `${s.toLowerCase()}_sigma` as WireRef;
  const opNode = (o: Operand) => (o.kind === "reg" || o.kind === "sreg" ? o.name : o.kind === "imm" ? "QUEUE" : "MEM");
  const opWires = (o: Operand): WireRef[] =>
    o.kind === "reg" ? ["regs_bus"] : o.kind === "imm" ? ["queue_bus"] : o.kind === "mem" ? ["mem_bus"] : o.kind === "sreg" ? [`bus_${o.name.toLowerCase()}` as WireRef] : [];
  const intoWires = (o: Operand): WireRef[] =>
    o.kind === "reg" ? ["~regs_bus"] : o.kind === "sreg" ? [`~bus_${o.name.toLowerCase()}` as WireRef] : [];
  const describe = (o: Operand, size: Size) =>
    o.kind === "imm" ? `the immediate ${h(o.value & mask(size), size)}` : o.kind === "mem" ? memText(o) : o.kind === "label" ? o.name : o.name;

  const addressPhase = (ref: MemRef, what: string) => {
    const parts = ref.regs.map((k) => `${k} (${h(r[k as Reg16])})`);
    if (ref.disp) parts.push(ref.disp < 0 ? `(−${h(-ref.disp)})` : h(ref.disp));
    const eaText = ref.regs.length
      ? ref.regs[0] === "SP"
        ? `EA = SP = ${h(ref.ea)}`
        : `EA = ${parts.join(" + ")} = ${h(ref.ea)}`
      : `EA = ${h(ref.ea)}, a direct address from the instruction`;
    const roles: Phase["roles"] = {};
    ref.regs.forEach((k) => (roles[k] = "src"));
    push({
      kind: "address",
      title: "Address",
      text: `${what}: ${eaText}. Σ adds ${ref.seg} × 16, so ${ref.seg}:EA = ${hex(ref.segVal)}:${hex(ref.ea)} → ${h5(ref.phys)}.`,
      wires: [...(ref.regs.length ? (["regs_bus"] as WireRef[]) : (["queue_bus"] as WireRef[])), "ea_sigma", segWire(ref.seg)],
      nodes: ["SIGMA", ref.seg, ...ref.regs, ...(ref.regs.length ? [] : ["QUEUE"])],
      roles,
      stage: 1,
      sigma: { seg: ref.seg, segVal: ref.segVal, off: ref.ea, phys: ref.phys },
    });
  };
  const readPhase = (ref: MemRef, size: Size) => {
    const v = readMem(ref, size);
    push({
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
  };
  const writePhase = (ref: MemRef, v: number, size: Size, from: { nodes: string[]; wires: WireRef[]; roles?: Phase["roles"] }, text?: string) => {
    writeMem(ref, v, size);
    push({
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
  };
  /** Read an operand, adding address and read phases for memory. */
  const load = (o: Operand, size: Size, what: string): number => {
    if (o.kind === "imm") return o.value & mask(size);
    if (o.kind === "mem") {
      const ref = memRef(o);
      addressPhase(ref, what);
      return readPhase(ref, size);
    }
    if (o.kind === "reg" || o.kind === "sreg") return get(o.name);
    return 0;
  };

  push({
    kind: "fetch",
    title: "Fetch",
    text: `CS:IP = ${hex(r.CS)}:${hex(r.IP)}. Σ forms ${h5(phys(r.CS, r.IP))} and the bus brings ${len} byte${len > 1 ? "s" : ""} (${bytesText(instr.bytes)}) into the queue.`,
    wires: ["cs_sigma", "ip_sigma", "sigma_mem", "mem_queue"],
    nodes: ["CS", "IP", "SIGMA", "MEM", "QUEUE"],
    stage: 0,
    sigma: { seg: "CS", segVal: r.CS, off: r.IP, phys: phys(r.CS, r.IP) },
    bus: { phys: phys(r.CS, r.IP), bytes: instr.bytes, dir: "read" },
  });
  push({
    kind: "decode",
    title: "Decode",
    text: `The control unit decodes ${hex(instr.bytes[0], 2)} as ${instr.form}. IP moves past the instruction to ${h(next)}.`,
    wires: ["queue_cu"],
    nodes: ["QUEUE", "CU", "IP"],
    stage: 1,
  });
  r.IP = next;

  const mn = instr.mnemonic;
  const ops = instr.ops;
  const size = instr.size ?? 16;

  try {
    if (mn === "MOV") {
      const [dst, src] = ops;
      if (dst.kind === "mem") {
        const ref = memRef(dst);
        const v = src.kind === "imm" ? src.value & mask(size) : get((src as { name: string }).name);
        addressPhase(ref, "Destination address");
        writePhase(ref, v, size, { nodes: [opNode(src)], wires: opWires(src), roles: { [opNode(src)]: "src" } },
          `${src.kind === "imm" ? `The immediate ${h(v, size)}` : `${describe(src, size)} (${h(v, size)})`} goes over the bus to ${h5(ref.phys)} as ${bytesText(bytesOf(v, size))}.`);
      } else {
        const name = (dst as { name: string }).name;
        const v = load(src, size, "Source address");
        set(name, v);
        const roles: Phase["roles"] = { [name]: "dst" };
        if (src.kind !== "mem") roles[opNode(src)] = "src";
        push({
          kind: "execute",
          title: "Execute",
          text:
            src.kind === "mem"
              ? `The ${size === 8 ? "byte" : "word"} from memory goes into ${name}: ${name} = ${h(v, size)}.`
              : src.kind === "imm"
                ? `The immediate comes from the queue into ${name}: ${name} = ${h(v, size)}.`
                : `${describe(src, size)} is copied into ${name}: ${name} = ${h(v, size)}.`,
          wires: [...opWires(src), ...intoWires(dst)],
          nodes: [opNode(src), name],
          roles,
          stage: 3,
        });
      }
    } else if (mn in ALU_OPS || mn === "TEST") {
      const [dst, src] = ops;
      const dref = dst.kind === "mem" ? memRef(dst) : null;
      const a = load(dst, size, "Destination address");
      const b = load(src, size, "Source address");
      const old = { ...f };
      let res = 0;
      if (mn === "ADD") res = add(f, a, b, 0, size);
      else if (mn === "ADC") res = add(f, a, b, +old.CF, size);
      else if (mn === "SUB" || mn === "CMP") res = sub(f, a, b, 0, size);
      else if (mn === "SBB") res = sub(f, a, b, +old.CF, size);
      else if (mn === "AND" || mn === "TEST") res = logic(f, a & b, size);
      else if (mn === "OR") res = logic(f, a | b, size);
      else if (mn === "XOR") res = logic(f, a ^ b, size);
      const keep = mn !== "CMP" && mn !== "TEST";
      const changed = flagChanges(old, f);
      const carry = mn === "ADC" || mn === "SBB" ? ` ${mn === "ADC" ? "+" : "−"} CF(${+old.CF})` : "";
      const expr = `${h(a, size)} ${ALU_SYMBOL[mn]} ${h(b, size)}${carry} = ${h(res, size)}`;
      push({
        kind: "execute",
        title: "Execute",
        text: `The ALU does ${mn}: ${expr}. ${changed.length ? `Flags: ${changed.join(", ")}.` : "No flag changes."}${keep ? "" : " The result is thrown away; only the flags keep it."}`,
        wires: ["cu_alu", "bus_alu_a", "bus_alu_b", "alu_flags", ...new Set([...opWires(dst), ...opWires(src)])],
        nodes: ["ALU", "FLAGS", "CU", opNode(dst), opNode(src)],
        roles: { [opNode(dst)]: "dst", [opNode(src)]: "src" },
        stage: keep ? 2 : 3,
        alu: { op: mn, expr },
      });
      if (keep) {
        if (dref) writePhase(dref, res, size, { nodes: ["ALU"], wires: ["alu_bus"] });
        else {
          const name = (dst as { name: string }).name;
          set(name, res);
          push({
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
    } else if (mn === "INC" || mn === "DEC" || mn === "NEG" || mn === "NOT") {
      const [o] = ops;
      const ref = o.kind === "mem" ? memRef(o) : null;
      const a = load(o, size, "Operand address");
      const old = { ...f };
      let res: number;
      let expr: string;
      if (mn === "INC") (res = add(f, a, 1, 0, size, false)), (expr = `${h(a, size)} + 1 = ${h(res, size)}`);
      else if (mn === "DEC") (res = sub(f, a, 1, 0, size, false)), (expr = `${h(a, size)} − 1 = ${h(res, size)}`);
      else if (mn === "NEG") {
        res = sub(f, 0, a, 0, size);
        f.CF = a !== 0;
        expr = `0 − ${h(a, size)} = ${h(res, size)}`;
      } else (res = ~a & mask(size)), (expr = `NOT ${h(a, size)} = ${h(res, size)}`);
      const changed = flagChanges(old, f);
      const note =
        mn === "NOT" ? "NOT leaves the flags alone." : mn === "NEG" ? "" : `${mn} leaves CF alone.`;
      push({
        kind: "execute",
        title: "Execute",
        text: `The ALU does ${mn}: ${expr}. ${changed.length ? `Flags: ${changed.join(", ")}.` : "No flag changes."} ${note}`.trim(),
        wires: ["cu_alu", "bus_alu_a", ...(mn === "NOT" ? [] : (["alu_flags"] as WireRef[])), ...opWires(o)],
        nodes: ["ALU", "CU", opNode(o), ...(mn === "NOT" ? [] : ["FLAGS"])],
        roles: { [opNode(o)]: "dst" },
        stage: 2,
        alu: { op: mn, expr },
      });
      if (ref) writePhase(ref, res, size, { nodes: ["ALU"], wires: ["alu_bus"] });
      else {
        const name = (o as { name: string }).name;
        set(name, res);
        push({
          kind: "write",
          title: "Write back",
          text: `The result ${h(res, size)} goes back into ${name}.`,
          wires: ["alu_bus", "~regs_bus"],
          nodes: ["ALU", name],
          roles: { [name]: "dst" },
          stage: 3,
        });
      }
    } else if (mn === "MUL" || mn === "IMUL" || mn === "DIV" || mn === "IDIV") {
      const [o] = ops;
      const b = load(o, size, "Operand address");
      const signedOp = mn[0] === "I";
      const old = { ...f };
      let expr: string;
      let targets: string[];
      if (mn === "MUL" || mn === "IMUL") {
        if (size === 8) {
          const al = r.AX & 0xff;
          const p = signedOp ? toSigned(al, 8) * toSigned(b, 8) : al * b;
          const ax = p & 0xffff;
          r.AX = ax;
          f.CF = f.OF = signedOp ? toSigned(ax & 0xff, 8) !== p : ax >> 8 !== 0;
          expr = `${h(al, 8)} × ${h(b, 8)} = ${h(ax)}`;
          targets = ["AX"];
        } else {
          const ax = r.AX;
          const p = signedOp ? toSigned(ax, 16) * toSigned(b, 16) : ax * b;
          const p32 = signedOp ? p | 0 : p;
          r.AX = p32 & 0xffff;
          r.DX = signedOp ? (p32 >>> 16) & 0xffff : Math.floor(p / 0x10000) & 0xffff;
          f.CF = f.OF = signedOp ? toSigned(r.AX, 16) !== p : r.DX !== 0;
          expr = `${h(ax)} × ${h(b)} = ${hex(r.DX)}${hex(r.AX)}h`;
          targets = ["AX", "DX"];
        }
      } else {
        if (b === 0) throw new CpuFault(`Divide by zero. The 8086 raises interrupt 0 (divide error).`);
        if (size === 8) {
          const n = signedOp ? toSigned(r.AX, 16) : r.AX;
          const d = signedOp ? toSigned(b, 8) : b;
          const q = Math.trunc(n / d);
          const rem = n - q * d;
          // The 8086 faults on a signed quotient of -128 too; only later CPUs allow it.
          if (signedOp ? q < -127 || q > 127 : q > 0xff)
            throw new CpuFault(`The quotient ${q} does not fit in AL. The 8086 raises interrupt 0 (divide error).`);
          r.AX = ((rem & 0xff) << 8) | (q & 0xff);
          expr = `${h(n & 0xffff)} ÷ ${h(b, 8)} = ${h(q & 0xff, 8)} r ${h(rem & 0xff, 8)}`;
          targets = ["AX"];
        } else {
          const raw = r.DX * 0x10000 + r.AX;
          const n = signedOp ? raw | 0 : raw;
          const d = signedOp ? toSigned(b, 16) : b;
          const q = Math.trunc(n / d);
          const rem = n - q * d;
          if (signedOp ? q < -32767 || q > 32767 : q > 0xffff)
            throw new CpuFault(`The quotient ${q} does not fit in AX. The 8086 raises interrupt 0 (divide error).`);
          const dx = r.DX;
          const ax = r.AX;
          r.AX = q & 0xffff;
          r.DX = rem & 0xffff;
          expr = `${hex(dx)}${hex(ax)}h ÷ ${h(b)} = ${h(r.AX)} r ${h(r.DX)}`;
          targets = ["AX", "DX"];
        }
      }
      const changed = flagChanges(old, f);
      const roles: Phase["roles"] = { [opNode(o)]: "src" };
      targets.forEach((t) => (roles[t] = "dst"));
      push({
        kind: "execute",
        title: "Execute",
        text: `${MULDIV_TEXT[`${mn[0] === "I" ? mn.slice(1) : mn}${size}`]}${signedOp ? ", treating the values as signed" : ""}: ${expr}.${changed.length ? ` Flags: ${changed.join(", ")}.` : ""}${mn.includes("DIV") ? " The flags are undefined after a divide and are left as they were." : ""}`,
        wires: ["cu_alu", "bus_alu_a", "bus_alu_b", "~regs_bus", ...opWires(o), ...(mn.includes("MUL") ? (["alu_flags"] as WireRef[]) : [])],
        nodes: ["ALU", "CU", opNode(o), ...targets, ...(mn.includes("MUL") ? ["FLAGS"] : [])],
        roles,
        stage: 3,
        alu: { op: mn, expr },
      });
    } else if (mn === "CBW" || mn === "CWD") {
      const wasNeg = mn === "CBW" ? (r.AX & 0x80) !== 0 : (r.AX & 0x8000) !== 0;
      if (mn === "CBW") r.AX = (r.AX & 0xff) | (wasNeg ? 0xff00 : 0);
      else r.DX = wasNeg ? 0xffff : 0;
      push({
        kind: "execute",
        title: "Execute",
        text:
          mn === "CBW"
            ? `The sign bit of AL is ${+wasNeg}, so AH becomes ${wasNeg ? "FFh" : "00h"}: AX = ${h(r.AX)}.`
            : `The sign bit of AX is ${+wasNeg}, so DX becomes ${wasNeg ? "FFFFh" : "0000h"}.`,
        wires: ["regs_bus", "~regs_bus"],
        nodes: mn === "CBW" ? ["AL", "AH"] : ["AX", "DX"],
        roles: mn === "CBW" ? { AL: "src", AH: "dst" } : { AX: "src", DX: "dst" },
        stage: 3,
      });
    } else if (mn === "PUSH") {
      const [o] = ops;
      let v = load(o, 16, "Source address");
      r.SP = (r.SP - 2) & 0xffff;
      // The 8086 pushes SP after the decrement (the 80286 changed this to the old value).
      if (o.kind === "reg" && o.name === "SP") v = r.SP;
      const ref = stackRef(r.SP);
      addressPhase(ref, `SP − 2 = ${h(r.SP)}, the new top of the stack`);
      writePhase(ref, v, 16, { nodes: [opNode(o)], wires: opWires(o), roles: { [opNode(o)]: "src", SP: "dst" } },
        `${describe(o, 16)} (${h(v)}) goes onto the stack at ${h5(ref.phys)}.`);
    } else if (mn === "POP") {
      const [o] = ops;
      const ref = stackRef(r.SP);
      addressPhase(ref, `SP = ${h(r.SP)} points at the top of the stack`);
      const v = readPhase(ref, 16);
      r.SP = (r.SP + 2) & 0xffff;
      if (o.kind === "mem") {
        const dref = memRef(o);
        addressPhase(dref, "Destination address");
        writePhase(dref, v, 16, { nodes: [], wires: [] }, `${h(v)} goes to ${h5(dref.phys)}. SP moves up to ${h(r.SP)}.`);
      } else {
        const name = (o as { name: string }).name;
        set(name, v);
        push({
          kind: "execute",
          title: "Execute",
          text: `${name} = ${h(v)} and SP moves up by 2 to ${h(r.SP)}.`,
          wires: ["mem_bus", ...intoWires(o)],
          nodes: [name, "SP"],
          roles: { [name]: "dst", SP: "dst" },
          stage: 3,
        });
      }
    } else if (mn === "JMP" || mn === "LOOP" || mn in JCC) {
      const target = instr.target!;
      let taken: boolean;
      let why: string;
      const nodes = ["CU", "IP"];
      const wires: WireRef[] = [];
      const roles: Record<string, Role> = { IP: "dst" };
      if (mn === "JMP") {
        taken = true;
        why = "JMP always jumps";
      } else if (mn === "LOOP") {
        r.CX = (r.CX - 1) & 0xffff;
        taken = r.CX !== 0;
        why = `CX − 1 = ${h(r.CX)}, ${taken ? "not zero" : "zero"}`;
        nodes.push("CX");
        roles.CX = "dst";
        wires.push("regs_bus");
      } else {
        const [cond, test] = CONDITIONS[JCC[mn]];
        taken = test(f);
        why = `${mn} checks ${cond}: ${taken ? "true" : "false"}`;
        nodes.push("FLAGS");
        wires.push("flags_cu");
      }
      if (taken) r.IP = target;
      const rel = target - next;
      push({
        kind: "execute",
        title: "Execute",
        text: taken
          ? `${why}, so the jump is taken: IP = ${h(next)} ${rel < 0 ? "−" : "+"} ${Math.abs(rel)} = ${h(target)}. The queue is flushed.`
          : `${why}, so execution falls through to ${h(next)}.`,
        wires,
        nodes,
        roles,
        stage: 3,
      });
    } else if (mn === "NOP") {
      push({ kind: "execute", title: "Execute", text: "Nothing happens; the CPU just moves on.", wires: [], nodes: ["CU"], stage: 3 });
    } else if (mn === "HLT") {
      halted = true;
      push({ kind: "execute", title: "Halt", text: "The CPU stops here until an interrupt arrives.", wires: [], nodes: ["CU"], stage: 3 });
    }
  } catch (e) {
    if (!(e instanceof CpuFault)) throw e;
    error = e.message;
    halted = true;
    push({ kind: "fault", title: "Divide error", text: e.message, wires: ["cu_alu"], nodes: ["ALU", "CU"], stage: 3 });
  }
  phases[phases.length - 1].stage = 3;

  return { instr, before, after: cloneRegs(r), writes, reads, phases, halted, error };
}

export function undo(m: Machine, s: StepResult) {
  m.regs = cloneRegs(s.before);
  for (let i = s.writes.length - 1; i >= 0; i--) m.mem[s.writes[i].addr] = s.writes[i].old;
}

