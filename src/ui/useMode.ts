// Edit mode gives the editor room; run mode gives the die room. Switching animates the
// layout in CSS; `morphing` is true while it does, so the board can drop its glow filters.
import { useCallback, useEffect, useRef, useState } from "react";

export type Mode = "edit" | "run";
const MORPH_MS = 560;

export function useMode() {
  const [mode, setModeState] = useState<Mode>("edit");
  const [morphing, setMorphing] = useState(false);
  const modeRef = useRef(mode);
  const timer = useRef<number>();

  const setMode = useCallback((m: Mode) => {
    if (modeRef.current === m) return;
    modeRef.current = m;
    setModeState(m);
    setMorphing(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMorphing(false), MORPH_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { mode, morphing, setMode, isRun: () => modeRef.current === "run" };
}
