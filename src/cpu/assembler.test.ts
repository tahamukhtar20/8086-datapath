import { test } from "node:test";
import assert from "node:assert/strict";
import { assemble, hex } from "./assembler.ts";

const bytes = (line: string) => {
  const p = assemble(line);
  assert.deepEqual(p.errors, [], `${line}: ${p.errors.map((e) => e.message).join("; ")}`);
  return p.instrs[0].bytes.map((b) => hex(b, 2)).join(" ");
};

// Reference encodings checked against NASM (bits 16).
const CASES: [string, string][] = [
  ["mov ax, bx", "89 D8"],
  ["mov al, 5", "B0 05"],
  ["mov bx, 1234h", "BB 34 12"],
  ["mov ax, [0200h]", "A1 00 02"],
  ["mov [0200h], al", "A2 00 02"],
  ["mov bl, [0200h]", "8A 1E 00 02"],
  ["mov cx, [bx+si]", "8B 08"],
  ["mov [bp], ax", "89 46 00"],
  ["mov dx, [bx+si+8]", "8B 50 08"],
  ["mov dx, [bp-2]", "8B 56 FE"],
  ["mov ax, [si+1234h]", "8B 84 34 12"],
  ["mov word ptr [bx], 1234h", "C7 07 34 12"],
  ["mov byte [di+300h], 7", "C6 85 00 03 07"],
  ["mov ds, ax", "8E D8"],
  ["mov ax, es", "8C C0"],
  ["add ax, bx", "01 D8"],
  ["add al, 5", "04 05"],
  ["add bx, 5", "83 C3 05"],
  ["add bx, -1", "83 C3 FF"],
  ["add bx, 1234h", "81 C3 34 12"],
  ["add ax, 1234h", "05 34 12"],
  ["add byte ptr [bx], 1", "80 07 01"],
  ["sub cx, [bx]", "2B 0F"],
  ["sbb ax, dx", "19 D0"],
  ["adc al, bl", "10 D8"],
  ["cmp al, bl", "38 D8"],
  ["cmp ax, 10", "83 F8 0A"],
  ["xor ax, ax", "31 C0"],
  ["and cl, 0Fh", "80 E1 0F"],
  ["or [bx], ax", "09 07"],
  ["test ax, bx", "85 D8"],
  ["test al, 1", "A8 01"],
  ["test byte [bx], 80h", "F6 07 80"],
  ["inc ax", "40"],
  ["dec si", "4E"],
  ["inc bl", "FE C3"],
  ["inc word [bx]", "FF 07"],
  ["dec byte [si]", "FE 0C"],
  ["neg ax", "F7 D8"],
  ["not bl", "F6 D3"],
  ["mul bx", "F7 E3"],
  ["imul cl", "F6 E9"],
  ["div bx", "F7 F3"],
  ["idiv byte [si]", "F6 3C"],
  ["cbw", "98"],
  ["cwd", "99"],
  ["nop", "90"],
  ["hlt", "F4"],
  ["push ax", "50"],
  ["pop bx", "5B"],
  ["push ds", "1E"],
  ["pop es", "07"],
  ["push word [bx]", "FF 37"],
  ["pop word [bx]", "8F 07"],
];

for (const [line, expected] of CASES) test(line, () => assert.equal(bytes(line), expected));

test("short jumps and LOOP", () => {
  const p = assemble("start: dec cx\n jnz start\n loop start\n jmp start");
  assert.deepEqual(p.errors, []);
  assert.deepEqual(
    p.instrs.map((i) => i.bytes.map((b) => hex(b, 2)).join(" ")),
    ["49", "75 FD", "E2 FB", "EB F9"],
  );
});

test("forward JMP grows to near when out of range", () => {
  const body = Array.from({ length: 70 }, () => "push ax\npop ax").join("\n");
  const p = assemble(`jmp done\n${body}\ndone: hlt`);
  assert.deepEqual(p.errors, []);
  assert.equal(hex(p.instrs[0].bytes[0], 2), "E9");
  assert.equal(p.labels.get("DONE"), 0x100 + 3 + 140);
});

test("fields add up to whole bytes", () => {
  for (const [line] of CASES) {
    const i = assemble(line).instrs[0];
    assert.equal(i.fields.map((f) => f.bits).join("").length, i.bytes.length * 8, line);
  }
});

test("errors", () => {
  const msg = (s: string) => assemble(s).errors[0]?.message ?? "";
  assert.match(msg("mov [bx], [si]"), /two memory operands/);
  assert.match(msg("mov ax, bl"), /sizes differ/);
  assert.match(msg("inc [bx]"), /BYTE PTR or WORD PTR/);
  assert.match(msg("mov ax, [cx]"), /cannot form an address/);
  assert.match(msg("push 5"), /80186/);
  assert.match(msg("mov cs, ax"), /cannot load CS/);
  assert.match(msg("mov al, 300"), /does not fit in 8 bits/);
  assert.match(msg("jmp nowhere"), /Unknown label/);
  assert.match(msg("frob ax"), /Unknown instruction/);
});

test("labels may start with byte or word", () => {
  const p = assemble("JMP wordy\nwordy: HLT\nbytes: JMP bytes");
  assert.deepEqual(p.errors, []);
});

test("',' and ';' work as character literals", () => {
  assert.equal(bytes("MOV AL, ','"), "B0 2C");
  assert.equal(bytes("MOV AL, ';' ; a comment"), "B0 3B");
});
