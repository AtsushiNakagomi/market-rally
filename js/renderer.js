// Market Rally - Canvas Renderer
// Draws exactly what tkinter draws

var ASSET_PATHS = {
    "GO":  "images/go.png",
    "FIN": "images/fin.png",
    "AMB": "images/amb.png",
    "ST":  "images/st.png",
    "CV":  "images/cv.png",
    "TJ":  "images/tj.png",
    "CR":  "images/cr.png",
    "GS":  "images/gs.png",
    "AC":  "images/ac.png",
    "BL":  "images/bl.png"
};

function preloadImages() {
    var images = {};
    var types = Object.keys(ASSET_PATHS);
    var promises = [];

    for (var i = 0; i < types.length; i++) {
        (function(type) {
            promises.push(new Promise(function(resolve, reject) {
                var img = new Image();
                img.onload = function() { resolve(); };
                img.onerror = function() { reject(new Error("Failed to load: " + ASSET_PATHS[type])); };
                img.src = ASSET_PATHS[type];
                images[type] = img;
            }));
        })(types[i]);
    }

    return Promise.all(promises).then(function() {
        return images;
    });
}

class Renderer {
    constructor(canvasA, canvasB, images) {
        this.canvasA = canvasA;
        this.canvasB = canvasB;
        this.ctxA = canvasA.getContext("2d");
        this.ctxB = canvasB.getContext("2d");
        this.images = images;

        var size = BOARD_SIZE * CELL_SIZE + 1;
        canvasA.width = size;
        canvasA.height = size;
        canvasB.width = size;
        canvasB.height = size;
    }

    getCtx(canvasId) {
        return canvasId === "A" ? this.ctxA : this.ctxB;
    }

    getCanvas(canvasId) {
        return canvasId === "A" ? this.canvasA : this.canvasB;
    }

    drawGrid(ctx) {
        var w = CELL_SIZE * BOARD_SIZE;
        var h = CELL_SIZE * BOARD_SIZE;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, w + 1, h + 1);
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        for (var i = 0; i <= BOARD_SIZE; i++) {
            var x = i * CELL_SIZE;
            var y = i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    placeCard(canvasId, row, col, card, angle) {
        var ctx = this.getCtx(canvasId);
        var img = this.images[card];
        if (!img) return;

        var x = col * CELL_SIZE + Math.floor(CELL_SIZE / 2);
        var y = row * CELL_SIZE + Math.floor(CELL_SIZE / 2);

        ctx.save();
        ctx.translate(x, y);
        if (angle !== 0) {
            // PIL rotate is counter-clockwise, canvas rotate is clockwise
            // so negate the angle
            ctx.rotate(-angle * Math.PI / 180);
        }
        ctx.drawImage(img, -CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
        ctx.restore();
    }

    drawPreview(canvasId, row, col, card, angle) {
        var ctx = this.getCtx(canvasId);
        var img = this.images[card];
        if (!img) return;

        var x = col * CELL_SIZE + Math.floor(CELL_SIZE / 2);
        var y = row * CELL_SIZE + Math.floor(CELL_SIZE / 2);

        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.translate(x, y);
        if (angle !== 0) {
            ctx.rotate(-angle * Math.PI / 180);
        }
        ctx.drawImage(img, -CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
        ctx.restore();
    }

    drawAccidentCounter(canvasId, row, col, count) {
        var ctx = this.getCtx(canvasId);
        var x = col * CELL_SIZE + Math.floor(CELL_SIZE / 2);
        var y = row * CELL_SIZE + Math.floor(CELL_SIZE / 2);

        ctx.save();
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(count), x, y);
        ctx.restore();
    }

    clearCell(canvasId, row, col) {
        var ctx = this.getCtx(canvasId);
        var x = col * CELL_SIZE;
        var y = row * CELL_SIZE;
        ctx.clearRect(x, y, CELL_SIZE, CELL_SIZE);
        // Redraw white background and grid lines for this cell
        ctx.fillStyle = "white";
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
    }

    redrawBoard(canvasId, board) {
        var ctx = this.getCtx(canvasId);
        this.drawGrid(ctx);
        for (var r = 0; r < BOARD_SIZE; r++) {
            for (var c = 0; c < BOARD_SIZE; c++) {
                var cell = board[r][c];
                if (cell["card"] !== "") {
                    var visualAngle = (360 - (cell["direction"] || 0)) % 360;
                    this.placeCard(canvasId, r, c, cell["card"], visualAngle);
                    if (cell["Num_turn"] > 0) {
                        this.drawAccidentCounter(canvasId, r, c, cell["Num_turn"]);
                    }
                }
            }
        }
    }
}

window.preloadImages = preloadImages;
window.Renderer = Renderer;
