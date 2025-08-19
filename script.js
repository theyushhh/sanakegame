class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [
            {x: 10, y: 10}
        ];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        
        this.init();
    }
    
    init() {
        this.highScoreElement.textContent = this.highScore;
        this.generateFood();
        this.bindEvents();
        this.gameLoop();
    }
    
    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && (e.key === ' ' || e.key === 'Enter')) {
                this.startGame();
                return;
            }
            
            if (!this.gameRunning) return;
            
            const key = e.key.toLowerCase();
            
            // Prevent reverse direction
            if ((key === 'arrowleft' || key === 'a') && this.dx !== 1) {
                this.dx = -1; this.dy = 0;
            } else if ((key === 'arrowup' || key === 'w') && this.dy !== 1) {
                this.dx = 0; this.dy = -1;
            } else if ((key === 'arrowright' || key === 'd') && this.dx !== -1) {
                this.dx = 1; this.dy = 0;
            } else if ((key === 'arrowdown' || key === 's') && this.dy !== -1) {
                this.dx = 0; this.dy = 1;
            }
        });
        
        // Mobile controls
        document.getElementById('upBtn').addEventListener('click', () => {
            if (this.gameRunning && this.dy !== 1) {
                this.dx = 0; this.dy = -1;
            }
        });
        
        document.getElementById('downBtn').addEventListener('click', () => {
            if (this.gameRunning && this.dy !== -1) {
                this.dx = 0; this.dy = 1;
            }
        });
        
        document.getElementById('leftBtn').addEventListener('click', () => {
            if (this.gameRunning && this.dx !== 1) {
                this.dx = -1; this.dy = 0;
            }
        });
        
        document.getElementById('rightBtn').addEventListener('click', () => {
            if (this.gameRunning && this.dx !== -1) {
                this.dx = 1; this.dy = 0;
            }
        });
        
        // Restart button
        this.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
        
        // Touch events for mobile
        let touchStartX, touchStartY;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) {
                this.startGame();
                return;
            }
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches.clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0 && this.dx !== -1) {
                    this.dx = 1; this.dy = 0; // Right
                } else if (deltaX < 0 && this.dx !== 1) {
                    this.dx = -1; this.dy = 0; // Left
                }
            } else {
                // Vertical swipe
                if (deltaY > 0 && this.dy !== -1) {
                    this.dx = 0; this.dy = 1; // Down
                } else if (deltaY < 0 && this.dy !== 1) {
                    this.dx = 0; this.dy = -1; // Up
                }
            }
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.dx = 1;
        this.dy = 0;
    }
    
    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
        
        // Make sure food doesn't spawn on snake
        for (let segment of this.snake) {
            if (segment.x === this.food.x && segment.y === this.food.y) {
                this.generateFood();
                return;
            }
        }
    }
    
    update() {
        if (!this.gameRunning) return;
        
        const head = {x: this.snake[0].x + this.dx, y: this.snake.y + this.dy};
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.scoreElement.textContent = this.score;
            this.generateFood();
            
            // Add pulse effect to score
            this.scoreElement.parentElement.classList.add('pulse');
            setTimeout(() => {
                this.scoreElement.parentElement.classList.remove('pulse');
            }, 300);
        } else {
            this.snake.pop();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw snake
        this.ctx.fillStyle = '#4CAF50';
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            
            // Head is slightly different color
            if (i === 0) {
                this.ctx.fillStyle = '#66BB6A';
            } else {
                this.ctx.fillStyle = '#4CAF50';
            }
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 2,
                segment.y * this.gridSize + 2,
                this.gridSize - 4,
                this.gridSize - 4
            );
            
            // Add subtle gradient effect
            const gradient = this.ctx.createRadialGradient(
                segment.x * this.gridSize + this.gridSize / 2,
                segment.y * this.gridSize + this.gridSize / 2,
                0,
                segment.x * this.gridSize + this.gridSize / 2,
                segment.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                segment.x * this.gridSize + 2,
                segment.y * this.gridSize + 2,
                this.gridSize - 4,
                this.gridSize - 4
            );
        }
        
        // Draw food with pulsing effect
        const time = Date.now() * 0.005;
        const pulse = Math.sin(time) * 0.1 + 0.9;
        
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2,
            this.food.y * this.gridSize + 2,
            (this.gridSize - 4) * pulse,
            (this.gridSize - 4) * pulse
        );
        
        // Add glow effect to food
        this.ctx.shadowColor = '#FF5722';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2,
            this.food.y * this.gridSize + 2,
            (this.gridSize - 4) * pulse,
            (this.gridSize - 4) * pulse
        );
        this.ctx.shadowBlur = 0;
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        
        // Show game over screen
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }
    
    restartGame() {
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.generateFood();
        this.gameOverScreen.classList.add('hidden');
        this.gameRunning = false;
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        setTimeout(() => {
            this.gameLoop();
        }, 150); // Game speed
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new SnakeGame();
});
