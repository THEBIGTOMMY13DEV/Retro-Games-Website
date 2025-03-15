class Tetris {
    constructor(playerNum, gameManager) {
        this.player = playerNum;
        this.gameManager = gameManager;
        this.canvas = document.getElementById(`gameCanvasP${playerNum}`);
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById(`nextCanvasP${playerNum}`);
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById(`holdCanvasP${playerNum}`);
        this.holdCtx = this.holdCanvas.getContext('2d');

        this.blockSize = 30;
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.colors = [
            null, '#FF0D72', '#0DC2FF', '#0DFF72',
            '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'
        ];
        this.pieces = [
            [[1,1,1,1]],           // I
            [[0,2,0],[2,2,2]],     // T
            [[0,3,3],[3,3,0]],     // S
            [[4,4,0],[0,4,4]],     // Z
            [[5,0,0],[5,5,5]],     // L
            [[0,0,6],[6,6,6]],     // J
            [[7,7],[7,7]]          // O
        ];

        this.gameState = {
            score: 0,
            level: 1,
            lines: 0,
            gameOver: true,
            dropCounter: 0,
            dropInterval: 1000,
            pos: {x: 3, y: 0},
            canHold: true
        };

        this.piece = null;
        this.nextPiece = null;
        this.holdPiece = null;

        // Load sound effects with corrected paths
        this.sounds = {
            move: new Audio('./js/sounds/move.mp3'),
            land: new Audio('./js/sounds/land.mp3'),
            fall: new Audio('./js/sounds/fall.mp3'),
            rotate: new Audio('./js/sounds/rotate.mp3'),
            gameover: new Audio('./js/sounds/gameover.mp3'),
            levelup: new Audio('./js/sounds/levelup.mp3'),
            lineclear: new Audio('./js/sounds/lineclear.mp3')
        };
        // Add error handling and load confirmation
        Object.keys(this.sounds).forEach(key => {
            this.sounds[key].onerror = () => console.error(`Failed to load sound: ${key}.mp3`);
            this.sounds[key].onloadeddata = () => console.log(`Loaded sound: ${key}.mp3`);
        });

        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    init() {
        this.clearCanvases();
        document.removeEventListener('keydown', this.handleKeyPress);
        document.addEventListener('keydown', this.handleKeyPress);
        this.spawnPiece();
        this.gameState.gameOver = false;
        this.updateScoreDisplay();
        this.draw();
    }

    reset() {
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.gameState = {
            score: 0,
            level: 1,
            lines: 0,
            gameOver: true,
            dropCounter: 0,
            dropInterval: 1000,
            pos: {x: 3, y: 0},
            canHold: true
        };
        this.piece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.clearCanvases();
        this.updateScoreDisplay();
    }

    clearCanvases() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextCtx.fillStyle = '#111';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        this.holdCtx.fillStyle = '#111';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
    }

    createPiece() {
        return JSON.parse(JSON.stringify(this.pieces[Math.floor(Math.random() * this.pieces.length)]));
    }

    spawnPiece() {
        if (!this.nextPiece) this.nextPiece = this.createPiece();
        this.piece = this.nextPiece;
        this.nextPiece = this.createPiece();
        this.gameState.pos = {x: 3, y: 0};
        this.gameState.canHold = true;

        if (this.checkCollision(0, 0, this.piece)) {
            this.gameState.gameOver = true;
            this.showGameOver();
            return;
        }
        this.drawNextPiece();
        this.draw();
    }

    checkCollision(xOffset, yOffset, piece) {
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) {
                    const newX = this.gameState.pos.x + x + xOffset;
                    const newY = this.gameState.pos.y + y + yOffset;
                    if (newX < 0 || newX >= 10 || newY >= 20 || 
                        (newY >= 0 && this.grid[newY] && this.grid[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    merge() {
        this.piece.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.grid[y + this.gameState.pos.y][x + this.gameState.pos.x] = value;
                }
            });
        });
        this.sounds.land.play(); // Play landing sound
        this.clearLines();
    }

    clearLines() {
        let linesCleared = 0;
        this.grid = this.grid.filter(row => {
            if (row.every(cell => cell > 0)) {
                linesCleared++;
                return false;
            }
            return true;
        });
        
        while (this.grid.length < 20) {
            this.grid.unshift(Array(10).fill(0));
        }

        if (linesCleared) {
            this.sounds.lineclear.play().catch(err => console.error('Lineclear sound error:', err));
            const previousLevel = this.gameState.level;
            this.gameState.lines += linesCleared;
            const points = [0, 40, 100, 300, 1200][linesCleared] * this.gameState.level;
            this.gameState.score += points;
            this.gameState.level = Math.floor(this.gameState.lines / 10) + 1;
            this.gameState.dropInterval = Math.max(100, 1000 - (this.gameState.level * 50));
            if (this.gameState.level > previousLevel) {
                this.sounds.levelup.play().catch(err => console.error('Levelup sound error:', err));
            }
            this.updateScoreDisplay();
        }
    }

    rotate() {
        const rotated = [];
        for (let x = 0; x < this.piece[0].length; x++) {
            const newRow = [];
            for (let y = this.piece.length - 1; y >= 0; y--) {
                newRow.push(this.piece[y][x]);
            }
            rotated.push(newRow);
        }
        
        const kicks = this.piece.length === 4 ? 
            [[0,0], [-1,0], [1,0], [-1,1], [1,1]] :
            [[0,0], [-1,0], [1,0], [0,1], [0,-1]];

        const original = this.piece;
        for (const [kx, ky] of kicks) {
            this.piece = rotated;
            this.gameState.pos.x += kx;
            this.gameState.pos.y += ky;
            if (!this.checkCollision(0, 0, this.piece)) {
                console.log('Playing rotate sound');
                this.sounds.rotate.play().catch(err => console.error('Rotate sound error:', err));
                this.draw();
                return;
            }
            this.gameState.pos.x -= kx;
            this.gameState.pos.y -= ky;
        }
        this.piece = original;
    }

    hold() {
        if (!this.gameState.canHold) return;
        if (!this.holdPiece) {
            this.holdPiece = this.piece;
            this.spawnPiece();
        } else {
            [this.piece, this.holdPiece] = [this.holdPiece, this.piece];
            this.gameState.pos = {x: 3, y: 0};
        }
        this.gameState.canHold = false;
        this.drawHoldPiece();
        this.draw();
    }

    drop() {
        this.gameState.pos.y++;
        if (this.checkCollision(0, 0, this.piece)) {
            this.gameState.pos.y--;
            this.merge();
            this.spawnPiece();
        } else {
            console.log('Playing fall sound');
            this.sounds.fall.play().catch(err => console.error('Fall sound error:', err));
            this.draw();
        }
    }

    hardDrop() {
        while (!this.checkCollision(0, 0, this.piece)) {
            this.gameState.pos.y++;
        }
        this.gameState.pos.y--;
        this.merge();
        this.spawnPiece();
        this.draw();
    }

    update(delta) {
        if (this.gameState.gameOver) return;
        this.gameState.dropCounter += delta;
        if (this.gameState.dropCounter >= this.gameState.dropInterval) {
            this.drop();
            this.gameState.dropCounter = 0;
        }
    }

    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.drawBlock(x, y, this.colors[value], this.ctx);
                }
            });
        });

        if (this.piece) {
            this.piece.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.drawBlock(
                            x + this.gameState.pos.x,
                            y + this.gameState.pos.y,
                            this.colors[value],
                            this.ctx
                        );
                    }
                });
            });
        }

        this.drawGridLines();
    }

    drawBlock(x, y, color, context) {
        context.fillStyle = color;
        context.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize - 1, this.blockSize - 1);
        context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        context.strokeRect(x * this.blockSize, y * this.blockSize, this.blockSize - 1, this.blockSize - 1);
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = '#111';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        if (this.nextPiece) {
            this.nextPiece.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.drawBlock(x + 1, y + 1, this.colors[value], this.nextCtx);
                    }
                });
            });
        }
    }

    drawHoldPiece() {
        this.holdCtx.fillStyle = '#111';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        if (this.holdPiece) {
            this.holdPiece.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.drawBlock(x + 1, y + 1, this.colors[value], this.holdCtx);
                    }
                });
            });
        }
    }

    drawGridLines() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.blockSize, 0);
            this.ctx.lineTo(i * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= 20; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.blockSize);
            this.ctx.lineTo(this.canvas.width, i * this.blockSize);
            this.ctx.stroke();
        }
    }

    updateScoreDisplay() {
        document.getElementById(`scoreP${this.player}`).textContent = this.gameState.score;
        document.getElementById(`levelP${this.player}`).textContent = this.gameState.level;
        document.getElementById(`linesP${this.player}`).textContent = this.gameState.lines;
    }

    showGameOver() {
        const modal = document.getElementById('gameOverModal');
        const message = document.getElementById('gameOverMessage');
        message.textContent = `Player ${this.player} Lost! Score: ${this.gameState.score}`;
        modal.style.display = 'block';
        console.log('Playing gameover sound');
        this.sounds.gameover.play().catch(err => console.error('Gameover sound error:', err));
        this.gameManager.handleGameOver();
    }

    handleKeyPress(event) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
        }

        if (this.gameState.gameOver) return;
        
        const controls = this.player === 1 ? {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            rotate: 'ArrowUp',
            down: 'ArrowDown',
            hardDrop: ' ',
            hold: 'c'
        } : {
            left: 'a',
            right: 'd',
            rotate: 'w',
            down: 's',
            hardDrop: 'Shift',
            hold: 'x'
        };

        const key = event.key;
        if (key === controls.left) {
            if (!this.checkCollision(-1, 0, this.piece)) {
                this.gameState.pos.x--;
                console.log('Playing move sound');
                this.sounds.move.play().catch(err => console.error('Move sound error:', err));
                this.draw();
            }
        } else if (key === controls.right) {
            if (!this.checkCollision(1, 0, this.piece)) {
                this.gameState.pos.x++;
                console.log('Playing move sound');
                this.sounds.move.play().catch(err => console.error('Move sound error:', err));
                this.draw();
            }
        } else if (key === controls.rotate) {
            this.rotate();
        } else if (key === controls.down) {
            this.drop();
        } else if (key === controls.hardDrop) {
            this.hardDrop();
        } else if (key.toLowerCase() === controls.hold) {
            this.hold();
        }
    }
}

