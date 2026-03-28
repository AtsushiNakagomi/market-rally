// Market Rally - UI Controller
// Matches the original tkinter UI behavior

class UIController {
    constructor(gameState, renderer) {
        this.gameState = gameState;
        this.renderer = renderer;

        this.selected_card = null; // [card, player] or null
        this.preview_image = {"A": null, "B": null};
        this.preview_angle = {"A": 0, "B": 0};
        this.preview_info = null;

        // DOM references
        this.canvasA = document.getElementById("board-a");
        this.canvasB = document.getElementById("board-b");
        this.info_label = document.getElementById("info-label");
        this.frame_hand_A = document.getElementById("hand-a");
        this.frame_hand_B = document.getElementById("hand-b");
        this.preview_buttons_container = document.getElementById("preview-buttons");
    }

    startGame() {
        // Draw grids
        this.renderer.drawGrid(this.renderer.ctxA);
        this.renderer.drawGrid(this.renderer.ctxB);

        // Place GO cards
        this.renderer.placeCard("A", 0, 0, "GO", 0);
        this.renderer.placeCard("B", 0, 0, "GO", 0);

        // Show hands
        this.show_hand(this.frame_hand_A, this.gameState.player_A["card"], "A");
        this.show_hand(this.frame_hand_B, this.gameState.player_B["card"], "B");

        // Update info
        this.updateInfo();

        // Bind board clicks
        this.canvasA.addEventListener("click", this.board_clicked.bind(this));
        this.canvasB.addEventListener("click", this.board_clicked.bind(this));
    }

    updateInfo() {
        this.info_label.textContent = "ターン: Player " + this.gameState.current_player + " | 山札残り: " + this.gameState.deck.length;
    }

