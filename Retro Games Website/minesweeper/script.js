class Minesweeper {
    constructor() {
        this.grid = document.getElementById('grid');
        this.mineCount = document.getElementById('mine-count');
        this.timer = document.getElementById('timer');
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        this.cells = [];
        this.mines = new Set();
        this.gameOver = false;
        this.timeInterval = null;
        this.seconds = 0;

        this.initializeGame('easy');
        this.addEventListeners();
    }

    initializeGame(difficulty) {
        this.gameOver = false;
        this.seconds = 0;
        this.timer.textContent = '0';
        clearInterval(this.timeInterval);
        
        const config = this.difficulties[difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;
        this.mineCount.textContent = this.totalMines;
        
        this.createGrid();
        this.placeMines();
        this.startTimer();
    }

    createGrid() {
        this.grid.innerHTML = '';
        this.grid.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size))`;
        this.cells = [];
        this.mines.clear();

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                this.grid.appendChild(cell);
                this.cells.push(cell);
            }
        }
    }

    placeMines() {
        let minesToPlace = this.totalMines;
        while (minesToPlace > 0) {
            const randomCell = Math.floor(Math.random() * (this.rows * this.cols));
            const row = Math.floor(randomCell / this.cols);
            const col = randomCell % this.cols;
            const key = `${row},${col}`;
            
            if (!this.mines.has(key)) {
                this.mines.add(key);
                minesToPlace--;
            }
        }
    }

    countAdjacentMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols) {
                    if (this.mines.has(`${newRow},${newCol}`)) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    revealCell(cell) {
        if (cell.classList.contains('revealed') || this.gameOver) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        cell.classList.add('revealed');

        if (this.mines.has(`${row},${col}`)) {
            cell.classList.add('mine');
            cell.textContent = '💣';
            this.gameOver = true;
            this.revealAllMines();
            clearInterval(this.timeInterval);
            this.showGameOver();
            return;
        }

        const adjacentMines = this.countAdjacentMines(row, col);
        if (adjacentMines > 0) {
            cell.textContent = adjacentMines;
            cell.style.color = this.getNumberColor(adjacentMines);
        } else {
            this.revealAdjacentCells(row, col);
        }
    }

    revealAdjacentCells(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols) {
                    const cell = this.cells[newRow * this.cols + newCol];
                    if (!cell.classList.contains('revealed')) {
                        this.revealCell(cell);
                    }
                }
            }
        }
    }

    revealAllMines() {
        this.mines.forEach(key => {
            const [row, col] = key.split(',').map(Number);
            const cell = this.cells[row * this.cols + col];
            cell.classList.add('revealed', 'mine');
            cell.textContent = '💣';
        });
    }

    getNumberColor(number) {
        const colors = ['#0000FF', '#008000', '#FF0000', '#000080', 
                       '#800000', '#008080', '#000000', '#808080'];
        return colors[number - 1] || '#000000';
    }

    startTimer() {
        this.timeInterval = setInterval(() => {
            this.seconds++;
            this.timer.textContent = this.seconds;
        }, 1000);
    }

    addEventListeners() {
        this.grid.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.revealCell(e.target);
            }
        });

        this.grid.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell') && !e.target.classList.contains('revealed')) {
                e.target.classList.remove('flag-animation');
                void e.target.offsetWidth; // Trigger reflow
                e.target.classList.add('flag-animation');
                e.target.textContent = e.target.textContent === '🚩' ? '' : '🚩';
            }
        });

        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.initializeGame('easy');
        });

        document.querySelector('.difficulty').addEventListener('click', (e) => {
            if (e.target.dataset.difficulty) {
                this.initializeGame(e.target.dataset.difficulty);
            }
        });

        document.getElementById('restartButton').addEventListener('click', () => {
            document.getElementById('gameOverOverlay').style.display = 'none';
            this.initializeGame('easy');
        });
    }

    showGameOver() {
        const overlay = document.getElementById('gameOverOverlay');
        const finalTime = document.getElementById('finalTime');
        
        finalTime.textContent = this.seconds;
        overlay.style.display = 'flex';
        
        // Add explosion effect to all mines
        this.mines.forEach(key => {
            const [row, col] = key.split(',').map(Number);
            const cell = this.cells[row * this.cols + col];
            setTimeout(() => {
                cell.classList.add('mine');
            }, Math.random() * 500); // Random delay for each mine
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});