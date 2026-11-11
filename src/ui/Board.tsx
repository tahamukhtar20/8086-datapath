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

// Die geometry. Everything inside DIE is on the silicon; memory sits off-chip on the board.
const DIE = { x: 80, y: -20, w: 1104, h: 694 };
const PKG = { x: 50, y: -46, w: 1162, h: 746 };
const CTL = { x: 110, y: 30, w: 80, h: 200 };
const MEMC = { x: -190, y: 30, w: 140, h: 210 };
const PIN_YS = Array.from({ length: 24 }, (_, k) => -24 + k * 30);
const BUS_LINES = [66, 96, 126, 156, 186, 216];

const WIRES: Record<Wire, Pt[]> = {
  es_sigma: [[460, segY("ES")], [430, segY("ES")], [430, 70], [410, 70]],
  cs_sigma: [[460, segY("CS")], [430, segY("CS")], [430, 70], [410, 70]],
  ss_sigma: [[460, segY("SS")], [430, segY("SS")], [430, 70], [410, 70]],
  ds_sigma: [[460, segY("DS")], [430, segY("DS")], [430, 70], [410, 70]],
  ip_sigma: [[460, 211], [418, 211], [418, 100], [410, 100]],
  ea_sigma: [[418, BUS_Y], [418, 100], [410, 100]],
  sigma_mem: [[250, 85], [CTL.x + CTL.w, 85]],
  mem_queue: [[150, CTL.y], [150, 12], [940, 12], [940, 90]],
  queue_cu: [[1080, 140], [1080, 330]],
  queue_bus: [[820, 140], [820, BUS_Y]],
  mem_bus: [[150, CTL.y + CTL.h], [150, BUS_Y]],
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
const MEM_WIRES: Wire[] = ["sigma_mem", "mem_queue", "mem_bus"];

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

const TIPS = {
  mem: "Memory, off the chip. 1 MB addressed by 20 bits. The CPU reaches it only through its address/data pins.",
  pins: "External bus. The 8086 shares 16 pins between address and data (AD0–AD15), plus A16–A19 for the top address bits.",
  ctl: "Bus control. Drives the pins: puts the 20-bit address out, then moves data in or out.",
  sigma: "Address adder. Physical address = segment × 16 + offset.",
  seg: "Segment register. Its value × 16 is the base of a 64 KB segment.",
  ip: "Instruction pointer. Offset of the next instruction inside the code segment (CS).",
  queue: "Instruction queue. Holds up to 6 code bytes fetched ahead of execution.",
  bus: "Internal data bus. Carries 16-bit values between the units.",
  regs: "General registers. AX–DX split into high and low bytes; SP, BP, SI and DI are 16-bit only.",
  alu: "Arithmetic logic unit. Adds, subtracts, compares, and does logic, multiply and divide.",
  out: "The operation the ALU is doing in this phase.",
  flags: "Status flags: overflow, sign, zero, auxiliary carry, parity, carry. Lit means set.",
  cu: "Control unit. Decodes the opcode and drives every other unit.",
};

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
  // The pins and external bus only carry traffic in phases that actually use memory.
  const extActive = !!phase?.bus && MEM_WIRES.some((w) => active.has(w));
  const extOut = reversed.has("mem_bus") || (active.has("sigma_mem") && !active.has("mem_bus") && !active.has("mem_queue"));
  const nodes = new Set(phase?.nodes ?? []);
  const role = (n: string): Role | undefined => phase?.roles[n];
  const on = (n: string) => nodes.has(n);
  const cls = (n: string, extra = "") => ["part", on(n) && "on", role(n), extra].filter(Boolean).join(" ");

  const sigma = phase?.sigma;
  const bus = phase?.bus;
  const memX = MEMC.x + MEMC.w / 2;

  return (
    <svg className="board" viewBox="-212 -60 1450 772" role="img" aria-label="8086 die with memory off the chip">
      <defs>
        <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.9" className="dot" />
        </pattern>
        <pattern id="die-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" className="die-grid" />
        </pattern>
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.03" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* board, package, die */}
      <rect x="-212" y="-60" width="1450" height="772" rx="16" className="pcb" />
      <rect x="-212" y="-60" width="1450" height="772" rx="16" fill="url(#dots)" />

      {PIN_YS.map((y) => (
        <g key={`pin${y}`}>
          <rect x={PKG.x - 12} y={y - 5} width={12} height={10} className="pkg-pin" />
          <rect x={PKG.x + PKG.w} y={y - 5} width={12} height={10} className="pkg-pin" />
        </g>
      ))}
      <rect x={PKG.x} y={PKG.y} width={PKG.w} height={PKG.h} rx="12" className="package" />
      <rect x={DIE.x - 6} y={DIE.y - 6} width={DIE.w + 12} height={DIE.h + 12} rx="4" className="cavity" />
      <rect x={DIE.x} y={DIE.y} width={DIE.w} height={DIE.h} rx="3" className="die" />
      <rect x={DIE.x} y={DIE.y} width={DIE.w} height={DIE.h} rx="3" fill="url(#die-grid)" />
      <rect x={DIE.x} y={DIE.y} width={DIE.w} height={DIE.h} rx="3" fill="url(#sheen)" />
      {PIN_YS.map((y) => {
        const l = DIE.x + 4;
        const r = DIE.x + DIE.w - 12;
        return (
          <g key={`bond${y}`}>
            <rect x={l} y={y - 4} width={8} height={8} className="bond-pad" />
            <rect x={r} y={y - 4} width={8} height={8} className="bond-pad" />
            <path d={`M${PKG.x + 4} ${y} Q${(PKG.x + l) / 2 + 2} ${y - 7} ${l + 4} ${y}`} className="bond-wire" />
            <path d={`M${PKG.x + PKG.w - 4} ${y} Q${(PKG.x + PKG.w + r) / 2 + 2} ${y - 7} ${r + 4} ${y}`} className="bond-wire" />
          </g>
        );
      })}
      <text x={PKG.x + PKG.w - 16} y={PKG.y + PKG.h - 9} className="stamp" textAnchor="end">8086 · 16-BIT · 5 MHz</text>

      {/* external bus between memory and the pins, then on-die to bus control */}
      <g>
        <title>{TIPS.pins}</title>
        {BUS_LINES.map((y) => {
          const outside: Pt[] = [[MEMC.x + MEMC.w + 7, y], [PKG.x - 12, y]];
          const inside: Pt[] = [[DIE.x + 12, y], [CTL.x, y]];
          return (
            <g key={`ext${y}`}>
              <polyline points={pts(outside)} className="ext" />
              <polyline points={pts(inside)} className="trace" />
              {extActive && (
                <>
                  <polyline points={pts(extOut ? [...outside].reverse() : outside)} className="ext live" filter="url(#glow)" />
                  <polyline points={pts(extOut ? [...outside].reverse() : outside)} className="trace flow" />
                  <polyline points={pts(extOut ? [...inside].reverse() : inside)} className="trace live" />
                  <polyline points={pts(extOut ? [...inside].reverse() : inside)} className="trace flow" />
                </>
              )}
            </g>
          );
        })}
        <text x={(MEMC.x + MEMC.w + PKG.x) / 2 - 4} y={BUS_LINES[0] - 12} className="silk tiny" textAnchor="middle">AD0–AD15</text>
        <text x={(MEMC.x + MEMC.w + PKG.x) / 2 - 4} y={BUS_LINES.at(-1)! + 22} className="silk tiny" textAnchor="middle">A16–A19</text>
      </g>

      {/* memory */}
      <g>
        <title>{TIPS.mem}</title>
        <Chip x={MEMC.x} y={MEMC.y} w={MEMC.w} h={MEMC.h} pins className={cls("MEM", "ic")}>
          <text x={memX} y={MEMC.y + 32} className="silk title" textAnchor="middle">MEMORY</text>
          <text x={memX} y={MEMC.y + 52} className="silk tiny" textAnchor="middle">1 MB · 20-BIT</text>
          {bus && on("MEM") ? (
            <>
              <text x={memX} y={MEMC.y + 104} className="value" textAnchor="middle">{hex(bus.phys, 5)}h</text>
              <text x={memX} y={MEMC.y + 134} className="value dim small-value" textAnchor="middle">
                {bus.bytes.slice(0, 4).map((b) => hex(b, 2)).join(" ")}
                {bus.bytes.length > 4 ? " …" : ""}
              </text>
              <text x={memX} y={MEMC.y + 172} className={`silk small ${bus.dir}`} textAnchor="middle">
                {bus.dir === "read" ? "READ" : "WRITE"}
              </text>
            </>
          ) : (
            <text x={memX} y={MEMC.y + 120} className="silk dim" textAnchor="middle">idle</text>
          )}
        </Chip>
        <text x={memX} y={MEMC.y + MEMC.h + 30} className="silk tiny" textAnchor="middle">OFF-CHIP</text>
      </g>

      {/* functional areas */}
      <rect x="100" y="0" width="1064" height="262" rx="6" className="frame" />
      <Legend x={1150} y={0} text="BUS INTERFACE UNIT" anchor="end" />
      <rect x="100" y="306" width="1064" height="346" rx="6" className="frame" />
      <Legend x={112} y={306} text="EXECUTION UNIT" anchor="start" />

      {/* on-die interconnect */}
      <g>
        <title>{TIPS.bus}</title>
        <polyline points={pts([[150, BUS_Y], [880, BUS_Y]])} className={`bus ${busActive ? "on" : ""}`} />
        <text x="166" y={BUS_Y - 9} className="silk small">INTERNAL BUS · 16 BIT</text>
      </g>
      {(Object.keys(WIRES) as Wire[]).map((id) => (
        <polyline key={id} points={pts(WIRES[id])} className="trace" />
      ))}
      {(Object.keys(WIRES) as Wire[]).flatMap((id) => [WIRES[id][0], WIRES[id].at(-1)!]).map(([x, y], i) => (
        <rect key={i} x={x - 3} y={y - 3} width="6" height="6" className="via" />
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

      {/* bus control */}
      <g>
        <title>{TIPS.ctl}</title>
        <rect x={CTL.x} y={CTL.y} width={CTL.w} height={CTL.h} rx="4" className={`part block ${extActive ? "on" : ""}`} />
        <text x={CTL.x + CTL.w / 2} y={CTL.y + 92} className="silk small strong" textAnchor="middle">BUS</text>
        <text x={CTL.x + CTL.w / 2} y={CTL.y + 110} className="silk small strong" textAnchor="middle">CTRL</text>
      </g>

      {/* Σ adder */}
      <g>
        <title>{TIPS.sigma}</title>
        <polygon points="410,34 410,136 250,114 250,56" className={cls("SIGMA", "adder")} />
        <text x="334" y="86" className="sigma" textAnchor="middle">Σ</text>
        {sigma && on("SIGMA") && (
          <text x="334" y="110" className="value tiny" textAnchor="middle">
            {hex(sigma.segVal)}:{hex(sigma.off)}
          </text>
        )}
      </g>
      {sigma && on("SIGMA") && (
        <text x={(CTL.x + CTL.w + 250) / 2} y="76" className="value tiny gold" textAnchor="middle">{hex(sigma.phys, 5)}h</text>
      )}

      {/* segment registers and IP */}
      {SEGS.map(({ name, y }) => (
        <g key={name}>
          <title>{TIPS.seg}</title>
          <RegBox x={460} y={y} w={220} name={name} value={hex(regs[name])} className={cls(name)} changed={changed.has(name)} />
        </g>
      ))}
      <g>
        <title>{TIPS.ip}</title>
        <RegBox x={460} y={196} w={220} name="IP" value={hex(regs.IP)} className={cls("IP")} changed={changed.has("IP")} />
      </g>

      {/* queue */}
      <g>
        <title>{TIPS.queue}</title>
        <text x="760" y="80" className="silk small">INSTRUCTION QUEUE · 6 BYTES</text>
        {Array.from({ length: 6 }, (_, k) => (
          <g key={k}>
            <rect x={760 + k * 60} y={90} width={56} height={50} rx={4} className={cls("QUEUE", "cell")} />
            <text x={788 + k * 60} y={122} className={`value ${queue[k] === undefined ? "dim" : ""}`} textAnchor="middle">
              {queue[k] === undefined ? "··" : hex(queue[k], 2)}
            </text>
          </g>
        ))}
      </g>

      {/* registers */}
      <g>
        <title>{TIPS.regs}</title>
        <Chip x={120} y={322} w={300} h={318} className={cls("REGS", "regs block")}>
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
      </g>

      {/* ALU */}
      <g>
        <title>{TIPS.alu}</title>
        <polygon points="520,430 610,430 640,470 670,430 760,430 700,540 580,540" className={cls("ALU", "alu")} />
        <text x="640" y="512" className="silk title" textAnchor="middle">ALU</text>
      </g>

      <g>
        <title>{TIPS.out}</title>
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
      </g>

      {/* flags */}
      <g>
        <title>{TIPS.flags}</title>
        <rect x="520" y="600" width="240" height="40" rx="5" className={cls("FLAGS", "chipbody")} />
        {FLAG_NAMES.map((n, k) => (
          <g key={n}>
            <circle cx={540 + k * 40} cy={612} r={5.5} className={`led ${flags[n] ? "lit" : ""} ${changed.has(n) ? "changed" : ""}`} />
            <text x={540 + k * 40} y={633} className="silk tiny" textAnchor="middle">{n}</text>
          </g>
        ))}
      </g>

      {/* control unit */}
      <g>
        <title>{TIPS.cu}</title>
        <Chip x={900} y={330} w={260} h={110} className={cls("CU", "block")}>
          <text x="1030" y="356" className="silk title" textAnchor="middle">CONTROL UNIT</text>
          {cu ? (
            <>
              <text x="1030" y="390" className="value" textAnchor="middle">{cu.form}</text>
              <text x="1030" y="418" className="value dim small-value" textAnchor="middle">
                {cu.source.length > 28 ? `${cu.source.slice(0, 27)}…` : cu.source}
              </text>
            </>
          ) : (
            <text x="1030" y="400" className="silk dim" textAnchor="middle">waiting</text>
          )}
        </Chip>
      </g>
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

function Chip({ x, y, w, h, pins, className, children }: { x: number; y: number; w: number; h: number; pins?: boolean; className: string; children: ReactNode }) {
  const pinEls: JSX.Element[] = [];
  if (pins) {
    for (let py = y + 18; py < y + h - 10; py += 22) {
      pinEls.push(<rect key={`l${py}`} x={x - 7} y={py} width={7} height={8} className="pin" />);
      pinEls.push(<rect key={`r${py}`} x={x + w} y={py} width={7} height={8} className="pin" />);
    }
  }
  return (
    <g>
      {pinEls}
      <rect x={x} y={y} width={w} height={h} rx={pins ? 6 : 4} className={`${className} chipbody`} />
      {pins && <circle cx={x + 12} cy={y + 12} r={3} className="notch" />}
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