class GameManager {
    constructor() {
        this.player1 = null;
        this.player2 = null;
        this.titleMusic = document.getElementById('titleMusic');
        this.initControls();
        if (this.titleMusic) {
            this.titleMusic.play().catch(err => console.error('Title music play error:', err));
        } else {
            console.error('titleMusic element not found');
        }
    }

    initControls() {
        const startBtn = document.getElementById('startBtn');
        startBtn.addEventListener('click', () => {
            // Animate start button hide
            startBtn.classList.add('hide');
            setTimeout(() => {
                startBtn.style.display = 'none';
                this.showPlayerSelection();
            }, 500); // Match CSS animation duration
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            window.location.reload();
        });
    }

    showPlayerSelection() {
        // Create player selection modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'playerSelectModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Select Players</h2>
                <button id="onePlayerBtn">1 Player</button>
                <button id="twoPlayersBtn">2 Players</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';

        document.getElementById('onePlayerBtn').addEventListener('click', () => {
            modal.remove();
            this.startGame(1);
            if (this.titleMusic) {
                this.titleMusic.pause();
                this.titleMusic.currentTime = 0;
            }
        });

        document.getElementById('twoPlayersBtn').addEventListener('click', () => {
            modal.remove();
            this.startGame(2);
            if (this.titleMusic) {
                this.titleMusic.pause();
                this.titleMusic.currentTime = 0;
            }
        });
    }

