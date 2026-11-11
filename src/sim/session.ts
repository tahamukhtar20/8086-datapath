// A running program: the machine, the step history for stepping back, and the
// phase being shown. Plain TypeScript with no React, so it can be unit tested.
import { hex, JCC } from "../cpu/assembler.ts";
import { Machine, step, undo } from "../cpu/machine.ts";
import { FLAG_NAMES, REG16, SREG } from "../cpu/types.ts";
import type { Flags, Instr, Phase, Program, Regs, StepResult } from "../cpu/types.ts";

export const MAX_HISTORY = 5000;
export const MAX_INSTRUCTIONS = 20000;

export class Session {
  readonly program: Program;
  readonly machine: Machine;
  /** Executed instructions, newest last. Capped at MAX_HISTORY. */
  readonly history: StepResult[] = [];
  /** Index of the phase being shown within the newest instruction. */
  phase = 0;
  /** Instructions executed, including ones dropped from the history. */
  count = 0;

  constructor(program: Program) {
    this.program = program;
    this.machine = new Machine(program);
  }

  get current(): StepResult | undefined {
    return this.history.at(-1);
  }

  /**
   * Advance one phase (or one whole instruction when `phases` is false).
   * Returns the new step when an instruction ran, true when only the phase moved,
   * and false when nothing can happen.
   */
  forward(phases: boolean): StepResult | boolean {
    if (this.program.errors.length) return false;
    const cur = this.current;
    if (cur && phases && this.phase < cur.phases.length - 1) {
      this.phase++;
      return true;
    }
    if (cur?.halted || this.count >= MAX_INSTRUCTIONS) return false;
    const res = step(this.machine, this.program);
    if (!res) return false;
    this.history.push(res);
    if (this.history.length > MAX_HISTORY) this.history.shift();
    this.count++;
    this.phase = phases ? 0 : res.phases.length - 1;
    return res;
  }

  /** Go back one phase, or undo the newest instruction. Returns false at the start of the history. */
  back(phases: boolean): boolean {
    const cur = this.current;
    if (!cur) return false;
    if (phases && this.phase > 0) this.phase--;
    else {
      undo(this.machine, cur);
      this.history.pop();
      this.count--;
      this.phase = this.current ? this.current.phases.length - 1 : 0;
    }
    return true;
  }

  /** Jump to the last phase of the current instruction (used when phases are turned off). */
  skipToLastPhase() {
    if (this.current) this.phase = this.current.phases.length - 1;
  }

  showPhase(i: number) {
    const cur = this.current;
    if (cur && i >= 0 && i < cur.phases.length) this.phase = i;
  }
}

/** Everything the UI needs to draw one moment of a session. */
export type View = {
  phase: Phase | null;
  phases: Phase[];
  phaseIndex: number;
  regs: Regs;
  flags: Flags;
  /** Registers, byte halves and flags that changed by this phase. */
  changed: Set<string>;
  queue: number[];
  cu: { form: string; source: string } | null;
  /** Memory as it is at this phase (writes appear in the write phase). */
  peek: (phys: number) => number;
  written: Set<number>;
  read: Set<number>;
  /** Instruction for the Encoding panel and the line to highlight. */
  encoding: Instr | undefined;
  encodingIsNext: boolean;
  currentLine: number | null;
  status: string;
  endNote: string;
  canForward: boolean;
  canBack: boolean;
  canReset: boolean;
};

const plural = (n: number) => `${n} instruction${n === 1 ? "" : "s"}`;

