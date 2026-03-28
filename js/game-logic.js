// Market Rally - Game Logic
// Ported from Market_Rally_game.py and MarketRallyGUI.py

var CELL_SIZE = 20;
var BOARD_SIZE = 13;

var ROAD_CONNECTIONS = {
    "ST":  [90, 270],
    "CV":  [180, 270],
    "TJ":  [0, 90, 270],
    "CR":  [0, 90, 180, 270],
    "FIN": [270],
    "GO":  [90],
    "GS":  [90, 270],
    "AC":  [90, 270],
    "BL":  [270]
};

function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

function rotatedDirections(baseDirs, angle) {
    var result = [];
    for (var i = 0; i < baseDirs.length; i++) {
        result.push((baseDirs[i] + angle) % 360);
    }
    return result;
}

function neighbourCell(row, col, direction) {
    if (direction === 0) return [row - 1, col];
    if (direction === 90) return [row, col + 1];
    if (direction === 180) return [row + 1, col];
    if (direction === 270) return [row, col - 1];
    return [row, col];
}

class GameState {
    constructor() {
        // board_A and board_B
        this.board_A = [];
        for (var i = 0; i < 13; i++) {
            var row = [];
            for (var j = 0; j < 13; j++) {
                row.push({"card": "", "direction": "", "Num_turn": 0});
            }
            this.board_A.push(row);
        }

        this.board_B = [];
        for (var i = 0; i < 13; i++) {
            var row = [];
            for (var j = 0; j < 13; j++) {
                row.push({"card": "", "direction": "", "Num_turn": 0});
            }
            this.board_B.push(row);
        }

        // card definitions (same as Python)
        var card = [];
        card.push({"card": "GO", "num": 2});
        card.push({"card": "FIN", "num": 2});
        card.push({"card": "AMB", "num": 6});
        card.push({"card": "ST", "num": 20});
        card.push({"card": "CV", "num": 20});
        card.push({"card": "TJ", "num": 20});
        card.push({"card": "CR", "num": 20});
        card.push({"card": "GS", "num": 10});
        card.push({"card": "AC", "num": 10});
        card.push({"card": "BL", "num": 10});

        // deck = card[3:9]
        this.deck = [];
        for (var ci = 3; ci < 9; ci++) {
            for (var n = 0; n < card[ci]["num"]; n++) {
                this.deck.push(card[ci]["card"]);
            }
        }

        shuffleArray(this.deck);

        // player hands
        var handA = ["FIN"];
        for (var k = 0; k < 3; k++) handA.push("AMB");
        for (var k = 0; k < 5; k++) handA.push(this.deck.pop());

        var handB = ["FIN"];
        for (var k = 0; k < 3; k++) handB.push("AMB");
        for (var k = 0; k < 5; k++) handB.push(this.deck.pop());

        this.player_A = {"card": handA};
        this.player_B = {"card": handB};

        console.log(this.player_A);
        console.log(this.player_B);

        // Place GO at (0,0) on both boards
        this.board_A[0][0]["card"] = "GO";
        this.board_A[0][0]["direction"] = 0;
        this.board_B[0][0]["card"] = "GO";
        this.board_B[0][0]["direction"] = 0;

        this.current_player = "A";
    }

