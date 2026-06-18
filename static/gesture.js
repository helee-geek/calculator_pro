// ==============================
// Hand Gesture Input
// ==============================

const gestureToggleBtn = document.getElementById("gesture-toggle-btn");
const gesturePanel = document.getElementById("gesture-panel");
const gestureCloseBtn = document.getElementById("gesture-close-btn");
const gestureReadoutEl = document.getElementById("gesture-readout");
const gestureHoldStatusEl = document.getElementById("gesture-hold-status");
const gestureHoldProgressEl = document.getElementById("gesture-hold-progress");
const gestureExpressionEl = document.getElementById("gesture-expression");
const gestureLastInsertEl = document.getElementById("gesture-last-insert");
const gestureVideo = document.getElementById("gesture-video");
const gestureCanvas = document.getElementById("gesture-canvas");
const gestureCtx = gestureCanvas.getContext("2d");

const modeNumbersBtn = document.getElementById("mode-numbers-btn");
const modeActionsBtn = document.getElementById("mode-actions-btn");

const HOLD_MS = 1500;
const COOLDOWN_MS = 1200;

let camera = null;
let handsModel = null;
let cameraStarting = false;

let currentMode = "numbers";
let latestCount = 0;
let latestAction = null;

let stableKey = null;
let stableSince = 0;
let lastInsertedAt = 0;


const ACTION_LABELS = {
    C: "Clear",
    "=": "Enter (=)",
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷",
    "sin(": "sin",
    "cos(": "cos",
    "tan(": "tan"
};


function syncGestureExpression() {
    const value = document.getElementById("expression-input").value;
    gestureExpressionEl.textContent = value || "—";
    gestureExpressionEl.scrollLeft = gestureExpressionEl.scrollWidth;
}

function showInsertFeedback(label) {
    gestureLastInsertEl.textContent = `Inserted: ${label}`;
    gestureLastInsertEl.classList.remove("flash");
    void gestureLastInsertEl.offsetWidth;
    gestureLastInsertEl.classList.add("flash");
    syncGestureExpression();
}

function setReadout(text) {
    gestureReadoutEl.textContent = text;
}

function resetHold() {
    stableKey = null;
    stableSince = 0;
    gestureHoldProgressEl.style.width = "0%";
    gestureHoldProgressEl.classList.remove("ready");
    gestureHoldStatusEl.textContent = "";
}

function getGestureKey(handsVisible) {

    if (currentMode === "numbers") {
        if (!handsVisible) return null;
        return `n:${latestCount}`;
    }

    if (latestAction) {
        return `a:${latestAction}`;
    }

    return null;
}

function performAutoInsert(key) {

    if (key.startsWith("n:")) {
        const label = key.slice(2);
        pressButton(label);
        showInsertFeedback(label);
        return;
    }

    if (key.startsWith("a:")) {
        const action = key.slice(2);
        const label = ACTION_LABELS[action] || action;
        pressButton(action);
        showInsertFeedback(label);
    }
}

function updateHoldToConfirm(key) {

    const now = Date.now();

    if (!key) {
        resetHold();
        return;
    }

    if (now - lastInsertedAt < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - (now - lastInsertedAt)) / 1000);
        gestureHoldStatusEl.textContent = `Wait ${wait}s…`;
        gestureHoldProgressEl.style.width = "0%";
        return;
    }

    if (key !== stableKey) {
        stableKey = key;
        stableSince = now;
    }

    const elapsed = now - stableSince;
    const progress = Math.min(elapsed / HOLD_MS, 1);

    gestureHoldProgressEl.style.width = `${progress * 100}%`;

    if (progress >= 1) {
        gestureHoldProgressEl.classList.add("ready");
        gestureHoldStatusEl.textContent = "Inserted!";
        performAutoInsert(key);
        lastInsertedAt = now;
        resetHold();
        return;
    }

    gestureHoldProgressEl.classList.remove("ready");
    const secondsLeft = Math.ceil((HOLD_MS - elapsed) / 1000);
    gestureHoldStatusEl.textContent = `Hold steady… ${secondsLeft}s`;
}


function countFingersForHand(landmarks) {

    let count = 0;

    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];

    for (let i = 0; i < tips.length; i++) {
        if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
            count++;
        }
    }

    if (isThumbExtended(landmarks)) {
        count++;
    }

    return count;
}


function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function isThumbExtended(landmarks) {

    const palmWidth = dist(landmarks[5], landmarks[17]);
    const thumbSpread = dist(landmarks[4], landmarks[17]);

    return thumbSpread > palmWidth * 1.2;
}

function fingerUpFlags(landmarks) {

    const wrist = landmarks[0];

    const fingers = [
        [8, 6],
        [12, 10],
        [16, 14],
        [20, 18]
    ];

    return fingers.map(([tip, pip]) =>
        dist(landmarks[tip], wrist) > dist(landmarks[pip], wrist) * 1.05
    );
}

function thumbActionState(landmarks) {

    const tip = landmarks[4];
    const ip = landmarks[3];
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];

    const extended = dist(tip, wrist) > dist(ip, wrist) * 1.12;
    const pointingUp = tip.y < indexMcp.y - 0.04;
    const pointingDown = tip.y > wrist.y + 0.03;

    return { extended, pointingUp, pointingDown };
}


