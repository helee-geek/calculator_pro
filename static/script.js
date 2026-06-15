// ==============================
// Elements
// ==============================

const hiddenInput = document.getElementById("expression-input");
const display = document.getElementById("display");
const form = document.getElementById("calculator-form");
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
// Core Logic — used by BOTH mouse and keyboard
// ==============================

function pressButton(value) {

    if (value === "C") {
        hiddenInput.value = "";
        updateDisplay();
    }
    else if (value === "⌫") {
        hiddenInput.value = hiddenInput.value.slice(0, -1);
        updateDisplay();
    }
    else if (value === "=") {
        // Make sure Flask receives button="=" even though
        // form.submit() doesn't include button name/value pairs
        let btnField = document.getElementById("button-field");

        if (!btnField) {
            btnField = document.createElement("input");
            btnField.type = "hidden";
            btnField.name = "button";
            btnField.id = "button-field";
            form.appendChild(btnField);
        }

        btnField.value = "=";

        form.submit();
    }
    else {
        hiddenInput.value += value;
        updateDisplay();
    }
}


// ==============================
// Mouse Clicks (buttons are now type="button")
// ==============================

document.querySelectorAll(".buttons button").forEach(button => {

    button.addEventListener("click", function () {
        const value = this.getAttribute("value");
        pressButton(value);
    });

});


// ==============================
// Keyboard Controls
// ==============================

document.addEventListener("keydown", function (e) {

    let key = e.key;


    // Numbers
    if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        pressButton(key);
        animateButton(key);
    }

    // Operators
    else if ([
        "+", "-", "*", "/", ".", "(", ")"
    ].includes(key)) {
        e.preventDefault();
        pressButton(key);
        animateButton(key);
    }

    // Scientific Shortcuts
    else if (key.toLowerCase() === "s") {
        e.preventDefault();
        pressButton("sin(");
        animateButton("s");
    }
    else if (key.toLowerCase() === "c") {
        e.preventDefault();
        pressButton("cos(");
        animateButton("c");
    }
    else if (key.toLowerCase() === "t") {
        e.preventDefault();
        pressButton("tan(");
        animateButton("t");
    }
    else if (key.toLowerCase() === "l") {
        e.preventDefault();
        pressButton("log(");
        animateButton("l");
    }
    else if (key.toLowerCase() === "r") {
        e.preventDefault();
        pressButton("sqrt(");
        animateButton("r");
    }
    else if (key.toLowerCase() === "p") {
        e.preventDefault();
        pressButton("pi");
        animateButton("p");
    }

    // Backspace
    else if (key === "Backspace") {
        e.preventDefault();
        pressButton("⌫");
        animateButton("Backspace");
    }

    // Clear All
    else if (key === "Delete") {
        e.preventDefault();
        pressButton("C");
        animateButton("Delete");
    }

    // Calculate
    else if (key === "Enter") {
        e.preventDefault();
        animateButton("Enter");

        setTimeout(() => {
            pressButton("=");
        }, 120);
    }

    else {
        return;
    }

});


// ==============================
// Initialize Display
// ==============================

updateDisplay();