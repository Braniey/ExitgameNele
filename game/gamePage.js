document.addEventListener("DOMContentLoaded", () => {

    const solutions = ["123", "456", "789", "111", "222"];
    const penaltySecondsPerFail = 120;

    let startTime = Date.now();
    let penaltySeconds = 0;
    let solved = [false, false, false, false, false];

    // TIMER
    setInterval(updateTimer, 1000);

    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById("timer").textContent = formatTime(elapsed);
        document.getElementById("penalty").textContent =
            "Strafe: +" + formatTime(penaltySeconds);
    }

    function formatTime(sec) {
        const h = String(Math.floor(sec / 3600)).padStart(2, "0");
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
        const s = String(sec % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    }

    // RÄTSEL + AUTOFOKUS
    document.querySelectorAll(".riddle").forEach((riddle, index) => {
        const inputs = riddle.querySelectorAll("input");
        const button = riddle.querySelector("button");

        inputs.forEach((input, i) => {
            input.addEventListener("input", () => {
                input.value = input.value.replace(/[^0-9]/g, "");

                if (input.value && i < inputs.length - 1) {
                    inputs[i + 1].focus();
                }
                if (input.value && i === inputs.length - 1) {
                    button.focus();
                }
            });

            input.addEventListener("keydown", e => {
                if (e.key === "Backspace" && !input.value && i > 0) {
                    inputs[i - 1].focus();
                }
            });
        });

        button.addEventListener("click", () => {
            const code = [...inputs].map(i => i.value).join("");

            if (code === solutions[index]) {
                solved[index] = true;
                flashScreen("green");
                button.disabled = true;
                inputs.forEach(i => i.disabled = true);
                checkFinish();
            } else {
                penaltySeconds += penaltySecondsPerFail;
                flashScreen("red");
            }
        });
    });

    // FINISH
    function checkFinish() {
        if (solved.every(v => v)) {
            document.getElementById("finishButton").disabled = false;
        }
    }

    document.getElementById("finishButton").addEventListener("click", () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const total = elapsed + penaltySeconds;

        alert(
            "🎉 Geschafft!\n\n" +
            "Zeit: " + formatTime(elapsed) + "\n" +
            "Strafe: +" + formatTime(penaltySeconds) + "\n\n" +
            "Endzeit: " + formatTime(total)
        );
    });

    // SCREEN FLASH (FIXED)
    function flashScreen(color) {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = "9999";
        overlay.style.background =
            color === "green"
                ? "rgba(0,255,0,0.5)"
                : "rgba(255,0,0,0.5)";

        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 250);
    }

});
