from tkinter import *
from tkinter import ttk
from PIL import ImageTk, Image

input_string = ""
flag = True
state = ""


def run():
    def Task_2(temp):
        window.destroy()
        temp = True

    global flag
    def inputt(inp):
        functionns = ["IDIV", "DIV", "MUL", "IMUL", "ADD", "SUB", "INC", "DEC", "AND", "XOR", "NEG", "NOT", "MOV", "OR"]
        inp = inp.upper()
        l1 = inp.split(" ", 1)
        if len(l1) > 1 and l1[0] in functionns:
            ltemp = l1[1]
            ltemp = ltemp.replace(" ", "")
            ltemp = ltemp.split(",", 1)
            ltemp.append(" ")
            l1[1] = ltemp[0]
            l1.append(ltemp[1])
            global state
            instructionn = l1[0]
            if instructionn in functionns and len(l1) > 1 and len(l1) < 5:
                a1 = l1[1]
                a2 = "0"
                value2 = -1
                if ("INC" not in l1[0] and "DEC" not in l1[0] and "NOT" not in l1[0] and "NEG" not in l1[
                    0] and "IMUL" not in l1[0] and "IDIV" not in l1[0] and "MUL" not in l1[0] and "DIV" not in l1[0]):
                    a2 = l1[2]
                if "#" in a2:
                    temp2 = a2[1:5]
                    value2 = int(temp2, 16)
                if "#" in a1:
                    temp1 = a1[1:5]
                    value1 = int(temp1, 16)
                if instructionn == "MOV":
                    if (a1 in reg1 and a2 in reg1):
                        mov(a1, a2)
                    elif (a1 in reg2 and a2 in reg2):
                        mov(a1, a2)
                    elif (a1 in reg1 and value2 > 1 and value2 < 256):
                        mov(a1, temp2)
                    elif (a1 in reg2 and value2 > 1 and value2 < 65536):
                        mov(a1, temp2)

                    elif ("[" in a1 and a2 in reg1):
                        mov(a1, a2)

                    elif (a1 in reg1 and "[" in a2):
                        mov(a1, a2)
                    else:
                        print("Invalid")
                elif instructionn == "IDIV" and a1 != "AX":
                    print("Implemented in task 2")
                elif instructionn == "IMUL" and a1 != "AX":
                    print("Implemented in task 2")
                elif instructionn == "DIV" and a1 != "AX":
                    print("Implemented in task 2")
                elif instructionn == "MUL" and a1 != "AX":
                    print("Implemented in task 2")

                elif instructionn == "ADD":
                    if (a1 in reg1 and a2 in reg1):
                        add(a1, a2)
                    elif (a1 in reg2 and a2 in reg2):
                        add(a1, a2)
                    elif (a1 in reg1 and value2 > 1 and value2 < 256):
                        add(a1, temp2)
                    elif (a1 in reg2 and value2 > 1 and value2 < 65536):
                        add(a1, temp2)
                    elif ("[" in a1 and a2 in reg1):
                        add(a1, a2)
                    elif (a1 in reg1 and "[" in a2):
                        add(a1, a2)
                    else:
                        state = "Incorrect ADD syntax"
                elif instructionn == "AND":
                    if (a1 in reg1 and a2 in reg1):
                        andd(a1, a2)
                    elif (a1 in reg2 and a2 in reg2):
                        andd(a1, a2)
                    elif (a1 in reg1 and value2 > 1 and value2 < 256):
                        andd(a1, temp2)
                    elif ("[" in a1 and a2 in reg1):
                        andd(a1, a2)
                    elif (a1 in reg1 and "[" in a2):
                        andd(a1, a2)
                    elif (a1 in reg2 and value2 > 1 and value2 < 65536):
                        andd(a1, temp2)
                    else:
                        state = "Incorrect AND syntax"
                elif instructionn == "OR":
                    if (a1 in reg1 and a2 in reg1):
                        orr(a1, a2)
                    elif (a1 in reg2 and a2 in reg2):
                        orr(a1, a2)
                    elif (a1 in reg1 and value2 > 1 and value2 < 256):
                        orr(a1, temp2)
                    elif ("[" in a1 and a2 in reg1):
                        orr(a1, a2)
                    elif (a1 in reg1 and "[" in a2):
                        orr(a1, a2)
                    elif (a1 in reg2 and value2 > 1 and value2 < 65536):
                        orr(a1, temp2)
                    else:
                        state = "Incorrect OR syntax"
                elif instructionn == "XOR":
                    if (a1 in reg1 and a2 in reg1):
                        xor(a1, a2)
                    elif (a1 in reg2 and a2 in reg2):
                        xor(a1, a2)
                    elif (a1 in reg1 and value2 > 1 and value2 < 256):
                        xor(a1, temp2)
                    elif ("[" in a1 and a2 in reg1):
                        xor(a1, a2)
                    elif (a1 in reg1 and "[" in a2):
                        xor(a1, a2)
                    elif (a1 in reg2 and value2 > 1 and value2 < 65536):
                        xor(a1, temp2)
                    else:
                        state = "Incorrect XOR syntax"
                elif instructionn == "SUB":
                    if (a1 in reg1 and a2 in reg1):
                        sub(a1, a2)
                    elif (a1 in reg2 and a2 in reg2):
                        sub(a1, a2)
                    elif (a1 in reg1 and value2 > 1 and value2 < 256):
                        sub(a1, temp2)
                    elif ("[" in a1 and a2 in reg1):
                        sub(a1, a2)
                    elif (a1 in reg1 and "[" in a2):
                        sub(a1, a2)
                    elif (a1 in reg2 and value2 > 1 and value2 < 65536):
                        sub(a1, temp2)
                    else:
                        state = "Incorrect SUB syntax"
                        print(state)
                elif instructionn == "INC":
                    if (a1 in reg1 or a1 in reg2 or "[" in a1):
                        inc(a1)
                    else:
                        state = "Incorrect INC syntax"
                elif instructionn == "DEC":
                    if (a1 in reg1 or a1 in reg2 or "[" in a1):
                        dec(a1)
                    else:
                        state = "Incorrect DEC SYNTAX"
                elif instructionn == "NOT":
                    if (a1 in reg1 or a1 in reg2 or "[" in a1):
                        nott(a1)
                    else:
                        state = "Incorrect NOT syntax"
                elif instructionn == "NEG":
                    if (a1 in reg1 or a1 in reg2 or "[" in a1):
                        neg(a1)
                    else:
                        state = "Incorrect NEG syntax"
            else:
                state = "INCORRECT INSTRUCTION"
        else:
            print("Incorrect instruction")

    def complement(a):
        a = "0x" + a
        inta = int(a, 16)
        bina = str(bin(inta))[2:]

        if inta < 256 and len(bina) < 8:
            bina = bina.rjust(8, "0")
        elif inta > 255 and len(bina) < 16:
            bina = bina.rjust(16, "0")

        answer = ""
        for i in range(len(bina)):
            if (bina[i] == '0'):
                answer = answer + '1'
            else:
                answer = answer + '0'
        answer = hex(int(answer, 2))[2:]
        if (len(answer) < 4):
            answer = answer.rjust(4, "0")
        answer = answer.upper()
        return answer

    def dechex(a):
        a = "0x" + a
        inta = int(a, 16) - 1
        if inta == -1:
            inta = 65534
        sum = str(hex(inta))[2:]
        if (len(sum) < 4):
            sum = sum.rjust(4, "0")
        sum = sum.upper()
        return sum

    def addhex(a, b):
        a = "0x" + a
        b = "0x" + b
        intsum = int(a, 16) + int(b, 16)
        sum = str(hex(intsum))[2:]
        if (len(sum) < 4):
            sum = sum.rjust(4, "0")
        sum = sum.upper()
        return sum

    def subhex(a, b):
        b = "0x" + b
        intb = int(b, 16)

        for i in range(intb):
            a = dechex(a)

        if (len(a) < 4):
            a = a.rjust(4, "0")
        a = a.upper()
        return a

    def andbin(a, b):
        a = "0x" + a
        b = "0x" + b
        inta = int(a, 16)
        intb = int(b, 16)
        bina = str(bin(inta))[2:]
        binb = str(bin(intb))[2:]

        if inta < 256 and len(bina) < 8:
            bina = bina.rjust(8, "0")
        if intb < 256 and len(binb) < 8:
            binb = binb.rjust(8, "0")
        if inta > 255 and len(bina) < 16:
            bina = bina.rjust(16, "0")
        if intb > 255 and len(binb) < 16:
            binb = binb.rjust(16, "0")

        if len(bina) < len(binb):
            bina = bina.rjust(16, "0")
        elif len(bina) > len(binb):
            binb = binb.rjust(16, "0")

        answer = ""
        for i in range(len(bina)):
            if (bina[i] == binb[i]) and (bina[i] == '1'):
                answer = answer + '1'
            else:
                answer = answer + '0'
        answer = hex(int(answer, 2))[2:]
        if (len(answer) < 4):
            answer = answer.rjust(4, "0")
        answer = answer.upper()
        return answer

    def orbin(a, b):
        a = "0x" + a
        b = "0x" + b
        inta = int(a, 16)
        intb = int(b, 16)
        bina = str(bin(inta))[2:]
        binb = str(bin(intb))[2:]

        if inta < 256 and len(bina) < 8:
            bina = bina.rjust(8, "0")
        if intb < 256 and len(binb) < 8:
            binb = binb.rjust(8, "0")
        if inta > 255 and len(bina) < 16:
            bina = bina.rjust(16, "0")
        if intb > 255 and len(binb) < 16:
            binb = binb.rjust(16, "0")

        if len(bina) < len(binb):
            bina = bina.rjust(16, "0")
        elif len(bina) > len(binb):
            binb = binb.rjust(16, "0")

        answer = ""
        for i in range(len(bina)):
            if (bina[i] == binb[i]) and (bina[i] == '0'):
                answer = answer + '0'
            else:
                answer = answer + '1'
        answer = hex(int(answer, 2))[2:]
        if (len(answer) < 4):
            answer = answer.rjust(4, "0")
        answer = answer.upper()
        return answer

    def xorbin(a, b):
        a = "0x" + a
        b = "0x" + b
        inta = int(a, 16)
        intb = int(b, 16)
        bina = str(bin(inta))[2:]
        binb = str(bin(intb))[2:]

        if inta < 256 and len(bina) < 8:
            bina = bina.rjust(8, "0")
        if intb < 256 and len(binb) < 8:
            binb = binb.rjust(8, "0")
        if inta > 255 and len(bina) < 16:
            bina = bina.rjust(16, "0")
        if intb > 255 and len(binb) < 16:
            binb = binb.rjust(16, "0")

        if len(bina) < len(binb):
            bina = bina.rjust(16, "0")
        elif len(bina) > len(binb):
            binb = binb.rjust(16, "0")

        answer = ""
        for i in range(len(bina)):
            if (bina[i] == binb[i]):
                answer = answer + '0'
            else:
                answer = answer + '1'
        answer = hex(int(answer, 2))[2:]
        if (len(answer) < 4):
            answer = answer.rjust(4, "0")
        answer = answer.upper()
        return answer

    def databin(a):
        a = "0x" + a
        inta = int(a, 16)
        bina = str(bin(inta))[2:]

        if inta < 256 and len(bina) < 8:
            bina = bina.rjust(8, "0")
        elif inta > 255 and len(bina) < 16:
            bina = bina.rjust(16, "0")
        return bina

    # ------------------------------------------------------------------------------------------------------------------------------------------

    # Instructions of 8086:

    def mov(op1, op2):
        Wbit = '1'
        Dbit = '1'
        mode = '11'
        reg = '000'
        rm = '000'
        data = ''

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
        a = None
        if (typeop1[0] == 'R') and (typeop2[0] == 'R'):
            if (op1[1] == 'X'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op2[0]) - 64][1],
                          general_purpose_registers[ord(op2[0]) - 64][2], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'H'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          general_purpose_registers[ord(op2[0]) - 64][1], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'L'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          general_purpose_registers[ord(op2[0]) - 64][2], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'H'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op2[0]) - 64][1],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'L'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op2[0]) - 64][2],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)
        if (typeop1[0] == 'R') and (typeop2[0] == 'M'):
            if op2[1] == 'H':
                address = general_purpose_registers[ord(op2[0]) - 64][1][1]
            elif (op2[1] == 'L') or (op2[1] == 'X'):
                address = general_purpose_registers[ord(op2[0]) - 64][2][1]

            if address.isdigit():
                if int(address) < 8:
                    a = Table(gpr_frame, op1[0], memory1[int(address)][1][0:2], memory1[int(address)][1][2:4],
                              general_purpose_registers)
                elif (int(address) == 8) or (int(address) == 9):
                    a = Table(gpr_frame, op1[0], memory2[int(address) - 8][1][0:2], memory2[int(address)][1][2:4],
                              general_purpose_registers)
            else:
                a = Table(gpr_frame, op1[0], memory2[ord(op1[0]) - 63][1][0:2], memory2[ord(op1[0]) - 63][1][2:4],
                          general_purpose_registers)

        if (typeop1[0] == 'M') and (typeop2[0] == 'R'):
            if op1[1] == 'H':
                address = general_purpose_registers[ord(op1[0]) - 64][1][1]
            elif (op1[1] == 'L') or (op1[1] == 'X'):
                address = general_purpose_registers[ord(op1[0]) - 64][2][1]

            if address.isdigit():
                if int(address) < 8:
                    a = Table(mem_frame1, address,
                              general_purpose_registers[ord(op2[0]) - 64][1] +
                              general_purpose_registers[ord(op2[0]) - 64][
                                  2], -1, memory1)
                elif (int(address) == 8) or (int(address) == 9):
                    a = Table(mem_frame2, address,
                              general_purpose_registers[ord(op2[0]) - 64][1] +
                              general_purpose_registers[ord(op2[0]) - 64][
                                  2], -1, memory2)
            else:
                a = Table(mem_frame2, address,
                          general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                              2],
                          -1, memory2)

        if (typeop1[0] == 'R') and (typeop2 == 'D'):
            opcode = opcode_dict["MOV1"]
            data = databin(op2)

            if op1[1] == 'L':
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1], op2,
                          general_purpose_registers)
            if op1[1] == 'H':
                a = Table(gpr_frame, op1[0], op2, general_purpose_registers[ord(op1[0]) - 64][2],
                          general_purpose_registers)
            if op1[1] == 'X':
                a = Table(gpr_frame, op1[0], op2[0:2], op2[2:4], general_purpose_registers)

        mcode.delete(0, END)
        mcode.insert(0, opcode + Dbit + Wbit + mode + reg + rm + data)

    def add(op1, op2):
        Wbit = '1'
        Dbit = '1'
        mode = '11'
        reg = '000'
        rm = '000'
        data = ''

        opcode = opcode_dict["ADD"]
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
                firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                secondop = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]
                total = addhex(firstop, secondop)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'H'):
                firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                total = addhex(firstop, general_purpose_registers[ord(op2[0]) - 64][1])
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'L'):
                firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                total = addhex(firstop, general_purpose_registers[ord(op2[0]) - 64][2])
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'H'):
                a = Table(gpr_frame, op1[0], addhex(general_purpose_registers[ord(op1[0]) - 64][1],
                                                    general_purpose_registers[ord(op2[0]) - 64][1])[-2:],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'L'):
                a = Table(gpr_frame, op1[0], addhex(general_purpose_registers[ord(op2[0]) - 64][2],
                                                    general_purpose_registers[ord(op1[0]) - 64][1])[-2:],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)

        if (typeop1[0] == 'R') and (typeop2[0] == 'M'):
            if op2[1] == 'H':
                address = general_purpose_registers[ord(op2[0]) - 64][1][1]
            elif (op2[1] == 'L') or (op2[1] == 'X'):
                address = general_purpose_registers[ord(op2[0]) - 64][2][1]

            firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][2]
            if address.isdigit():
                if int(address) < 8:
                    total = addhex(memory1[int(address)][1], firstop)
                    a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
                elif (int(address) == 8) or (int(address) == 9):
                    total = addhex(memory2[int(address) - 8][1], firstop)
                    a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            else:
                total = addhex(memory2[ord(op1[0]) - 63][1], firstop)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)

        if (typeop1[0] == 'M') and (typeop2[0] == 'R'):
            if op1[1] == 'H':
                address = general_purpose_registers[ord(op1[0]) - 64][1][1]
            elif (op1[1] == 'L') or (op1[1] == 'X'):
                address = general_purpose_registers[ord(op1[0]) - 64][2][1]

            if op2[1] == 'H':
                regdata = general_purpose_registers[ord(op2[0]) - 64][1]
            elif (op2[1] == 'L'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][2]
            elif (op2[1] == 'X'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]

            if address.isdigit():
                if int(address) < 8:
                    total = addhex(regdata, memory1[int(address)][1])
                    a = Table(mem_frame1, address, total[-4:], -1, memory1)
                elif (int(address) == 8) or (int(address) == 9):
                    total = addhex(regdata, memory2[int(address) - 8][1])
                    a = Table(mem_frame2, address, total[-4:], -1, memory2)
            else:
                total = addhex(regdata, memory2[ord(op2[0]) - 63][1])
                a = Table(mem_frame2, address, total[-4:], -1, memory2)

        if (typeop1[0] == 'R') and (typeop2 == 'D'):
            opcode = "100000"
            reg = "000"
            data = databin(op2)

            if op2[1] == 'H':
                regdata = general_purpose_registers[ord(op2[0]) - 64][1]
                total = addhex(regdata, op2)
                a = Table(gpr_frame, op1[0], total[-2:], general_purpose_registers[ord(op1[0]) - 64][2],
                          general_purpose_registers)
            elif (op2[1] == 'L'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][2]
                total = addhex(regdata, op2)
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1], total[-2:],
                          general_purpose_registers)
            elif (op2[1] == 'X'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]
                total = addhex(regdata, op2)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)

        mcode.delete(0, END)
        mcode.insert(0, opcode + Dbit + Wbit + mode + reg + rm + data)

    def sub(op1, op2):
        Wbit = '1'
        Dbit = '1'
        mode = '11'
        reg = '000'
        rm = '000'
        data = ''

        opcode = opcode_dict["SUB"]
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
                firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                secondop = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]
                total = subhex(firstop, secondop)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'H'):
                firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                total = subhex(firstop, general_purpose_registers[ord(op2[0]) - 64][1])
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'L'):
                firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                total = subhex(firstop, general_purpose_registers[ord(op2[0]) - 64][2])
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'H'):
                a = Table(gpr_frame, op1[0], subhex(general_purpose_registers[ord(op1[0]) - 64][1],
                                                    general_purpose_registers[ord(op2[0]) - 64][1])[-2:],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'L'):
                a = Table(gpr_frame, op1[0], subhex(general_purpose_registers[ord(op1[0]) - 64][1],
                                                    general_purpose_registers[ord(op2[0]) - 64][2])[-2:],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)

        if (typeop1[0] == 'R') and (typeop2[0] == 'M'):
            if op2[1] == 'H':
                address = general_purpose_registers[ord(op2[0]) - 64][1][1]
            elif (op2[1] == 'L') or (op2[1] == 'X'):
                address = general_purpose_registers[ord(op2[0]) - 64][2][1]

            firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][2]
            if address.isdigit():
                if int(address) < 8:
                    total = subhex(firstop, memory1[int(address)][1])
                    a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
                elif (int(address) == 8) or (int(address) == 9):
                    total = subhex(firstop, memory2[int(address) - 8][1])
                    a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            else:
                total = subhex(firstop, memory2[ord(op1[0]) - 63][1])
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)

        if (typeop1[0] == 'M') and (typeop2[0] == 'R'):
            if op1[1] == 'H':
                address = general_purpose_registers[ord(op1[0]) - 64][1][1]
            elif (op1[1] == 'L') or (op1[1] == 'X'):
                address = general_purpose_registers[ord(op1[0]) - 64][2][1]

            if op2[1] == 'H':
                regdata = general_purpose_registers[ord(op2[0]) - 64][1]
            elif (op2[1] == 'L'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][2]
            elif (op2[1] == 'X'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]

            if address.isdigit():
                if int(address) < 8:
                    total = subhex(memory1[int(address)][1], regdata)
                    a = Table(mem_frame1, address, total[-4:], -1, memory1)
                elif (int(address) == 8) or (int(address) == 9):
                    total = subhex(memory2[int(address) - 8][1], regdata)
                    a = Table(mem_frame2, address, total[-4:], -1, memory2)
            else:
                total = subhex(memory2[ord(op2[0]) - 63][1], regdata)
                a = Table(mem_frame2, address, total[-4:], -1, memory2)

        if (typeop1[0] == 'R') and (typeop2 == 'D'):
            opcode = "100000"
            reg = "101"
            data = databin(op2)

            if op2[1] == 'H':
                regdata = general_purpose_registers[ord(op2[0]) - 64][1]
                total = subhex(regdata, op2)
                a = Table(gpr_frame, op1[0], total[-2:], general_purpose_registers[ord(op1[0]) - 64][2],
                          general_purpose_registers)
            elif (op2[1] == 'L'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][2]
                total = subhex(regdata, op2)
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1], total[-2:],
                          general_purpose_registers)
            elif (op2[1] == 'X'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]
                total = subhex(regdata, op2)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)

        mcode.delete(0, END)
        mcode.insert(0, opcode + Dbit + Wbit + mode + reg + rm + data)

    def andd(op1, op2):
        Wbit = '1'
        Dbit = '1'
        mode = '11'
        reg = '000'
        rm = '000'
        data = ''

        opcode = opcode_dict["AND"]
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
        a = None
        if (typeop1[0] == 'R') and (typeop2[0] == 'R'):
            if (op1[1] == 'X'):
                firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                secondop = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]
                total = andbin(firstop, secondop)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'H'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          andbin(general_purpose_registers[ord(op2[0]) - 64][1],
                                 general_purpose_registers[ord(op1[0]) - 64][2])[-2:], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'L'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          andbin(general_purpose_registers[ord(op1[0]) - 64][2],
                                 general_purpose_registers[ord(op2[0]) - 64][2])[-2:], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'H'):
                a = Table(gpr_frame, op1[0], andbin(general_purpose_registers[ord(op1[0]) - 64][1],
                                                    general_purpose_registers[ord(op2[0]) - 64][1])[-2:],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'L'):
                a = Table(gpr_frame, op1[0], andbin(general_purpose_registers[ord(op1[0]) - 64][1],
                                                    general_purpose_registers[ord(op2[0]) - 64][2])[-2:],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)

        if (typeop1[0] == 'R') and (typeop2[0] == 'M'):
            if op2[1] == 'H':
                address = general_purpose_registers[ord(op2[0]) - 64][1][1]
            elif (op2[1] == 'L') or (op2[1] == 'X'):
                address = general_purpose_registers[ord(op2[0]) - 64][2][1]

            regdata = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][2]

            if address.isdigit():
                if int(address) < 8:
                    total = andbin(memory1[int(address)][1], regdata)
                    a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
                elif (int(address) == 8) or (int(address) == 9):
                    total = andbin(memory2[int(address) - 8][1], regdata)
                    a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            else:
                total = andbin(memory2[ord(op1[0]) - 63][1], regdata)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)

        if (typeop1[0] == 'M') and (typeop2[0] == 'R'):
            if op1[1] == 'H':
                address = general_purpose_registers[ord(op1[0]) - 64][1][1]
            elif (op1[1] == 'L') or (op1[1] == 'X'):
                address = general_purpose_registers[ord(op1[0]) - 64][2][1]

            if op2[1] == 'H':
                regdata = general_purpose_registers[ord(op2[0]) - 64][1]
            elif (op2[1] == 'L'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][2]
            elif (op2[1] == 'X'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]

            if address.isdigit():
                if int(address) < 8:
                    total = andbin(regdata, memory1[int(address)][1])
                    a = Table(mem_frame1, address, total[-4:], -1, memory1)
                elif (int(address) == 8) or (int(address) == 9):
                    total = andbin(regdata, memory2[int(address) - 8][1])
                    a = Table(mem_frame2, address, total[-4:], -1, memory2)
            else:
                total = andbin(regdata, memory2[ord(op2[0]) - 63][1])
                a = Table(mem_frame2, address, total[-4:], -1, memory2)

        if (typeop1[0] == 'R') and (typeop2 == 'D'):
            opcode = "100000"
            reg = "000"
            data = databin(op2)

            if op2[1] == 'H':
                regdata = general_purpose_registers[ord(op2[0]) - 64][1]
                total = andbin(regdata, op2)
                a = Table(gpr_frame, op1[0], total[-2:], general_purpose_registers[ord(op1[0]) - 64][2],
                          general_purpose_registers)
            elif (op2[1] == 'L'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][2]
                total = andbin(regdata, op2)
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1], total[-2:],
                          general_purpose_registers)
            elif (op2[1] == 'X'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]
                total = andbin(regdata, op2)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
        mcode.delete(0, END)
        mcode.insert(0, opcode + Dbit + Wbit + mode + reg + rm + data)

    def orr(op1, op2):
        Wbit = '1'
        Dbit = '1'
        mode = '11'
        reg = '000'
        rm = '000'
        data = ''

        opcode = opcode_dict["OR"]
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
        a = None
        if (typeop1[0] == 'R') and (typeop2[0] == 'R'):
            if (op1[1] == 'X'):
                firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                secondop = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]
                total = orbin(firstop, secondop)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'H'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          orbin(general_purpose_registers[ord(op2[0]) - 64][1],
                                general_purpose_registers[ord(op1[0]) - 64][2])[-2:], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'L'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          orbin(general_purpose_registers[ord(op1[0]) - 64][2],
                                general_purpose_registers[ord(op2[0]) - 64][2])[-2:], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'H'):
                a = Table(gpr_frame, op1[0], orbin(general_purpose_registers[ord(op1[0]) - 64][1],
                                                   general_purpose_registers[ord(op2[0]) - 64][1])[-2:],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'L'):
                a = Table(gpr_frame, op1[0], orbin(general_purpose_registers[ord(op1[0]) - 64][1],
                                                   general_purpose_registers[ord(op2[0]) - 64][2])[-2:],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)

        if (typeop1[0] == 'R') and (typeop2[0] == 'M'):
            if op2[1] == 'H':
                address = general_purpose_registers[ord(op2[0]) - 64][1][1]
            elif (op2[1] == 'L') or (op2[1] == 'X'):
                address = general_purpose_registers[ord(op2[0]) - 64][2][1]

            regdata = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][2]

            if address.isdigit():
                if int(address) < 8:
                    total = orbin(memory1[int(address)][1], regdata)
                    a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
                elif (int(address) == 8) or (int(address) == 9):
                    total = orbin(memory2[int(address) - 8][1], regdata)
                    a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            else:
                total = orbin(memory2[ord(op1[0]) - 63][1], regdata)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)

        if (typeop1[0] == 'M') and (typeop2[0] == 'R'):
            if op1[1] == 'H':
                address = general_purpose_registers[ord(op1[0]) - 64][1][1]
            elif (op1[1] == 'L') or (op1[1] == 'X'):
                address = general_purpose_registers[ord(op1[0]) - 64][2][1]

            if op2[1] == 'H':
                regdata = general_purpose_registers[ord(op2[0]) - 64][1]
            elif (op2[1] == 'L'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][2]
            elif (op2[1] == 'X'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]

            if address.isdigit():
                if int(address) < 8:
                    total = orbin(regdata, memory1[int(address)][1])
                    a = Table(mem_frame1, address, total[-4:], -1, memory1)
                elif (int(address) == 8) or (int(address) == 9):
                    total = orbin(regdata, memory2[int(address) - 8][1])
                    a = Table(mem_frame2, address, total[-4:], -1, memory2)
            else:
                total = orbin(regdata, memory2[ord(op2[0]) - 63][1])
                a = Table(mem_frame2, address, total[-4:], -1, memory2)

        if (typeop1[0] == 'R') and (typeop2 == 'D'):
            opcode = "100000"
            reg = "001"
            data = databin(op2)

            if op2[1] == 'H':
                regdata = general_purpose_registers[ord(op2[0]) - 64][1]
                total = orbin(regdata, op2)
                a = Table(gpr_frame, op1[0], total[-2:], general_purpose_registers[ord(op1[0]) - 64][2],
                          general_purpose_registers)
            elif (op2[1] == 'L'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][2]
                total = orbin(regdata, op2)
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1], total[-2:],
                          general_purpose_registers)
            elif (op2[1] == 'X'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]
                total = orbin(regdata, op2)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)

        mcode.delete(0, END)
        mcode.insert(0, opcode + Dbit + Wbit + mode + reg + rm + data)

    def xor(op1, op2):
        Wbit = '1'
        Dbit = '1'
        mode = '11'
        reg = '000'
        rm = '000'
        data = ''

        opcode = opcode_dict["XOR"]
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
        a = None
        if (typeop1[0] == 'R') and (typeop2[0] == 'R'):
            if (op1[1] == 'X'):
                firstop = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                secondop = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]
                total = xorbin(firstop, secondop)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'H'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          xorbin(general_purpose_registers[ord(op2[0]) - 64][1],
                                 general_purpose_registers[ord(op1[0]) - 64][2])[-2:], general_purpose_registers)
            elif (op1[1] == 'L') and (op2[1] == 'L'):
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          xorbin(general_purpose_registers[ord(op1[0]) - 64][2],
                                 general_purpose_registers[ord(op2[0]) - 64][2])[-2:], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'H'):
                a = Table(gpr_frame, op1[0], xorbin(general_purpose_registers[ord(op1[0]) - 64][1],
                                                    general_purpose_registers[ord(op2[0]) - 64][1])[-2:],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)
            elif (op1[1] == 'H') and (op2[1] == 'L'):
                a = Table(gpr_frame, op1[0], xorbin(general_purpose_registers[ord(op1[0]) - 64][1],
                                                    general_purpose_registers[ord(op2[0]) - 64][2])[-2:],
                          general_purpose_registers[ord(op1[0]) - 64][2], general_purpose_registers)

        if (typeop1[0] == 'R') and (typeop2[0] == 'M'):
            if op2[1] == 'H':
                address = general_purpose_registers[ord(op2[0]) - 64][1][1]
            elif (op2[1] == 'L') or (op2[1] == 'X'):
                address = general_purpose_registers[ord(op2[0]) - 64][2][1]

            regdata = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][2]

            if address.isdigit():
                if int(address) < 8:
                    total = xorbin(memory1[int(address)][1], regdata)
                    a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
                elif (int(address) == 8) or (int(address) == 9):
                    total = xorbin(memory2[int(address) - 8][1], regdata)
                    a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)
            else:
                total = xorbin(memory2[ord(op1[0]) - 63][1], regdata)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)

        if (typeop1[0] == 'M') and (typeop2[0] == 'R'):
            if op1[1] == 'H':
                address = general_purpose_registers[ord(op1[0]) - 64][1][1]
            elif (op1[1] == 'L') or (op1[1] == 'X'):
                address = general_purpose_registers[ord(op1[0]) - 64][2][1]

            if op2[1] == 'H':
                regdata = general_purpose_registers[ord(op2[0]) - 64][1]
            elif (op2[1] == 'L'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][2]
            elif (op2[1] == 'X'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]

            if address.isdigit():
                if int(address) < 8:
                    total = xorbin(regdata, memory1[int(address)][1])
                    a = Table(mem_frame1, address, total[-4:], -1, memory1)
                elif (int(address) == 8) or (int(address) == 9):
                    total = xorbin(regdata, memory2[int(address) - 8][1])
                    a = Table(mem_frame2, address, total[-4:], -1, memory2)
            else:
                total = xorbin(regdata, memory2[ord(op2[0]) - 63][1])
                a = Table(mem_frame2, address, total[-4:], -1, memory2)

        if (typeop1[0] == 'R') and (typeop2 == 'D'):
            opcode = "100000"
            reg = "001"
            data = databin(op2)

            if op2[1] == 'H':
                regdata = general_purpose_registers[ord(op2[0]) - 64][1]
                total = xorbin(regdata, op2)
                a = Table(gpr_frame, op1[0], total[-2:], general_purpose_registers[ord(op1[0]) - 64][2],
                          general_purpose_registers)
            elif (op2[1] == 'L'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][2]
                total = xorbin(regdata, op2)
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1], total[-2:],
                          general_purpose_registers)
            elif (op2[1] == 'X'):
                regdata = general_purpose_registers[ord(op2[0]) - 64][1] + general_purpose_registers[ord(op2[0]) - 64][
                    2]
                total = xorbin(regdata, op2)
                a = Table(gpr_frame, op1[0], total[-4:-2], total[-2:], general_purpose_registers)

        mcode.delete(0, END)
        mcode.insert(0, opcode + Dbit + Wbit + mode + reg + rm + data)

    def inc(op1):
        Wbit = '1'
        mode = '11'
        reg = '000'
        rm = '000'
        opcode = opcode_dict["INC"]
        if (op1 in reg1):
            typeop1 = 'R1'
            rm = reg1[op1]
        elif (op1 in reg2):
            typeop1 = 'R2'
            rm = reg2[op1]
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

        a = None
        if (typeop1[0] == 'R'):
            if (op1[1] == 'X'):
                regdata = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                newsum = addhex(regdata, "01")
                a = Table(gpr_frame, op1[0], newsum[-4:-2], newsum[-2:], general_purpose_registers)
            elif (op1[1] == 'L'):
                newsum = addhex(general_purpose_registers[ord(op1[0]) - 64][2], "01")
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          newsum[-2:], general_purpose_registers)
            elif (op1[1] == 'H'):
                newsum = addhex(general_purpose_registers[ord(op1[0]) - 64][1], "01")
                a = Table(gpr_frame, op1[0], newsum[-2:], general_purpose_registers[ord(op1[0]) - 64][2],
                          general_purpose_registers)
        elif (typeop1[0] == 'M'):
            if op1[1] == 'H':
                address = general_purpose_registers[ord(op1[0]) - 64][1][1]
            elif (op1[1] == 'L') or (op1[1] == 'X'):
                address = general_purpose_registers[ord(op1[0]) - 64][2][1]

            if address.isdigit():
                if int(address) < 8:
                    a = Table(mem_frame1, address, addhex("01", memory1[int(address)][1]), -1, memory1)
                elif (int(address) == 8) or (int(address) == 9):
                    a = Table(mem_frame2, address, addhex("01", memory2[int(address) - 8][1]), -1, memory2)
            else:
                a = Table(mem_frame2, address, addhex("01", memory2[ord(op1[0]) - 63][1]), -1, memory2)
        mcode.delete(0, END)
        mcode.insert(0, opcode + Wbit + mode + reg + rm)

    def dec(op1):
        Wbit = '1'
        mode = '11'
        reg = '001'
        rm = '000'
        opcode = opcode_dict["DEC"]
        if (op1 in reg1):
            typeop1 = 'R1'
            rm = reg1[op1]
        elif (op1 in reg2):
            typeop1 = 'R2'
            rm = reg2[op1]
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

        a = None
        if (typeop1[0] == 'R'):
            if (op1[1] == 'X'):
                regdata = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                newsum = dechex(regdata)
                a = Table(gpr_frame, op1[0], newsum[-4:-2], newsum[-2:], general_purpose_registers)
            elif (op1[1] == 'L'):
                newsum = dechex(general_purpose_registers[ord(op1[0]) - 64][2])
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          newsum[-2:], general_purpose_registers)
            elif (op1[1] == 'H'):
                newsum = dechex(general_purpose_registers[ord(op1[0]) - 64][1])
                a = Table(gpr_frame, op1[0], newsum[-2:], general_purpose_registers[ord(op1[0]) - 64][2],
                          general_purpose_registers)
        elif (typeop1[0] == 'M'):
            if op1[1] == 'H':
                address = general_purpose_registers[ord(op1[0]) - 64][1][1]
            elif (op1[1] == 'L') or (op1[1] == 'X'):
                address = general_purpose_registers[ord(op1[0]) - 64][2][1]

            if address.isdigit():
                if int(address) < 8:
                    a = Table(mem_frame1, address, dechex(memory1[int(address)][1]), -1, memory1)
                elif (int(address) == 8) or (int(address) == 9):
                    a = Table(mem_frame2, address, dechex(memory2[int(address) - 8][1]), -1, memory2)
            else:
                a = Table(mem_frame2, address, dechex(memory2[ord(op1[0]) - 63][1]), -1, memory2)
        mcode.delete(0, END)
        mcode.insert(0, opcode + Wbit + mode + reg + rm)

    def nott(op1):
        Wbit = '1'
        mode = '11'
        reg = '010'
        rm = '000'
        opcode = opcode_dict["NOT"]
        if (op1 in reg1):
            typeop1 = 'R1'
            rm = reg1[op1]
        elif (op1 in reg2):
            typeop1 = 'R2'
            rm = reg2[op1]
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

        a = None
        if (typeop1[0] == 'R'):
            if (op1[1] == 'X'):
                regdata = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                newsum = complement(regdata)
                a = Table(gpr_frame, op1[0], newsum[-4:-2], newsum[-2:], general_purpose_registers)
            elif (op1[1] == 'L'):
                newsum = complement(general_purpose_registers[ord(op1[0]) - 64][2])
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          newsum[-2:], general_purpose_registers)
            elif (op1[1] == 'H'):
                newsum = complement(general_purpose_registers[ord(op1[0]) - 64][1])
                a = Table(gpr_frame, op1[0], newsum[-2:], general_purpose_registers[ord(op1[0]) - 64][2],
                          general_purpose_registers)
        elif (typeop1[0] == 'M'):
            if op1[1] == 'H':
                address = general_purpose_registers[ord(op1[0]) - 64][1][1]
            elif (op1[1] == 'L') or (op1[1] == 'X'):
                address = general_purpose_registers[ord(op1[0]) - 64][2][1]

            if address.isdigit():
                if int(address) < 8:
                    a = Table(mem_frame1, address, complement(memory1[int(address)][1]), -1, memory1)
                elif (int(address) == 8) or (int(address) == 9):
                    a = Table(mem_frame2, address, complement(memory2[int(address) - 8][1]), -1, memory2)
            else:
                a = Table(mem_frame2, address, complement(memory2[ord(op1[0]) - 63][1]), -1, memory2)
        mcode.delete(0, END)
        mcode.insert(0, opcode + Wbit + mode + reg + rm)

    def neg(op1):
        Wbit = '1'
        mode = '11'
        reg = '011'
        rm = '000'
        opcode = opcode_dict["NEG"]
        if (op1 in reg1):
            typeop1 = 'R1'
            rm = reg1[op1]
        elif (op1 in reg2):
            typeop1 = 'R2'
            rm = reg2[op1]
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

        a = None
        if (typeop1[0] == 'R'):
            if (op1[1] == 'X'):
                regdata = general_purpose_registers[ord(op1[0]) - 64][1] + general_purpose_registers[ord(op1[0]) - 64][
                    2]
                newsum = complement(regdata)
                a = Table(gpr_frame, op1[0], newsum[-4:-2], newsum[-2:], general_purpose_registers)
            elif (op1[1] == 'L'):
                newsum = complement(general_purpose_registers[ord(op1[0]) - 64][2])
                a = Table(gpr_frame, op1[0], general_purpose_registers[ord(op1[0]) - 64][1],
                          newsum[-2:], general_purpose_registers)
            elif (op1[1] == 'H'):
                newsum = complement(general_purpose_registers[ord(op1[0]) - 64][1])
                a = Table(gpr_frame, op1[0], newsum[-2:], general_purpose_registers[ord(op1[0]) - 64][2],
                          general_purpose_registers)
        elif (typeop1[0] == 'M'):
            if op1[1] == 'H':
                address = general_purpose_registers[ord(op1[0]) - 64][1][1]
            elif (op1[1] == 'L') or (op1[1] == 'X'):
                address = general_purpose_registers[ord(op1[0]) - 64][2][1]

            if address.isdigit():
                if int(address) < 8:
                    a = Table(mem_frame1, address, complement(memory1[int(address)][1]), -1, memory1)
                elif (int(address) == 8) or (int(address) == 9):
                    a = Table(mem_frame2, address, complement(memory2[int(address) - 8][1]), -1, memory2)
            else:
                a = Table(mem_frame2, address, complement(memory2[ord(op1[0]) - 63][1]), -1, memory2)
        mcode.delete(0, END)
        mcode.insert(0, opcode + Wbit + mode + reg + rm)

    trigger = False

    global instruction

    window = Tk()

    def set_flag():
        global flag
        flag = False
        window.destroy()

    # Creating code frame
    code_frame = LabelFrame(window, font=("Times New Roman", 15, "bold"), padx=100, pady=250, borderwidth=7)
    code_frame.grid(padx=25, pady=50, rowspan=3)
    e = Entry(code_frame, width=40, borderwidth=8)
    e.pack()
    window.protocol("WM_DELETE_WINDOW", set_flag)
    def retain_command():
        global input_string
        input_string = e.get()
        inputt(input_string)
        return input_string

    def state_return():
        global state
        return state

    compile_button = Button(code_frame, text="Compile", padx=10, pady=10, command=retain_command).pack()
    error_state = Label(code_frame, text=state_return(), padx=10, pady=10, font=("Times New Roman", 11)).pack()


    # Creating class for changing tables
    class Table:
        def __init__(self, root, register, h_val, l_val, lst):
            # code for creating table
            for i in range(len(lst)):
                for j in range(len(lst[0])):
                    self.e = Entry(root, width=7, fg='black', font=('Times New Roman', 16))
                    self.e.grid(row=i + 1, column=j + 1)
                    if register != "-1":
                        if lst[i][0] == register:
                            if j == 1:
                                lst[i][j] = h_val
                            if l_val != "-1":
                                if j == 2:
                                    lst[i][j] = l_val
                    self.e.insert(END, lst[i][j])

    # take the data
    general_purpose_registers = [['Reg', 'H', 'L'], ['A', '00', '00'], ['B', '00', '00'], ['C', '00', '00'],
                                 ['D', '00', '00']]
    segments = [['SS', '0000'], ['DS', '0000'], ['ES', '0000']]
    pointers = [['SP', '0000'], ['BP', '0000'], ['SI', '0000'], ['DI', '0000']]
    memory1 = [['0', '0000'], ['1', '0000'], ['2', '0000'], ['3', '0000'],
               ['4', '0000'], ['5', '0000'], ['6', '0000'], ['7', '0000']]
    memory2 = [['8', '0000'], ['9', '0000'], ['A', '0000'], ['B', '0000'],
               ['C', '0000'], ['D', '0000'], ['E', '0000'], ['F', '0000']]

    # Creating general purpose register frame
    gpr_frame = LabelFrame(window, borderwidth=7, text='General Purpose Registers',
                           font=('Times New Roman', 16, 'bold'))
    gpr_frame.grid(row=0, column=1)
    gpr = Table(gpr_frame, "-1", '00', '00', general_purpose_registers)

    # Creating segment register frame
    s_frame = LabelFrame(window, borderwidth=7, text='Segment Registers', font=('Times New Roman', 16, 'bold'))
    s_frame.grid(row=0, column=2)

    sr = Table(s_frame, "-1", '00', '00', segments)

    # Creating pointer register frame
    p_frame = LabelFrame(window, borderwidth=7, text='Pointer Registers', font=('Times New Roman', 16, 'bold'))
    p_frame.grid(row=0, column=3)

    sr = Table(p_frame, "-1", '00', '00', pointers)

    # Creating Machine Code area
    mc_frame = LabelFrame(window, font=("Times New Roman", 15, "bold"), text='Machine Code', borderwidth=7)
    mc_frame.grid(row=1, column=1, columnspan=2)
    mcode = Entry(mc_frame, width=40, borderwidth=7)
    mcode.pack()

    # Creating memory
    memory_frame = LabelFrame(window, borderwidth=7, text='PRIMARY MEMORY', font=('Times New Roman', 16, 'bold'))
    memory_frame.grid(row=2, column=2, padx=100)
    mem_frame1 = LabelFrame(memory_frame)
    mem_frame1.grid(row=2, column=1)

    mem1 = Table(mem_frame1, "-1", '00', '00', memory1)

    mem_frame2 = LabelFrame(memory_frame)
    mem_frame2.grid(row=2, column=2)

    mem2 = Table(mem_frame2, "-1", '00', '00', memory2)

    opcode_dict = {"MOV": "100010", "MOV1": "101", "ADD": "000000", "AND": "001000", "CBW": "10011000",
                   "CWD": "10011000",
                   "DEC": "1111111", "DIV": "1111011", "IDIV": "1111011", "IMUL": "1111011", "MUL": "1111011",
                   "INC": "1111111", "NEG": "1111011", "NOT": "1111011", "OR": "000010", "SUB": "000101",
                   "XOR": "000110"}

    opcode_ex = {"DEC": "001", "INC": "000", "DIV": "110", "IDIV": "111", "IMUL": "101", "MUL": "100", "NEG": "011",
                 "NOT": "010"}

    reg1 = {"AL": "000", "CL": "001", "DL": "010", "BL": "011", "AH": "100", "CH": "101", "DH": "110", "BH": "111"}

    reg2 = {"AX": "000", "CX": "001", "DX": "010", "BX": "011", "SP": "100", "BP": "101", "SI": "110", "DI": "111"}

    # create a button on the corner of the screen

    Task_2_button = Button(window, text="Simulate", padx=10, pady=10, command=(lambda: Task_2(trigger)))
    Task_2_button.grid(row=0, column=0, padx=10, pady=10)
    global input_string
    input_string = e.get()
    window.mainloop()
