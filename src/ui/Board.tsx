import type { ReactNode } from "react";
import { hex } from "../cpu/assembler.ts";
import { FLAG_NAMES } from "../cpu/types.ts";
import type { Flags, Phase, Regs, Role, SReg, Wire } from "../cpu/types.ts";

type Pt = [number, number];

const SEGS: { name: SReg; y: number }[] = [
  { name: "ES", y: 40 },
  { name: "CS", y: 76 },
  { name: "SS", y: 112 },
  { name: "DS", y: 148 },
];
const segY = (s: SReg) => SEGS.find((x) => x.name === s)!.y + 15;
const BUS_Y = 285;

const WIRES: Record<Wire, Pt[]> = {
  es_sigma: [[460, segY("ES")], [430, segY("ES")], [430, 70], [400, 70]],
  cs_sigma: [[460, segY("CS")], [430, segY("CS")], [430, 70], [400, 70]],
  ss_sigma: [[460, segY("SS")], [430, segY("SS")], [430, 70], [400, 70]],
  ds_sigma: [[460, segY("DS")], [430, segY("DS")], [430, 70], [400, 70]],
  ip_sigma: [[460, 211], [415, 211], [415, 100], [400, 100]],
  ea_sigma: [[415, BUS_Y], [415, 100], [400, 100]],
  sigma_mem: [[250, 85], [170, 85]],
  mem_queue: [[100, 40], [100, 18], [940, 18], [940, 90]],
  queue_cu: [[1080, 140], [1080, 330]],
  queue_bus: [[820, 140], [820, BUS_Y]],
  mem_bus: [[100, 230], [100, BUS_Y]],
  regs_bus: [[270, 322], [270, BUS_Y]],
  bus_alu_a: [[580, BUS_Y], [580, 430]],
  bus_alu_b: [[700, BUS_Y], [700, 430]],
  alu_bus: [[640, 540], [640, 560], [500, 560], [500, BUS_Y]],
  alu_flags: [[640, 540], [640, 600]],
  cu_alu: [[900, 420], [800, 420], [800, 450], [749, 450]],
  flags_cu: [[760, 620], [1030, 620], [1030, 440]],
  bus_es: [[680, segY("ES")], [720, segY("ES")], [720, BUS_Y]],
  bus_cs: [[680, segY("CS")], [720, segY("CS")], [720, BUS_Y]],
  bus_ss: [[680, segY("SS")], [720, segY("SS")], [720, BUS_Y]],
  bus_ds: [[680, segY("DS")], [720, segY("DS")], [720, BUS_Y]],
};
const BUS_WIRES = new Set<Wire>(["ea_sigma", "queue_bus", "mem_bus", "regs_bus", "bus_alu_a", "bus_alu_b", "alu_bus", "bus_es", "bus_cs", "bus_ss", "bus_ds"]);

const pts = (p: Pt[]) => p.map(([x, y]) => `${x},${y}`).join(" ");

const GPR_ROWS: { name: string; y: number; split: boolean }[] = [
  { name: "AX", y: 352, split: true },
  { name: "BX", y: 386, split: true },
  { name: "CX", y: 420, split: true },
  { name: "DX", y: 454, split: true },
  { name: "SP", y: 498, split: false },
  { name: "BP", y: 532, split: false },
  { name: "SI", y: 566, split: false },
  { name: "DI", y: 600, split: false },
];

type Props = {
  regs: Regs;
  flags: Flags;
  phase: Phase | null;
  queue: number[];
  cu: { form: string; source: string } | null;
  changed: Set<string>;
};

