import { REG16, REG8, SREG } from "./types.ts";
import type {
  AsmError,
  Field,
  FieldKind,
  Instr,
  MemOperand,
  Operand,
  Program,
  RegOperand,
  Size,
} from "./types.ts";

/** Programs are loaded at CS:0100h, like a DOS .COM file. */
export const ORIGIN = 0x0100;

export const ALU_OPS: Record<string, number> = { ADD: 0, OR: 1, ADC: 2, SBB: 3, AND: 4, SUB: 5, XOR: 6, CMP: 7 };
export const UNARY_OPS: Record<string, number> = { NOT: 2, NEG: 3, MUL: 4, IMUL: 5, DIV: 6, IDIV: 7 };
export const JCC: Record<string, number> = {
  JO: 0x70, JNO: 0x71, JB: 0x72, JC: 0x72, JNAE: 0x72, JAE: 0x73, JNB: 0x73, JNC: 0x73,
  JE: 0x74, JZ: 0x74, JNE: 0x75, JNZ: 0x75, JBE: 0x76, JNA: 0x76, JA: 0x77, JNBE: 0x77,
  JS: 0x78, JNS: 0x79, JP: 0x7a, JPE: 0x7a, JNP: 0x7b, JPO: 0x7b,
  JL: 0x7c, JNGE: 0x7c, JGE: 0x7d, JNL: 0x7d, JLE: 0x7e, JNG: 0x7e, JG: 0x7f, JNLE: 0x7f,
};
const SINGLE: Record<string, [number, string]> = {
  CBW: [0x98, "Sign-extend AL into AX"],
  CWD: [0x99, "Sign-extend AX into DX:AX"],
  NOP: [0x90, "No operation (really XCHG AX, AX)"],
  HLT: [0xf4, "Halt the processor"],
};

export const MNEMONICS = [
  "MOV", ...Object.keys(ALU_OPS), "TEST", ...Object.keys(UNARY_OPS), "INC", "DEC",
  "PUSH", "POP", ...Object.keys(SINGLE), "JMP", "LOOP", ...Object.keys(JCC),
];

export class AsmFault extends Error {}
function fail(message: string): never {
  throw new AsmFault(message);
}

export const hex = (v: number, digits = 4) => v.toString(16).toUpperCase().padStart(digits, "0");
const bin = (v: number, width: number) => v.toString(2).padStart(width, "0").slice(-width);
const signed = (v: number, size: Size) => (v & (size === 8 ? 0x80 : 0x8000) ? v - (size === 8 ? 0x100 : 0x10000) : v);

export function parseNumber(text: string): number | null {
  let t = text.trim();
  let sign = 1;
  if (t.startsWith("-") || t.startsWith("+")) {
    if (t[0] === "-") sign = -1;
    t = t.slice(1).trim();
  }
  let v: number;
  if (/^'.'$/.test(t)) v = t.charCodeAt(1);
  else if (/^0x[0-9a-f]+$/i.test(t)) v = parseInt(t.slice(2), 16);
  else if (/^[0-9][0-9a-f]*h$/i.test(t)) v = parseInt(t.slice(0, -1), 16);
  else if (/^[01]+b$/i.test(t)) v = parseInt(t.slice(0, -1), 2);
  else if (/^\d+$/.test(t)) v = parseInt(t, 10);
  else return null;
  return sign * v;
}

const isOneOf = <T extends string>(list: readonly T[], s: string): s is T => (list as readonly string[]).includes(s);

function parseMem(inner: string, size: Size | undefined): MemOperand {
  const compact = inner.replace(/\s+/g, "");
  const terms = compact.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join("") !== compact) return fail(`Cannot read the address [${inner}]`);
  const m: MemOperand = { kind: "mem", disp: 0, size };
  let disp = 0;
  for (const term of terms) {
    const negative = term.startsWith("-");
    const body = term.replace(/^[+-]/, "").toUpperCase();
    if (body === "BX" || body === "BP") {
      if (negative) fail("Registers can only be added in an address");
      if (m.base) fail("An address can use only one of BX and BP");
      m.base = body;
    } else if (body === "SI" || body === "DI") {
      if (negative) fail("Registers can only be added in an address");
      if (m.index) fail("An address can use only one of SI and DI");
      m.index = body;
    } else if (isOneOf(REG16, body) || isOneOf(REG8, body) || isOneOf(SREG, body)) {
      fail(`${body} cannot form an address on the 8086; use BX, BP, SI or DI`);
    } else {
      const n = parseNumber(body);
      if (n === null) fail(`Cannot read "${term}" in an address`);
      disp += negative ? -n! : n!;
    }
  }
  if (disp < -0x8000 || disp > 0xffff) fail("The displacement does not fit in 16 bits");
  m.disp = disp & 0xffff;
  return m;
}

