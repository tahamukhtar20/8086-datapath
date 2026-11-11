const GROUPS: [string, string][] = [
  ["Move", "MOV, PUSH, POP"],
  ["Arithmetic", "ADD, ADC, SUB, SBB, CMP, INC, DEC, NEG"],
  ["Logic", "AND, OR, XOR, TEST, NOT"],
  ["Multiply and divide", "MUL, IMUL, DIV, IDIV, CBW, CWD"],
  ["Jumps", "JMP, LOOP, JZ/JE, JNZ/JNE, JC, JNC, JS, JNS, JO, JNO, JP, JNP, JA, JAE, JB, JBE, JG, JGE, JL, JLE"],
  ["Other", "NOP, HLT"],
];

const MODES: [string, string][] = [
  ["Register", "MOV AX, BX"],
  ["Immediate", "MOV CL, 0Ah"],
  ["Direct", "MOV AX, [0200h]"],
  ["Register indirect", "MOV AL, [SI]"],
  ["Based / indexed", "MOV AX, [BX+4]"],
  ["Based indexed", "MOV [BP+DI-2], DX"],
];

export function Reference() {
  return (
    <section className="reference">
      <div className="panel">
        <h2>Instructions</h2>
        <dl className="ref-list">
          {GROUPS.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd className="mono">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="muted small">
          Numbers can be decimal (<span className="mono">10</span>), hex (<span className="mono">0Ah</span>,{" "}
          <span className="mono">0x0A</span>), binary (<span className="mono">1010b</span>) or a character (
          <span className="mono">'A'</span>). Use <span className="mono">BYTE PTR</span> or{" "}
          <span className="mono">WORD PTR</span> when the size is not clear from a register.
        </p>
      </div>
      <div className="panel">
        <h2>Addressing modes</h2>
        <dl className="ref-list">
          {MODES.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd className="mono">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="muted small">
          Addresses built on BP use the stack segment SS; the rest use DS. The physical address is segment × 16 + offset.
        </p>
      </div>
      <div className="panel">
        <h2>Reading the board</h2>
        <ul className="key">
          <li><span className="key-trace" /> Copper traces light up and pulse in the direction data moves.</li>
          <li><span className="key-box dst" /> Destination: the register or memory being written.</li>
          <li><span className="key-box src" /> Source: where the value comes from.</li>
          <li><span className="key-box on" /> A unit taking part in this phase.</li>
        </ul>
        <p className="muted small">
          The bus interface unit fetches bytes and forms addresses; the execution unit decodes and computes. Fetching runs
          ahead of execution on a real 8086; here each instruction is shown on its own so the phases stay readable.
        </p>
      </div>
    </section>
  );
}
