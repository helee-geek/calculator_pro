// ==============================
// Elements
// ==============================

const hiddenInput = document.getElementById("expression-input");
const display = document.getElementById("display");
const equalButton = document.getElementById("equal-btn");


// ==============================
// Update Calculator Display
// ==============================

function updateDisplay() {
    display.value = hiddenInput.value;
}


// ==============================
// Button Press Animation
// ==============================

function animateButton(key) {

    const button = document.querySelector(
        `[data-key="${key}"]`
    );

    if (!button) return;

    button.classList.add("active");


    setTimeout(() => {
        button.classList.remove("active");
    }, 150);
}


// ==============================
// Add Value
// ==============================

function addValue(value) {
    hiddenInput.value += value;
    updateDisplay();
}


// ==============================
// Keyboard Controls
// ==============================

document.addEventListener("keydown", function (e) {

    let key = e.key;


    // ==========================
    // Numbers
    // ==========================

    if (/^[0-9]$/.test(key)) {

        addValue(key);
        animateButton(key);

    }


    // ==========================
    // Operators
    // ==========================

    else if ([
        "+",
        "-",
        "*",
        "/",
        ".",
        "(",
        ")"
    ].includes(key)) {

        addValue(key);
        animateButton(key);

    }


    // ==========================
    // Scientific Shortcuts
    // ==========================

    else if (key.toLowerCase() === "s") {

        addValue("sin(");
        animateButton("s");

    }

    else if (key.toLowerCase() === "c") {

        addValue("cos(");
        animateButton("c");

    }

    else if (key.toLowerCase() === "t") {

        addValue("tan(");
        animateButton("t");

    }

    else if (key.toLowerCase() === "l") {

        addValue("log(");
        animateButton("l");

    }

    else if (key.toLowerCase() === "r") {

        addValue("sqrt(");
        animateButton("r");

    }

    else if (key.toLowerCase() === "p") {

        addValue("pi");
        animateButton("p");

    }


    // ==========================
    // Backspace
    // ==========================

    else if (key === "Backspace") {

        e.preventDefault();

        hiddenInput.value =
            hiddenInput.value.slice(0, -1);

        updateDisplay();

        animateButton("Backspace");

    }


    // ==========================
    // Clear All
    // ==========================

    else if (key === "Delete") {

        e.preventDefault();

        hiddenInput.value = "";

        updateDisplay();

        animateButton("Delete");

    }


    // ==========================
    // Calculate
    // ==========================

    else if (key === "Enter") {

        e.preventDefault();

        animateButton("Enter");


        // Small delay so animation can play
        setTimeout(() => {

            equalButton.click();

        }, 120);

        return;

    }


    // ==========================
    // Ignore Other Keys
    // ==========================

    else {

        return;

    }

});


// ==============================
// Mouse Button Animation
// ==============================

document.querySelectorAll("button").forEach(button => {


    button.addEventListener("mousedown", function () {

        this.classList.add("active");

    });


    button.addEventListener("mouseup", function () {


        setTimeout(() => {

            this.classList.remove("active");

        }, 100);

    });


    button.addEventListener("mouseleave", function () {

        this.classList.remove("active");

    });


});


// ==============================
// Initialize Display
// ==============================

updateDisplay();