export function parseOperand(raw: string): Operand {
  let s = raw.trim();
  let size: Size | undefined;
  const ptr = /^(byte|word)(\s+ptr)?\s*/i.exec(s);
  if (ptr) {
    size = ptr[1].toLowerCase() === "byte" ? 8 : 16;
    s = s.slice(ptr[0].length).trim();
    if (!s.startsWith("[")) fail(`${ptr[1].toUpperCase()} PTR only applies to a memory operand`);
  }
  if (s.startsWith("[")) {
    if (!s.endsWith("]")) fail(`Missing ] in ${raw.trim()}`);
    return parseMem(s.slice(1, -1), size);
  }
  const u = s.toUpperCase();
  if (isOneOf(REG16, u)) return { kind: "reg", name: u, size: 16, code: REG16.indexOf(u) };
  if (isOneOf(REG8, u)) return { kind: "reg", name: u, size: 8, code: REG8.indexOf(u) };
  if (isOneOf(SREG, u)) return { kind: "sreg", name: u, code: SREG.indexOf(u) };
  const n = parseNumber(s);
  if (n !== null) return { kind: "imm", value: n };
  if (/^[A-Za-z_.][\w.]*$/.test(s)) return { kind: "label", name: u };
  return fail(`Cannot read the operand "${s}"`);
}

