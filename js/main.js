// Market Rally - Main Entry Point

window.addEventListener("DOMContentLoaded", function() {
    preloadImages().then(function(images) {
        var gameState = new GameState();

        var canvasA = document.getElementById("board-a");
        var canvasB = document.getElementById("board-b");
        var renderer = new Renderer(canvasA, canvasB, images);

        var ui = new UIController(gameState, renderer);
        ui.startGame();
    }).catch(function(err) {
        console.error("Failed to initialize Market Rally:", err);
    });
});
