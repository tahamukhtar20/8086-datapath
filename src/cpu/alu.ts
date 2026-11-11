// Arithmetic, flags and conditions shared by the instruction handlers.
import { FLAG_NAMES } from "./types.ts";
import type { Flags, Size } from "./types.ts";

export const mask = (size: Size) => (size === 8 ? 0xff : 0xffff);
const sign = (size: Size) => (size === 8 ? 0x80 : 0x8000);
export const toSigned = (v: number, size: Size) => (v & sign(size) ? v - (mask(size) + 1) : v);

const parity = (v: number) => {
  let c = 0;
  for (let x = v & 0xff; x; x >>= 1) c += x & 1;
  return c % 2 === 0;
};

/** Set ZF, SF and PF from a result. */
function szp(f: Flags, r: number, size: Size) {
  f.ZF = r === 0;
  f.SF = (r & sign(size)) !== 0;
  f.PF = parity(r);
}

export function add(f: Flags, a: number, b: number, carry: number, size: Size, setCF = true) {
  const full = a + b + carry;
  const r = full & mask(size);
  if (setCF) f.CF = full > mask(size);
  f.OF = ((a ^ r) & (b ^ r) & sign(size)) !== 0;
  f.AF = ((a ^ b ^ r) & 0x10) !== 0;
  szp(f, r, size);
  return r;
}

export function sub(f: Flags, a: number, b: number, borrow: number, size: Size, setCF = true) {
  const full = a - b - borrow;
  const r = full & mask(size);
  if (setCF) f.CF = full < 0;
  f.OF = ((a ^ b) & (a ^ r) & sign(size)) !== 0;
  f.AF = ((a ^ b ^ r) & 0x10) !== 0;
  szp(f, r, size);
  return r;
}

export function logic(f: Flags, r: number, size: Size) {
  f.CF = f.OF = f.AF = false;
  szp(f, r, size);
  return r;
}

/** Jcc opcode → [condition text, test]. */
export const CONDITIONS: Record<number, [string, (f: Flags) => boolean]> = {
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

/** "ZF 0→1"-style descriptions of the flags that changed. */
export function flagChanges(a: Flags, b: Flags) {
  return FLAG_NAMES.filter((n) => a[n] !== b[n]).map((n) => `${n} ${+a[n]}→${+b[n]}`);
}

/** Sentence fragment listing changed flags, or saying there were none. */
export const flagText = (old: Flags, now: Flags) => {
  const changed = flagChanges(old, now);
  return changed.length ? `Flags: ${changed.join(", ")}.` : "No flag changes.";
};