    startGame(playerCount) {
        if (playerCount === 1) {
            // Hide Player 2 elements
            document.querySelector('.player-container:nth-child(2)').style.display = 'none';
            document.querySelector('.right-panel').style.display = 'none';
            document.querySelector('.controls-info p:nth-child(2)').style.display = 'none'; // Hide P2 controls
            this.player1 = new Tetris(1, this);
            this.player1.init();
        } else {
            this.player1 = new Tetris(1, this);
            this.player2 = new Tetris(2, this);
            this.player1.init();
            this.player2.init();
        }
        this.gameLoop(playerCount);
    }

    handleGameOver() {
        if (this.player1) this.player1.reset();
        if (this.player2) this.player2.reset();
    }

    gameLoop(playerCount) {
        let lastTime = performance.now();
        const frame = (currentTime) => {
            const delta = currentTime - lastTime;
            if (delta >= 33.33) { // 30fps
                lastTime = currentTime;
                if (!this.player1.gameState.gameOver) this.player1.update(delta);
                if (playerCount === 2 && this.player2 && !this.player2.gameState.gameOver) {
                    this.player2.update(delta);
                }
                this.player1.draw();
                if (playerCount === 2 && this.player2) this.player2.draw();
            }
            if (!this.player1.gameState.gameOver || (playerCount === 2 && this.player2 && !this.player2.gameState.gameOver)) {
                requestAnimationFrame(frame);
            }
        };
        requestAnimationFrame(frame);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GameManager();
});