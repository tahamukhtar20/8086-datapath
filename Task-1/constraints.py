def inputt(inp):
    inp=inp.upper()
    l1=inp.split()
    instruction=inp[0]
    a1=l1[1]
    a2=l1[3]
    if "#" in a2:
        temp2=a2[1:5]
        value2=temp(a2,16)
    if "#" in a1:
        temp1=a1[1:5]
        value1=temp1(a1,16)
    if instruction == "MOV":
        if(a1 in reg1 and a2 in reg1):
            mov(a1,a2)
        elif(a1 in reg2 and a2 in reg2):
            mov(a1,a2)
        elif(a1 in reg2 and value2>1 and value2<65535 ):
            mov(a1,temp2)
        elif ("[" in a1 and a2 in reg1):
            mov(a1,a2)
        elif(a1 in reg1 and "[" in a2):
            mov(a1,a2)
        else:
            print("Incorrect MOV syntax")
    elif instruction == "ADDHEX":
        if(a1 in reg2 and value2>1 and value2<65535):
            addhex(a1,a2)
        elif(value1>1 and value1<65535 or value2>1 and value2<65535):
            addhex(temp1,temp2)
    elif instruction == "ADD":
        if(a1 in reg1 and a2 in reg1):
            add(a1,a2)
        elif(a1 in reg2 and a2 in reg2):
            add(a1,a2)
        elif (a1 in reg2 and value2 > 1 and value2 < 65535):
            add(a1, temp2)
        elif ("[" in a1 and a2 in reg1):
            add(a1, a2)
        elif (a1 in reg1 and "[" in a2):
            add(a1, a2)
        elif (value1>1 and value1<65535 and a2 in reg2):
            add(a1,temp1)
        else:
            print("Incorrect ADD syntax")
    elif instruction == "AND":
        if (a1 in reg1 and a2 in reg1):
            andd(a1, a2)
        elif (a1 in reg2 and a2 in reg2):
            andd(a1, a2)
        elif (a1 in reg2 and value2 > 1 and value2 < 65535):
            andd(a1, temp2)
        elif ("[" in a1 and a2 in reg1):
            andd(a1, a2)
        elif (a1 in reg1 and "[" in a2):
            andd(a1, a2)
        elif (value1 > 1 and value1 < 65535 and a2 in reg2):
            andd(a1, temp1)
        else:
            print("Incorrect AND syntax")
    elif instruction == "OR":
        if (a1 in reg1 and a2 in reg1):
            orr(a1, a2)
        elif (a1 in reg2 and a2 in reg2):
            orr (a1, a2)
        elif (a1 in reg2 and value2 > 1 and value2 < 65535):
            orr (a1, temp2)
        elif ("[" in a1 and a2 in reg1):
            orr (a1, a2)
        elif (a1 in reg1 and "[" in a2):
            orr(a1, a2)
        elif (value1 > 1 and value1 < 65535 and a2 in reg2):
            orr (a1, temp1)
        else:
            print("Incorrect OR syntax")
    elif instruction == "XOR":
        if (a1 in reg1 and a2 in reg1):
            xor(a1, a2)
        elif (a1 in reg2 and a2 in reg2):
            xor (a1, a2)
        elif (a1 in reg2 and value2 > 1 and value2 < 65535):
            xor (a1, temp2)
        elif ("[" in a1 and a2 in reg1):
            xor (a1, a2)
        elif (a1 in reg1 and "[" in a2):
            xor (a1, a2)
        elif (value1 > 1 and value1 < 65535 and a2 in reg2):
            xor (a1, temp1)
        else:
            print("Incorrect XOR syntax")
    elif instruction == "SUB":
        if (a1 in reg1 and a2 in reg1):
            sub(a1, a2)
        elif (a1 in reg2 and a2 in reg2):
            sub (a1, a2)
        elif (a1 in reg2 and value2 > 1 and value2 < 65535):
            sub (a1, temp2)
        elif ("[" in a1 and a2 in reg1):
            sub (a1, a2)
        elif (a1 in reg1 and "[" in a2):
            sub (a1, a2)
        elif (value1 > 1 and value1 < 65535 and a2 in reg2):
            sub (a1, temp1)
        else:
            print("Incorrect SUB syntax")


