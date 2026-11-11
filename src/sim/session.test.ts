import { test } from "node:test";
import assert from "node:assert/strict";
import { assemble } from "../cpu/assembler.ts";
import { MAX_HISTORY, Session, viewOf } from "./session.ts";

const session = (code: string) => new Session(assemble(code));

test("a fresh session can step but not go back or reset", () => {
  const v = viewOf(session("MOV AX, 1\nHLT"));
  assert.equal(v.canForward, true);
  assert.equal(v.canBack, false);
  assert.equal(v.canReset, false);
  assert.match(v.status, /^Press Step to fetch the first instruction at CS:IP = 1000:0100/);
  assert.equal(v.encoding?.source, "MOV AX, 1");
  assert.equal(v.encodingIsNext, true);
});

test("registers change only in the phase that writes them", () => {
  const s = session("MOV AX, 1234h\nHLT");
  assert.equal(typeof s.forward(true), "object"); // fetch
  let v = viewOf(s);
  assert.equal(v.phase?.kind, "fetch");
  assert.equal(v.regs.AX, 0);
  assert.equal(v.regs.IP, 0x100);
  assert.equal(s.forward(true), true); // decode: IP moves on
  v = viewOf(s);
  assert.equal(v.regs.IP, 0x103);
  assert.equal(v.regs.AX, 0);
  s.forward(true); // execute
  v = viewOf(s);
  assert.equal(v.regs.AX, 0x1234);
  assert.ok(v.changed.has("AX") && v.changed.has("AH") && v.changed.has("AL"));
  // Once the instruction is done the Encoding panel shows the next one.
  assert.equal(v.encoding?.mnemonic, "HLT");
  assert.equal(v.encodingIsNext, true);
});

test("memory writes appear in the write phase and undo exactly", () => {
  const s = session("MOV WORD PTR [0200h], 0BEEFh\nHLT");
  const p = 0x20200;
  s.forward(true);
  assert.equal(viewOf(s).peek(p), 0, "not written during fetch");
  while (viewOf(s).phase?.kind !== "write") s.forward(true);
  const v = viewOf(s);
  assert.equal(v.peek(p), 0xef);
  assert.equal(v.peek(p + 1), 0xbe);
  assert.ok(v.written.has(p));
  while (s.back(true));
  assert.equal(s.machine.mem[p], 0);
  assert.equal(viewOf(s).canBack, false);
});

test("a taken jump flushes the queue", () => {
  const s = session("JMP over\nNOP\nover: HLT");
  s.forward(false);
  const v = viewOf(s);
  assert.deepEqual(v.queue, []);
  assert.equal(v.regs.IP, 0x103);
});

test("halting ends the run with a note", () => {
  const s = session("MOV AX, 1\nHLT");
  while (s.forward(false));
  const v = viewOf(s);
  assert.equal(v.canForward, false);
  assert.equal(v.endNote, "Halted after 2 instructions.");
});

test("a divide error stops the run", () => {
  const s = session("MOV AX, 1\nMOV BL, 0\nDIV BL\nHLT");
  while (s.forward(false));
  const v = viewOf(s);
  assert.equal(v.phase?.kind, "fault");
  assert.equal(v.endNote, "Stopped after 3 instructions.");
});

test("errors in the program block running", () => {
  const s = session("FOO AX");
  assert.equal(s.forward(true), false);
  const v = viewOf(s);
  assert.equal(v.canForward, false);
  assert.equal(v.status, "Fix the errors in the program to run it.");
});

test("stepping back past the kept history says so and still allows reset", () => {
  const s = session("again: JMP again");
  for (let i = 0; i < MAX_HISTORY + 3; i++) s.forward(false);
  while (s.back(false));
  const v = viewOf(s);
  assert.equal(v.canBack, false);
  assert.equal(v.canReset, true);
  assert.match(v.status, /^Only the last 5,000 instructions are kept/);
});

test("turning phases off jumps to the end of the instruction", () => {
  const s = session("MOV AX, [0200h]\nHLT");
  s.forward(true);
  s.skipToLastPhase();
  assert.equal(viewOf(s).phase?.kind, "execute");
  s.showPhase(0);
  assert.equal(viewOf(s).phase?.kind, "fetch");
  s.showPhase(99);
  assert.equal(viewOf(s).phase?.kind, "fetch");
});
