// One handler per instruction family. Each changes the machine state through the
// StepContext and records the phases the board shows after fetch and decode.
import { ALU_OPS, JCC, hex } from "./assembler.ts";
import { CONDITIONS, add, flagChanges, flagText, logic, mask, sub, toSigned } from "./alu.ts";
import { CpuFault, StepContext, bytesOf, bytesText, h, h5 } from "./context.ts";
import type { Phase, Role, WireRef } from "./types.ts";

type Handler = (c: StepContext) => void;
const node = StepContext.node;
const wiresFrom = StepContext.wiresFrom;
const wiresInto = StepContext.wiresInto;

const mov: Handler = (c) => {
  const [dst, src] = c.instr.ops;
  const size = c.size;
  if (dst.kind === "mem") {
    const ref = c.memRef(dst);
    const v = src.kind === "imm" ? src.value & mask(size) : c.get((src as { name: string }).name);
    c.addressPhase(ref, "Destination address");
    const what = src.kind === "imm" ? `The immediate ${h(v, size)}` : `${c.describe(src, size)} (${h(v, size)})`;
    c.writePhase(ref, v, size, { nodes: [node(src)], wires: wiresFrom(src), roles: { [node(src)]: "src" } },
      `${what} goes over the bus to ${h5(ref.phys)} as ${bytesText(bytesOf(v, size))}.`);
    return;
  }
  const name = (dst as { name: string }).name;
  const v = c.load(src, size, "Source address");
  c.set(name, v);
  const roles: Phase["roles"] = { [name]: "dst" };
  if (src.kind !== "mem") roles[node(src)] = "src";
  const text =
    src.kind === "mem"
      ? `The ${size === 8 ? "byte" : "word"} from memory goes into ${name}: ${name} = ${h(v, size)}.`
      : src.kind === "imm"
        ? `The immediate comes from the queue into ${name}: ${name} = ${h(v, size)}.`
        : `${c.describe(src, size)} is copied into ${name}: ${name} = ${h(v, size)}.`;
  c.push({ kind: "execute", title: "Execute", text, wires: [...wiresFrom(src), ...wiresInto(dst)], nodes: [node(src), name], roles, stage: 3 });
};

const ALU_SYMBOL: Record<string, string> = {
  ADD: "+", ADC: "+", SUB: "−", SBB: "−", CMP: "−", AND: "AND", OR: "OR", XOR: "XOR", TEST: "AND",
};

/** Two-operand arithmetic and logic: ADD ADC SUB SBB CMP AND OR XOR TEST. */
const alu: Handler = (c) => {
  const mn = c.instr.mnemonic;
  const [dst, src] = c.instr.ops;
  const size = c.size;
  const f = c.f;
  const dref = dst.kind === "mem" ? c.memRef(dst) : null;
  const a = c.load(dst, size, "Destination address");
  const b = c.load(src, size, "Source address");
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
  const carry = mn === "ADC" || mn === "SBB" ? ` ${mn === "ADC" ? "+" : "−"} CF(${+old.CF})` : "";
  const expr = `${h(a, size)} ${ALU_SYMBOL[mn]} ${h(b, size)}${carry} = ${h(res, size)}`;
  c.push({
    kind: "execute",
    title: "Execute",
    text: `The ALU does ${mn}: ${expr}. ${flagText(old, f)}${keep ? "" : " The result is thrown away; only the flags keep it."}`,
    wires: ["cu_alu", "bus_alu_a", "bus_alu_b", "alu_flags", ...new Set([...wiresFrom(dst), ...wiresFrom(src)])],
    nodes: ["ALU", "FLAGS", "CU", node(dst), node(src)],
    roles: { [node(dst)]: "dst", [node(src)]: "src" },
    stage: keep ? 2 : 3,
    alu: { op: mn, expr },
  });
  if (keep) c.store(dst, dref, res, size);
};

/** One-operand ALU instructions: INC DEC NEG NOT. */
const unary: Handler = (c) => {
  const mn = c.instr.mnemonic;
  const [o] = c.instr.ops;
  const size = c.size;
  const f = c.f;
  const ref = o.kind === "mem" ? c.memRef(o) : null;
  const a = c.load(o, size, "Operand address");
  const old = { ...f };
  let res: number;
  let expr: string;
  let note = "";
  if (mn === "INC") {
    res = add(f, a, 1, 0, size, false);
    expr = `${h(a, size)} + 1 = ${h(res, size)}`;
    note = " INC leaves CF alone.";
  } else if (mn === "DEC") {
    res = sub(f, a, 1, 0, size, false);
    expr = `${h(a, size)} − 1 = ${h(res, size)}`;
    note = " DEC leaves CF alone.";
  } else if (mn === "NEG") {
    res = sub(f, 0, a, 0, size);
    f.CF = a !== 0;
    expr = `0 − ${h(a, size)} = ${h(res, size)}`;
  } else {
    res = ~a & mask(size);
    expr = `NOT ${h(a, size)} = ${h(res, size)}`;
    note = " NOT leaves the flags alone.";
  }
  const usesFlags = mn !== "NOT";
  c.push({
    kind: "execute",
    title: "Execute",
    text: `The ALU does ${mn}: ${expr}. ${flagText(old, f)}${note}`,
    wires: ["cu_alu", "bus_alu_a", ...(usesFlags ? (["alu_flags"] as WireRef[]) : []), ...wiresFrom(o)],
    nodes: ["ALU", "CU", node(o), ...(usesFlags ? ["FLAGS"] : [])],
    roles: { [node(o)]: "dst" },
    stage: 2,
    alu: { op: mn, expr },
  });
  c.store(o, ref, res, size);
};