    canPlaceCard(board, row, col, card, angle) {
        if (["ST", "CV", "TJ", "CR", "GO", "FIN", "GS", "AC", "BL"].indexOf(card) === -1) {
            return true;
        }

        if (card === "AMB") {
            if (board[row][col]["card"] !== "ST") return false;
            if (board[row][col]["Num_turn"] <= 0) return false;
            return true;
        }

        if (card === "AC") {
            if (board[row][col]["card"] !== "ST") return false;
            return true;
        }

        if (card === "BL") {
            var base_dirs = ROAD_CONNECTIONS["BL"] || [];
            var bl_dir = (base_dirs[0] + angle) % 360;

            var nc = neighbourCell(row, col, bl_dir);
            var nr = nc[0], ncc = nc[1];

            if (!(nr >= 0 && nr < BOARD_SIZE && ncc >= 0 && ncc < BOARD_SIZE)) {
                return false;
            }

            var neighbour = board[nr][ncc];

            if (neighbour["card"] === "CV") return false;
            if (neighbour["card"] === "ST") return false;
            if (neighbour["card"] === "AC") return false;

            var n_dirs = rotatedDirections(
                ROAD_CONNECTIONS[neighbour["card"]] || [],
                neighbour["direction"] || 0
            );
            var neighbour_side = (bl_dir + 180) % 360;
            if (n_dirs.indexOf(neighbour_side) === -1) return false;

            var existing_blocked = 0;
            for (var di = 0; di < n_dirs.length; di++) {
                var d = n_dirs[di];
                var ac2 = neighbourCell(nr, ncc, d);
                var ar = ac2[0], acol = ac2[1];
                if (ar >= 0 && ar < BOARD_SIZE && acol >= 0 && acol < BOARD_SIZE) {
                    var cell = board[ar][acol];
                    if (cell["card"] === "BL") {
                        var bl_dirs_at_cell = rotatedDirections(
                            ROAD_CONNECTIONS["BL"] || [],
                            cell["direction"] || 0
                        );
                        if (bl_dirs_at_cell.indexOf((d + 180) % 360) !== -1) {
                            existing_blocked++;
                        }
                    }
                }
            }
            var blocked_after = existing_blocked + 1;
            if (blocked_after >= n_dirs.length) return false;

            var ac3 = neighbourCell(nr, ncc, neighbour_side);
            var ar2 = ac3[0], ac2col = ac3[1];
            if (ar2 >= 0 && ar2 < BOARD_SIZE && ac2col >= 0 && ac2col < BOARD_SIZE) {
                var cell2 = board[ar2][ac2col];
                if (cell2["card"] === "BL") {
                    var bl_dirs2 = rotatedDirections(
                        ROAD_CONNECTIONS["BL"] || [],
                        cell2["direction"] || 0
                    );
                    if (bl_dirs2.indexOf((neighbour_side + 180) % 360) !== -1) {
                        return false;
                    }
                }
            }

            return true;
        }

        // Normal road cards
        var base_dirs = ROAD_CONNECTIONS[card] || [];
        var dirs = rotatedDirections(base_dirs, angle);

        for (var di = 0; di < dirs.length; di++) {
            var d = dirs[di];
            if (row === 0 && d === 0) return false;
            if (row === 12 && d === 180) return false;
            if (col === 0 && d === 270) return false;
            if (col === 12 && d === 90) return false;
        }

        var connected = false;
        for (var di = 0; di < dirs.length; di++) {
            var d = dirs[di];
            var nc = neighbourCell(row, col, d);
            var nr = nc[0], ncc = nc[1];
            if (nr >= 0 && nr < BOARD_SIZE && ncc >= 0 && ncc < BOARD_SIZE) {
                var neighbour = board[nr][ncc];
                if (neighbour["card"] !== "" && (neighbour["Num_turn"] || 0) === 0) {
                    var n_dirs = rotatedDirections(
                        ROAD_CONNECTIONS[neighbour["card"]] || [],
                        neighbour["direction"] || 0
                    );
                    if (n_dirs.indexOf((d + 180) % 360) !== -1) {
                        connected = true;
                    }
                }
            }
        }
        if (!connected) return false;

        console.log("Trying to place " + card + "@(" + row + "," + col + ") angle=" + angle);
        console.log(" → dirs=" + JSON.stringify(dirs));
        for (var di = 0; di < dirs.length; di++) {
            var d = dirs[di];
            var nc = neighbourCell(row, col, d);
            var nr = nc[0], ncc = nc[1];
            if (nr >= 0 && nr < BOARD_SIZE && ncc >= 0 && ncc < BOARD_SIZE) {
                var neighbour = board[nr][ncc];
                console.log("    Neighbour " + neighbour["card"] + "@(" + nr + "," + ncc + ") dirs=" + JSON.stringify(rotatedDirections(ROAD_CONNECTIONS[neighbour["card"]] || [], neighbour["direction"] || 0)));
            }
        }
        return true;
    }

