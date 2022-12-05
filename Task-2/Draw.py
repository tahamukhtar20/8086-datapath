import pygame


def write(screen=pygame.display.set_mode((1280, 720)), x=-1, y=-1, text="", width=0, i=0):
    font = pygame.font.SysFont('Calibri', 18, True, False)
    text = font.render(text, True, (0, 0, 0))
    screen.blit(text, [x + width // 2, y + (y - 8) * i])


class shape:
    def __init__(self, x, width, height, i, text):
        self.x = x
        self.y = 30
        self.width = width
        self.height = height
        self.color = (234, 234, 234)
        self.screen = pygame.display.set_mode((1130, 670))
        self.screen.fill((255, 0, 0))
        self.increment = self.y - 8
        self.i = i
        self.text = text

    def rect(self):
        pygame.draw.rect(self.screen, self.color, (self.x, self.y + self.increment * self.i, self.width, self.height))
        write(self.screen, self.x, self.y, self.text, self.width, self.i)

    def alu(self):
        pygame.draw.polygon(self.screen, self.color,
                            [(self.x, self.y + self.increment * 18),
                             (self.x + 40, self.y + self.increment * 23),
                             (self.x + 200, self.y + self.increment * 23),
                             (self.x + 240, self.y + self.increment * 18),
                             (self.x + 180, self.y + self.increment * 18),
                             (self.x + 160, self.y + self.increment * 21),
                             (self.x + 80, self.y + self.increment * 21),
                             (self.x + 60, self.y + self.increment * 18)])
        write(self.screen, self.x - 20, self.y, "ALU", self.width, self.i)

    def summation(self):
        pygame.draw.polygon(self.screen, self.color,
                            [(self.x, self.y + self.increment * 8),
                             (self.x + 40, self.y + self.increment * 4),
                             (self.x + 200, self.y + self.increment * 4),
                             (self.x + 240, self.y + self.increment * 8),
                             (self.x + 180, self.y + self.increment * 8),
                             (self.x + 160, self.y + self.increment * 6),
                             (self.x + 80, self.y + self.increment * 6),
                             (self.x + 60, self.y + self.increment * 8)])
        write(self.screen, self.x - 10, self.y, "Summation", self.width, self.i)

    def ellipse(self):
        pygame.draw.ellipse(self.screen, self.color, (45, 10, 180, 60), 30)
        write(self.screen, self.x - 70, self.y, "Memory Interface", self.width, self.i)

    def color_change(self, x):
        if x == 1:
            self.color = (234, 34, 23)
        elif x == 2:
            self.color = (25, 64, 238)
        elif x == 3:
            self.color = (90, 255, 68)


class Arrows:
    def __init__(self, start_x, start_y, end_x, end_y, direction):
        self.start_x = start_x
        self.start_y = start_y
        self.end_x = end_x
        self.end_y = end_y
        self.color = (234, 234, 234)
        self.screen = pygame.display.set_mode((1130, 670))
        self.screen.fill((24, 54, 66))
        self.direction = direction

    def draw(self):
        if self.direction == "BAR":
            pygame.draw.line(self.screen, self.color, (self.start_x, self.start_y), (self.end_x, self.end_y),
                             10)
        else:
            pygame.draw.line(self.screen, self.color, (self.start_x, self.start_y), (self.end_x, self.end_y), 2)
            if self.direction == "right":
                pygame.draw.polygon(self.screen, self.color,
                                    [(self.end_x, self.end_y), (self.end_x - 10, self.end_y - 5),
                                     (self.end_x - 10, self.end_y + 5)])
            elif self.direction == "left":
                pygame.draw.polygon(self.screen, self.color,
                                    [(self.end_x, self.end_y), (self.end_x + 10, self.end_y - 5),
                                     (self.end_x + 10, self.end_y + 5)])
            elif self.direction == "up":
                pygame.draw.polygon(self.screen, self.color,
                                    [(self.end_x, self.end_y), (self.end_x - 5, self.end_y + 10),
                                     (self.end_x + 5, self.end_y + 10)])
            elif self.direction == "down":
                pygame.draw.polygon(self.screen, self.color,
                                    [(self.end_x, self.end_y), (self.end_x - 5, self.end_y - 10),
                                     (self.end_x + 5, self.end_y - 10)])

    def color_change(self, x):
        if x == 1:
            self.color = (234, 34, 23)
        elif x == 2:
            self.color = (255, 61, 90)