function detectActionGesture(landmarks) {

    const [indexUp, middleUp, ringUp, pinkyUp] = fingerUpFlags(landmarks);
    const upCount = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;
    const thumb = thumbActionState(landmarks);
    const thumbOut = isThumbExtended(landmarks);

    if (indexUp && middleUp && !ringUp && !pinkyUp && !thumb.extended) {
        return { action: "tan(", display: "✌️ tan" };
    }

    if (indexUp && middleUp && ringUp && !pinkyUp && !thumb.extended) {
        return { action: "*", display: "🤟 ×" };
    }

    if (indexUp && thumb.extended && !middleUp && !ringUp && !pinkyUp) {
        return { action: "/", display: "👉 ÷" };
    }

    if (pinkyUp && thumbOut && !indexUp && !middleUp && !ringUp) {
        return { action: "-", display: "🤙 −" };
    }

    if (indexUp && !middleUp && !ringUp && !pinkyUp && !thumb.extended) {
        return { action: "+", display: "☝️ +" };
    }

    if (upCount >= 4 && thumb.extended) {
        return { action: "=", display: "🖐 Enter" };
    }

    if (upCount === 0 && !thumb.extended) {
        return { action: "C", display: "✊ Clear" };
    }

    if (upCount === 0 && thumb.extended && thumb.pointingUp) {
        return { action: "sin(", display: "👍 sin" };
    }

    if (upCount === 0 && thumb.extended && thumb.pointingDown) {
        return { action: "cos(", display: "👎 cos" };
    }

    return { action: null, display: "Show a gesture…" };
}


function onHandsResults(results) {

    gestureCtx.save();
    gestureCtx.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);

    const hands = results.multiHandLandmarks || [];

    for (const landmarks of hands) {
        drawConnectors(gestureCtx, landmarks, HAND_CONNECTIONS, {
            color: "#2686FF",
            lineWidth: 3
        });

        drawLandmarks(gestureCtx, landmarks, {
            color: "#005EFF",
            lineWidth: 1,
            radius: 4
        });
    }

    gestureCtx.restore();

    if (currentMode === "numbers") {

        let total = 0;
        for (const landmarks of hands) {
            total += countFingersForHand(landmarks);
        }

        latestCount = Math.min(total, 10);
        setReadout(latestCount);

    } else if (hands.length > 0) {

        const result = detectActionGesture(hands[0]);
        latestAction = result.action;
        setReadout(result.display);

    } else {

        latestAction = null;
        setReadout("Show a gesture…");
    }

    updateHoldToConfirm(getGestureKey(hands.length > 0));
}


async function startGestureCamera() {

    if (camera || cameraStarting) return;

    cameraStarting = true;
    setReadout("Loading camera…");
    resetHold();

    try {
        handsModel = new Hands({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        handsModel.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });

        handsModel.onResults(onHandsResults);

        if (typeof handsModel.initialize === "function") {
            await handsModel.initialize();
        }

        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        camera = new Camera(gestureVideo, {
            onFrame: async () => {
                if (!handsModel) return;
                try {
                    await handsModel.send({ image: gestureVideo });
                } catch (err) {
                    // Skip bad frames during startup.
                }
            },
            width: 320,
            height: 240
        });

        await camera.start();

        await new Promise((resolve) => {
            if (gestureVideo.readyState >= 2) {
                resolve();
                return;
            }

            gestureVideo.addEventListener("loadeddata", resolve, { once: true });
            setTimeout(resolve, 2000);
        });

        setReadout(currentMode === "numbers" ? "0" : "Show a gesture…");

    } catch (err) {
        setReadout("Camera unavailable");
        stopGestureCamera();
    } finally {
        cameraStarting = false;
    }
}


function stopGestureCamera() {

    if (camera) {
        camera.stop();
        camera = null;
    }

    if (gestureVideo.srcObject) {
        gestureVideo.srcObject.getTracks().forEach(track => track.stop());
        gestureVideo.srcObject = null;
    }

    if (handsModel) {
        handsModel.close();
        handsModel = null;
    }

    cameraStarting = false;
    resetHold();

    gestureCtx.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);
    latestCount = 0;
    latestAction = null;
}


function setMode(mode) {

    currentMode = mode;

    modeNumbersBtn.classList.toggle("active", mode === "numbers");
    modeActionsBtn.classList.toggle("active", mode === "actions");

    latestCount = 0;
    latestAction = null;
    resetHold();

    if (!cameraStarting) {
        setReadout(mode === "numbers" ? "0" : "Show a gesture…");
    }
}

modeNumbersBtn.addEventListener("click", () => setMode("numbers"));
modeActionsBtn.addEventListener("click", () => setMode("actions"));


gestureToggleBtn.addEventListener("click", function () {
    gesturePanel.classList.add("open");
    setMode("numbers");
    gestureLastInsertEl.textContent = "";
    syncGestureExpression();
    startGestureCamera();
});

gestureCloseBtn.addEventListener("click", function () {
    gesturePanel.classList.remove("open");
    stopGestureCamera();
});

gesturePanel.addEventListener("click", function (e) {
    if (e.target === gesturePanel) {
        gesturePanel.classList.remove("open");
        stopGestureCamera();
    }
});


document.addEventListener("calculator-updated", syncGestureExpression);

window.addEventListener("load", () => {
    if (typeof Hands === "undefined") return;

    const preload = new Hands({
        locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    preload.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
    });

    preload.initialize().then(() => preload.close()).catch(() => {});
});
