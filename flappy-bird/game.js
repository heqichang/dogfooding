class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;

        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');

        this.gameState = 'start';
        this.score = 0;

        this.bird = {
            x: 80,
            y: 300,
            width: 34,
            height: 24,
            velocity: 0,
            gravity: 0.22,
            jumpForce: -5.2,
            rotation: 0
        };

        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 200;
        this.pipeSpeed = 1.2;
        this.pipeSpawnTimer = 0;
        this.pipeSpawnInterval = 150;

        this.groundY = this.canvas.height - 50;
        this.bgOffset = 0;
        this.groundOffset = 0;

        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });

        this.canvas.addEventListener('click', () => {
            this.handleInput();
        });

        this.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
    }

    handleInput() {
        if (this.gameState === 'start') {
            this.gameState = 'playing';
            this.startScreen.classList.add('hidden');
            this.bird.velocity = this.bird.jumpForce;
        } else if (this.gameState === 'playing') {
            this.bird.velocity = this.bird.jumpForce;
        }
    }

    restartGame() {
        this.gameState = 'start';
        this.score = 0;
        this.bird.x = 80;
        this.bird.y = 300;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.pipes = [];
        this.pipeSpawnTimer = 0;
        this.gameOverScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);

        this.pipeSpawnTimer++;
        if (this.pipeSpawnTimer >= this.pipeSpawnInterval) {
            this.spawnPipe();
            this.pipeSpawnTimer = 0;
        }

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;

            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                this.score++;
                pipe.scored = true;
            }

            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }

        this.bgOffset -= 0.5;
        if (this.bgOffset <= -this.canvas.width) {
            this.bgOffset = 0;
        }

        this.groundOffset -= this.pipeSpeed;
        if (this.groundOffset <= -this.canvas.width) {
            this.groundOffset = 0;
        }

        this.checkCollisions();
    }

    spawnPipe() {
        const minPipeHeight = 80;
        const maxPipeHeight = this.groundY - this.pipeGap - minPipeHeight;
        const topPipeHeight = Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight;

        this.pipes.push({
            x: this.canvas.width,
            topHeight: topPipeHeight,
            bottomY: topPipeHeight + this.pipeGap,
            scored: false
        });
    }

    checkCollisions() {
        if (this.bird.y + this.bird.height >= this.groundY || this.bird.y <= 0) {
            this.gameOver();
            return;
        }

        for (const pipe of this.pipes) {
            if (this.bird.x + this.bird.width > pipe.x && this.bird.x < pipe.x + this.pipeWidth) {
                if (this.bird.y < pipe.topHeight || this.bird.y + this.bird.height > pipe.bottomY) {
                    this.gameOver();
                    return;
                }
            }
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();
        this.drawPipes();
        this.drawBird();
        this.drawGround();
        this.drawScore();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
        gradient.addColorStop(0, '#70c5ce');
        gradient.addColorStop(1, '#87CEEB');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);

        this.ctx.fillStyle = '#ffffff';
        this.drawCloud(50 + this.bgOffset * 0.3, 100, 60);
        this.drawCloud(200 + this.bgOffset * 0.2, 50, 80);
        this.drawCloud(350 + this.bgOffset * 0.4, 150, 50);
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y + size * 0.1, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawBird() {
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate(this.bird.rotation * Math.PI / 180);

        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, -2, 8, 6, -0.3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(10, -5, 6, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(12, -5, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FF6347';
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(22, -3);
        this.ctx.lineTo(22, 3);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawPipes() {
        for (const pipe of this.pipes) {
            const gradient = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + this.pipeWidth, 0);
            gradient.addColorStop(0, '#4CAF50');
            gradient.addColorStop(0.5, '#66BB6A');
            gradient.addColorStop(1, '#4CAF50');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);

            this.ctx.fillStyle = '#388E3C';
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 25, this.pipeWidth + 10, 25);

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.groundY - pipe.bottomY);

            this.ctx.fillStyle = '#388E3C';
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 25);
        }
    }

    drawGround() {
        const gradient = this.ctx.createLinearGradient(0, this.groundY, 0, this.canvas.height);
        gradient.addColorStop(0, '#D2691E');
        gradient.addColorStop(1, '#8B4513');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, 10);

        this.ctx.fillStyle = '#8B4513';
        for (let i = 0; i < this.canvas.width + 50; i += 50) {
            this.ctx.fillRect(i + this.groundOffset % 50, this.groundY + 20, 10, 5);
            this.ctx.fillRect(i + this.groundOffset % 50 + 25, this.groundY + 35, 15, 5);
        }
    }

    drawScore() {
        if (this.gameState === 'start') return;

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeText(this.score.toString(), this.canvas.width / 2, 80);
        this.ctx.fillText(this.score.toString(), this.canvas.width / 2, 80);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new FlappyBirdGame();
});