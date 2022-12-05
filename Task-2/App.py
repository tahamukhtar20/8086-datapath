import sys

sys.path.insert(0, "..\\Task-1")
import app


def run():
    import pygame
    from Draw import shape, write as label, Arrows
    instruction = app.input_string
    if app.input_string == "":
        exit()
    instruction = instruction.upper()
    print([app.input_string], "here")
    instruction_set = instruction.split(" ", 1)
    if "," in instruction_set[1]:
        instruction_set[1] = instruction_set[1].replace(" ", "")
        instruction_set[1] = instruction_set[1].split(",", 1)
        operation = instruction_set[0].strip()
        operand1 = instruction_set[1][0].strip()
        operand2 = instruction_set[1][1].strip()
    else:
        operation = instruction_set[0].strip()
        operand1 = instruction_set[1].strip()
        operand2 = None
    left_index = 30
    right_index = 800
    small_box_x = 180
    small_box_y = 20
    large_box_x = 250
    large_box_y = 80
    screen = pygame.display.set_mode((1130, 670))
    # ===============================================================================================================
    keybox = shape(500, 10, 10, 20, "1st Operand")
    keybox.color_change(1)
    keybox1 = shape(500, 10, 10, 22.5, "2nd Operand")
    keybox1.color_change(3)
    keybox2 = shape(500, 10, 10, 25, "Components in Use")
    keybox2.color_change(2)
    back_fill = shape(470, 200, 150, 19.5, "")
    one = shape(right_index, small_box_x, small_box_y, 4, "1")
    two = shape(right_index, small_box_x, small_box_y, 5, "2")
    three = shape(right_index, small_box_x, small_box_y, 6, "3")
    four = shape(right_index, small_box_x, small_box_y, 7, "4")
    five = shape(right_index, small_box_x, small_box_y, 8, "5")
    six = shape(right_index, small_box_x, small_box_y, 9, "6")
    # ===============================================================================================================
    control_unit = shape(right_index - 30, large_box_x, large_box_y, 11, "Control Unit")
    a_l_u = shape(right_index, large_box_x, large_box_y, 21.5, "ALU")
    operands = shape(right_index, small_box_x, small_box_y + 11, 25, "Operands")
    flags = shape(right_index, small_box_x, small_box_y + 11, 26.5, "Flags")
    memory_interface = shape(left_index, large_box_x, large_box_y, 0, "Memory Interface")
    summation = shape(left_index, small_box_x, small_box_y, 4.7, "Summation")
    # ================================================================================================
    es = shape(left_index, small_box_x * 1.5, small_box_y, 11, "ES")
    cs = shape(left_index, small_box_x * 1.5, small_box_y, 12, "CS")
    ss = shape(left_index, small_box_x * 1.5, small_box_y, 13, "SS")
    ds = shape(left_index, small_box_x * 1.5, small_box_y, 14, "DS")
    ip = shape(left_index, small_box_x * 1.5, small_box_y, 15, "IP")
    ah = shape(left_index + small_box_x // 2 + 2, small_box_x // 2, small_box_y, 19, "AH")
    bh = shape(left_index + small_box_x // 2 + 2, small_box_x // 2, small_box_y, 20, "BH")
    ch = shape(left_index + small_box_x // 2 + 2, small_box_x // 2, small_box_y, 21, "CH")
    dh = shape(left_index + small_box_x // 2 + 2, small_box_x // 2, small_box_y, 22, "DH")
    al = shape(left_index, small_box_x // 2, small_box_y, 19, "AL")
    bl = shape(left_index, small_box_x // 2, small_box_y, 20, "BL")
    cl = shape(left_index, small_box_x // 2, small_box_y, 21, "CL")
    dl = shape(left_index, small_box_x // 2, small_box_y, 22, "DL")
    sp = shape(left_index, small_box_x + 2, small_box_y, 23, "SP")
    bp = shape(left_index, small_box_x + 2, small_box_y, 24, "BP")
    si = shape(left_index, small_box_x + 2, small_box_y, 25, "SI")
    di = shape(left_index, small_box_x + 2, small_box_y, 26, "DI")
    # ================================================================================================
    sum_to_mem = Arrows(summation.x * 4,
                        summation.y + summation.increment * (summation.i + 0),
                        memory_interface.x * 4,
                        memory_interface.y + memory_interface.increment * (memory_interface.i + 2),
                        "up")
    sum_to_es = Arrows(es.x * 2,
                       es.y + es.increment * (es.i + 0),
                       summation.x * 2,
                       summation.y + summation.increment * (summation.i + 3.5),
                       "up")
    sum_to_es_1 = Arrows(es.x * 8.5,
                         es.y + es.increment * (es.i + 0),
                         summation.x * 8.5,
                         summation.y + summation.increment * (summation.i + 3.5),
                         "up")
    es_to_sum = Arrows(summation.x * 8.5,
                       summation.y + summation.increment * (summation.i + 3.5),
                       es.x * 8.5,
                       es.y + es.increment * (es.i + 0),
                       "down")

    BIU = Arrows(memory_interface.x * 4,
                 memory_interface.y + memory_interface.increment * (memory_interface.i + 3),
                 one.x + 100,
                 memory_interface.y + memory_interface.increment * (memory_interface.i + 3),
                 "BAR")

    BIU_to_one = Arrows(one.x + 100,
                        memory_interface.y + memory_interface.increment * (memory_interface.i + 2.8),
                        one.x + 100,
                        one.y + one.increment * (one.i + 0),
                        "down")

    EU = Arrows(ip.x + 100,
                ip.y + one.increment * (ip.i + 2),
                a_l_u.x + 300,
                ip.y + one.increment * (ip.i + 2),
                "BAR")
    EU_2 = Arrows(a_l_u.x + 300,
                  ip.y + one.increment * (ip.i + 2) - 4,
                  a_l_u.x + 300,
                  a_l_u.y + a_l_u.increment * (a_l_u.i + 6),
                  "BAR")
    EU_to_ip = Arrows(ip.x + 100,
                      ip.y + one.increment * (ip.i + 2),
                      ip.x + 100,
                      ip.y + one.increment * (ip.i + 1),
                      "up")
    ip_to_EU = Arrows(ip.x + 120,
                      ip.y + one.increment * (ip.i + 1),
                      ip.x + 120,
                      ip.y + one.increment * (ip.i + 1.79),
                      "down")
    ALU_to_EU1 = Arrows(a_l_u.x + 30,
                        ip.y + one.increment * (ip.i + 2.4) - 2,
                        a_l_u.x + 30,
                        a_l_u.y + a_l_u.increment * (a_l_u.i - 3.5),
                        "down")
    ALU_to_EU = Arrows(a_l_u.x + 210,
                       ip.y + one.increment * (ip.i + 2.4) - 2,
                       a_l_u.x + 210,
                       a_l_u.y + a_l_u.increment * (a_l_u.i - 3.5),
                       "down")
    BIU_to_MID = Arrows(summation.x + 300,
                        summation.y + summation.increment * (summation.i - 1.5),
                        summation.x + 300,
                        ip.y + one.increment * (ip.i - 6) - 4,
                        "down")
    mid_to_sumarrow = Arrows(summation.x + 300,
                             ip.y + one.increment * (ip.i - 6) - 4,
                             es.x * 8.5,
                             ip.y + one.increment * (ip.i - 6) - 4,
                             "left")
    EU_to_regs = Arrows(summation.x + 150,
                        ip.y + one.increment * (ip.i + 4) - 4,
                        summation.x + 150,
                        summation.y + summation.increment * (summation.i + 12.7),
                        "up")
    regs_to_EU = Arrows(summation.x + 150,
                        summation.y + summation.increment * (summation.i + 12.7),
                        summation.x + 150,
                        ip.y + one.increment * (ip.i + 4) - 4,
                        "down")
    six_to_cu = Arrows(six.x + 150,
                       six.y + six.increment * (six.i + 0.9),
                       six.x + 150,
                       six.y + six.increment * (six.i + 2),
                       "down")
    scarr_to_scearr = Arrows(six.x + 150,
                             six.y + six.increment * (six.i + 1.3),
                             six.x - 50,
                             six.y + six.increment * (six.i + 1.3),
                             "left")
    scearr_to_EU = Arrows(six.x - 50,
                          six.y + six.increment * (six.i + 1.3),
                          six.x - 50,
                          six.y + six.increment * (six.i + 7.79),
                          "down")
    oper_to_EU_2 = Arrows(operands.x + 178,
                          operands.y + operands.increment * (operands.i + 1.5),
                          operands.x + 295,
                          operands.y + operands.increment * (operands.i + 1.5),
                          "right")
    EU_2_to_oper = Arrows(operands.x + 295,
                          operands.y + operands.increment * (operands.i + 1.5),
                          operands.x + 178,
                          operands.y + operands.increment * (operands.i + 1.5),
                          "left")
    ALU_to_mid_below = Arrows(a_l_u.x + 120,
                              a_l_u.y + a_l_u.increment * (a_l_u.i + 1.5),
                              a_l_u.x + 120,
                              a_l_u.y + a_l_u.increment * (a_l_u.i + 2.5),
                              "down")
    mid_to_EU = Arrows(a_l_u.x + 120,
                       a_l_u.y + a_l_u.increment * (a_l_u.i + 2.5),
                       a_l_u.x + 295,
                       a_l_u.y + a_l_u.increment * (a_l_u.i + 2.5),
                       "right")

    # ================================================================================================

    def collective_function_drawing():
        pygame.draw.rect(screen, (203, 197, 234), (0, 0, 1130, 670), 8)
        back_fill.rect()
        keybox.rect()
        keybox1.rect()
        keybox2.rect()
        sum_to_mem.draw()
        sum_to_es_1.draw()
        sum_to_es.draw()
        es_to_sum.draw()
        BIU.draw()
        BIU_to_MID.draw()
        mid_to_sumarrow.draw()
        ALU_to_EU1.draw()
        ALU_to_EU.draw()
        EU_to_regs.draw()
        BIU_to_one.draw()
        EU_to_ip.draw()
        ip_to_EU.draw()
        EU.draw()
        EU_2.draw()
        EU_to_regs.draw()
        regs_to_EU.draw()
        six_to_cu.draw()
        scarr_to_scearr.draw()
        scearr_to_EU.draw()
        oper_to_EU_2.draw()
        EU_2_to_oper.draw()
        ALU_to_mid_below.draw()
        mid_to_EU.draw()
        one.rect()
        two.rect()
        three.rect()
        four.rect()
        five.rect()
        six.rect()
        control_unit.rect()
        a_l_u.alu()
        operands.rect()
        flags.rect()
        memory_interface.ellipse()
        summation.summation()
        es.rect()
        cs.rect()
        ss.rect()
        ds.rect()
        ip.rect()
        ah.rect()
        bh.rect()
        ch.rect()
        dh.rect()
        al.rect()
        bl.rect()
        cl.rect()
        dl.rect()
        sp.rect()
        bp.rect()
        si.rect()
        di.rect()

    regs = {"AL": al.color_change,
            "BL": bl.color_change,
            "CL": cl.color_change,
            "DL": dl.color_change,
            "AH": ah.color_change,
            "BH": bh.color_change,
            "CH": ch.color_change,
            "DH": dh.color_change,
            "AX": (lambda x: (ah.color_change(x), al.color_change(x))),
            "BX": (lambda x: (bh.color_change(x), bl.color_change(x))),
            "CX": (lambda x: (ch.color_change(x), cl.color_change(x))),
            "DX": (lambda x: (dh.color_change(x), dl.color_change(x))),
            "SP": sp.color_change,
            "BP": bp.color_change,
            "SI": si.color_change,
            "DI": di.color_change
            }

    def returner(instruction_str):
        def mov():
            one.color_change(2),
            control_unit.color_change(2),
            six_to_cu.color_change(2),
            scarr_to_scearr.color_change(2),
            scearr_to_EU.color_change(2),
            EU.color_change(2),
            EU_to_regs.color_change(2),
            regs_to_EU.color_change(2)

        def add():
            mov()
            a_l_u.color_change(2)
            ALU_to_mid_below.color_change(2)
            mid_to_EU.color_change(2)
            EU_2.color_change(2)
            ALU_to_EU.color_change(2)
            ALU_to_EU1.color_change(2)

        if "MOV" == instruction_str:
            mov()
        elif "ADD" == instruction_str:
            add()
        elif "SUB" == instruction_str:
            add()
        elif "AND" == instruction_str:
            add()
        elif "XOR" == instruction_str:
            add()
        elif "INC" == instruction_str:
            add()
        elif "DEC" == instruction_str:
            add()
        elif "DIV" == instruction_str:
            ah.color_change(3)
            al.color_change(3)
            add()
        elif "IDIV" == instruction_str:
            ah.color_change(3)
            al.color_change(3)
            add()
        elif "MUL" == instruction_str:
            ah.color_change(3)
            al.color_change(3)
            add()
        elif "IMUL" == instruction_str:
            ah.color_change(3)
            al.color_change(3)
            add()
        elif "NEG" == instruction_str:
            add()
        elif "NOT" == instruction_str:
            add()

    def mem_involved():
        summation.color_change(2)
        sum_to_mem.color_change(2)
        BIU.color_change(2)
        BIU_to_one.color_change(2)
        es.color_change(2)
        cs.color_change(2)
        ss.color_change(2)
        ds.color_change(2)
        ip.color_change(2)
        es_to_sum.color_change(2)
        sum_to_es.color_change(2)
        sum_to_es_1.color_change(2)
        BIU_to_MID.color_change(2)
        mid_to_sumarrow.color_change(2)
        EU_to_ip.color_change(2)
        ip_to_EU.color_change(2)
        two.color_change(2)

    while True:
        pygame.init()
        returner(operation)
        if operand2 is not None:
            if operand1 in regs.keys():
                regs[operand1](1)
            else:
                memory_interface.color_change(1)
                mem_involved()
            if operand2 in regs.keys():
                regs[operand2](3)
            else:
                memory_interface.color_change(3)
                mem_involved()
        else:
            if operand1 in regs.keys():
                regs[operand1](1)
            else:
                memory_interface.color_change(1)
                mem_involved()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                exit()
        collective_function_drawing()
        pygame.display.update()
