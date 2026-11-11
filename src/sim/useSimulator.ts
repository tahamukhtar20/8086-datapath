// React wrapper around a Session: re-renders on every change, runs the Run timer,
// and starts a fresh session whenever the program changes.
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Program } from "../cpu/types.ts";
import { Session, viewOf } from "./session.ts";

export const SPEEDS = [
  { label: "Slow", ms: 1200 },
  { label: "Normal", ms: 650 },
  { label: "Fast", ms: 220 },
  { label: "Turbo", ms: 40 },
];

const DATA_START = 0x200;

export function useSimulator(program: Program, onStep?: () => void) {
  const session = useRef<Session | null>(null);
  // Replace the session during render, not in an effect, so a new program is never
  // drawn with the previous program's state for a frame.
  if (!session.current || session.current.program !== program) session.current = new Session(program);
  const s = session.current;

  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [running, setRunning] = useState(false);
  const [showPhases, setShowPhasesState] = useState(true);
  const [speed, setSpeed] = useState(SPEEDS[1].ms);
  // Start of the 32-byte data window in the Memory panel; follows DS accesses.
  const [dataBase, setDataBase] = useState(DATA_START);

  const phasesRef = useRef(showPhases);
  phasesRef.current = showPhases;
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  // A new program stops the run and resets the memory window in the same render,
  // so the Run timer can never step the new program.
  const [shownProgram, setShownProgram] = useState(program);
  if (shownProgram !== program) {
    setShownProgram(program);
    setRunning(false);
    setDataBase(DATA_START);
  }

  const forward = useCallback((): boolean => {
    const cur = session.current!;
    const res = cur.forward(phasesRef.current);
    if (!res) return false;
    if (typeof res === "object") {
      const ds = cur.machine.regs.DS * 16;
      const touched = [...res.writes.map((w) => w.addr), ...res.reads].find((p) => p >= ds && p < ds + 0x10000);
      if (touched !== undefined) {
        const off = touched - ds;
        setDataBase((b) => (off >= b && off < b + 32 ? b : off & 0xffe0));
      }
    }
    onStepRef.current?.();
    rerender();
    return true;
  }, []);

  const back = useCallback(() => {
    if (session.current!.back(phasesRef.current)) rerender();
  }, []);

  const reset = useCallback(() => {
    session.current = new Session(session.current!.program);
    setRunning(false);
    setDataBase(DATA_START);
    rerender();
  }, []);

  const showPhase = useCallback((i: number) => {
    setRunning(false);
    session.current!.showPhase(i);
    rerender();
  }, []);

  const setShowPhases = useCallback((on: boolean) => {
    setShowPhasesState(on);
    if (!on) {
      session.current!.skipToLastPhase();
      rerender();
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      if (!forward()) setRunning(false);
    }, speed);
    return () => clearInterval(t);
  }, [running, forward, speed]);

  return {
    view: viewOf(s),
    count: s.count,
    forward,
    back,
    reset,
    showPhase,
    running,
    setRunning,
    showPhases,
    setShowPhases,
    speed,
    setSpeed,
    dataBase,
    setDataBase,
  };
}
