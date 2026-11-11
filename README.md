# 8086 Datapath

An 8086 assembler and simulator. It shows the machine code for each line and runs programs phase by phase on a drawing of the CPU die, with memory off the chip.

Live at [8086.tahamukhtar.com](https://8086.tahamukhtar.com).

## What it does

- **Assembler.** Encodes real 8086 machine code: opcode, d/s/w bits, mod/reg/r/m, displacements and immediates, including the short forms (`B8+r`, `40+r`, `A0`–`A3`, `83` sign-extended immediates). Labels, short and near jumps. Encodings are tested against NASM output.
- **Encoding panel.** Splits each instruction into its bit fields and explains every one.
- **Datapath.** Each instruction runs in phases: fetch, decode, address calculation, memory read, execute and write back. The die lights the lines and units each phase uses, with data flowing in the direction it moves. Sources and destinations are colour-coded.
- **Edit and run modes.** The editor gets the space while you write; the first Step or Run morphs the layout so the die takes over and the code becomes a listing that follows the current line. Click it or press E to edit again.
- **Fits one screen.** On desktop everything fits in the viewport; unit descriptions are tooltips and the instruction reference opens in a dialog.
- **Machine state.** Registers, the six status flags, the instruction queue, a data window that follows memory accesses, and the stack. Step back undoes registers and memory exactly.

Supported instructions: `MOV PUSH POP ADD ADC SUB SBB CMP INC DEC NEG AND OR XOR TEST NOT MUL IMUL DIV IDIV CBW CWD JMP LOOP NOP HLT` and all conditional jumps. All 8086 addressing modes work, with `BYTE PTR` / `WORD PTR` where the size is ambiguous.

The model is simplified in one way: on a real 8086 the bus interface unit prefetches ahead while the execution unit works, whereas here each instruction is shown on its own so the phases stay readable.

## Layout

```
src/cpu/assembler.ts   parser and encoder
src/cpu/machine.ts     CPU state, flags, execution and the phase trace for the board
src/cpu/examples.ts    example programs
src/cpu/*.test.ts      encoder and execution tests (node --test)
src/ui/                board, editor and panels
```

## Run locally

```bash
npm install
npm run dev
npm test
```

## Deploy

Static site on Cloudflare Workers:

```bash
npm run build
npx wrangler deploy
```
