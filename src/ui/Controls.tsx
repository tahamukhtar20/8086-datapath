import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import type { Phase } from "../cpu/types.ts";
import { SPEEDS } from "../sim/useSimulator.ts";

type ToolbarProps = {
  canBack: boolean;
  canForward: boolean;
  canReset: boolean;
  running: boolean;
  showPhases: boolean;
  speed: number;
  onBack: () => void;
  onForward: () => void;
  onToggleRun: () => void;
  onReset: () => void;
  onShowPhases: (on: boolean) => void;
  onSpeed: (ms: number) => void;
};

export function Toolbar(p: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="btn-group">
        <button type="button" className="btn" onClick={p.onBack} disabled={!p.canBack} aria-label="Step back">
          <StepBack size={18} />
          <span>Back</span>
        </button>
        <button type="button" className="btn primary" onClick={p.onForward} disabled={!p.canForward} aria-label="Step forward">
          <StepForward size={18} />
          <span>Step</span>
        </button>
        <button type="button" className="btn" onClick={p.onToggleRun} disabled={!p.canForward && !p.running} aria-label={p.running ? "Pause" : "Run"}>
          {p.running ? <Pause size={18} /> : <Play size={18} />}
          <span>{p.running ? "Pause" : "Run"}</span>
        </button>
        <button type="button" className="btn" onClick={p.onReset} disabled={!p.canReset} aria-label="Reset">
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
      </div>
      <div className="btn-group">
        <label className="toggle">
          <input type="checkbox" checked={p.showPhases} onChange={(e) => p.onShowPhases(e.target.checked)} />
          <span>Every phase</span>
        </label>
        {/* Blur after choosing so the arrow keys go back to stepping. */}
        <select className="select" value={p.speed} onChange={(e) => (p.onSpeed(+e.target.value), e.currentTarget.blur())} aria-label="Run speed">
          {SPEEDS.map((sp) => (
            <option key={sp.ms} value={sp.ms}>
              {sp.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

type PhaseBoxProps = { phases: Phase[]; index: number; status: string; endNote: string; fault: boolean; onPick: (i: number) => void };

export function PhaseBox({ phases, index, status, endNote, fault, onPick }: PhaseBoxProps) {
  return (
    <div className="phase-box">
      {phases.length > 0 && (
        <ol className="pills">
          {phases.map((p, i) => (
            <li key={i}>
              <button type="button" className={`pill ${i === index ? "current" : i < index ? "past" : ""}`} onClick={() => onPick(i)}>
                {p.title}
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className={`phase-text ${fault ? "fault" : ""}`} aria-live="polite">
        {status}
      </p>
      {endNote && <p className="muted small">{endNote}</p>}
    </div>
  );
}