    show_hand(frame, cards, player) {
        // Remove existing buttons
        var buttons = frame.querySelectorAll("button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].remove();
        }

        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var btn = document.createElement("button");
            btn.className = "hand-card-btn";

            var img = document.createElement("img");
            img.src = "images/" + card.toLowerCase() + ".png";
            img.alt = card;
            img.style.width = "40px";
            img.style.height = "40px";
            btn.appendChild(img);

            btn.style.width = "60px";
            btn.style.height = "90px";

            (function(c, p, self) {
                btn.addEventListener("click", function() {
                    self.select_card(c, p);
                });
            })(card, player, this);

            frame.appendChild(btn);
        }
    }

    select_card(card, player) {
        if (player !== this.gameState.current_player) {
            console.log("相手のターンです。");
            return;
        }

        if (this.selected_card && this.selected_card[0] === card && this.selected_card[1] === player) {
            this.selected_card = null;
            console.log("Player " + player + ": 選択解除");
        } else {
            this.selected_card = [card, player];
            console.log("Player " + player + " selected " + card);
        }
    }

    board_clicked(event) {
        // Clear any existing preview
        for (var i = 0; i < 2; i++) {
            var cid = (i === 0) ? "A" : "B";
            if (this.preview_image[cid] !== null) {
                var brd = (cid === "A") ? this.gameState.board_A : this.gameState.board_B;
                this.renderer.redrawBoard(cid, brd);
                this.preview_image[cid] = null;
            }
        }

        // Clear preview buttons
        this.preview_buttons_container.innerHTML = "";

        var canvas = event.target;
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var ex = (event.clientX - rect.left) * scaleX;
        var ey = (event.clientY - rect.top) * scaleY;

        var col = Math.floor(ex / CELL_SIZE);
        var row = Math.floor(ey / CELL_SIZE);
        console.log("Clicked cell: (" + row + ", " + col + ")");

        if (!this.selected_card) return;

        var card = this.selected_card[0];
        var player = this.selected_card[1];

        var canvas_id = (canvas === this.canvasA) ? "A" : "B";
        var board = (canvas_id === "A") ? this.gameState.board_A : this.gameState.board_B;
        var target_player = canvas_id;

        console.log("[board_clicked] click on canvas " + canvas_id + " by selected (" + card + "," + player + ") -> target_player=" + target_player);

        // if card not in ["BL", "AC"] and target_player != player:
        if (["BL", "AC"].indexOf(card) === -1 && target_player !== player) {
            console.log("!!このカードは相手の盤面にはおけません");
            return;
        }

        var allowed_overlap = ["AC", "AMB"];
        if (board[row][col]["card"] !== "" && allowed_overlap.indexOf(card) === -1) {
            console.log("!!すでにカードを置いています");
            return;
        }

        this.preview_angle[canvas_id] = 0;

        // Draw preview
        this.renderer.drawPreview(canvas_id, row, col, card, this.preview_angle[canvas_id]);
        this.preview_image[canvas_id] = true;

        // Create rotate and confirm buttons
        var self = this;
        var rotate_btn = document.createElement("button");
        rotate_btn.textContent = "↻回転";
        rotate_btn.addEventListener("click", function() {
            self.rotate_preview(canvas_id, card, row, col);
        });

        var confirm_btn = document.createElement("button");
        confirm_btn.textContent = "✔OK";
        confirm_btn.addEventListener("click", function() {
            self.confirm_card_placement(canvas_id, card, row, col, target_player);
        });

        this.preview_buttons_container.innerHTML = "";
        this.preview_buttons_container.appendChild(rotate_btn);
        this.preview_buttons_container.appendChild(confirm_btn);
    }

    rotate_preview(canvas_id, card, row, col) {
        // Clear old preview by redrawing board
        var board = (canvas_id === "A") ? this.gameState.board_A : this.gameState.board_B;
        this.renderer.redrawBoard(canvas_id, board);

        this.preview_angle[canvas_id] = (this.preview_angle[canvas_id] + 90) % 360;

        this.renderer.drawPreview(canvas_id, row, col, card, this.preview_angle[canvas_id]);
        this.preview_image[canvas_id] = true;
    }

    confirm_card_placement(canvas_id, card, row, col, player) {
        // Faithfully follows the original Python confirm_card_placement

        var board = (player === "A") ? this.gameState.board_A : this.gameState.board_B;

        var angle_to_use_visual = this.preview_angle[canvas_id];
        var game_logic_angle = (360 - angle_to_use_visual) % 360;

        console.log("[confirm] placing " + card + " at (" + row + "," + col + ") on board " + canvas_id + " (requested player=" + player + "visual_angle=" + angle_to_use_visual + ", logic_ange=" + game_logic_angle + ")");

        if (!this.gameState.canPlaceCard(board, row, col, card, game_logic_angle)) {
            console.log(" !! Can Not Place Card Here");
            return;
        }

        // Clear preview
        if (this.preview_image[canvas_id]) {
            this.preview_image[canvas_id] = null;
        }
        this.preview_buttons_container.innerHTML = "";

        // Decrement accident counters on current player's board
        // (original reassigns canvas_id here to current player's board)
        var target_board, target_canvas_id;
        if (this.gameState.current_player === "A") {
            target_board = this.gameState.board_A;
            target_canvas_id = "A";
        } else {
            target_board = this.gameState.board_B;
            target_canvas_id = "B";
        }
        // Note: in original Python, canvas_id gets reassigned here
        // We use target_canvas_id for the accident loop, and keep canvas_id for card placement

        for (var r = 0; r < BOARD_SIZE; r++) {
            for (var c = 0; c < BOARD_SIZE; c++) {
                var cell = target_board[r][c];
                if (cell["card"] === "ST" && cell["Num_turn"] > 0) {
                    cell["Num_turn"]--;
                    if (cell["Num_turn"] === 0) {
                        this.renderer.clearCell(target_canvas_id, r, c);
                        // Original bug preserved: passes game_logic_angle (cell["direction"]) as visual angle
                        this.renderer.placeCard(target_canvas_id, r, c, "ST", cell["direction"]);
                    }
                }
            }
        }

        // Place the card visually
        var display_card = (card === "AC") ? "AC" : card;
        this.renderer.placeCard(canvas_id, row, col, display_card, angle_to_use_visual);

        if (card === "AC") {
            this.renderer.drawAccidentCounter(canvas_id, row, col, 3);
        }

        if (card === "AMB") {
            board[row][col]["Num_turn"] = 0;
            this.renderer.clearCell(canvas_id, row, col);
            // Original bug preserved: passes game_logic_angle (board direction) as visual angle
            this.renderer.placeCard(canvas_id, row, col, "ST", board[row][col]["direction"]);
        }

        console.log("Placed " + card + " at (" + row + ", " + col + ") visual_angle=" + angle_to_use_visual + ", logic_angle=" + game_logic_angle);

        // Remove card from hand
        var hand = (this.gameState.current_player === "A") ? this.gameState.player_A["card"] : this.gameState.player_B["card"];
        var idx = hand.indexOf(card);
        if (idx !== -1) {
            hand.splice(idx, 1);
        }

        // Draw new card
        if (this.gameState.deck.length > 0) {
            var new_card = this.gameState.deck.pop();
            hand.push(new_card);
            console.log("Player " + player + ": drew " + new_card);
        }

        // Update hand display
        if (this.gameState.current_player === "A") {
            this.show_hand(this.frame_hand_A, hand, "A");
        } else {
            this.show_hand(this.frame_hand_B, hand, "B");
        }

        // Update board state
        board = (player === "A") ? this.gameState.board_A : this.gameState.board_B;
        if (card === "AC") {
            board[row][col]["Num_turn"] = 3;
        } else {
            board[row][col]["card"] = card;
            board[row][col]["direction"] = game_logic_angle;
            board[row][col]["Num_turn"] = 0;
        }

        // Check loop loss
        var loopResult = this.gameState.checkLoopLoss();
        if (loopResult === "both") {
            alert("Both players are blocked. Draw!");
            return;
        } else if (loopResult === "A") {
            alert("Player A loses! (no more possible roads)");
            return;
        } else if (loopResult === "B") {
            alert("Player B loses! (no more possible roads)");
            return;
        }

        // Check deck empty -> final judgement
        if (this.gameState.deck.length === 0) {
            var result = this.gameState.judgeFinal();
            alert(result);
        }

        // Check victory
        if (this.gameState.checkVictory(board)) {
            console.log("player " + player + " wins!");
            alert("Player " + player + " wins!");
        }

        // Switch player
        this.selected_card = null;
        this.gameState.current_player = (this.gameState.current_player === "A") ? "B" : "A";

        this.updateInfo();

        // Redraw boards to show updated accident counters
        this.renderer.redrawBoard("A", this.gameState.board_A);
        this.renderer.redrawBoard("B", this.gameState.board_B);
    }
}

window.UIController = UIController;
