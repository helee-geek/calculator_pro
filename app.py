from flask import Flask, render_template, request

app = Flask(__name__)

# Used to show the operator as a symbol in the result line (e.g. "12 + 8 = 20")
OP_LABELS = {"+": "+", "-": "\u2212", "*": "\u00d7", "/": "\u00f7"}


@app.route("/", methods=["GET", "POST"])
def home():
    result = None
    num1 = num2 = None
    operator = "+"  # default selected operator on first page load

    if request.method == "POST":
        num1 = request.form["num1"]
        num2 = request.form["num2"]
        operator = request.form["operator"]

        try:
            n1 = float(num1)
            n2 = float(num2)

            if operator == "+":
                result = n1 + n2
            elif operator == "-":
                result = n1 - n2
            elif operator == "*":
                result = n1 * n2
            elif operator == "/":
                if n2 == 0:
                    result = "Cannot divide by zero"
                else:
                    result = n1 / n2

            # Show whole numbers without a trailing ".0"
            if isinstance(result, float) and result == int(result):
                result = int(result)

        except ValueError:
            result = "Please enter valid numbers"

    return render_template(
        "index.html",
        result=result,
        num1=num1,
        num2=num2,
        operator=operator,
        op_label=OP_LABELS.get(operator, operator),
    )


if __name__ == "__main__":
    app.run(debug=True)