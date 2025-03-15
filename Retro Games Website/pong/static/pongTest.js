document.addEventListener('DOMContentLoaded', function() {
    console.log("pongTest4.js loaded");

    let startButton = document.querySelector(".start-button");
    let resetButton = document.querySelector(".reset-button");
    let gameContainer = document.querySelector(".game-container");
    let startGameText = document.getElementById('StartGameText');
    let gameStarted = false;
    let leftUpPressed = false;
    let leftDownPressed = false;
    let rightUpPressed = false;
    let rightDownPressed = false;
    let gameMode = "pvp";
    let difficulty = "medium";
    let isResetting = false;

    const difficultyTitle = document.querySelector('.difficulty-title');
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    const gameModeButtons = document.querySelectorAll(".game-mode-button");

    // Add touch control variables at the top with other variables
    let touchStartY = null;
    let touchIdentifier = null;
    let leftTouchActive = false;
    let rightTouchActive = false;

    // Update game mode button handlers
    gameModeButtons.forEach(button => {
        button.addEventListener("click", function() {
            gameMode = this.getAttribute("data-mode");
            console.log("Game mode selected:", gameMode);
            
            // Hide game mode buttons and title
            document.querySelector('.button-container').classList.add('fade-out');
            startGameText.classList.add('fade-out');
            
            setTimeout(() => {
                document.querySelector('.button-container').style.display = 'none';
                startGameText.style.display = 'none';
                
                if (gameMode === "pve") {
                    // Show difficulty section
                    const difficultySection = document.querySelector('.difficulty-section');
                    difficultySection.style.display = 'block';
                    difficultySection.classList.add('fade-in');
                    
                    // Show difficulty buttons
                    difficultyButtons.forEach(btn => {
                        btn.style.display = 'block';
                        btn.classList.add('fade-in');
                    });
                } else {
                    // Show start button for PvP
                    startButton.style.display = 'block';
                    startButton.classList.add('fade-in');
                    startButton.style.opacity = '1';
                }
            }, 500);
        });
    });

    // Update difficulty button handlers
    difficultyButtons.forEach(button => {
        button.addEventListener("click", function() {
            difficulty = this.getAttribute("data-difficulty");
            console.log("Difficulty selected:", difficulty);
            
            // Hide difficulty section
            document.querySelector('.difficulty-section').classList.add('fade-out');
            document.querySelector('.difficulty-section').classList.remove('fade-in');
            
            setTimeout(() => {
                document.querySelector('.difficulty-section').style.display = 'none';
                
                // Show start button
                startButton.style.display = 'block';
                startButton.classList.add('fade-in');
                startButton.style.opacity = '1';
            }, 500);
        });
    });

    // Add game state variables
    const MAX_BALL_SPEED = 8;
    const WINNING_SCORE = 5;
    let leftScore = 0;
    let rightScore = 0;

    // Create score display elements
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'score-display';
    scoreDisplay.style.cssText = 'position:absolute; top:10px; width:100%; text-align:center; color:white; font-size:24px;';
    document.body.appendChild(scoreDisplay);

    function updateScoreDisplay() {
        scoreDisplay.textContent = `${leftScore} - ${rightScore}`;
    }

    // Update the speed constants
    const PVP_SPEED = 4;
    const BOT_SPEEDS = {
        easy: 3,
        medium: 5,
        hard: 7  // Reduced from 10 to 7 for smoother gameplay
    };
    const SPEED_MULTIPLIERS = {
        easy: 1.05,
        medium: 1.1,
        hard: 1.15  // Reduced from 1.3 to 1.15 for more controlled speed
    };

    // Update the resetBall function
    function resetBall() {
        mySquare.x = 290;
        mySquare.y = 140;
        
        // Set initial speed based on game mode and difficulty
        let initialSpeed;
        if (gameMode === "pvp") {
            initialSpeed = PVP_SPEED;
        } else {
            initialSpeed = BOT_SPEEDS[difficulty];
        }
        
        // Ensure the speed is exactly the initial speed (no floating point errors)
        mySquare.speedX = Math.round(Math.random()) ? initialSpeed : -initialSpeed;
        mySquare.speedY = Math.round((Math.random() - 0.5) * 4);
    }

    // Start button handler
    startButton.onclick = function(e) {
        e.preventDefault();
        startButton.classList.add('fade-out');
        setTimeout(() => {
            startButton.style.display = "none";
            startGame();
        }, 500);
    };

    // Update reset button handler
    resetButton.onclick = function(e) {
        e.preventDefault();
        
        // Prevent multiple rapid clicks
        if (isResetting) {
            return;
        }
        
        isResetting = true;
        
        // Stop all game processes
        if (myGameArea.interval) {
            clearInterval(myGameArea.interval);
        }
        gameStarted = false;
        
        // Reset both audio tracks
        gameOverAudio.pause();
        gameOverAudio.currentTime = 0;
        gameWonAudio.pause();
        gameWonAudio.currentTime = 0;
        
        // Reset scores
        leftScore = 0;
        rightScore = 0;
        
        // Reset puck if it exists
        if (mySquare) {
            mySquare.speedX = 0;
            mySquare.speedY = 0;
        }
        
        // Clean up event listeners
        document.removeEventListener("keydown", keyDownHandler);
        document.removeEventListener("keyup", keyUpHandler);
        
        // Disable the reset button visually
        resetButton.style.opacity = '0.5';
        resetButton.style.pointerEvents = 'none';
        
        // Add a small delay before reloading to ensure cleanup
        setTimeout(() => {
            location.reload();
        }, 100);
    };

    function startGame() {
        console.log("Starting game with mode:", gameMode, "difficulty:", difficulty);
        
        // Reset scores
        leftScore = 0;
        rightScore = 0;
        updateScoreDisplay();
        
        // Hide all menu elements with fade out
        const menuElements = document.querySelectorAll(".menu-container *");
        menuElements.forEach(element => {
            element.classList.add('fade-out');
            setTimeout(() => element.style.display = 'none', 500);
        });

        // Initialize touch controls for mobile
        initTouchControls();

        // Show controls based on device type and game mode
        setTimeout(() => {
            const controlsContainer = document.querySelector('.controls-container');
            if (window.innerWidth >= 768) {
                // Desktop controls
                controlsContainer.style.display = 'flex';
                if (gameMode === "pve") {
                    // Only show left player controls for PvE
                    controlsContainer.innerHTML = '<div class="control-section"><p class="control-text">Player Controls: W & S</p></div>';
                } else {
                    // Show both controls for PvP
                    controlsContainer.innerHTML = `
                        <div class="control-section">
                            <p class="control-text">Left Player: W & S</p>
                        </div>
                        <div class="control-section">
                            <p class="control-text">Right Player: ↑ & ↓</p>
                        </div>`;
                }
                controlsContainer.offsetHeight; // Trigger reflow
                controlsContainer.classList.add('controls-visible');
            } else {
                // Mobile controls text
                controlsContainer.style.display = 'flex';
                if (gameMode === "pve") {
                    controlsContainer.innerHTML = '<div class="control-section"><p class="control-text">Touch and drag on left side to move paddle</p></div>';
                } else {
                    controlsContainer.innerHTML = '<div class="control-section"><p class="control-text">Touch and drag on either side to move paddles</p></div>';
                }
                controlsContainer.offsetHeight; // Trigger reflow
                controlsContainer.classList.add('controls-visible');
            }
        }, 500);

        // Start the game after animations
        setTimeout(() => {
            myGameArea.start();
            let initialSpeed = gameMode === "pvp" ? PVP_SPEED : BOT_SPEEDS[difficulty];
            mySquare = new gameComponent(20, 20, "blue", 290, 140, initialSpeed, 2);
            leftPaddle = new gameComponent(10, 60, "green", 0, 120, 0, 0);
            rightPaddle = new gameComponent(10, 60, "red", 590, 120, 0, 0);
            gameStarted = true;
        }, 500);
    }

    var puckImage = new Image();
    puckImage.src = "/static/media/puck.png";
    var mySquare, leftPaddle, rightPaddle;
    var gameOverScreen = document.querySelector(".game-over-screen");
    var gameOverAudio = document.getElementById("game-over-music");
    var gameWonAudio = document.getElementById("game-won-sound");
    gameOverAudio.volume = 0.05;
    gameWonAudio.volume = 0.05;

    var myGameArea = {
        canvas: document.createElement("canvas"),
        start: function() {
            this.canvas.width = 600;
            this.canvas.height = 300;
            this.context = this.canvas.getContext("2d");
            gameContainer.appendChild(this.canvas);
            document.addEventListener("keydown", keyDownHandler);
            document.addEventListener("keyup", keyUpHandler);
            this.interval = setInterval(updateGameArea, 20);
        },
        clear: function() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    };

    class gameComponent {
        constructor(width, height, color, x, y, speedX, speedY) {
            this.width = width;
            this.height = height;
            this.color = color;
            this.x = x;
            this.y = y;
            this.speedX = speedX;
            this.speedY = speedY;
        }

        update() {
            var ctx = myGameArea.context;
            if (this.color === "blue") {
                ctx.drawImage(puckImage, this.x, this.y, this.width, this.height);
            } else {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        }
    }

    function checkCollideWith(paddle, puck) {
        let paddleTop = paddle.y;
        let paddleBottom = paddle.y + paddle.height;
        let paddleLeft = paddle.x;
        let paddleRight = paddle.x + paddle.width;

        let puckTop = puck.y;
        let puckBottom = puck.y + puck.height;
        let puckLeft = puck.x;
        let puckRight = puck.x + puck.width;

        // Paddle collision
        if (puckRight >= paddleLeft && puckLeft <= paddleRight &&
            puckBottom >= paddleTop && puckTop <= paddleBottom) {
            
            // Get appropriate speed multiplier based on game mode
            let speedMultiplier = gameMode === "pvp" ? 1.0 : SPEED_MULTIPLIERS[difficulty];
            
            puck.speedX = -puck.speedX * speedMultiplier;
            
            // Cap ball speed based on game mode
            let maxSpeed = gameMode === "pvp" ? PVP_SPEED * 1.5 : BOT_SPEEDS[difficulty] * 1.5;
            puck.speedX = Math.min(Math.max(puck.speedX, -maxSpeed), maxSpeed);
            
            let hitPosition = (puck.y + puck.height / 2) - paddle.y;
            let hitRatio = hitPosition / paddle.height;
            puck.speedY = (hitRatio - 0.5) * 6;
        }

        // Wall collisions
        if (puckTop <= 0) {
            puck.speedY = Math.abs(puck.speedY);
        } else if (puckBottom >= myGameArea.canvas.height) {
            puck.speedY = -Math.abs(puck.speedY);
        }

        // Scoring
        if (puckRight >= myGameArea.canvas.width) {
            if (leftScore + 1 >= WINNING_SCORE) {
                leftScore = WINNING_SCORE;  // Set to exactly 5
                updateScoreDisplay();
                endGame();
            } else {
                leftScore++;
                updateScoreDisplay();
                resetBall();
            }
        } else if (puckLeft <= 0) {
            if (rightScore + 1 >= WINNING_SCORE) {
                rightScore = WINNING_SCORE;  // Set to exactly 5
                updateScoreDisplay();
                endGame();
            } else {
                rightScore++;
                updateScoreDisplay();
                resetBall();
            }
        }
    }

    // Update endGame function
    function endGame() {
        // Hide controls when game ends
        const controlsContainer = document.querySelector('.controls-container');
        controlsContainer.style.display = 'none';
        controlsContainer.classList.remove('controls-visible');
        
        gameContainer.style.display = "none";
        gameOverScreen.style.display = "block";
        
        // Update the winner text based on game mode and scores
        let winnerText;
        let isPlayerWin = false;

        if (gameMode === "pve") {
            if (leftScore >= WINNING_SCORE) {
                winnerText = "Player Wins!";
                isPlayerWin = true;
            } else {
                winnerText = "Bot Wins!";
                isPlayerWin = false;
            }
        } else {
            // PvP mode - both players get victory sound
            if (leftScore >= WINNING_SCORE) {
                winnerText = "Left Player Wins!";
                isPlayerWin = true;
            } else {
                winnerText = "Right Player Wins!";
                isPlayerWin = true;
            }
        }
        
        // Add the final score to the winner text
        winnerText += ` (${leftScore}-${rightScore})`;
        scoreDisplay.textContent = winnerText;
        
        // Stop the game loop
        clearInterval(myGameArea.interval);
        gameStarted = false;
        
        // Hide reset button initially
        resetButton.style.display = "none";
        resetButton.classList.remove('fade-in');
        
        // Make sure both audio elements are ready
        gameOverAudio.currentTime = 0;
        gameWonAudio.currentTime = 0;
        
        // Choose which audio to play based on winner
        if (gameMode === "pve" && !isPlayerWin) {
            // Bot wins - play game over sound
            console.log("Bot won - playing game over sound");  // Debug log
            gameOverAudio.volume = 0.05;  // Ensure volume is set
            gameOverAudio.loop = false;
            
            // Remove any existing listeners
            gameOverAudio.removeEventListener('ended', showResetButton);
            
            // Add new listener
            gameOverAudio.addEventListener('ended', showResetButton, { once: true });
            
            try {
                gameOverAudio.play().catch(error => {
                    console.error("Error playing game over sound:", error);
                    // Show reset button anyway if audio fails
                    setTimeout(showResetButton, 1000);
                });
            } catch (error) {
                console.error("Error playing game over sound:", error);
                setTimeout(showResetButton, 1000);
            }
        } else {
            // Player wins - play victory sound
            console.log("Player won - playing victory sound");  // Debug log
            gameWonAudio.volume = 0.05;  // Ensure volume is set
            
            // Remove any existing listeners
            gameWonAudio.removeEventListener('ended', showResetButton);
            
            // Add new listener
            gameWonAudio.addEventListener('ended', showResetButton, { once: true });
            
            try {
                gameWonAudio.play().catch(error => {
                    console.error("Error playing victory sound:", error);
                    // Show reset button anyway if audio fails
                    setTimeout(showResetButton, 1000);
                });
            } catch (error) {
                console.error("Error playing victory sound:", error);
                setTimeout(showResetButton, 1000);
            }
        }
    }

    // Separate function for showing reset button
    function showResetButton() {
        setTimeout(() => {
            resetButton.style.display = "block";
            resetButton.classList.add('fade-in');
        }, 500);
    }

    function updateGameArea() {
        if (!gameStarted) return;
        
        myGameArea.clear();
        mySquare.x += mySquare.speedX;
        mySquare.y += mySquare.speedY;
        checkCollideWith(leftPaddle, mySquare);
        checkCollideWith(rightPaddle, mySquare);

        if (leftUpPressed) {
            leftPaddle.y = Math.max(leftPaddle.y - 7, 0);
        } else if (leftDownPressed) {
            leftPaddle.y = Math.min(leftPaddle.y + 7, 300 - leftPaddle.height);
        }

        if (gameMode === "pvp") {
            if (rightUpPressed) {
                rightPaddle.y = Math.max(rightPaddle.y - 7, 0);
            } else if (rightDownPressed) {
                rightPaddle.y = Math.min(rightPaddle.y + 7, 300 - rightPaddle.height);
            }
        } else if (gameMode === "pve") {
            let paddleSpeed = difficulty === "hard" ? 8 : 7;
            socket.emit('move_paddle', {
                paddle_y: rightPaddle.y,
                puck_y: mySquare.y,
                difficulty: difficulty,
                paddleSpeed: paddleSpeed
            });
        }

        mySquare.update();
        leftPaddle.update();
        rightPaddle.update();
    }

    const socket = io();
    
    socket.on('paddle_moved', function(data) {
        if (rightPaddle && data.new_paddle_y !== undefined) {
            rightPaddle.y = data.new_paddle_y;
        }
    });

    function keyDownHandler(e) {
        if (e.key === "w" || e.key === "W") leftUpPressed = true;
        if (e.key === "s" || e.key === "S") leftDownPressed = true;
        if (gameMode === "pvp") {
            if (e.key === "ArrowUp") rightUpPressed = true;
            if (e.key === "ArrowDown") rightDownPressed = true;
        }
    }

    function keyUpHandler(e) {
        if (e.key === "w" || e.key === "W") leftUpPressed = false;
        if (e.key === "s" || e.key === "S") leftDownPressed = false;
        if (gameMode === "pvp") {
            if (e.key === "ArrowUp") rightUpPressed = false;
            if (e.key === "ArrowDown") rightDownPressed = false;
        }
    }

    // Update animation classes
    const fadeInClass = {
        keyframes: [
            { opacity: 0, transform: 'translateY(-20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ],
        options: {
            duration: 500,
            fill: 'forwards'
        }
    };

    const fadeOutClass = {
        keyframes: [
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(20px)' }
        ],
        options: {
            duration: 500,
            fill: 'forwards'
        }
    };

    // Add touch event handlers
    function initTouchControls() {
        document.addEventListener('touchstart', handleTouchStart, false);
        document.addEventListener('touchmove', handleTouchMove, false);
        document.addEventListener('touchend', handleTouchEnd, false);
    }

    function handleTouchStart(e) {
        const touch = e.changedTouches[0];
        const touchX = touch.clientX;
        const screenMiddle = window.innerWidth / 2;

        // Determine which side of the screen was touched
        if (touchX < screenMiddle) {
            leftTouchActive = true;
            touchStartY = touch.clientY;
            touchIdentifier = touch.identifier;
        } else {
            if (gameMode === "pvp") {
                rightTouchActive = true;
                touchStartY = touch.clientY;
                touchIdentifier = touch.identifier;
            }
        }
    }

    function handleTouchMove(e) {
        e.preventDefault(); // Prevent scrolling while playing
        
        // Find the relevant touch
        let touch = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchIdentifier) {
                touch = e.changedTouches[i];
                break;
            }
        }
        
        if (!touch) return;

        const currentY = touch.clientY;
        const deltaY = currentY - touchStartY;

        if (leftTouchActive) {
            if (deltaY < -10) {
                leftUpPressed = true;
                leftDownPressed = false;
            } else if (deltaY > 10) {
                leftUpPressed = false;
                leftDownPressed = true;
            } else {
                leftUpPressed = false;
                leftDownPressed = false;
            }
        } else if (rightTouchActive && gameMode === "pvp") {
            if (deltaY < -10) {
                rightUpPressed = true;
                rightDownPressed = false;
            } else if (deltaY > 10) {
                rightUpPressed = false;
                rightDownPressed = true;
            } else {
                rightUpPressed = false;
                rightDownPressed = false;
            }
        }

        touchStartY = currentY;
    }

    function handleTouchEnd(e) {
        // Find the relevant touch
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchIdentifier) {
                leftTouchActive = false;
                rightTouchActive = false;
                leftUpPressed = false;
                leftDownPressed = false;
                rightUpPressed = false;
                rightDownPressed = false;
                touchIdentifier = null;
                break;
            }
        }
    }
});
