## Technology Used
- Python 
- Tkinter 
- Pygame

## https://nustedupk0.sharepoint.com/:v:/s/kjfljsakfd/EULif_4-BqJHjr-es0Q8ZBgBKgrx8CvI80NQHmkmc7dqtw?e=ZvZJsZ

## Link for the video explaining everything


## Name of people with their work on project
- **GUI of Task-1 and basic GUI(shapes) of Task-2 -> Muhammad Hassan Bin Adeel**

    ![work screenshot #1](mhba.png)
    ![work screenshot #2](mhba2.png)

- **Constraints of Task-1 and debugging of Task-2 and some GUI -> Bashar Siddiqui**

    ![work screenshot #3](bashar1.jpeg)
    ![work screenshot #4](bashar2.jpeg)

- **Functionality of operations in Task-1 and Task-2 -> Syed Hashir Ahmed Kazi and Mohsin Khan**

    ![work screenshot #5](hashir_mohsin.png)
    ![work screenshot #6](hashir_mohsin2.jpeg)


- **Debugging of Task-1 and Task-2 GUI and Logic -> Muhammad Taha Mukhtar**

    ![work screenshot #7](taha1.jpeg)
    ![work screenshot #8](taha2.jpeg)

### GUI
- Displaying input box
- Displaying all registers and memory
- Giving access to every register and memory element to logic builders
- Drawing of shapes in logic block diagram in Task-2

### Constraints
- Checking user input according to assembly language rules
- Not running and throwing error if instruction does not follow the rules
- Run command iff all rules followed

## Code Logic
- Calculation of machine code according to user input
- Calculation and assignment of register values according to user input
- Helps in simulation of instruction (in Task-2) according to 8086
- Highlighting of specific boxes and arrows (red, blue and green colour) which are used in processing (Task-2)
    - Colour decryption key is available in GUI
    - If memory is involved in operation (either in operand1 or operand2) stacks, summation, BIU and second command in queue will be highlighted
    - If memory is not involved, there will be only one operation in the queue. Only the registers involved will be highlighted (red for operand1 and green for operand2)
    - In case of XOR,ADD,SUB,INC,DEC,NOT,AND,OR ALU will be used
    - In case of single operand operations, only red colour will highlight the operand

## Commands Working and some assumtions
- For direct addressing or accessing memory, only type in hexa. Binary not implemented
- 11 commands working in Task-1
- All 15 commands working in Task-2
- If command not working in Task-1, then click on simulate button and it will work in Task-2
- Do not enter ax in mul,imul,div,idiv as constraint missing in task-1 but again it does work in Task-2

## Example use of all instructions
1. MOV 
    - mov ax,bx
    - mov ax,[1]
    - mov [1],ax
2. Increment 
    - inc ax
3. Decrement 
    - dec ax
4. Negate
    - neg ax
5. XOR
    - xor ax,bx
6. AND
    - and ax,bx
7. OR
    - or ax,bx
8. NOT
    - not ax
9. ADD
    - add ax,bx
10. SUB
    - sub ax,bx
11. COMPLEMENT
    - comp ax
12. MUL
    - mul bx (Task-1 not working)
13. IMUL
    - imul bx (Task-1 not working)
14. DIV
    - div bx (Task-1 not working)
15. IDIV
    - idiv bx (Task-1 not working)
