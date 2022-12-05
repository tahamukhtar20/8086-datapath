import app as application2
import sys

sys.path.insert(0, "..\\Task-2")  # Comment these lines before running the code
import App as application  # Comment these lines before running the code

if __name__ == '__main__':
    application2.run()
    if application2.flag == 1:
        application.run()
    # application.run()  # Comment these lines before running the code
