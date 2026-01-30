// game.js
(() => {
    // === Konfiguration ===
    // Pro Rätsel (data-index) der korrekte 3-stellige Code:
    // Passe diese Werte an deine Rätsel-Lösungen an.
    const SOLUTIONS = ["123", "456", "789", "012", "345"];

    // Strafe pro falschem Versuch (in Sekunden)
    const PENALTY_SECONDS_PER_FAIL = 120;

    // Flash-Dauer (ms) muss zur CSS-Animation passen
    const FLASH_MS = 220;

    // === DOM ===
    const timerEl = document.getElementById("timer");
    const penaltyEl = document.getElementById("penalty");
    const finishButton = document.getElementById("finishButton");
    const riddleEls = Array.from(document.querySelectorAll(".riddle"));

    // === State ===
    const startMs = Date.now();
    let penaltySeconds = 0;

    // pro Rätsel merken, ob es bereits korrekt gelöst wurde
    const solved = new Array(riddleEls.length).fill(false);

    // === Helpers ===
    const pad2 = (n) => String(n).padStart(2, "0");

    function formatHMS(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    }

    function formatMS(totalSeconds) {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${pad2(m)}:${pad2(s)}`;
    }

    function getElapsedSeconds() {
        return Math.floor((Date.now() - startMs) / 1000);
    }

    function updateTimerUI() {
        timerEl.textContent = formatHMS(getElapsedSeconds());
        penaltyEl.textContent = `Strafe: +${formatMS(penaltySeconds)}`;
    }

    function flash(type /* "success" | "fail" */) {
        const cls = type === "success" ? "flash-success" : "flash-fail";
        document.body.classList.remove("flash-success", "flash-fail");
        // Reflow, damit es bei schnellem Klicken erneut triggert
        void document.body.offsetWidth;
        document.body.classList.add(cls);
        window.setTimeout(() => document.body.classList.remove(cls), FLASH_MS);
    }

    function setRiddleSolvedUI(riddleEl, isSolved) {
        riddleEl.classList.toggle("is-solved", isSolved);
        const inputs = Array.from(riddleEl.querySelectorAll("input"));
        const btn = riddleEl.querySelector("button");

        inputs.forEach((inp) => {
            inp.disabled = isSolved;
            inp.setAttribute("aria-invalid", String(!isSolved));
        });

        if (btn) btn.disabled = isSolved;
    }

    function allSolved() {
        return solved.every(Boolean);
    }

    function updateFinishState() {
        finishButton.disabled = !allSolved();
    }

    function collectCode(riddleEl) {
        const inputs = Array.from(riddleEl.querySelectorAll("input"));
        return inputs.map((i) => i.value).join("");
    }

    function normalizeDigitInput(value) {
        // erlaubt nur 1 Ziffer, sonst leer
        const match = String(value).match(/\d/);
        return match ? match[0] : "";
    }

    function focusInput(inputs, idx) {
        const el = inputs[idx];
        if (!el) return;
        el.focus();
        el.select?.();
    }

    // === Setup Inputs: nur Ziffern + Auto-Weiter ===
    riddleEls.forEach((riddleEl) => {
        const inputs = Array.from(riddleEl.querySelectorAll("input"));
        const btn = riddleEl.querySelector("button");

        inputs.forEach((inputEl, i) => {
            inputEl.setAttribute("inputmode", "numeric");
            inputEl.setAttribute("autocomplete", "one-time-code");
            inputEl.setAttribute("aria-label", `Ziffer ${i + 1}`);

            inputEl.addEventListener("input", (e) => {
                const normalized = normalizeDigitInput(e.target.value);
                e.target.value = normalized;

                if (normalized && i < inputs.length - 1) {
                    focusInput(inputs, i + 1);
                }
            });

            inputEl.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    btn?.click();
                    return;
                }

                if (e.key === "Backspace") {
                    // Wenn Feld leer: zurück ins vorige Feld
                    if (!inputEl.value && i > 0) {
                        e.preventDefault();
                        focusInput(inputs, i - 1);
                        return;
                    }
                }

                // Optional: Pfeiltasten Navigation
                if (e.key === "ArrowLeft" && i > 0) {
                    e.preventDefault();
                    focusInput(inputs, i - 1);
                }
                if (e.key === "ArrowRight" && i < inputs.length - 1) {
                    e.preventDefault();
                    focusInput(inputs, i + 1);
                }
            });

            // Paste: mehrere Ziffern auf einmal in die drei Felder verteilen
            inputEl.addEventListener("paste", (e) => {
                const text = (e.clipboardData?.getData("text") ?? "").replace(/\D/g, "");
                if (!text) return;

                e.preventDefault();
                for (let k = 0; k < inputs.length; k++) {
                    inputs[k].value = text[k] ?? "";
                }
                const firstEmpty = inputs.findIndex((x) => !x.value);
                focusInput(inputs, firstEmpty === -1 ? inputs.length - 1 : firstEmpty);
            });
        });

        btn?.addEventListener("click", () => {
            const idx = Number(riddleEl.dataset.index);
            const expected = SOLUTIONS[idx];

            if (solved[idx]) return;

            const code = collectCode(riddleEl);

            // nur prüfen, wenn alle 3 Ziffern da sind
            const hasEmpty = inputs.some((inp) => inp.value === "");
            if (code.length !== inputs.length || hasEmpty) {
                flash("fail");
                penaltySeconds += PENALTY_SECONDS_PER_FAIL;
                updateTimerUI();
                return;
            }

            if (code === expected) {
                solved[idx] = true;
                setRiddleSolvedUI(riddleEl, true);
                flash("success");
                updateFinishState();
            } else {
                flash("fail");
                penaltySeconds += PENALTY_SECONDS_PER_FAIL;
                updateTimerUI();

                // Optional: Felder leeren und wieder ins erste fokussieren
                inputs.forEach((inp) => (inp.value = ""));
                focusInput(inputs, 0);
            }
        });
    });

    // === Timer Start ===
    updateTimerUI();
    const timerId = window.setInterval(updateTimerUI, 250);

    // === Finish ===
    finishButton.addEventListener("click", () => {
        if (!allSolved()) return;

        window.clearInterval(timerId);

        const elapsed = getElapsedSeconds();
        const end = elapsed + penaltySeconds;

        const message =
            `Geschafft!\n\n` +
            `Gebrauchte Zeit: ${formatHMS(elapsed)}\n` +
            `Strafe: +${formatMS(penaltySeconds)}\n` +
            `————————————\n` +
            `Endzeit: ${formatHMS(end)}`;

        // Einfach & zuverlässig:
        window.alert(message);
    });
})();