export function Board({ regs, flags, phase, queue, cu, changed }: Props) {
  const active = new Set<Wire>();
  const reversed = new Set<Wire>();
  for (const w of phase?.wires ?? []) {
    const id = (w.startsWith("~") ? w.slice(1) : w) as Wire;
    active.add(id);
    if (w.startsWith("~")) reversed.add(id);
  }
  const busActive = [...active].some((w) => BUS_WIRES.has(w));
  const nodes = new Set(phase?.nodes ?? []);
  const role = (n: string): Role | undefined => phase?.roles[n];
  const on = (n: string) => nodes.has(n);
  const cls = (n: string, extra = "") =>
    ["part", on(n) && "on", role(n), extra].filter(Boolean).join(" ");

  const sigma = phase?.sigma;
  const bus = phase?.bus;

  return (
    <svg className="board" viewBox="0 0 1200 680" role="img" aria-label="8086 block diagram drawn as a circuit board">
      <defs>
        <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.9" className="dot" />
        </pattern>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="2" y="2" width="1196" height="676" rx="18" className="pcb" />
      <rect x="2" y="2" width="1196" height="676" rx="18" fill="url(#dots)" />
      {[[22, 22], [1178, 22], [22, 658], [1178, 658]].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="8" className="hole-ring" />
          <circle cx={x} cy={y} r="4.5" className="hole" />
        </g>
      ))}

      <rect x="40" y="8" width="1124" height="254" rx="8" className="frame" />
      <Legend x={1150} y={8} text="BUS INTERFACE UNIT" anchor="end" />
      <rect x="40" y="306" width="1124" height="346" rx="8" className="frame" />
      <Legend x={52} y={306} text="EXECUTION UNIT" anchor="start" />

      {/* traces */}
      <polyline points={pts([[100, BUS_Y], [880, BUS_Y]])} className={`bus ${busActive ? "on" : ""}`} />
      <text x="116" y={BUS_Y - 8} className="silk small">INTERNAL BUS · 16 BIT</text>
      {(Object.keys(WIRES) as Wire[]).map((id) => (
        <polyline key={id} points={pts(WIRES[id])} className="trace" />
      ))}
      {(Object.keys(WIRES) as Wire[]).flatMap((id) => [WIRES[id][0], WIRES[id].at(-1)!]).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.4" className="pad" />
      ))}
      {[...active].map((id) => {
        const p = reversed.has(id) ? [...WIRES[id]].reverse() : WIRES[id];
        return (
          <g key={`a-${id}`}>
            <polyline points={pts(p)} className="trace live" filter="url(#glow)" />
            <polyline points={pts(p)} className="trace flow" />
          </g>
        );
      })}

      {/* memory */}
      <Chip x={30} y={40} w={140} h={190} pins="lr" className={cls("MEM")}>
        <text x="100" y="72" className="silk title" textAnchor="middle">MEMORY</text>
        <text x="100" y="92" className="silk small" textAnchor="middle">1 MB · 20-BIT</text>
        {bus && on("MEM") ? (
          <>
            <text x="100" y="134" className="value" textAnchor="middle">{hex(bus.phys, 5)}h</text>
            <text x="100" y="164" className="value dim" textAnchor="middle">
              {bus.bytes.slice(0, 4).map((b) => hex(b, 2)).join(" ")}
              {bus.bytes.length > 4 ? " …" : ""}
            </text>
            <text x="100" y="196" className={`silk small ${bus.dir}`} textAnchor="middle">
              {bus.dir === "read" ? "READ" : "WRITE"}
            </text>
          </>
        ) : (
          <text x="100" y="150" className="silk dim" textAnchor="middle">idle</text>
        )}
      </Chip>

      {/* Σ adder */}
      <polygon points="400,45 400,125 250,105 250,65" className={cls("SIGMA", "adder")} />
      <text x="325" y="92" className="sigma" textAnchor="middle">Σ</text>
      {sigma && on("SIGMA") && (
        <>
          <text x="325" y="118" className="value tiny" textAnchor="middle">
            {hex(sigma.segVal)}:{hex(sigma.off)}
          </text>
          <text x="210" y="77" className="value tiny gold" textAnchor="middle">{hex(sigma.phys, 5)}h</text>
        </>
      )}

      {/* segment registers and IP */}
      {SEGS.map(({ name, y }) => (
        <RegBox key={name} x={460} y={y} w={220} name={name} value={hex(regs[name])} className={cls(name)} changed={changed.has(name)} />
      ))}
      <RegBox x={460} y={196} w={220} name="IP" value={hex(regs.IP)} className={cls("IP")} changed={changed.has("IP")} />

      {/* queue */}
      <text x="760" y="80" className="silk small">INSTRUCTION QUEUE · 6 BYTES</text>
      {Array.from({ length: 6 }, (_, k) => (
        <g key={k}>
          <rect x={760 + k * 60} y={90} width={56} height={50} rx={4} className={cls("QUEUE", "cell")} />
          <text x={788 + k * 60} y={122} className={`value ${queue[k] === undefined ? "dim" : ""}`} textAnchor="middle">
            {queue[k] === undefined ? "··" : hex(queue[k], 2)}
          </text>
        </g>
      ))}

      {/* registers */}
      <Chip x={120} y={322} w={300} h={318} pins="tb" className={cls("REGS", "regs")}>
        <text x="132" y="342" className="silk small">GENERAL REGISTERS</text>
        {GPR_ROWS.map((row) => {
          const full = row.name;
          const hi = `${full[0]}H`;
          const lo = `${full[0]}L`;
          const v = regs[full as keyof Regs] as number;
          return (
            <g key={full}>
              <text x="138" y={row.y + 19} className="silk name">{full}</text>
              {row.split ? (
                <>
                  <Cell x={186} y={row.y} w={110} label={hi} value={hex(v >> 8, 2)} className={cls(hi, `cell ${role(hi) || on(hi) ? "" : roleClass(full, role, on)}`)} changed={changed.has(hi)} />
                  <Cell x={302} y={row.y} w={110} label={lo} value={hex(v & 0xff, 2)} className={cls(lo, `cell ${role(lo) || on(lo) ? "" : roleClass(full, role, on)}`)} changed={changed.has(lo)} />
                </>
              ) : (
                <Cell x={186} y={row.y} w={226} value={hex(v)} className={cls(full, "cell")} changed={changed.has(full)} />
              )}
            </g>
          );
        })}
      </Chip>

      {/* ALU */}
      <polygon points="520,430 610,430 640,470 670,430 760,430 700,540 580,540" className={cls("ALU", "alu")} />
      <text x="640" y="512" className="silk title" textAnchor="middle">ALU</text>

      <rect x="790" y="476" width="370" height="104" rx="6" className={`lcd ${phase?.alu && on("ALU") ? "on" : ""}`} />
      <text x="808" y="502" className="silk small">ALU OUTPUT</text>
      {phase?.alu && on("ALU") ? (
        <>
          <text x="808" y="532" className="lcd-text big">{phase.alu.op}</text>
          <text x="808" y="562" className="lcd-text">{phase.alu.expr}</text>
        </>
      ) : (
        <text x="808" y="546" className="lcd-text dim">—</text>
      )}

      {/* flags */}
      <rect x="520" y="600" width="240" height="40" rx="5" className={cls("FLAGS", "chipbody")} />
      {FLAG_NAMES.map((n, k) => (
        <g key={n}>
          <circle cx={540 + k * 40} cy={612} r={5.5} className={`led ${flags[n] ? "lit" : ""} ${changed.has(n) ? "changed" : ""}`} />
          <text x={540 + k * 40} y={633} className="silk tiny" textAnchor="middle">{n}</text>
        </g>
      ))}

      {/* control unit */}
      <Chip x={900} y={330} w={260} h={110} pins="tb" className={cls("CU")}>
        <text x="1030" y="356" className="silk title" textAnchor="middle">CONTROL UNIT</text>
        {cu ? (
          <>
            <text x="1030" y="390" className="value" textAnchor="middle">{cu.form}</text>
            <text x="1030" y="418" className="value dim small-value" textAnchor="middle">{cu.source}</text>
          </>
        ) : (
          <text x="1030" y="400" className="silk dim" textAnchor="middle">waiting</text>
        )}
      </Chip>

      <text x="1150" y="666" className="silk tiny" textAnchor="end">8086 · 16-BIT · 5 MHz</text>
    </svg>
  );
}

