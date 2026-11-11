import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { hex } from "../cpu/assembler.ts";
import type { Program } from "../cpu/types.ts";

const LINE = 22;
const PAD = 10;

type Props = {
  value: string;
  onChange: (v: string) => void;
  program: Program;
  currentLine: number | null;
};

export function Editor({ value, onChange, program, currentLine }: Props) {
  const [scroll, setScroll] = useState(0);
  const area = useRef<HTMLTextAreaElement>(null);
  const lines = value.split("\n");
  const errorLines = new Map(program.errors.map((e) => [e.line, e.message]));

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    const t = e.currentTarget;
    const { selectionStart: a, selectionEnd: b } = t;
    onChange(value.slice(0, a) + "    " + value.slice(b));
    requestAnimationFrame(() => t.setSelectionRange(a + 4, a + 4));
  };

  return (
    <div className="editor-block">
      <div className="editor" style={{ height: LINE * 18 + PAD * 2 }}>
        <div className="gutter" aria-hidden>
          <div style={{ transform: `translateY(${PAD - scroll}px)` }}>
            {lines.map((_, i) => {
              const ins = program.byLine[i];
              return (
                <div key={i} className={`gutter-line ${errorLines.has(i) ? "error" : ""} ${i === currentLine ? "current" : ""}`}>
                  {errorLines.has(i) ? "error" : ins ? hex(ins.addr) : ""}
                </div>
              );
            })}
          </div>
        </div>
        <div className="code">
          {currentLine !== null && (
            <div className="line-highlight" style={{ top: PAD + currentLine * LINE - scroll, height: LINE }} />
          )}
          <textarea
            ref={area}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            aria-label="Assembly program"
            style={{ padding: `${PAD}px 12px`, lineHeight: `${LINE}px` }}
          />
        </div>
        <div className="bytes" aria-hidden>
          <div style={{ transform: `translateY(${PAD - scroll}px)` }}>
            {lines.map((_, i) => {
              const ins = program.byLine[i];
              return (
                <div key={i} className={`bytes-line ${i === currentLine ? "current" : ""}`}>
                  {ins ? ins.bytes.map((b) => hex(b, 2)).join(" ") : ""}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {program.errors.length > 0 && (
        <ul className="errors" role="alert">
          {program.errors.map((e) => (
            <li key={`${e.line}-${e.message}`}>
              <span className="mono">Line {e.line + 1}</span> {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
