// Machine state and the step loop: fetch, decode, then the instruction's handler.
import { ORIGIN, hex } from "./assembler.ts";
import { CpuFault, StepContext, bytesText, h, h5, phys } from "./context.ts";
import { HANDLERS } from "./handlers.ts";
import type { Program, Regs, StepResult } from "./types.ts";

export { h, phys };

const INITIAL_SEGMENTS = { CS: 0x1000, DS: 0x2000, ES: 0x2000, SS: 0x3000 };
const INITIAL_SP = 0xfffe;

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

/** Run the instruction at CS:IP. Returns null when there is no instruction there. */
export function step(m: Machine, program: Program): StepResult | null {
  const r = m.regs;
  const instr = program.byAddr.get(r.IP);
  if (!instr) return null;
  const before = cloneRegs(r);
  const len = instr.bytes.length;
  const next = (r.IP + len) & 0xffff;
  const c = new StepContext(r, m.mem, instr, next);

  c.push({
    kind: "fetch",
    title: "Fetch",
    text: `CS:IP = ${hex(r.CS)}:${hex(r.IP)}. Σ forms ${h5(phys(r.CS, r.IP))} and the bus brings ${len} byte${len > 1 ? "s" : ""} (${bytesText(instr.bytes)}) into the queue.`,
    wires: ["cs_sigma", "ip_sigma", "sigma_mem", "mem_queue"],
    nodes: ["CS", "IP", "SIGMA", "MEM", "QUEUE"],
    stage: 0,
    sigma: { seg: "CS", segVal: r.CS, off: r.IP, phys: phys(r.CS, r.IP) },
    bus: { phys: phys(r.CS, r.IP), bytes: instr.bytes, dir: "read" },
  });
  c.push({
    kind: "decode",
    title: "Decode",
    text: `The control unit decodes ${hex(instr.bytes[0], 2)} as ${instr.form}. IP moves past the instruction to ${h(next)}.`,
    wires: ["queue_cu"],
    nodes: ["QUEUE", "CU", "IP"],
    stage: 1,
  });
  r.IP = next;

  let error: string | undefined;
  try {
    HANDLERS[instr.mnemonic](c);
  } catch (e) {
    if (!(e instanceof CpuFault)) throw e;
    error = e.message;
    c.halted = true;
    c.push({ kind: "fault", title: "Divide error", text: e.message, wires: ["cu_alu"], nodes: ["ALU", "CU"], stage: 3 });
  }
  // By the last phase everything has happened, whatever the handler marked.
  c.phases[c.phases.length - 1].stage = 3;

  return { instr, before, after: cloneRegs(r), writes: c.writes, reads: c.reads, phases: c.phases, halted: c.halted, error };
}

/** Put registers and memory back exactly as they were before a step. */
export function undo(m: Machine, s: StepResult) {
  m.regs = cloneRegs(s.before);
  for (let i = s.writes.length - 1; i >= 0; i--) m.mem[s.writes[i].addr] = s.writes[i].old;
}
