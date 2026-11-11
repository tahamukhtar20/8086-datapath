import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { BookOpen, CodeXml, Pause, Pencil, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import { assemble, hex, JCC } from "./cpu/assembler.ts";
import { EXAMPLES } from "./cpu/examples.ts";
import { Machine, step, undo } from "./cpu/machine.ts";
import { FLAG_NAMES, REG16, SREG } from "./cpu/types.ts";
import type { Program, Regs, StepResult } from "./cpu/types.ts";
import { Board } from "./ui/Board.tsx";
import { Editor } from "./ui/Editor.tsx";
import { Encoding, MemoryPanel, StatePanel } from "./ui/Panels.tsx";
import { Reference } from "./ui/Reference.tsx";

const REPO = "https://github.com/tahamukhtar20/8086-Master-COAL";
const MAX_HISTORY = 5000;
const MAX_INSTRUCTIONS = 20000;
const SPEEDS = [
  { label: "Slow", ms: 1200 },
  { label: "Normal", ms: 650 },
  { label: "Fast", ms: 220 },
  { label: "Turbo", ms: 40 },
];

type Mode = "edit" | "run";
type Sim = { machine: Machine; history: StepResult[]; phase: number; count: number };
const newSim = (p: Program): Sim => ({ machine: new Machine(p), history: [], phase: 0, count: 0 });

export default function App() {
  const [source, setSource] = useState(EXAMPLES[0].code);
  const [exampleId, setExampleId] = useState(EXAMPLES[0].id);
  const program = useMemo(() => assemble(source), [source]);
  const sim = useRef<Sim>(newSim(program));
  const [, render] = useReducer((x: number) => x + 1, 0);
  const [running, setRunning] = useState(false);
  const [showPhases, setShowPhases] = useState(true);
  const [speed, setSpeed] = useState(SPEEDS[1].ms);
  const [dataBase, setDataBase] = useState(0x200);
  const [tab, setTab] = useState<"enc" | "mem">("enc");
  const [refOpen, setRefOpen] = useState(false);
  const [mode, setModeState] = useState<Mode>("edit");
  const [morphing, setMorphing] = useState(false);
  const morphTimer = useRef<number>();
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const setMode = useCallback((m: Mode) => {
    if (modeRef.current === m) return;
    modeRef.current = m;
    setModeState(m);
    // Drop the SVG glows while the columns resize so each frame paints cheaply.
    setMorphing(true);
    window.clearTimeout(morphTimer.current);
    morphTimer.current = window.setTimeout(() => setMorphing(false), 560);
  }, []);
  const phasesRef = useRef(showPhases);
  phasesRef.current = showPhases;

  const reset = useCallback(() => {
    sim.current = newSim(program);
    setRunning(false);
    setDataBase(0x200);
    render();
  }, [program]);
  useEffect(reset, [reset]);

  const forward = useCallback((): boolean => {
    const s = sim.current;
    if (program.errors.length) return false;
    setMode("run");
    const cur = s.history.at(-1);
    if (cur && phasesRef.current && s.phase < cur.phases.length - 1) {
      s.phase++;
      render();
      return true;
    }
    if (cur?.halted || s.count >= MAX_INSTRUCTIONS) return false;
    const res = step(s.machine, program);
    if (!res) return false;
    s.history.push(res);
    if (s.history.length > MAX_HISTORY) s.history.shift();
    s.count++;
    s.phase = phasesRef.current ? 0 : res.phases.length - 1;
    const ds = s.machine.regs.DS * 16;
    const touched = [...res.writes.map((w) => w.addr), ...res.reads].find((p) => p >= ds && p < ds + 0x10000);
    if (touched !== undefined) {
      const off = touched - ds;
      setDataBase((b) => (off >= b && off < b + 32 ? b : off & 0xffe0));
    }
    render();
    return true;
  }, [program, setMode]);

  const back = useCallback(() => {
    const s = sim.current;
    const cur = s.history.at(-1);
    if (!cur) return;
    if (phasesRef.current && s.phase > 0) s.phase--;
    else {
      undo(s.machine, cur);
      s.history.pop();
      s.count--;
      const prev = s.history.at(-1);
      s.phase = prev ? prev.phases.length - 1 : 0;
    }
    render();
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      if (!forward()) setRunning(false);
    }, speed);
    return () => clearInterval(t);
  }, [running, forward, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest("textarea, input, select")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setRunning(false);
        forward();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setRunning(false);
        back();
      } else if ((e.key === "e" || e.key === "E") && !e.ctrlKey && !e.metaKey && !e.altKey && modeRef.current === "run") {
        e.preventDefault();
        setRunning(false);
        setMode("edit");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [forward, back, setMode]);

  const togglePhases = (on: boolean) => {
    setShowPhases(on);
    const s = sim.current;
    const cur = s.history.at(-1);
    if (!on && cur) {
      s.phase = cur.phases.length - 1;
      render();
    }
  };

  // ---- what the board shows ----
  const s = sim.current;
  const cur = s.history.at(-1);
  const phase = cur?.phases[s.phase] ?? null;
  const stage = phase?.stage ?? 3;
  const atEnd = !cur || s.phase === cur.phases.length - 1;
  const len = cur?.instr.bytes.length ?? 0;
  let regs: Regs = s.machine.regs;
  let flags = regs.flags;
  if (cur) {
    regs = stage >= 3 ? cur.after : { ...cur.before, IP: stage >= 1 ? (cur.before.IP + len) & 0xffff : cur.before.IP };
    flags = stage >= 2 ? cur.after.flags : cur.before.flags;
  }
  const changed = new Set<string>();
  if (cur && stage >= 3) {
    for (const k of [...REG16, ...SREG]) if (cur.before[k] !== cur.after[k]) changed.add(k);
    for (const x of "ABCD") {
      const b = cur.before[`${x}X` as "AX"];
      const a = cur.after[`${x}X` as "AX"];
      if ((a ^ b) & 0xff) changed.add(`${x}L`);
      if ((a ^ b) & 0xff00) changed.add(`${x}H`);
    }
  }
  if (cur && stage >= 2) for (const n of FLAG_NAMES) if (cur.before.flags[n] !== cur.after.flags[n]) changed.add(n);

  const isJump = cur && (cur.instr.mnemonic === "JMP" || cur.instr.mnemonic === "LOOP" || cur.instr.mnemonic in JCC);
  const flushed = !!(isJump && stage >= 3 && cur.after.IP !== ((cur.before.IP + len) & 0xffff));
  const queue = cur && !flushed ? cur.instr.bytes : [];
  const cu = cur && s.phase >= 1 ? { form: cur.instr.form, source: cur.instr.source.toUpperCase() } : null;

  const oldBytes = new Map<number, number>();
  for (const w of cur?.writes ?? []) if (!oldBytes.has(w.addr)) oldBytes.set(w.addr, w.old);
  const peek = (p: number) => (cur && stage < 3 && oldBytes.has(p) ? oldBytes.get(p)! : s.machine.mem[p]);
  const written = new Set(cur && stage >= 3 ? cur.writes.map((w) => w.addr) : []);
  const readIdx = cur ? cur.phases.findIndex((p) => p.kind === "read") : -1;
  const read = new Set(cur && readIdx >= 0 && s.phase >= readIdx ? cur.reads : []);

  const nextInstr = program.byAddr.get(s.machine.regs.IP);
  const ended = atEnd && (cur?.halted || !nextInstr);
  const encInstr = cur && !atEnd ? cur.instr : cur && atEnd && !ended ? nextInstr : cur?.instr ?? nextInstr;
  const currentLine = encInstr?.line ?? null;
  const hasErrors = program.errors.length > 0;
  const canForward = !hasErrors && !ended && s.count < MAX_INSTRUCTIONS;

  let status: string;
  if (hasErrors) status = "Fix the errors in the program to run it.";
  else if (!cur) status = `Press Step to fetch the first instruction at CS:IP = ${hex(regs.CS)}:${hex(regs.IP)}.`;
  else status = phase!.text;
  let endNote = "";
  if (cur && atEnd) {
    if (cur.error) endNote = `Stopped after ${s.count} instruction${s.count > 1 ? "s" : ""}.`;
    else if (cur.halted) endNote = `Halted after ${s.count} instruction${s.count > 1 ? "s" : ""}.`;
    else if (!nextInstr) endNote = `IP ${hex(s.machine.regs.IP)}h is past the end of the program.`;
    else if (s.count >= MAX_INSTRUCTIONS) endNote = `Stopped after ${MAX_INSTRUCTIONS.toLocaleString()} instructions.`;
  }

  const loadExample = (id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id)!;
    setExampleId(id);
    setSource(ex.code);
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div className="title">
          <h1>8086 Datapath</h1>
        </div>
        <div className="top-actions">
          <button type="button" className="source-link" onClick={() => setRefOpen(true)}>
            <BookOpen size={18} />
            <span>Reference</span>
          </button>
          <a className="source-link" href={REPO}>
            <CodeXml size={18} />
            <span>Source</span>
          </a>
        </div>
      </header>

      <main className={`layout ${mode} ${morphing ? "morphing" : ""}`}>
        <div className="col col-right">
        <section className="panel board-panel">
          <div className="toolbar">
            <div className="btn-group">
              <button type="button" className="btn" onClick={() => (setRunning(false), back())} disabled={!cur} aria-label="Step back">
                <StepBack size={18} />
                <span>Back</span>
              </button>
              <button type="button" className="btn primary" onClick={() => (setRunning(false), forward())} disabled={!canForward} aria-label="Step forward">
                <StepForward size={18} />
                <span>Step</span>
              </button>
              <button type="button" className="btn" onClick={() => setRunning((r) => !r)} disabled={!canForward && !running}>
                {running ? <Pause size={18} /> : <Play size={18} />}
                <span>{running ? "Pause" : "Run"}</span>
              </button>
              <button type="button" className="btn" onClick={reset} disabled={!cur} aria-label="Reset">
                <RotateCcw size={18} />
                <span>Reset</span>
              </button>
            </div>
            <div className="btn-group">
              <label className="toggle">
                <input type="checkbox" checked={showPhases} onChange={(e) => togglePhases(e.target.checked)} />
                <span>Every phase</span>
              </label>
              <select className="select" value={speed} onChange={(e) => setSpeed(+e.target.value)} aria-label="Run speed">
                {SPEEDS.map((sp) => (
                  <option key={sp.ms} value={sp.ms}>
                    {sp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="board-wrap">
            <Board regs={regs} flags={flags} phase={phase} queue={queue} cu={cu} changed={changed} />
          </div>

          <div className="phase-box">
            {cur && (
              <ol className="pills">
                {cur.phases.map((p, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={`pill ${i === s.phase ? "current" : i < s.phase ? "past" : ""}`}
                      onClick={() => {
                        setRunning(false);
                        s.phase = i;
                        render();
                      }}
                    >
                      {p.title}
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <p className={`phase-text ${phase?.kind === "fault" ? "fault" : ""}`} aria-live="polite">
              {status}
            </p>
            {endNote && <p className="muted small">{endNote}</p>}
          </div>
        </section>
        <StatePanel regs={regs} flags={flags} changed={changed} />
        </div>

        <div className="col col-left">
        <section className="panel editor-panel">
          <div className="panel-head">
            <h2>Program</h2>
            {mode === "run" && (
              <button type="button" className="btn small-btn" onClick={() => (setRunning(false), setMode("edit"))}>
                <Pencil size={15} />
                <span>Edit</span>
              </button>
            )}
            <select className="select" value={exampleId} onChange={(e) => loadExample(e.target.value)} aria-label="Example program">
              {EXAMPLES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>
          <Editor
            value={source}
            onChange={setSource}
            program={program}
            currentLine={currentLine}
            readOnly={mode === "run"}
            onActivate={() => (setRunning(false), setMode("edit"))}
          />
          <p className="muted small hint">
            {mode === "edit" ? (
              <>
                Loaded at CS:0100h. <span className="mono">;</span> starts a comment. Step or Run to start.
              </>
            ) : (
              <>Arrow keys step. Click the code or press E to edit.</>
            )}
          </p>
        </section>

        <section className="panel info-panel">
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "enc"} className={`tab ${tab === "enc" ? "on" : ""}`} onClick={() => setTab("enc")}>
              Encoding
            </button>
            <button type="button" role="tab" aria-selected={tab === "mem"} className={`tab ${tab === "mem" ? "on" : ""}`} onClick={() => setTab("mem")}>
              Memory
            </button>
          </div>
          {tab === "enc" ? (
            <Encoding key={encInstr?.addr ?? -1} instr={encInstr} next={!!encInstr && encInstr !== cur?.instr} />
          ) : (
            <MemoryPanel regs={regs} peek={peek} written={written} read={read} dataBase={dataBase} setDataBase={setDataBase} />
          )}
        </section>
        </div>
      </main>

      <Reference open={refOpen} onClose={() => setRefOpen(false)} />
    </div>
  );
}