    checkVictory(board, return_score) {
        var start = null;
        for (var r = 0; r < BOARD_SIZE; r++) {
            for (var c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c]["card"] === "GO") {
                    start = [r, c];
                    break;
                }
            }
            if (start) break;
        }

        if (!start) {
            if (return_score) return [false, 0, 0];
            return false;
        }

        var best_len = 0;
        var best_gs = 0;
        var victory = false;
        var self = this;

        function dfs(r, c, length, gs_count, visited) {
            var cell = board[r][c];
            var current_gs = gs_count;
            if (cell["card"] === "GS") current_gs++;

            if (length > best_len) {
                best_len = length;
                best_gs = current_gs;
            } else if (length === best_len) {
                best_gs = Math.max(best_gs, current_gs);
            }

            if (cell["card"] === "FIN") {
                if (length >= 10 && current_gs >= 1) {
                    victory = true;
                }
            }

            var dirs = rotatedDirections(
                ROAD_CONNECTIONS[cell["card"]] || [],
                cell["direction"] || 0
            );

            for (var di = 0; di < dirs.length; di++) {
                var d = dirs[di];
                var nc = neighbourCell(r, c, d);
                var nr = nc[0], ncc = nc[1];

                if (!(nr >= 0 && nr < BOARD_SIZE && ncc >= 0 && ncc < BOARD_SIZE)) continue;

                var key = nr + "," + ncc;
                if (visited[key]) continue;

                var neighbour = board[nr][ncc];
                if (neighbour["card"] === "") continue;
                if (neighbour["card"] === "ST" && (neighbour["Num_turn"] || 0) > 0) continue;

                var n_dirs = rotatedDirections(
                    ROAD_CONNECTIONS[neighbour["card"]] || [],
                    neighbour["direction"] || 0
                );

                if (n_dirs.indexOf((d + 180) % 360) !== -1) {
                    var newVisited = {};
                    for (var k in visited) newVisited[k] = true;
                    newVisited[key] = true;
                    dfs(nr, ncc, length + 1, current_gs, newVisited);
                }
            }
        }

        var startVisited = {};
        startVisited[start[0] + "," + start[1]] = true;
        dfs(start[0], start[1], 1, 0, startVisited);

        if (return_score) return [victory, best_len, best_gs];
        return victory;
    }

    isCompletelyClosed(board) {
        var road_cards = ["ST", "CV", "TJ", "CR", "GS"];

        for (var r = 0; r < BOARD_SIZE; r++) {
            for (var c = 0; c < BOARD_SIZE; c++) {
                var cell = board[r][c];
                if (cell["card"] === "") continue;
                if (!(cell["card"] in ROAD_CONNECTIONS)) continue;

                var dirs = rotatedDirections(
                    ROAD_CONNECTIONS[cell["card"]] || [],
                    cell["direction"] || 0
                );

                for (var di = 0; di < dirs.length; di++) {
                    var d = dirs[di];
                    var nc = neighbourCell(r, c, d);
                    var nr = nc[0], ncc = nc[1];
                    if (!(nr >= 0 && nr < BOARD_SIZE && ncc >= 0 && ncc < BOARD_SIZE)) continue;
                    if (board[nr][ncc]["card"] === "") {
                        for (var ci = 0; ci < road_cards.length; ci++) {
                            for (var ai = 0; ai < 4; ai++) {
                                var tryAngle = ai * 90;
                                if (this.canPlaceCard(board, nr, ncc, road_cards[ci], tryAngle)) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    checkLoopLoss() {
        var a_closed = this.isCompletelyClosed(this.board_A);
        var b_closed = this.isCompletelyClosed(this.board_B);

        if (a_closed && b_closed) return "both";
        if (a_closed) return "A";
        if (b_closed) return "B";
        return null;
    }

    judgeFinal() {
        var a_result = this.checkVictory(this.board_A, true);
        var b_result = this.checkVictory(this.board_B, true);

        var a_len = a_result[1], a_gs = a_result[2];
        var b_len = b_result[1], b_gs = b_result[2];

        if (a_len > b_len) {
            return "Player A Wins!(longest road)";
        } else if (b_len > a_len) {
            return "Player B Wins!(longest road)";
        } else if (a_gs > b_gs) {
            return "Player A Wins!(Number of Gas Stations)";
        } else if (b_gs > a_gs) {
            return "Player B Wins!(Number of Gas Stations)";
        } else {
            return "Draw!";
        }
    }
}

window.CELL_SIZE = CELL_SIZE;
window.BOARD_SIZE = BOARD_SIZE;
window.ROAD_CONNECTIONS = ROAD_CONNECTIONS;
window.GameState = GameState;
window.rotatedDirections = rotatedDirections;
window.neighbourCell = neighbourCell;
