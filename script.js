class ModernSnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.levelElement = document.getElementById('level');
        this.finalScoreElement = document.getElementById('finalScore');
        
        // Screens
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.newRecordElement = document.getElementById('newRecord');
        
        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.homeBtn = document.getElementById('homeBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        
        // Touch controls
        this.upBtn = document.getElementById('upBtn');
        this.downBtn = document.getElementById('downBtn');
        this.leftBtn = document.getElementById('leftBtn');
        this.rightBtn = document.getElementById('rightBtn');
        
        // Game settings
        this.gridSize = 24;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
        this.snake = [];
        this.food = {};
        this.powerUp = null;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.score = 0;
        this.level = 1;
        this.gameSpeed = 150;
        this.highScore = parseInt(localStorage.getItem('modernSnakeHighScore')) || 0;
        
        // Animation properties
        this.animationId = null;
        this.lastTime = 0;
        this.particles = [];
        
        this.init();
    }
    
    init() {
        this.highScoreElement.textContent = this.highScore;
        this.resetGame();
        this.bindEvents();
        this.gameLoop(0);
    }
    
    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Button events
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.startGame());
        this.homeBtn.addEventListener('click', () => this.goHome());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resumeBtn.addEventListener('click', () => this.togglePause());
        
        // Touch controls
        this.upBtn.addEventListener('click', () => this.changeDirection(0, -1));
        this.downBtn.addEventListener('click', () => this.changeDirection(0, 1));
        this.leftBtn.addEventListener('click', () => this.changeDirection(-1, 0));
        this.rightBtn.addEventListener('click', () => this.changeDirection(1, 0));
        
        // Touch/swipe controls
        let touchStartX, touchStartY;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameState === 'start') {
                this.startGame();
                return;
            }
            
            if (!touchStartX || !touchStartY) return;
            
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            
            const minSwipeDistance = 30;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    this.changeDirection(deltaX > 0 ? 1 : -1, 0);
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    this.changeDirection(0, deltaY > 0 ? 1 : -1);
                }
            }
        });
    }
    
    handleKeyPress(e) {
        const key = e.key.toLowerCase();
        
        switch (key) {
            case ' ':
                e.preventDefault();
                if (this.gameState === 'playing' || this.gameState === 'paused') {
                    this.togglePause();
                } else if (this.gameState === 'start') {
                    this.startGame();
                }
                break;
                
            case 'enter':
                if (this.gameState === 'start' || this.gameState === 'gameOver') {
                    this.startGame();
                }
                break;
                
            case 'escape':
                if (this.gameState === 'playing') {
                    this.togglePause();
                }
                break;
        }
        
        if (this.gameState !== 'playing') return;
        
        switch (key) {
            case 'arrowup':
            case 'w':
                e.preventDefault();
                this.changeDirection(0, -1);
                break;
            case 'arrowdown':
            case 's':
                e.preventDefault();
                this.changeDirection(0, 1);
                break;
            case 'arrowleft':
            case 'a':
                e.preventDefault();
                this.changeDirection(-1, 0);
                break;
            case 'arrowright':
            case 'd':
                e.preventDefault();
                this.changeDirection(1, 0);
                break;
        }
    }
    
    changeDirection(x, y) {
        if (this.gameState !== 'playing') return;
        
        // Prevent reverse direction
        if (this.direction.x === -x && this.direction.y === -y) return;
        
        this.nextDirection = { x, y };
    }
    
    startGame() {
        this.gameState = 'playing';
        this.resetGame();
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.hideAllScreens();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.pauseScreen.classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.pauseScreen.classList.add('hidden');
        }
    }
    
    goHome() {
        this.gameState = 'start';
        this.resetGame();
        this.hideAllScreens();
        this.startScreen.classList.remove('hidden');
    }
    
    hideAllScreens() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
    }
    
    resetGame() {
        this.snake = [{ x: 10, y: 10 }];
        this.score = 0;
        this.level = 1;
        this.gameSpeed = 150;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.particles = [];
        this.generateFood();
        this.updateUI();
    }
    
    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.isSnakePosition(this.food.x, this.food.y));
        
        // Occasionally generate power-ups
        if (Math.random() < 0.1) {
            this.generatePowerUp();
        }
    }
    
    generatePowerUp() {
        do {
            this.powerUp = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                type: Math.random() < 0.5 ? 'speed' : 'points'
            };
        } while (this.isSnakePosition(this.powerUp.x, this.powerUp.y) || 
                (this.powerUp.x === this.food.x && this.powerUp.y === this.food.y));
    }
    
    isSnakePosition(x, y) {
        return this.snake.some(segment => segment.x === x && segment.y === y);
    }
    
    update(currentTime) {
        if (this.gameState !== 'playing') return;
        
        if (currentTime - this.lastTime < this.gameSpeed) return;
        this.lastTime = currentTime;
        
        // Update direction
        this.direction = { ...this.nextDirection };
        
        // Move snake
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        if (this.isSnakePosition(head.x, head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else if (this.powerUp && head.x === this.powerUp.x && head.y === this.powerUp.y) {
            this.eatPowerUp();
        } else {
            this.snake.pop();
        }
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.life--;
            particle.x += particle.vx;
            particle.y += particle.vy;
            return particle.life > 0;
        });
    }
    
    eatFood() {
        this.score += 10 * this.level;
        this.updateScore();
        this.generateFood();
        this.createParticles(this.food.x * this.gridSize, this.food.y * this.gridSize, '#ef4444');
        
        // Level up every 5 foods
        if (this.score % 50 === 0) {
            this.level++;
            this.gameSpeed = Math.max(80, this.gameSpeed - 10);
            this.levelElement.textContent = this.level;
            this.levelElement.classList.add('score-pop');
            setTimeout(() => {
                this.levelElement.classList.remove('score-pop');
            }, 300);
        }
    }
    
    eatPowerUp() {
        const points = this.powerUp.type === 'points' ? 50 : 25;
        this.score += points;
        this.updateScore();
        
        if (this.powerUp.type === 'speed') {
            // Temporary speed boost
            const originalSpeed = this.gameSpeed;
            this.gameSpeed = Math.max(60, this.gameSpeed - 30);
            setTimeout(() => {
                this.gameSpeed = originalSpeed;
            }, 5000);
        }
        
        this.createParticles(
            this.powerUp.x * this.gridSize, 
            this.powerUp.y * this.gridSize, 
            this.powerUp.type === 'points' ? '#f59e0b' : '#10b981'
        );
        
        this.powerUp = null;
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        this.scoreElement.classList.add('score-pop');
        setTimeout(() => {
            this.scoreElement.classList.remove('score-pop');
        }, 300);
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + this.gridSize / 2,
                y: y + this.gridSize / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                color: color
            });
        }
    }
    
    draw() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw food
        this.drawFood();
        
        // Draw power-up
        if (this.powerUp) {
            this.drawPowerUp();
        }
        
        // Draw snake
        this.drawSnake();
        
        // Draw particles
        this.drawParticles();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            // Head
            if (index === 0) {
                const gradient = this.ctx.createRadialGradient(
                    x + this.gridSize / 2, y + this.gridSize / 2, 0,
                    x + this.gridSize / 2, y + this.gridSize / 2, this.gridSize / 2
                );
                gradient.addColorStop(0, '#10b981');
                gradient.addColorStop(1, '#059669');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
                
                // Eyes
                this.ctx.fillStyle = '#ffffff';
                const eyeSize = 4;
                this.ctx.fillRect(x + 6, y + 6, eyeSize, eyeSize);
                this.ctx.fillRect(x + this.gridSize - 10, y + 6, eyeSize, eyeSize);
                
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(x + 7, y + 7, 2, 2);
                this.ctx.fillRect(x + this.gridSize - 9, y + 7, 2, 2);
            } else {
                // Body
                const alpha = Math.max(0.3, 1 - (index / this.snake.length) * 0.7);
                this.ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
                this.ctx.fillRect(x + 3, y + 3, this.gridSize - 6, this.gridSize - 6);
                
                // Glow effect
                this.ctx.shadowColor = '#10b981';
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(x + 3, y + 3, this.gridSize - 6, this.gridSize - 6);
                this.ctx.shadowBlur = 0;
            }
        });
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        const time = Date.now() * 0.005;
        const pulse = Math.sin(time) * 0.1 + 0.9;
        
        const gradient = this.ctx.createRadialGradient(
            x + this.gridSize / 2, y + this.gridSize / 2, 0,
            x + this.gridSize / 2, y + this.gridSize / 2, this.gridSize / 2
        );
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(1, '#dc2626');
        
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 15;
        
        const size = (this.gridSize - 4) * pulse;
        const offset = (this.gridSize - size) / 2;
        this.ctx.fillRect(x + offset, y + offset, size, size);
        
        this.ctx.shadowBlur = 0;
    }
    
    drawPowerUp() {
        const x = this.powerUp.x * this.gridSize;
        const y = this.powerUp.y * this.gridSize;
        const time = Date.now() * 0.01;
        const rotation = time % (Math.PI * 2);
        
        this.ctx.save();
        this.ctx.translate(x + this.gridSize / 2, y + this.gridSize / 2);
        this.ctx.rotate(rotation);
        
        const color = this.powerUp.type === 'points' ? '#f59e0b' : '#10b981';
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        
        this.ctx.fillRect(-8, -8, 16, 16);
        this.ctx.shadowBlur = 0;
        
        this.ctx.restore();
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / 30;
            this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update high score
        let isNewRecord = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('modernSnakeHighScore', this.highScore.toString());
            isNewRecord = true;
        }
        
        // Show game over screen
        this.finalScoreElement.textContent = this.score;
        if (isNewRecord) {
            this.newRecordElement.classList.remove('hidden');
        } else {
            this.newRecordElement.classList.add('hidden');
        }
        
        this.gameOverScreen.classList.remove('hidden');
    }
    
    gameLoop(currentTime) {
        this.update(currentTime);
        this.draw();
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ModernSnakeGame();
});
