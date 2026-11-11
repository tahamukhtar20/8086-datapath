export type Example = { id: string; title: string; code: string };

export const EXAMPLES: Example[] = [
  {
    id: "sum",
    title: "Sum 1 to 10",
    code: `; Add 10 + 9 + ... + 1 into AX, then store it
        MOV CX, 10
        XOR AX, AX
next:   ADD AX, CX
        LOOP next
        MOV [0200h], AX   ; 55 = 0037h
        HLT`,
  },
  {
    id: "addressing",
    title: "Addressing modes",
    code: `; Every way the 8086 can name a memory operand
        MOV BX, 0200h
        MOV SI, 4
        MOV WORD PTR [BX], 1234h     ; register indirect
        MOV AX, [BX]                 ; AX = 1234h
        MOV [BX+SI], AX              ; base + index
        MOV BYTE PTR [BX+SI+2], 7Fh  ; base + index + displacement
        MOV DL, [0206h]              ; direct
        MOV BP, 0010h
        MOV [BP+2], DX               ; BP uses the stack segment
        HLT`,
  },
  {
    id: "flags",
    title: "Flags",
    code: `; Watch OF, SF, ZF, CF and AF change
        MOV AL, 7Fh
        ADD AL, 1      ; 80h: signed overflow, OF and SF set
        ADD AL, 80h    ; 00h: carry out, CF and ZF set
        MOV BL, 0Fh
        INC BL         ; half carry, AF set, CF untouched
        SUB AL, 1      ; borrow, CF set again
        CMP BL, 10h    ; equal, so ZF set
        HLT`,
  },
  {
    id: "muldiv",
    title: "Multiply and divide",
    code: `; MUL and DIV use AX and DX implicitly
        MOV AX, 1234
        MOV BX, 100
        MUL BX         ; DX:AX = 123400
        DIV BX         ; back to AX = 1234, DX = 0
        MOV AL, -7
        CBW            ; AX = FFF9h
        MOV CL, 2
        IDIV CL        ; AL = -3, AH = -1
        HLT`,
  },
  {
    id: "stack",
    title: "Stack",
    code: `; Swap two registers through the stack
        MOV AX, 1111h
        MOV BX, 2222h
        PUSH AX
        PUSH BX
        POP AX
        POP BX
        PUSH DS        ; segment registers can be pushed too
        POP ES
        HLT`,
  },
  {
    id: "max",
    title: "Find the largest",
    code: `; Largest byte in a list at DS:0200h
        MOV BX, 0200h
        MOV BYTE PTR [BX], 12
        MOV BYTE PTR [BX+1], 47
        MOV BYTE PTR [BX+2], 9
        MOV BYTE PTR [BX+3], 30
        MOV CX, 4
        XOR AL, AL
        XOR SI, SI
check:  CMP AL, [BX+SI]
        JAE skip
        MOV AL, [BX+SI]
skip:   INC SI
        LOOP check
        HLT            ; AL = 47 = 2Fh`,
  },
];
