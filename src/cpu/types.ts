export type Size = 8 | 16;

export const REG8 = ["AL", "CL", "DL", "BL", "AH", "CH", "DH", "BH"] as const;
export const REG16 = ["AX", "CX", "DX", "BX", "SP", "BP", "SI", "DI"] as const;
export const SREG = ["ES", "CS", "SS", "DS"] as const;

export type Reg8 = (typeof REG8)[number];
export type Reg16 = (typeof REG16)[number];
export type SReg = (typeof SREG)[number];

export type RegOperand = { kind: "reg"; name: Reg8 | Reg16; size: Size; code: number };
export type SRegOperand = { kind: "sreg"; name: SReg; code: number };
export type ImmOperand = { kind: "imm"; value: number };
export type LabelOperand = { kind: "label"; name: string };
export type MemOperand = {
  kind: "mem";
  base?: "BX" | "BP";
  index?: "SI" | "DI";
  /** 16-bit displacement, already wrapped to 0..FFFF. */
  disp: number;
  size?: Size;
};
export type Operand = RegOperand | SRegOperand | ImmOperand | LabelOperand | MemOperand;

export type FieldKind = "opcode" | "flag" | "mod" | "reg" | "rm" | "disp" | "data";
export type Field = { kind: FieldKind; label: string; bits: string; note: string };

export type Instr = {
  /** 0-based source line. */
  line: number;
  addr: number;
  mnemonic: string;
  ops: Operand[];
  /** Operation size, when the instruction has one. */
  size?: Size;
  bytes: number[];
  fields: Field[];
  /** Encoding form, e.g. "MOV r/m16, r16". */
  form: string;
  /** Jump target offset. */
  target?: number;
  source: string;
};

export type AsmError = { line: number; message: string };

export type Program = {
  instrs: Instr[];
  byAddr: Map<number, Instr>;
  /** Instruction for each source line, if any. */
  byLine: (Instr | undefined)[];
  labels: Map<string, number>;
  errors: AsmError[];
};

export type Flags = { OF: boolean; SF: boolean; ZF: boolean; AF: boolean; PF: boolean; CF: boolean };
export const FLAG_NAMES = ["OF", "SF", "ZF", "AF", "PF", "CF"] as const;

export type Regs = Record<Reg16 | SReg | "IP", number> & { flags: Flags };

export type Wire =
  | "cs_sigma"
  | "ds_sigma"
  | "ss_sigma"
  | "es_sigma"
  | "ip_sigma"
  | "ea_sigma"
  | "sigma_mem"
  | "mem_queue"
  | "queue_cu"
  | "queue_bus"
  | "mem_bus"
  | "regs_bus"
  | "bus_alu_a"
  | "bus_alu_b"
  | "alu_bus"
  | "alu_flags"
  | "cu_alu"
  | "flags_cu"
  | "bus_es"
  | "bus_cs"
  | "bus_ss"
  | "bus_ds";

/** A wire, optionally prefixed with "~" when data flows against its drawn direction. */
export type WireRef = Wire | `~${Wire}`;

export type Role = "dst" | "src";

export type PhaseKind = "fetch" | "decode" | "address" | "read" | "execute" | "write" | "fault";

export type Phase = {
  kind: PhaseKind;
  title: string;
  text: string;
  wires: WireRef[];
  /** Board parts in use: MEM, SIGMA, QUEUE, CU, ALU, FLAGS, segment registers, IP, general registers. */
  nodes: string[];
  roles: Partial<Record<string, Role>>;
  /**
   * How much of the instruction's effect is visible:
   * 0 nothing, 1 IP advanced, 2 flags updated, 3 registers and memory updated.
   */
  stage: 0 | 1 | 2 | 3;
  sigma?: { seg: SReg; segVal: number; off: number; phys: number };
  bus?: { phys: number; bytes: number[]; dir: "read" | "write" };
  alu?: { op: string; expr: string };
};

export type MemWrite = { addr: number; old: number; value: number };

export type StepResult = {
  instr: Instr;
  before: Regs;
  after: Regs;
  writes: MemWrite[];
  reads: number[];
  phases: Phase[];
  halted: boolean;
  error?: string;
};