export function viewOf(s: Session): View {
  const { program, machine } = s;
  const cur = s.current;
  const phase = cur?.phases[s.phase] ?? null;
  // stage 0: nothing applied yet, 1: IP advanced, 2: flags updated, 3: registers and memory updated.
  const stage = phase?.stage ?? 3;
  const atEnd = !cur || s.phase === cur.phases.length - 1;
  const len = cur?.instr.bytes.length ?? 0;

  let regs: Regs = machine.regs;
  let flags = regs.flags;
  if (cur) {
    regs = stage >= 3 ? cur.after : { ...cur.before, IP: stage >= 1 ? (cur.before.IP + len) & 0xffff : cur.before.IP };
    flags = stage >= 2 ? cur.after.flags : cur.before.flags;
  }

  const changed = new Set<string>();
  if (cur && stage >= 3) {
    for (const k of [...REG16, ...SREG]) if (cur.before[k] !== cur.after[k]) changed.add(k);
    for (const x of "ABCD") {
      const diff = cur.before[`${x}X` as "AX"] ^ cur.after[`${x}X` as "AX"];
      if (diff & 0xff) changed.add(`${x}L`);
      if (diff & 0xff00) changed.add(`${x}H`);
    }
  }
  if (cur && stage >= 2) for (const n of FLAG_NAMES) if (cur.before.flags[n] !== cur.after.flags[n]) changed.add(n);

  // A taken jump flushes the prefetch queue.
  const mn = cur?.instr.mnemonic ?? "";
  const isJump = mn === "JMP" || mn === "LOOP" || mn in JCC;
  const flushed = !!cur && isJump && stage >= 3 && cur.after.IP !== ((cur.before.IP + len) & 0xffff);
  const queue = cur && !flushed ? cur.instr.bytes : [];
  const cu = cur && s.phase >= 1 ? { form: cur.instr.form, source: cur.instr.source.toUpperCase() } : null;

  const oldBytes = new Map<number, number>();
  for (const w of cur?.writes ?? []) if (!oldBytes.has(w.addr)) oldBytes.set(w.addr, w.old);
  const peek = (p: number) => (cur && stage < 3 && oldBytes.has(p) ? oldBytes.get(p)! : machine.mem[p]);
  const written = new Set(cur && stage >= 3 ? cur.writes.map((w) => w.addr) : []);
  const readIdx = cur ? cur.phases.findIndex((p) => p.kind === "read") : -1;
  const read = new Set(cur && readIdx >= 0 && s.phase >= readIdx ? cur.reads : []);

  const nextInstr = program.byAddr.get(machine.regs.IP);
  const ended = atEnd && (!!cur?.halted || !nextInstr);
  // Mid-instruction, show the instruction being run; once it is done, show the next one.
  const encoding = cur && !atEnd ? cur.instr : cur && !ended ? nextInstr : (cur?.instr ?? nextInstr);
  const hasErrors = program.errors.length > 0;

  let status: string;
  if (hasErrors) status = "Fix the errors in the program to run it.";
  else if (!cur && s.count > 0) status = `Only the last ${MAX_HISTORY.toLocaleString()} instructions are kept for stepping back. Step forward or reset.`;
  else if (!cur) status = `Press Step to fetch the first instruction at CS:IP = ${hex(regs.CS)}:${hex(regs.IP)}.`;
  else status = phase!.text;

  let endNote = "";
  if (cur && atEnd) {
    if (cur.error) endNote = `Stopped after ${plural(s.count)}.`;
    else if (cur.halted) endNote = `Halted after ${plural(s.count)}.`;
    else if (!nextInstr) endNote = `IP ${hex(machine.regs.IP)}h is past the end of the program.`;
    else if (s.count >= MAX_INSTRUCTIONS) endNote = `Stopped after ${MAX_INSTRUCTIONS.toLocaleString()} instructions.`;
  }

  return {
    phase,
    phases: cur?.phases ?? [],
    phaseIndex: s.phase,
    regs,
    flags,
    changed,
    queue,
    cu,
    peek,
    written,
    read,
    encoding,
    encodingIsNext: !!encoding && encoding !== cur?.instr,
    currentLine: encoding?.line ?? null,
    status,
    endNote,
    canForward: !hasErrors && !ended && s.count < MAX_INSTRUCTIONS,
    canBack: !!cur,
    canReset: s.count > 0 || !!cur,
  };
}