/** Highlight both halves when the whole 16-bit register is involved. */
function roleClass(full: string, role: (n: string) => Role | undefined, on: (n: string) => boolean) {
  return [on(full) && "on", role(full)].filter(Boolean).join(" ");
}

function Legend({ x, y, text, anchor }: { x: number; y: number; text: string; anchor: "start" | "end" }) {
  const w = text.length * 8.4 + 16;
  const rx = anchor === "end" ? x - w : x;
  return (
    <g>
      <rect x={rx} y={y - 9} width={w} height={18} className="legend-bg" />
      <text x={anchor === "end" ? x - 8 : x + 8} y={y + 4} className="silk small strong" textAnchor={anchor}>
        {text}
      </text>
    </g>
  );
}

function Chip({ x, y, w, h, pins, className, children }: { x: number; y: number; w: number; h: number; pins: "lr" | "tb"; className: string; children: ReactNode }) {
  const pinEls: JSX.Element[] = [];
  if (pins === "lr") {
    for (let py = y + 18; py < y + h - 10; py += 22) {
      pinEls.push(<rect key={`l${py}`} x={x - 7} y={py} width={7} height={8} className="pin" />);
      pinEls.push(<rect key={`r${py}`} x={x + w} y={py} width={7} height={8} className="pin" />);
    }
  } else {
    for (let px = x + 18; px < x + w - 10; px += 24) {
      pinEls.push(<rect key={`t${px}`} x={px} y={y - 7} width={8} height={7} className="pin" />);
      pinEls.push(<rect key={`b${px}`} x={px} y={y + h} width={8} height={7} className="pin" />);
    }
  }
  return (
    <g>
      {pinEls}
      <rect x={x} y={y} width={w} height={h} rx={6} className={`${className} chipbody`} />
      <circle cx={x + 12} cy={y + 12} r={3} className="notch" />
      {children}
    </g>
  );
}

function RegBox({ x, y, w, name, value, className, changed }: { x: number; y: number; w: number; name: string; value: string; className: string; changed: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={30} rx={4} className={`${className} cell`} />
      <text x={x + 12} y={y + 20} className="silk name">{name}</text>
      <text key={changed ? value : "same"} x={x + w - 12} y={y + 21} className={`value ${changed ? "changed" : ""}`} textAnchor="end">
        {value}
      </text>
    </g>
  );
}

function Cell({ x, y, w, label, value, className, changed }: { x: number; y: number; w: number; label?: string; value: string; className: string; changed: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={28} rx={4} className={className} />
      {label && <text x={x + 8} y={y + 18} className="silk tiny">{label}</text>}
      <text key={changed ? value : "same"} x={x + w - 10} y={y + 20} className={`value ${changed ? "changed" : ""}`} textAnchor="end">
        {value}
      </text>
    </g>
  );
}
