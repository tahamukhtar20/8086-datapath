import { useMemo, useState } from "react";
import { BookOpen, CodeXml, Pencil } from "lucide-react";
import { assemble } from "./cpu/assembler.ts";
import { EXAMPLES } from "./cpu/examples.ts";
import { useSimulator } from "./sim/useSimulator.ts";
import { Board } from "./ui/Board.tsx";
import { PhaseBox, Toolbar } from "./ui/Controls.tsx";
import { Editor } from "./ui/Editor.tsx";
import { InfoTabs, StatePanel } from "./ui/Panels.tsx";
import { Reference } from "./ui/Reference.tsx";
import { useMode } from "./ui/useMode.ts";
import { useShortcuts } from "./ui/useShortcuts.ts";

const REPO = "https://github.com/tahamukhtar20/8086-Master-COAL";

export default function App() {
  const [source, setSource] = useState(EXAMPLES[0].code);
  const [exampleId, setExampleId] = useState(EXAMPLES[0].id);
  const [refOpen, setRefOpen] = useState(false);
  const program = useMemo(() => assemble(source), [source]);
  const { mode, morphing, setMode, isRun } = useMode();
  // Any step that happens switches to run mode.
  const sim = useSimulator(program, () => setMode("run"));
  const { view } = sim;

  const stop = () => sim.setRunning(false);
  const edit = () => (stop(), setMode("edit"));
  useShortcuts({
    enabled: !refOpen,
    forward: () => (stop(), sim.forward()),
    back: () => (stop(), sim.back()),
    edit: () => isRun() && edit(),
  });

  const loadExample = (id: string) => {
    setExampleId(id);
    setSource(EXAMPLES.find((e) => e.id === id)!.code);
  };

  return (
    <div className="app">
      <header className="top-bar">
        <h1>8086 Datapath</h1>
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
            <Toolbar
              canBack={view.canBack}
              canForward={view.canForward}
              canReset={view.canReset}
              running={sim.running}
              showPhases={sim.showPhases}
              speed={sim.speed}
              onBack={() => (stop(), sim.back())}
              onForward={() => (stop(), sim.forward())}
              onToggleRun={() => sim.setRunning((r) => !r)}
              onReset={sim.reset}
              onShowPhases={sim.setShowPhases}
              onSpeed={sim.setSpeed}
            />
            <div className="board-wrap">
              <Board regs={view.regs} flags={view.flags} phase={view.phase} queue={view.queue} cu={view.cu} changed={view.changed} />
            </div>
            <PhaseBox
              phases={view.phases}
              index={view.phaseIndex}
              status={view.status}
              endNote={view.endNote}
              fault={view.phase?.kind === "fault"}
              onPick={sim.showPhase}
            />
          </section>
          <StatePanel regs={view.regs} flags={view.flags} changed={view.changed} />
        </div>

        <div className="col col-left">
          <section className="panel editor-panel">
            <div className="panel-head">
              <h2>Program</h2>
              {mode === "run" && (
                <button type="button" className="btn small-btn" onClick={edit} aria-label="Edit program">
                  <Pencil size={15} />
                  <span>Edit</span>
                </button>
              )}
              <select className="select" value={exampleId} onChange={(e) => (loadExample(e.target.value), e.currentTarget.blur())} aria-label="Example program">
                {EXAMPLES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>
            <Editor value={source} onChange={setSource} program={program} currentLine={view.currentLine} readOnly={mode === "run"} onActivate={edit} />
            <p className="muted small hint">
              {mode === "edit" ? (
                <>
                  Loaded at CS:0100h. <span className="mono">;</span> starts a comment. Step or Run to start.
                </>
              ) : (
                "Arrow keys step. Click the code or press E to edit."
              )}
            </p>
          </section>

          <div className="info-wrap">
            <div className="info-inner">
              <InfoTabs view={view} dataBase={sim.dataBase} setDataBase={sim.setDataBase} />
            </div>
          </div>
        </div>
      </main>

      <Reference open={refOpen} onClose={() => setRefOpen(false)} />
    </div>
  );
}