/** Collects bit fields; the machine code is their concatenation. */
class Enc {
  fields: Field[] = [];
  add(kind: FieldKind, label: string, value: number, width: number, note: string) {
    this.fields.push({ kind, label, bits: bin(value, width), note });
    return this;
  }
  byte(kind: FieldKind, label: string, value: number, note: string) {
    return this.add(kind, label, value & 0xff, 8, note);
  }
  word(kind: FieldKind, label: string, value: number, note: string) {
    this.byte(kind, `${label} lo`, value, `${note} (low byte first)`);
    return this.byte(kind, `${label} hi`, value >> 8, `${note} (high byte)`);
  }
  data(size: Size, value: number) {
    return size === 8
      ? this.byte("data", "imm8", value, `Immediate ${hex(value & 0xff, 2)}h`)
      : this.word("data", "imm16", value, `Immediate ${hex(value & 0xffff)}h`);
  }
  w(size: Size) {
    return this.add("flag", "w", size === 16 ? 1 : 0, 1, size === 16 ? "w=1: 16-bit operands" : "w=0: 8-bit operands");
  }
  bytes(): number[] {
    const bits = this.fields.map((f) => f.bits).join("");
    const out: number[] = [];
    for (let i = 0; i < bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
    return out;
  }
}

const RM: Record<string, number> = { "BX+SI": 0, "BX+DI": 1, "BP+SI": 2, "BP+DI": 3, SI: 4, DI: 5, BP: 6, BX: 7 };

export const memText = (m: MemOperand) => {
  const parts: string[] = [m.base, m.index].filter((p): p is NonNullable<typeof p> => !!p);
  const d = signed(m.disp, 16);
  if (!parts.length) return `[${hex(m.disp)}h]`;
  if (d === 0) return `[${parts.join("+")}]`;
  return `[${parts.join("+")}${d < 0 ? "-" : "+"}${hex(Math.abs(d), Math.abs(d) > 0xff ? 4 : 2)}h]`;
};

/** mod, reg and r/m fields, plus any displacement. */
function modrm(e: Enc, reg: { label: string; value: number; note: string }, rm: RegOperand | MemOperand) {
  if (rm.kind === "reg") {
    e.add("mod", "mod", 3, 2, "11: r/m names a register");
    e.add("reg", reg.label, reg.value, 3, reg.note);
    e.add("rm", "r/m", rm.code, 3, `${bin(rm.code, 3)}: ${rm.name}`);
    return;
  }
  if (!rm.base && !rm.index) {
    e.add("mod", "mod", 0, 2, "00 with r/m 110: a direct address follows");
    e.add("reg", reg.label, reg.value, 3, reg.note);
    e.add("rm", "r/m", 6, 3, "110: direct address");
    e.word("disp", "addr", rm.disp, `Address ${hex(rm.disp)}h`);
    return;
  }
  const key = [rm.base, rm.index].filter(Boolean).join("+");
  const code = RM[key];
  const d = signed(rm.disp, 16);
  const mod = rm.disp === 0 && key !== "BP" ? 0 : d >= -128 && d <= 127 ? 1 : 2;
  const modNote =
    mod === 0
      ? "00: memory, no displacement"
      : mod === 1
        ? key === "BP" && d === 0
          ? "01: memory, 8-bit displacement (BP needs one, since 00 110 means a direct address)"
          : "01: memory, 8-bit displacement follows"
        : "10: memory, 16-bit displacement follows";
  e.add("mod", "mod", mod, 2, modNote);
  e.add("reg", reg.label, reg.value, 3, reg.note);
  e.add("rm", "r/m", code, 3, `${bin(code, 3)}: [${key}${mod ? " + disp" : ""}]`);
  if (mod === 1) e.byte("disp", "disp8", rm.disp, `Displacement ${d < 0 ? "-" : ""}${hex(Math.abs(d), 2)}h, sign-extended`);
  if (mod === 2) e.word("disp", "disp16", rm.disp, `Displacement ${hex(rm.disp)}h`);
}

const opSize = (o: Operand): Size | undefined =>
  o.kind === "reg" ? o.size : o.kind === "mem" ? o.size : o.kind === "sreg" ? 16 : undefined;

const opName = (o: Operand) =>
  o.kind === "reg" || o.kind === "sreg" ? o.name : o.kind === "mem" ? memText(o) : o.kind === "imm" ? String(o.value) : o.name;

function pairSize(a: Operand, b: Operand): Size {
  const sa = opSize(a);
  const sb = opSize(b);
  if (sa && sb && sa !== sb) fail(`Operand sizes differ: ${opName(a)} is ${sa}-bit and ${opName(b)} is ${sb}-bit`);
  const s = sa ?? sb;
  if (!s) fail("Operand size is unknown: write BYTE PTR or WORD PTR");
  return s!;
}

function needSize(o: Operand): Size {
  const s = opSize(o);
  if (!s) fail(`The size of ${opName(o)} is unknown: write BYTE PTR or WORD PTR`);
  return s!;
}

function immValue(v: number, size: Size) {
  if (size === 8 && (v < -0x80 || v > 0xff)) fail(`${v} does not fit in 8 bits`);
  if (size === 16 && (v < -0x8000 || v > 0xffff)) fail(`${v} does not fit in 16 bits`);
  return v & (size === 8 ? 0xff : 0xffff);
}

function count(ops: Operand[], n: number, mn: string) {
  if (ops.length !== n) fail(`${mn} takes ${n === 0 ? "no operands" : n === 1 ? "one operand" : "two operands"}`);
}

function regOrMem(o: Operand, what: string): RegOperand | MemOperand {
  if (o.kind === "reg" || o.kind === "mem") return o;
  if (o.kind === "sreg") return fail(`Segment registers only work with MOV, PUSH and POP`);
  return fail(`${what} must be a register or memory`);
}

type Ctx = { addr: number; labels: Map<string, number> | null; near: boolean };
type Encoded = { bytes: number[]; fields: Field[]; form: string; size?: Size; target?: number; nearNeeded?: boolean };

function encodeJump(mn: string, ops: Operand[], ctx: Ctx): Encoded {
  count(ops, 1, mn);
  const t = ops[0];
  if (t.kind !== "label") return fail(`${mn} needs a label`);
  let target: number;
  if (ctx.labels) {
    const found = ctx.labels.get(t.name);
    if (found === undefined) return fail(`Unknown label ${t.name}`);
    target = found;
  } else target = ctx.addr;
  const e = new Enc();
  const near = mn === "JMP" && ctx.near;
  const len = near ? 3 : 2;
  const rel = target - (ctx.addr + len);
  if (mn === "JMP") {
    if (near) {
      e.add("opcode", "opcode", 0xe9, 8, "E9: near JMP with a 16-bit offset");
      e.word("disp", "rel16", rel, `Offset ${rel} from the next instruction`);
    } else {
      e.add("opcode", "opcode", 0xeb, 8, "EB: short JMP with an 8-bit offset");
      e.byte("disp", "rel8", rel, `Offset ${rel} from the next instruction`);
    }
    return { bytes: e.bytes(), fields: e.fields, form: near ? "JMP rel16" : "JMP rel8", target, nearNeeded: !near && (rel < -128 || rel > 127) };
  }
  if (rel < -128 || rel > 127) fail(`${t.name} is ${rel} bytes away; ${mn} only reaches -128 to +127`);
  const op = mn === "LOOP" ? 0xe2 : JCC[mn];
  e.add("opcode", "opcode", op, 8, mn === "LOOP" ? "E2: LOOP (decrement CX, jump if not zero)" : `${hex(op, 2)}: ${mn} (short conditional jump)`);
  e.byte("disp", "rel8", rel, `Offset ${rel} from the next instruction`);
  return { bytes: e.bytes(), fields: e.fields, form: `${mn} rel8`, target };
}

export function encode(mn: string, ops: Operand[], ctx: Ctx): Encoded {
  const e = new Enc();
  const done = (form: string, size?: Size): Encoded => ({ bytes: e.bytes(), fields: e.fields, form, size });

  if (mn === "JMP" || mn === "LOOP" || mn in JCC) return encodeJump(mn, ops, ctx);

  if (mn in SINGLE) {
    count(ops, 0, mn);
    const [op, note] = SINGLE[mn];
    e.add("opcode", "opcode", op, 8, `${hex(op, 2)}: ${note}`);
    return done(mn, mn === "CBW" ? 8 : mn === "CWD" ? 16 : undefined);
  }

  if (mn in ALU_OPS || mn === "TEST") {
    count(ops, 2, mn);
    const dst = regOrMem(ops[0], "The destination");
    const src = ops[1];
    if (src.kind === "label") fail(`${mn} cannot take a label`);
    if (src.kind === "sreg") fail(`Segment registers only work with MOV, PUSH and POP`);
    const op = ALU_OPS[mn] ?? 0;
    if (src.kind === "imm") {
      const size = needSize(dst);
      const v = immValue(src.value, size);
      const sv = signed(v, size);
      const acc = dst.kind === "reg" && dst.code === 0;
      if (mn === "TEST") {
        if (acc) {
          e.add("opcode", "opcode", 0b1010100, 7, "1010100: TEST AL/AX with an immediate");
          e.w(size).data(size, v);
          return done(`TEST ${dst.name}, imm${size}`, size);
        }
        e.add("opcode", "opcode", 0b1111011, 7, "1111011: group of one-operand instructions (F6/F7)").w(size);
        modrm(e, { label: "op", value: 0, note: "000: selects TEST in the group" }, dst);
        e.data(size, v);
        return done(`TEST r/m${size}, imm${size}`, size);
      }
      if (size === 16 && sv >= -128 && sv <= 127) {
        e.add("opcode", "opcode", 0b100000, 6, "100000: arithmetic with an immediate (80-83)");
        e.add("flag", "s", 1, 1, "s=1: the 8-bit immediate is sign-extended to 16 bits");
        e.w(16);
        modrm(e, { label: "op", value: op, note: `${bin(op, 3)}: selects ${mn} in the group` }, dst);
        e.byte("data", "imm8", v, `Immediate ${hex(v & 0xff, 2)}h, sign-extended to ${hex(v)}h`);
        return done(`${mn} r/m16, imm8`, size);
      }
      if (acc) {
        e.add("opcode", "opcode", (op << 2) | 2, 7, `${bin((op << 2) | 2, 7)}: ${mn} with AL/AX and an immediate`);
        e.w(size).data(size, v);
        return done(`${mn} ${dst.name}, imm${size}`, size);
      }
      e.add("opcode", "opcode", 0b100000, 6, "100000: arithmetic with an immediate (80-83)");
      e.add("flag", "s", 0, 1, "s=0: the immediate is full width");
      e.w(size);
      modrm(e, { label: "op", value: op, note: `${bin(op, 3)}: selects ${mn} in the group` }, dst);
      e.data(size, v);
      return done(`${mn} r/m${size}, imm${size}`, size);
    }
    if (dst.kind === "mem" && src.kind === "mem") fail("The 8086 cannot use two memory operands");
    const size = pairSize(dst, src);
    if (mn === "TEST") {
      const reg = (src.kind === "reg" ? src : dst) as RegOperand;
      const rm = (src.kind === "reg" ? dst : src) as RegOperand | MemOperand;
      e.add("opcode", "opcode", 0b1000010, 7, "1000010: TEST r/m, reg").w(size);
      modrm(e, { label: "reg", value: reg.code, note: `${bin(reg.code, 3)}: ${reg.name}` }, rm);
      return done(`TEST r/m${size}, r${size}`, size);
    }
    const d = dst.kind === "reg" && src.kind === "mem" ? 1 : 0;
    const reg = (d ? dst : src) as RegOperand;
    const rm = (d ? src : dst) as RegOperand | MemOperand;
    e.add("opcode", "opcode", op << 1, 6, `${bin(op << 1, 6)}: ${mn}`);
    e.add("flag", "d", d, 1, d ? "d=1: reg is the destination" : "d=0: reg is the source");
    e.w(size);
    modrm(e, { label: "reg", value: reg.code, note: `${bin(reg.code, 3)}: ${reg.name}` }, rm);
    return done(d ? `${mn} r${size}, r/m${size}` : `${mn} r/m${size}, r${size}`, size);
  }

  if (mn === "MOV") {
    count(ops, 2, mn);
    const [dst, src] = ops;
    if (dst.kind === "imm" || dst.kind === "label") fail("The destination must be a register or memory");
    if (src.kind === "label") fail("MOV cannot take a label");
    if (dst.kind === "sreg") {
      if (dst.name === "CS") fail("MOV cannot load CS; only a far jump or call changes it");
      if (src.kind !== "reg" && src.kind !== "mem") return fail("A segment register loads from a 16-bit register or memory");
      if (opSize(src) === 8) fail("Segment registers are 16-bit");
      e.add("opcode", "opcode", 0x8e, 8, "8E: MOV Sreg, r/m16");
      modrm(e, { label: "sreg", value: dst.code, note: `${bin(dst.code, 3)}: ${dst.name}` }, src);
      return done("MOV Sreg, r/m16", 16);
    }
    if (src.kind === "sreg") {
      if (opSize(dst) === 8) fail("Segment registers are 16-bit");
      e.add("opcode", "opcode", 0x8c, 8, "8C: MOV r/m16, Sreg");
      modrm(e, { label: "sreg", value: src.code, note: `${bin(src.code, 3)}: ${src.name}` }, dst);
      return done("MOV r/m16, Sreg", 16);
    }
    if (src.kind === "imm") {
      if (dst.kind === "reg") {
        const v = immValue(src.value, dst.size);
        e.add("opcode", "opcode", 0b1011, 4, "1011: MOV register, immediate (B0-BF)").w(dst.size);
        e.add("reg", "reg", dst.code, 3, `${bin(dst.code, 3)}: ${dst.name}`);
        e.data(dst.size, v);
        return done(`MOV r${dst.size}, imm${dst.size}`, dst.size);
      }
      const size = needSize(dst);
      const v = immValue(src.value, size);
      e.add("opcode", "opcode", 0b1100011, 7, "1100011: MOV r/m, immediate (C6/C7)").w(size);
      modrm(e, { label: "op", value: 0, note: "000: the only operation in this group" }, dst);
      e.data(size, v);
      return done(`MOV r/m${size}, imm${size}`, size);
    }
    if (dst.kind === "mem" && src.kind === "mem") fail("The 8086 cannot use two memory operands");
    const size = pairSize(dst, src);
    const mem = dst.kind === "mem" ? dst : src.kind === "mem" ? src : undefined;
    const reg = (dst.kind === "reg" ? dst : src) as RegOperand;
    if (mem && !mem.base && !mem.index && reg.code === 0) {
      const store = dst.kind === "mem";
      e.add("opcode", "opcode", store ? 0b1010001 : 0b1010000, 7,
        store ? "1010001: store AL/AX at a direct address (A2/A3)" : "1010000: load AL/AX from a direct address (A0/A1)");
      e.w(size).word("disp", "addr", mem.disp, `Address ${hex(mem.disp)}h`);
      return done(store ? `MOV moffs${size}, ${reg.name}` : `MOV ${reg.name}, moffs${size}`, size);
    }
    const d = dst.kind === "reg" && src.kind === "mem" ? 1 : 0;
    const r = (d ? dst : src) as RegOperand;
    const rm = (d ? src : dst) as RegOperand | MemOperand;
    e.add("opcode", "opcode", 0b100010, 6, "100010: MOV");
    e.add("flag", "d", d, 1, d ? "d=1: reg is the destination" : "d=0: reg is the source");
    e.w(size);
    modrm(e, { label: "reg", value: r.code, note: `${bin(r.code, 3)}: ${r.name}` }, rm);
    return done(d ? `MOV r${size}, r/m${size}` : `MOV r/m${size}, r${size}`, size);
  }

  if (mn in UNARY_OPS) {
    count(ops, 1, mn);
    const o = regOrMem(ops[0], "The operand");
    const size = needSize(o);
    const ext = UNARY_OPS[mn];
    e.add("opcode", "opcode", 0b1111011, 7, "1111011: group of one-operand instructions (F6/F7)").w(size);
    modrm(e, { label: "op", value: ext, note: `${bin(ext, 3)}: selects ${mn} in the group` }, o);
    return done(`${mn} r/m${size}`, size);
  }

  if (mn === "INC" || mn === "DEC") {
    count(ops, 1, mn);
    const o = regOrMem(ops[0], "The operand");
    const size = needSize(o);
    if (o.kind === "reg" && size === 16) {
      e.add("opcode", "opcode", mn === "INC" ? 0b01000 : 0b01001, 5, `${mn === "INC" ? "01000" : "01001"}: ${mn} a 16-bit register (one byte)`);
      e.add("reg", "reg", o.code, 3, `${bin(o.code, 3)}: ${o.name}`);
      return done(`${mn} r16`, 16);
    }
    const ext = mn === "INC" ? 0 : 1;
    e.add("opcode", "opcode", 0b1111111, 7, "1111111: INC/DEC group (FE/FF)").w(size);
    modrm(e, { label: "op", value: ext, note: `${bin(ext, 3)}: selects ${mn}` }, o);
    return done(`${mn} r/m${size}`, size);
  }

  if (mn === "PUSH" || mn === "POP") {
    count(ops, 1, mn);
    const o = ops[0];
    const push = mn === "PUSH";
    if (o.kind === "imm") fail("PUSH with an immediate arrived with the 80186; the 8086 cannot do it");
    if (o.kind === "label") fail(`${mn} cannot take a label`);
    if (opSize(o) === 8) fail(`${mn} works on 16-bit values`);
    if (o.kind === "reg") {
      e.add("opcode", "opcode", push ? 0b01010 : 0b01011, 5, `${push ? "01010" : "01011"}: ${mn} a 16-bit register`);
      e.add("reg", "reg", o.code, 3, `${bin(o.code, 3)}: ${o.name}`);
      return done(`${mn} r16`, 16);
    }
    if (o.kind === "sreg") {
      if (!push && o.name === "CS") fail("POP CS is not supported");
      e.add("opcode", "opcode", 0, 3, `000: ${mn} a segment register`);
      e.add("reg", "sreg", o.code, 2, `${bin(o.code, 2)}: ${o.name}`);
      e.add("opcode", "opcode", push ? 0b110 : 0b111, 3, push ? "110: PUSH" : "111: POP");
      return done(`${mn} Sreg`, 16);
    }
    const m = { ...o, size: 16 as Size };
    if (push) {
      e.add("opcode", "opcode", 0xff, 8, "FF: INC/DEC/PUSH group");
      modrm(e, { label: "op", value: 6, note: "110: selects PUSH" }, m);
    } else {
      e.add("opcode", "opcode", 0x8f, 8, "8F: POP r/m16");
      modrm(e, { label: "op", value: 0, note: "000: the only operation in this group" }, m);
    }
    return done(`${mn} r/m16`, 16);
  }

  return fail(`Unknown instruction ${mn}`);
}

type Stmt = { line: number; source: string; label?: string; mn?: string; ops?: Operand[]; error?: string };

function parseLines(text: string): Stmt[] {
  return text.split("\n").map((raw, line) => {
    const code = raw.replace(/;.*$/, "").trim();
    const st: Stmt = { line, source: code };
    if (!code) return st;
    try {
      let rest = code;
      const lab = /^([A-Za-z_.][\w.]*)\s*:/.exec(rest);
      if (lab) {
        st.label = lab[1].toUpperCase();
        rest = rest.slice(lab[0].length).trim();
        if (isOneOf(REG16, st.label) || isOneOf(REG8, st.label) || isOneOf(SREG, st.label))
          fail(`${st.label} is a register name and cannot be a label`);
      }
      st.source = rest;
      if (!rest) return st;
      const sp = /^(\S+)\s*(.*)$/.exec(rest)!;
      const mn = sp[1].toUpperCase();
      if (!MNEMONICS.includes(mn)) fail(`Unknown instruction ${sp[1]}`);
      st.mn = mn;
      st.ops = sp[2].trim() ? sp[2].split(",").map(parseOperand) : [];
    } catch (e) {
      if (!(e instanceof AsmFault)) throw e;
      st.error = e.message;
    }
    return st;
  });
}

export function assemble(text: string): Program {
  const stmts = parseLines(text);
  const errors: AsmError[] = [];
  const labels = new Map<string, number>();
  for (const st of stmts) {
    if (st.error) errors.push({ line: st.line, message: st.error });
    if (st.label) {
      if (labels.has(st.label)) errors.push({ line: st.line, message: `Label ${st.label} is defined twice` });
      labels.set(st.label, 0);
    }
  }

  // Sizes depend on whether each JMP is short or near, and that depends on addresses.
  const near = new Set<number>();
  let instrs: Instr[] = [];
  let lineErrors: AsmError[] = [];
  for (let pass = 0; pass < 10; pass++) {
    const sizes = new Map<number, number>();
    for (const st of stmts) {
      if (!st.mn || st.error) continue;
      try {
        sizes.set(st.line, encode(st.mn, st.ops!, { addr: 0, labels: null, near: near.has(st.line) }).bytes.length);
      } catch {
        sizes.set(st.line, 0);
      }
    }
    let addr = ORIGIN;
    for (const st of stmts) {
      if (st.label) labels.set(st.label, addr);
      addr += sizes.get(st.line) ?? 0;
    }
    instrs = [];
    lineErrors = [];
    let grew = false;
    addr = ORIGIN;
    for (const st of stmts) {
      if (!st.mn || st.error) continue;
      try {
        const enc = encode(st.mn, st.ops!, { addr, labels, near: near.has(st.line) });
        if (enc.nearNeeded) {
          near.add(st.line);
          grew = true;
        }
        instrs.push({ line: st.line, addr, mnemonic: st.mn, ops: st.ops!, source: st.source, ...enc });
        addr += enc.bytes.length;
      } catch (e) {
        if (!(e instanceof AsmFault)) throw e;
        lineErrors.push({ line: st.line, message: e.message });
      }
    }
    if (!grew) break;
  }
  errors.push(...lineErrors);
  errors.sort((a, b) => a.line - b.line);

  const byLine: (Instr | undefined)[] = new Array(stmts.length).fill(undefined);
  for (const i of instrs) byLine[i.line] = i;
  return { instrs, byAddr: new Map(instrs.map((i) => [i.addr, i])), byLine, labels, errors };
}
