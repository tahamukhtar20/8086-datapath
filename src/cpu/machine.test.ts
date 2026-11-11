import { test } from "node:test";
import assert from "node:assert/strict";
import { assemble } from "./assembler.ts";
import { Machine, step, undo, phys } from "./machine.ts";
import { EXAMPLES } from "./examples.ts";
import type { StepResult } from "./types.ts";

function run(code: string, limit = 1000) {
  const p = assemble(code);
  assert.deepEqual(p.errors, []);
  const m = new Machine(p);
  const steps: StepResult[] = [];
  for (let i = 0; i < limit; i++) {
    const s = step(m, p);
    if (!s) break;
    steps.push(s);
    if (s.halted) break;
  }
  return { m, steps };
}

test("every example runs to HLT", () => {
  for (const ex of EXAMPLES) {
    const { steps } = run(ex.code);
    const last = steps.at(-1)!;
    assert.equal(last.instr.mnemonic, "HLT", ex.id);
    assert.equal(last.error, undefined, ex.id);
    for (const s of steps) assert.equal(s.phases.at(-1)!.stage, 3, `${ex.id}: ${s.instr.source}`);
  }
});

test("sum 1..10", () => {
  const { m } = run(EXAMPLES[0].code);
  assert.equal(m.regs.AX, 55);
  assert.equal(m.mem[phys(0x2000, 0x200)], 55);
});

test("largest byte", () => {
  const { m } = run(EXAMPLES.find((e) => e.id === "max")!.code);
  assert.equal(m.regs.AX & 0xff, 47);
});

test("flags", () => {
  const { steps } = run("mov al, 7fh\nadd al, 1\nadd al, 80h\nmov bl, 0fh\ninc bl\nhlt");
  const f1 = steps[1].after.flags;
  assert.deepEqual(f1, { OF: true, SF: true, ZF: false, AF: true, PF: false, CF: false });
  const f2 = steps[2].after.flags;
  assert.equal(f2.CF, true);
  assert.equal(f2.ZF, true);
  assert.equal(f2.OF, true);
  const f4 = steps[4].after.flags;
  assert.equal(f4.AF, true);
  assert.equal(f4.CF, true, "INC keeps CF");
});

test("mul, div, idiv, cbw", () => {
  const { m, steps } = run(EXAMPLES.find((e) => e.id === "muldiv")!.code);
  assert.equal(steps[2].after.DX, 1);
  assert.equal(steps[2].after.AX, 123400 & 0xffff);
  assert.equal(steps[3].after.AX, 1234);
  assert.equal(steps[5].after.AX, 0xfff9);
  assert.equal(m.regs.AX & 0xff, 0xfd);
  assert.equal(m.regs.AX >> 8, 0xff);
});

test("imul flags", () => {
  const { m } = run("mov al, -2\nmov bl, 3\nimul bl\nhlt");
  assert.equal(m.regs.AX, 0xfffa);
  assert.equal(m.regs.flags.CF, false);
});

test("divide error stops the run", () => {
  const { steps } = run("mov ax, 5\nmov bl, 0\ndiv bl\nmov ax, 1");
  assert.match(steps.at(-1)!.error!, /Divide by zero/);
});

test("stack swap", () => {
  const { m } = run(EXAMPLES.find((e) => e.id === "stack")!.code);
  assert.equal(m.regs.AX, 0x2222);
  assert.equal(m.regs.BX, 0x1111);
  assert.equal(m.regs.ES, 0x2000);
  assert.equal(m.regs.SP, 0xfffe);
});

test("addressing", () => {
  const { m } = run(EXAMPLES.find((e) => e.id === "addressing")!.code);
  assert.equal(m.mem[phys(0x2000, 0x204)], 0x34);
  assert.equal(m.mem[phys(0x2000, 0x206)], 0x7f);
  assert.equal(m.regs.DX & 0xff, 0x7f);
  assert.equal(m.mem[phys(0x3000, 0x12)], 0x7f);
});

test("undo restores registers and memory", () => {
  const p = assemble("mov word [0200h], 1234h\nmov ax, 5\nhlt");
  const m = new Machine(p);
  const a = step(m, p)!;
  const b = step(m, p)!;
  undo(m, b);
  undo(m, a);
  assert.equal(m.regs.AX, 0);
  assert.equal(m.regs.IP, 0x100);
  assert.equal(m.mem[phys(0x2000, 0x200)], 0);
});

test("word access at offset FFFFh wraps within the segment", () => {
  const { m } = run("MOV BX, 0FFFFh\nMOV WORD PTR [BX], 1234h\nMOV AX, [BX]\nHLT");
  assert.equal(m.mem[phys(0x2000, 0xffff)], 0x34);
  assert.equal(m.mem[phys(0x2000, 0x0000)], 0x12);
  assert.equal(m.mem[phys(0x3000, 0x0000)], 0x00);
  assert.equal(m.regs.AX, 0x1234);
});

test("PUSH SP pushes the decremented SP, as on the 8086", () => {
  const { m } = run("MOV SP, 100h\nPUSH SP\nPOP AX\nHLT");
  assert.equal(m.regs.AX, 0x00fe);
});

test("IDIV faults on a quotient of -128", () => {
  const { steps } = run("MOV AX, 0FF80h\nMOV BL, 1\nIDIV BL\nHLT");
  assert.ok(steps.at(-1)!.error, "expected a divide error");
});
