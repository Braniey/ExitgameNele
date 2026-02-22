// game.js
(() => {
    // === Konfiguration ===
    const SOLUTIONS = ["123", "456", "789", "012", "345", "678"];
    const PENALTY_SECONDS_PER_FAIL = 120;
    const FLASH_MS = 220;

    // === DOM ===
    const timerEl = document.getElementById("timer");
    const penaltyEl = document.getElementById("penalty");
    const hintButton = document.getElementById("hintButton");
    const finishButton = document.getElementById("finishButton");
    const riddleEls = Array.from(document.querySelectorAll(".riddle"));

    // === Modal DOM ===
    const finishModalEl = document.getElementById("finishModal");
    const finishCloseBtn = document.getElementById("finishCloseBtn");

    // NEU: Wertefelder wie in der Skizze
    const finishTimeEl = document.getElementById("finishTime");
    const finishPenaltyValueEl = document.getElementById("finishPenalty");
    const finishTotalEl = document.getElementById("finishTotal");

    // === State ===
    const startMs = Date.now();
    let penaltySeconds = 0;
    const solved = new Array(riddleEls.length).fill(false);

    // === Helpers ===
    const pad2 = (n) => String(n).padStart(2, "0");

    function formatHMS(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    }

    function getElapsedSeconds() {
        return Math.floor((Date.now() - startMs) / 1000);
    }

    function updateTimerUI() {
        timerEl.textContent = formatHMS(getElapsedSeconds());
        // Skizze zeigt hh:mm:ss → Strafe ebenfalls in hh:mm:ss
        penaltyEl.textContent = `Strafe: +${formatHMS(penaltySeconds)}`;
    }

    function flash(type /* "success" | "fail" */) {
        const cls = type === "success" ? "flash-success" : "flash-fail";
        document.body.classList.remove("flash-success", "flash-fail");
        void document.body.offsetWidth;
        document.body.classList.add(cls);
        window.setTimeout(() => document.body.classList.remove(cls), FLASH_MS);
    }

    // === Modal Helpers ===
    function openFinishModal({ time, penalty, total }) {
        if (!finishModalEl) return;

        if (finishTimeEl) finishTimeEl.textContent = time;
        if (finishPenaltyValueEl) finishPenaltyValueEl.textContent = penalty;
        if (finishTotalEl) finishTotalEl.textContent = total;

        finishModalEl.hidden = false;
        finishModalEl.setAttribute("aria-hidden", "false");
        finishCloseBtn?.focus();
    }

    function closeFinishModal() {
        if (!finishModalEl) return;
        finishModalEl.hidden = true;
        finishModalEl.setAttribute("aria-hidden", "true");
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
                    if (!inputEl.value && i > 0) {
                        e.preventDefault();
                        focusInput(inputs, i - 1);
                        return;
                    }
                }

                if (e.key === "ArrowLeft" && i > 0) {
                    e.preventDefault();
                    focusInput(inputs, i - 1);
                }
                if (e.key === "ArrowRight" && i < inputs.length - 1) {
                    e.preventDefault();
                    focusInput(inputs, i + 1);
                }
            });

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

                inputs.forEach((inp) => (inp.value = ""));
                focusInput(inputs, 0);
            }
        });
    });

    // === Timer Start ===
    updateTimerUI();
    const timerId = window.setInterval(updateTimerUI, 250);

    // NEU: Tipp geholt => Strafzeit wie bei falschem Code
    hintButton?.addEventListener("click", () => {
        flash("fail");
        penaltySeconds += PENALTY_SECONDS_PER_FAIL;
        updateTimerUI();
    });

    // === Modal Close Events ===
    finishCloseBtn?.addEventListener("click", closeFinishModal);
    finishModalEl?.addEventListener("click", (e) => {
        if (e.target === finishModalEl) closeFinishModal();
    });
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && finishModalEl && !finishModalEl.hidden) {
            closeFinishModal();
        }
    });

    // === Finish ===
    finishButton.addEventListener("click", () => {
        if (!allSolved()) return;

        window.clearInterval(timerId);

        const elapsed = getElapsedSeconds();
        const end = elapsed + penaltySeconds;

        openFinishModal({
            time: formatHMS(elapsed),
            penalty: formatHMS(penaltySeconds),
            total: formatHMS(end),
        });
    });
})();