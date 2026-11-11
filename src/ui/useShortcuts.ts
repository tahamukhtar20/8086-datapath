// Global keys: ← and → step, E leaves run mode. They stay out of the way of text
// fields, menus, dialogs and browser shortcuts.
import { useEffect, useRef } from "react";

type Shortcuts = { forward: () => void; back: () => void; edit: () => void; enabled: boolean };

export function useShortcuts(handlers: Shortcuts) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = ref.current;
      if (!h.enabled || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target instanceof Element && e.target.closest('textarea, select, input:not([type="checkbox"]), dialog')) return;
      const action = e.key === "ArrowRight" ? h.forward : e.key === "ArrowLeft" ? h.back : e.key === "e" || e.key === "E" ? h.edit : null;
      if (!action) return;
      e.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