const MULDIV_TEXT: Record<string, string> = {
  MUL8: "AL × operand goes into AX",
  MUL16: "AX × operand goes into DX:AX",
  DIV8: "AX ÷ operand puts the quotient in AL and the remainder (r) in AH",
  DIV16: "DX:AX ÷ operand puts the quotient in AX and the remainder (r) in DX",
};

/** MUL IMUL DIV IDIV. */
const mulDiv: Handler = (c) => {
  const mn = c.instr.mnemonic;
  const [o] = c.instr.ops;
  const size = c.size;
  const { r, f } = c;
  const b = c.load(o, size, "Operand address");
  const signedOp = mn[0] === "I";
  const isMul = mn.endsWith("MUL");
  const old = { ...f };
  let expr: string;
  let targets: string[];
  if (isMul && size === 8) {
    const al = r.AX & 0xff;
    const p = signedOp ? toSigned(al, 8) * toSigned(b, 8) : al * b;
    r.AX = p & 0xffff;
    f.CF = f.OF = signedOp ? toSigned(r.AX & 0xff, 8) !== p : r.AX >> 8 !== 0;
    expr = `${h(al, 8)} × ${h(b, 8)} = ${h(r.AX)}`;
    targets = ["AX"];
  } else if (isMul) {
    const ax = r.AX;
    const p = signedOp ? toSigned(ax, 16) * toSigned(b, 16) : ax * b;
    const p32 = signedOp ? p | 0 : p;
    r.AX = p32 & 0xffff;
    r.DX = signedOp ? (p32 >>> 16) & 0xffff : Math.floor(p / 0x10000) & 0xffff;
    f.CF = f.OF = signedOp ? toSigned(r.AX, 16) !== p : r.DX !== 0;
    expr = `${h(ax)} × ${h(b)} = ${hex(r.DX)}${hex(r.AX)}h`;
    targets = ["AX", "DX"];
  } else {
    if (b === 0) throw new CpuFault(`Divide by zero. The 8086 raises interrupt 0 (divide error).`);
    // The 8086 also faults on a signed quotient of -128 / -32768; only later CPUs allow it.
    const limit = size === 8 ? (signedOp ? 127 : 0xff) : signedOp ? 32767 : 0xffff;
    if (size === 8) {
      const n = signedOp ? toSigned(r.AX, 16) : r.AX;
      const q = Math.trunc(n / (signedOp ? toSigned(b, 8) : b));
      const rem = n - q * (signedOp ? toSigned(b, 8) : b);
      if (q > limit || q < -limit) throw new CpuFault(`The quotient ${q} does not fit in AL. The 8086 raises interrupt 0 (divide error).`);
      r.AX = ((rem & 0xff) << 8) | (q & 0xff);
      expr = `${h(n & 0xffff)} ÷ ${h(b, 8)} = ${h(q & 0xff, 8)} r ${h(rem & 0xff, 8)}`;
      targets = ["AX"];
    } else {
      const raw = r.DX * 0x10000 + r.AX;
      const n = signedOp ? raw | 0 : raw;
      const d = signedOp ? toSigned(b, 16) : b;
      const q = Math.trunc(n / d);
      const rem = n - q * d;
      if (q > limit || q < -limit) throw new CpuFault(`The quotient ${q} does not fit in AX. The 8086 raises interrupt 0 (divide error).`);
      const [dx, ax] = [r.DX, r.AX];
      r.AX = q & 0xffff;
      r.DX = rem & 0xffff;
      expr = `${hex(dx)}${hex(ax)}h ÷ ${h(b)} = ${h(r.AX)} r ${h(r.DX)}`;
      targets = ["AX", "DX"];
    }
  }
  const roles: Phase["roles"] = { [node(o)]: "src" };
  targets.forEach((t) => (roles[t] = "dst"));
  const changed = flagChanges(old, f);
  const flags = isMul
    ? changed.length ? ` Flags: ${changed.join(", ")}.` : ""
    : " The flags are undefined after a divide and are left as they were.";
  c.push({
    kind: "execute",
    title: "Execute",
    text: `${MULDIV_TEXT[`${isMul ? "MUL" : "DIV"}${size}`]}${signedOp ? ", treating the values as signed" : ""}: ${expr}.${flags}`,
    wires: ["cu_alu", "bus_alu_a", "bus_alu_b", "~regs_bus", ...wiresFrom(o), ...(isMul ? (["alu_flags"] as WireRef[]) : [])],
    nodes: ["ALU", "CU", node(o), ...targets, ...(isMul ? ["FLAGS"] : [])],
    roles,
    stage: 3,
    alu: { op: mn, expr },
  });
};

