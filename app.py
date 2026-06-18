from flask import Flask, render_template, request, url_for
import math
import os

app = Flask(__name__)


@app.context_processor
def static_version():
    def versioned_static(filename):
        path = os.path.join(app.static_folder, filename)
        v = int(os.path.getmtime(path)) if os.path.exists(path) else 0
        return url_for("static", filename=filename, v=v)

    return dict(versioned_static=versioned_static)

allowed = {
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "log": math.log10,
    "pi": math.pi,
    "pow": pow
}


@app.route("/", methods=["GET", "POST"])
def home():

    expression = ""

    if request.method == "POST":

        expression = request.form.get("expression", "")
        button = request.form.get("button")


        if button == "C":
            expression = ""

        elif button == "⌫":
            expression = expression[:-1]


        elif button == "=":

            try:
                expression = str(
                    eval(
                        expression,
                        {"__builtins__": None},
                        allowed
                    )
                )

            except:
                expression = "Malformed Expression"

        else:
            expression += button


    return render_template(
        "index.html",
        expression=expression
    )


if __name__ == "__main__":
    app.run(debug=True)
    

# User presses button
#           |
#           v
# button value received
#           |
#           v
# expression += button
#           |
#           v
# Display shows expression
#           |
#           |
#        Press "="
#           |
#           v
# eval(expression)
#           |
#           |
#   Uses allowed functions
#           |
#           v
# Result generated
#           |
#           v
# str(result)
#           |
#           v
# Display output