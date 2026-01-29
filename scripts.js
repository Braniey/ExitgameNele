// Warten, bis das HTML geladen ist
document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startButton");

    if (startButton) {
        startButton.addEventListener("click", startGame);
    }
});

// Startet das Spiel
function startGame() {
    window.location.href = "start.html";
}