/** CBW CWD: sign-extend AL into AH, or AX into DX. */
const convert: Handler = (c) => {
  const { r } = c;
  const byte = c.instr.mnemonic === "CBW";
  const neg = byte ? (r.AX & 0x80) !== 0 : (r.AX & 0x8000) !== 0;
  if (byte) r.AX = (r.AX & 0xff) | (neg ? 0xff00 : 0);
  else r.DX = neg ? 0xffff : 0;
  c.push({
    kind: "execute",
    title: "Execute",
    text: byte
      ? `The sign bit of AL is ${+neg}, so AH becomes ${neg ? "FFh" : "00h"}: AX = ${h(r.AX)}.`
      : `The sign bit of AX is ${+neg}, so DX becomes ${neg ? "FFFFh" : "0000h"}.`,
    wires: ["regs_bus", "~regs_bus"],
    nodes: byte ? ["AL", "AH"] : ["AX", "DX"],
    roles: byte ? { AL: "src", AH: "dst" } : { AX: "src", DX: "dst" },
    stage: 3,
  });
};

const pushOp: Handler = (c) => {
  const [o] = c.instr.ops;
  const { r } = c;
  let v = c.load(o, 16, "Source address");
  r.SP = (r.SP - 2) & 0xffff;
  // The 8086 pushes SP after the decrement (the 80286 changed this to the old value).
  if (o.kind === "reg" && o.name === "SP") v = r.SP;
  const ref = c.stackRef(r.SP);
  c.addressPhase(ref, `SP − 2 = ${h(r.SP)}, the new top of the stack`);
  c.writePhase(ref, v, 16, { nodes: [node(o)], wires: wiresFrom(o), roles: { [node(o)]: "src", SP: "dst" } },
    `${c.describe(o, 16)} (${h(v)}) goes onto the stack at ${h5(ref.phys)}.`);
};

const popOp: Handler = (c) => {
  const [o] = c.instr.ops;
  const { r } = c;
  const ref = c.stackRef(r.SP);
  c.addressPhase(ref, `SP = ${h(r.SP)} points at the top of the stack`);
  const v = c.readPhase(ref, 16);
  r.SP = (r.SP + 2) & 0xffff;
  if (o.kind === "mem") {
    const dref = c.memRef(o);
    c.addressPhase(dref, "Destination address");
    c.writePhase(dref, v, 16, { nodes: [], wires: [] }, `${h(v)} goes to ${h5(dref.phys)}. SP moves up to ${h(r.SP)}.`);
    return;
  }
  const name = (o as { name: string }).name;
  c.set(name, v);
  c.push({
    kind: "execute",
    title: "Execute",
    text: `${name} = ${h(v)} and SP moves up by 2 to ${h(r.SP)}.`,
    wires: ["mem_bus", ...wiresInto(o)],
    nodes: [name, "SP"],
    roles: { [name]: "dst", SP: "dst" },
    stage: 3,
  });
};

/** JMP, LOOP and the conditional jumps. */
const jump: Handler = (c) => {
  const mn = c.instr.mnemonic;
  const { r } = c;
  const target = c.instr.target!;
  const nodes = ["CU", "IP"];
  const wires: WireRef[] = [];
  const roles: Record<string, Role> = { IP: "dst" };
  let taken: boolean;
  let why: string;
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
    taken = test(c.f);
    why = `${mn} checks ${cond}: ${taken ? "true" : "false"}`;
    nodes.push("FLAGS");
    wires.push("flags_cu");
  }
  if (taken) r.IP = target;
  const rel = target - c.next;
  c.push({
    kind: "execute",
    title: "Execute",
    text: taken
      ? `${why}, so the jump is taken: IP = ${h(c.next)} ${rel < 0 ? "−" : "+"} ${Math.abs(rel)} = ${h(target)}. The queue is flushed.`
      : `${why}, so execution falls through to ${h(c.next)}.`,
    wires,
    nodes,
    roles,
    stage: 3,
  });
};

const nop: Handler = (c) =>
  c.push({ kind: "execute", title: "Execute", text: "Nothing happens; the CPU just moves on.", wires: [], nodes: ["CU"], stage: 3 });

const hlt: Handler = (c) => {
  c.halted = true;
  c.push({ kind: "execute", title: "Halt", text: "The CPU stops here until an interrupt arrives.", wires: [], nodes: ["CU"], stage: 3 });
};

export const HANDLERS: Record<string, Handler> = {
  MOV: mov,
  ...Object.fromEntries([...Object.keys(ALU_OPS), "TEST"].map((k) => [k, alu])),
  INC: unary, DEC: unary, NEG: unary, NOT: unary,
  MUL: mulDiv, IMUL: mulDiv, DIV: mulDiv, IDIV: mulDiv,
  CBW: convert, CWD: convert,
  PUSH: pushOp, POP: popOp,
  JMP: jump, LOOP: jump,
  ...Object.fromEntries(Object.keys(JCC).map((k) => [k, jump])),
  NOP: nop, HLT: hlt,
};
