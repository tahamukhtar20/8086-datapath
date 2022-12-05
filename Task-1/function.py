import app

opcode_dict = {"MOV": "100010", "MOV1": "101", "ADD": "000000", "AND": "001000", "CBW": "10011000", "CWD": "10011000",
               "DEC": "1111111", "DIV": "1111011", "IDIV": "1111011", "IMUL": "1111011", "MUL": "1111011",
               "INC": "1111111", "NEG": "1111011", "NOT": "1111011", "OR": "000010", "SUB": "000101", "XOR": "000110"}

opcode_ex = {"DEC": "001", "INC": "000", "DIV": "110", "IDIV": "111", "IMUL": "101", "MUL": "100", "NEG": "011",
             "NOT": "010"}

reg1 = {"AL": "000", "CL": "001", "DL": "010", "BL": "011", "AH": "100", "CH": "101", "DH": "110", "BH": "111"}

reg2 = {"AX": "000", "CX": "001", "DX": "010", "BX": "011", "SP": "100", "BP": "101", "SI": "110", "DI": "111"}


def mov(op1, op2):
    Wbit = '1'
    Dbit = '1'
    mode = '11'
    reg = '000'
    rm = '000'
    data = ''
    disp = ''

    opcode = opcode_dict["MOV"]
    if (op1 in reg1):
        typeop1 = 'R1'
        reg = reg1[op1]
    elif (op1 in reg2):
        typeop1 = 'R2'
        reg = reg2[op1]
    elif (op1[0] == '['):
        typeop1 = 'M'
        mode = '00'
        Dbit = '0'
        op1 = op1[1:3]
        if (op1 in reg1):
            rm = reg1[op1]
        elif (op1 in reg2):
            rm = reg2[op1]
    else:
        typeop1 = 'D'

    if (op2 in reg1):
        typeop2 = 'R1'
        rm = reg1[op2]
    elif (op2 in reg2):
        typeop2 = 'R2'
        rm = reg2[op2]
    elif (op2[0] == '['):
        mode = '00'
        typeop2 = 'M'
        op2 = op2[1:3]
        if (op2 in reg1):
            rm = reg1[op2]
        elif (op2 in reg2):
            rm = reg2[op2]
    else:
        typeop2 = 'D'

    if (typeop1[0] == 'R') and (typeop2[0] == 'R'):
        if (op1[1] == 'X'):
            a = app.Table(app.gpr_frame, op1[0], app.general_purpose_registers[ord(op2[0]) - 64][1],
                          app.general_purpose_registers[ord(op2[0]) - 64][2], app.general_purpose_registers)
        elif (op1[1] == 'L') and (op2[1] == 'H'):
            a = app.Table(app.gpr_frame, op1[0], app.general_purpose_registers[ord(op1[0]) - 64][1],
                          app.general_purpose_registers[ord(op2[0]) - 64][1], app.general_purpose_registers)
        elif (op1[1] == 'L') and (op2[1] == 'L'):
            a = app.Table(app.gpr_frame, op1[0], app.general_purpose_registers[ord(op1[0]) - 64][1],
                          app.general_purpose_registers[ord(op2[0]) - 64][2], app.general_purpose_registers)
        elif (op1[1] == 'H') and (op2[1] == 'H'):
            a = app.Table(app.gpr_frame, op1[0], app.general_purpose_registers[ord(op2[0]) - 64][1],
                          app.general_purpose_registers[ord(op1[0]) - 64][2], app.general_purpose_registers)
        elif (op1[1] == 'H') and (op2[1] == 'L'):
            a = app.Table(app.gpr_frame, op1[0], app.general_purpose_registers[ord(op2[0]) - 64][2],
                          app.general_purpose_registers[ord(op1[0]) - 64][2], app.general_purpose_registers)

    if (typeop1[0] == 'R') and (typeop2[0] == 'M'):
        if op2[1] == 'H':
            address = app.general_purpose_registers[ord(op2[0]) - 64][1][1]
        elif (op2[1] == 'L') or (op2[1] == 'X'):
            address = app.general_purpose_registers[ord(op2[0]) - 64][2][1]

        if address.isdigit():
            if int(address) < 8:
                a = app.Table(app.gpr_frame, op1[0], app.memory1[int(address)][1][0:2],
                              app.memory1[int(address)][1][2:4], app.general_purpose_registers)
            elif (int(address) == 8) or (int(address) == 9):
                a = app.Table(app.gpr_frame, op1[0], app.memory2[int(address)][1][0:2],
                              app.memory2[int(address)][1][2:4], app.general_purpose_registers)
        else:
            a = app.Table(app.gpr_frame, op1[0], app.memory2[ord(op1[0]) - 55][1][0:2],
                          app.memory2[ord(op1[0]) - 55][1][2:4], app.general_purpose_registers)

    if (typeop1[0] == 'M') and (typeop2[0] == 'R'):
        if op1[1] == 'H':
            address = app.general_purpose_registers[ord(op1[0]) - 64][1][1]
        elif (op1[1] == 'L') or (op1[1] == 'X'):
            address = app.general_purpose_registers[ord(op1[0]) - 64][2][1]

        if address.isdigit():
            if int(address) < 8:
                a = app.Table(app.mem_frame1, address, app.general_purpose_registers[ord(op2[0]) - 64][1] +
                              app.general_purpose_registers[ord(op2[0]) - 64][2], -1, app.memory1)
            elif (int(address) == 8) or (int(address) == 9):
                a = app.Table(app.mem_frame2, address, app.general_purpose_registers[ord(op2[0]) - 64][1] +
                              app.general_purpose_registers[ord(op2[0]) - 64][2], -1, app.memory2)
        else:
            a = app.Table(app.mem_frame2, address, app.general_purpose_registers[ord(op2[0]) - 64][1] +
                          app.general_purpose_registers[ord(op2[0]) - 64][2], -1, app.memory2)

    if (typeop1[0] == 'R') and (typeop2 == 'D'):
        opcode = opcode_dict["MOV1"]

        if op1[1] == 'L':
            a = app.Table(app.gpr_frame, op1[0], app.general_purpose_registers[ord(op1[0]) - 64][1], op2,
                          app.general_purpose_registers)
        if op1[1] == 'H':
            a = app.Table(app.gpr_frame, op1[0], op2, app.general_purpose_registers[ord(op1[0]) - 64][2],
                          app.general_purpose_registers)
        if op1[1] == 'X':
            a = app.Table(app.gpr_frame, op1[0], op2[0:2], op2[2:4], app.general_purpose_registers)

    mcode.insert(0,opcode+Dbit+Wbit+mode+reg+rm+disp+data)
