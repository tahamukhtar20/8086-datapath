import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { hex } from "../cpu/assembler.ts";
import { FLAG_NAMES, REG16, SREG } from "../cpu/types.ts";
import type { Field, Flags, Instr, Regs } from "../cpu/types.ts";

const KIND_NAME: Record<Field["kind"], string> = {
  opcode: "opcode",
  flag: "d / s / w bits",
  mod: "mod",
  reg: "reg",
  rm: "r/m",
  disp: "displacement",
  data: "immediate",
};

export function Encoding({ instr, next }: { instr?: Instr; next: boolean }) {
  const [focus, setFocus] = useState(0);
  if (!instr) return <p className="muted">No instruction at IP.</p>;
  // Group fields into bytes.
  const rows: { field: Field; index: number }[][] = [];
  let bits = 0;
  instr.fields.forEach((field, index) => {
    if (bits % 8 === 0) rows.push([]);
    rows.at(-1)!.push({ field, index });
    bits += field.bits.length;
  });
  const f = instr.fields[Math.min(focus, instr.fields.length - 1)];
  return (
    <div className="enc">
      <div className="enc-head">
        <span className="mono enc-source">{instr.source.toUpperCase()}</span>
        <span className="muted small">{next ? "next" : "current"}</span>
      </div>
      <div className="byte-chips">
        {instr.bytes.map((b, i) => (
          <span key={i} className="byte-chip mono">
            {hex(b, 2)}
          </span>
        ))}
        <span className="muted small mono enc-form" title={instr.form}>
          {instr.form}
        </span>
      </div>
      <div className="bitrows">
        {rows.map((row, i) => (
          <div key={i} className="bitrow">
            <span className="mono muted small byte-index">{hex(instr.bytes[i], 2)}</span>
            <div className="bitfields">
              {row.map(({ field, index }) => (
                <button
                  type="button"
                  key={index}
                  className={`bitfield k-${field.kind} ${index === focus ? "focus" : ""}`}
                  style={{ flexGrow: field.bits.length }}
                  onMouseEnter={() => setFocus(index)}
                  onFocus={() => setFocus(index)}
                  onClick={() => setFocus(index)}
                  aria-label={`${field.label}: ${field.note}`}
                >
                  <span className="mono bits">{field.bits}</span>
                  <span className="field-label">{field.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="field-note">
        <span className={`swatch k-${f.kind}`} aria-label={KIND_NAME[f.kind]} />
        <span className="mono note-label">{f.label}</span>
        <span>{f.note}</span>
      </p>
      <p className="muted small hint">Hover a field to see what it encodes.</p>
    </div>
  );
}

const FLAG_TITLE: Record<string, string> = {
  OF: "Overflow",
  SF: "Sign",
  ZF: "Zero",
  AF: "Auxiliary carry",
  PF: "Parity",
  CF: "Carry",
};

export function StatePanel({ regs, flags, changed }: { regs: Regs; flags: Flags; changed: Set<string> }) {
  return (
    <section className="panel state-panel">
      <h2>Registers</h2>
      <div className="reg-grid">
        {[...REG16, ...SREG, "IP" as const].map((k) => (
          <div key={k} className={`reg ${changed.has(k) ? "changed" : ""}`}>
            <span className="mono muted">{k}</span>
            <span className="mono">{hex(regs[k])}</span>
          </div>
        ))}
      </div>
      <div className="flag-row">
        {FLAG_NAMES.map((n) => (
          <span key={n} className={`flag ${flags[n] ? "set" : ""} ${changed.has(n) ? "changed" : ""}`} title={FLAG_TITLE[n]}>
            <span className="mono">{n}</span>
            <span className="mono">{+flags[n]}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

type MemProps = {
  regs: Regs;
  peek: (phys: number) => number;
  written: Set<number>;
  read: Set<number>;
  dataBase: number;
  setDataBase: (v: number) => void;
};

export function MemoryPanel({ regs, peek, written, read, dataBase, setDataBase }: MemProps) {
  const stackBase = Math.max(0, Math.min(0xfff0, ((regs.SP - 6) & 0xfff8) >>> 0));
  return (
    <div className="mem">
      <div className="mem-head">
        <h3>
          Data <span className="mono muted">DS = {hex(regs.DS)}</span>
        </h3>
        <div className="mem-nav">
          <button type="button" className="icon-btn" aria-label="Previous 32 bytes" onClick={() => setDataBase((dataBase - 32) & 0xffe0)}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="icon-btn" aria-label="Next 32 bytes" onClick={() => setDataBase((dataBase + 32) & 0xffe0)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <HexGrid seg={regs.DS} base={dataBase} count={32} peek={peek} written={written} read={read} />
      <h3>
        Stack <span className="mono muted">SS = {hex(regs.SS)}, SP = {hex(regs.SP)}</span>
      </h3>
      <HexGrid seg={regs.SS} base={stackBase} count={16} peek={peek} written={written} read={read} marker={regs.SP} />
      <p className="muted small hint">Low byte first. Hover a byte for its address.</p>
    </div>
  );
}

function HexGrid({ seg, base, count, peek, written, read, marker }: {
  seg: number; base: number; count: number; peek: (p: number) => number; written: Set<number>; read: Set<number>; marker?: number;
}) {
  const rows = [];
  for (let off = base; off < base + count; off += 8) {
    rows.push(
      <div key={off} className="hex-row">
        <span className="mono muted hex-addr">{hex(off)}</span>
        {Array.from({ length: 8 }, (_, k) => {
          const o = (off + k) & 0xffff;
          const p = (seg * 16 + o) & 0xfffff;
          const c = ["hex-cell", "mono", written.has(p) && "w", read.has(p) && "r", marker === o && "sp"].filter(Boolean).join(" ");
          return (
            <span key={k} className={c} title={`${hex(seg)}:${hex(o)} = ${hex(p, 5)}h`}>
              {hex(peek(p), 2)}
            </span>
          );
        })}
      </div>,
    );
  }
  return <div className="hex">{rows}</div>;
}
