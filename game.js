// Healing Happy Bird Game - Complete JavaScript Implementation
class HealingBirdGame {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particleCanvas = document.getElementById('particleCanvas');
        this.particleCtx = this.particleCanvas.getContext('2d');

        // UI Elements
        this.scoreElement = document.getElementById('score');
        this.confidenceElement = document.getElementById('confidence');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.pauseButton = document.getElementById('pauseButton');
        this.confidenceFill = document.getElementById('confidenceFill');
        this.encouragementText = document.getElementById('encouragementText');
        
        // Game state
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.score = 0;
        this.confidence = 0;
        this.maxConfidence = 100;
        this.gameTime = 0;
        this.lastRewardTime = 0;
        this.rewardInterval = 9000; // 9 seconds for positive reinforcement
        
        // Bird properties
        this.bird = {
            x: 100,
            y: 0,
            width: 40,
            height: 30,
            velocity: 0,
            gravity: 0.5,
            jumpPower: -8,
            color: '#FFD93D',
            wingAngle: 0,
            eyeBlink: 0
        };
        
        this.currentSpeed = this.baseSpeed;
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.clouds = [];
        this.rainbows = [];
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.initializeAudio();
        this.generateBackgroundElements();
        this.resetGame();
        this.gameLoop();
    }

    setupCanvas() {
        // Set canvas dimensions
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.particleCanvas.width = window.innerWidth;
        this.particleCanvas.height = window.innerHeight;
        
        // Center bird vertically
        this.bird.y = this.canvas.height / 2;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.particleCanvas.width = window.innerWidth;
            this.particleCanvas.height = window.innerHeight;
        });
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart button
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Pause button
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.togglePause();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.birdJump();
                } else if (this.gameState === 'start') {
                    this.startGame();
                }
            } else if (e.code === 'KeyP') {
                this.togglePause();
            }
        });
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.birdJump();
            } else if (this.gameState === 'start') {
                this.startGame();
            }
        });
        
        // Mouse controls (for desktop)
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                this.birdJump();
            } else if (this.gameState === 'start') {
                this.startGame();
            }
        });
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
            this.playBackgroundMusic();
        } catch (error) {
            console.log('Audio not supported, continuing without sound');
        }
    }
    
    createSounds() {
        // Create simple synthesized sounds using Web Audio API
        this.sounds = {
            jump: () => this.playTone(440, 0.1, 0.1),
            collect: () => this.playTone(880, 0.2, 0.2),
            reward: () => this.playTone(660, 0.3, 0.3),
            collision: () => this.playTone(220, 0.2, 0.2)
        };
    }
    
    playTone(frequency, duration, volume) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playBackgroundMusic() {
        // Simple background music pattern
        if (!this.audioContext) return;
        
        const playNote = (frequency, startTime, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0.05, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };
        
        // Simple melody pattern
        const melody = [
            { freq: 523.25, duration: 0.5 }, // C5
            { freq: 587.33, duration: 0.5 }, // D5
            { freq: 659.25, duration: 0.5 }, // E5
            { freq: 698.46, duration: 0.5 }, // F5
            { freq: 783.99, duration: 1.0 }  // G5
        ];
        
        let currentTime = this.audioContext.currentTime;
        melody.forEach(note => {
            playNote(note.freq, currentTime, note.duration);
            currentTime += note.duration;
        });
    }
    
    generateBackgroundElements() {
        // Generate clouds
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width * 2,
                y: Math.random() * this.canvas.height * 0.7,
                width: 60 + Math.random() * 40,
                height: 30 + Math.random() * 20,
                speed: 0.5 + Math.random() * 0.5,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
        
        // Generate rainbows
        for (let i = 0; i < 3; i++) {
            this.rainbows.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.5,
                width: 150,
                height: 80,
                opacity: 0.2 + Math.random() * 0.2
            });
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.startScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.resetGame();
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.gameOverScreen.style.display = 'none';
        this.resetGame();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
    
    resetGame() {
        this.score = 0;
        this.confidence = 0;
        this.gameTime = 0;
        this.lastRewardTime = 0;
        this.rewardInterval = 9000; // 9 seconds for positive reinforcement

        this.currentSpeed = this.baseSpeed;
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
    }

    birdJump() {
        this.bird.velocity = this.bird.jumpPower;
        this.sounds.jump();
        this.createJumpParticles();
    }
    
    createJumpParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.bird.x - 10,
                y: this.bird.y + this.bird.height / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 2 + 1,
                size: Math.random() * 4 + 2,
                color: '#FFD93D',
                life: 1.0,
                decay: 0.02
            });
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.gameTime += 16; // Approximate 60fps
        
        // Update bird
        this.updateBird();
        
        // Update game objects
        this.updateObstacles();
        this.updateCollectibles();
        this.updateParticles();
        this.updateBackgroundElements();
        
        // Spawn new objects
        this.spawnObjects();
        
        // Check collisions
        this.checkCollisions();
        
        // Update confidence and rewards
        this.updateConfidence();
        
        // Increase difficulty over time
        this.updateDifficulty();
        
        // Update UI
        this.updateUI();

        // Check for win condition
        if (this.score >= 10000) {
            this.gameState = 'gameOver';
            this.gameOverScreen.style.display = 'flex';
            this.finalScore.textContent = this.score;
        }
    }
    
    updateBird() {
        // Apply gravity
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Keep bird in bounds
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }
        if (this.bird.y > this.canvas.height - this.bird.height) {
            this.bird.y = this.canvas.height - this.bird.height;
            this.bird.velocity = 0;
        }
        
        // Animate wings
        this.bird.wingAngle += 0.2;
        
        // Animate eye blink
        this.bird.eyeBlink += 0.1;
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.currentSpeed;
            
            // Remove obstacles that are off screen
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10; // Bonus for avoiding obstacles
            }
        }
    }
    
    updateCollectibles() {
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            collectible.x -= this.currentSpeed;
            collectible.rotation += 0.1;
            
            // Remove collectibles that are off screen
            if (collectible.x + collectible.size < 0) {
                this.collectibles.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.size *= 0.98;
            
            // Remove dead particles
            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateBackgroundElements() {
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width + cloud.width;
                cloud.y = Math.random() * this.canvas.height * 0.7;
            }
        });
    }
    
    spawnObjects() {
        // Spawn obstacles
        if (Math.random() < this.obstacleSpawnRate) {
            this.obstacles.push({
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - 150),
                width: 50 + Math.random() * 30,
                height: 80 + Math.random() * 40,
                type: Math.random() < 0.5 ? 'cloud' : 'balloon',
                color: this.getRandomPastelColor()
            });
        }
        
        // Spawn collectibles
        if (Math.random() < this.collectibleSpawnRate) {
            this.collectibles.push({
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - 50) + 25,
                size: 20 + Math.random() * 10,
                type: Math.random() < 0.7 ? 'heart' : 'star',
                rotation: 0,
                color: this.getRandomBrightColor()
            });
        }
    }
    
    checkCollisions() {
        // Check obstacle collisions
        this.obstacles.forEach(obstacle => {
            if (this.isColliding(this.bird, obstacle)) {
                this.handleCollision();
            }
        });
        
        // Check collectible collisions
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            if (this.isCollidingCircle(this.bird, collectible)) {
                this.handleCollectible(collectible, i);
            }
        }
    }
    
    isColliding(bird, obstacle) {
        return bird.x < obstacle.x + obstacle.width &&
               bird.x + bird.width > obstacle.x &&
               bird.y < obstacle.y + obstacle.height &&
               bird.y + bird.height > obstacle.y;
    }
    
    isCollidingCircle(bird, collectible) {
        const birdCenterX = bird.x + bird.width / 2;
        const birdCenterY = bird.y + bird.height / 2;
        const collectibleCenterX = collectible.x + collectible.size / 2;
        const collectibleCenterY = collectible.y + collectible.size / 2;
        
        const distance = Math.sqrt(
            Math.pow(birdCenterX - collectibleCenterX, 2) +
            Math.pow(birdCenterY - collectibleCenterY, 2)
        );
        
        return distance < (bird.width / 2 + collectible.size / 2);
    }
    
    handleCollision() {
        // Gentle collision handling - no game over, just encouragement
        this.sounds.collision();
        this.bird.velocity = Math.abs(this.bird.velocity) * 0.5; // Reduce velocity
        this.confidence = Math.max(0, this.confidence - 5);
        this.showEncouragement("小鳥休息一下，馬上再起飛！");
        this.createCollisionParticles();
    }
    
    handleCollectible(collectible, index) {
        this.collectibles.splice(index, 1);
        this.score += 50;
        this.confidence = Math.min(100, this.confidence + 10);
        this.sounds.collect();
        this.createCollectParticles(collectible.x, collectible.y);
        this.showEncouragement(this.getRandomEncouragement());
    }
    
    updateConfidence() {
        // Gradually increase confidence over time
        this.confidence = Math.min(100, this.confidence + 0.05);
        
        // Check for 9-second reward
        if (this.gameTime - this.lastRewardTime >= this.rewardInterval) {
            this.triggerReward();
            this.lastRewardTime = this.gameTime;
        }
    }
    
    triggerReward() {
        this.score += 100;
        this.confidence = Math.min(100, this.confidence + 20);
        this.sounds.reward();
        this.createRewardParticles();
        this.showEncouragement(this.getRandomEncouragement());
    }
    
    updateDifficulty() {
        // Gradually increase speed and spawn rates
        this.currentSpeed += this.difficultyIncrease;
        this.obstacleSpawnRate += this.difficultyIncrease * 0.5;
        this.collectibleSpawnRate += this.difficultyIncrease * 0.3;
    }
    
    updateUI() {
        this.scoreElement.textContent = Math.floor(this.score);
        this.confidenceFill.style.width = `${this.confidence}%`;
    }
    
    showEncouragement(message) {
        this.encouragementText.textContent = message;
        this.encouragementText.classList.add('show');
        setTimeout(() => {
            this.encouragementText.classList.remove('show');
        }, 2000);
    }
    
    getRandomEncouragement() {
        return this.encouragementMessages[Math.floor(Math.random() * this.encouragementMessages.length)];
    }
    
    createCollisionParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 6 + 3,
                color: '#FF6B6B',
                life: 1.0,
                decay: 0.03
            });
        }
    }
    
    createCollectParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 5 + 2,
                color: '#FFD93D',
                life: 1.0,
                decay: 0.025
            });
        }
    }
    
    createRewardParticles() {
        // Create colorful burst
        const colors = ['#FFD93D', '#FF6B6B', '#4ECDC4', '#A8E6CF', '#FFA8A8'];
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.02
            });
        }
    }
    
    getRandomPastelColor() {
        const colors = ['#FFB6C1', '#FFDAB9', '#FFE5B4', '#E6E6FA', '#F0FFF0'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getRandomBrightColor() {
        const colors = ['#FFD93D', '#FF6B6B', '#4ECDC4', '#A8E6CF', '#FFA8A8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    render() {
        // Clear canvases
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        // Render background elements
        this.renderBackground();
        
        // Render game objects
        this.renderClouds();
        this.renderRainbows();
        this.renderObstacles();
        this.renderCollectibles();
        this.renderBird();
        this.renderParticles();
    }
    
    renderBackground() {
        // Sky gradient is handled by CSS, but we can add some dynamic elements
        // Render sun
        const sunX = this.canvas.width - 100;
        const sunY = 100;
        const gradient = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.7, '#FFA500');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderClouds() {
        this.clouds.forEach(cloud => {
            this.ctx.save();
            this.ctx.globalAlpha = cloud.opacity;
            this.ctx.fillStyle = '#FFFFFF';
            
            // Draw fluffy cloud
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.height / 2, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.25, cloud.y - cloud.height * 0.2, cloud.height * 0.4, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.5, cloud.y, cloud.height * 0.5, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.75, cloud.y - cloud.height * 0.1, cloud.height * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    renderRainbows() {
        this.rainbows.forEach(rainbow => {
            this.ctx.save();
            this.ctx.globalAlpha = rainbow.opacity;
            
            const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
            const radius = rainbow.width;
            
            colors.forEach((color, index) => {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(rainbow.x, rainbow.y, radius - index * 4, 0, Math.PI, false);
                this.ctx.stroke();
            });
            
            this.ctx.restore();
        });
    }
    
    renderBird() {
        this.ctx.save();
        
        // Bird body
        this.ctx.fillStyle = this.bird.color;
        this.ctx.beginPath();
        this.ctx.ellipse(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2, 
                        this.bird.width / 2, this.bird.height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wings
        this.ctx.fillStyle = '#FFA500';
        const wingOffset = Math.sin(this.bird.wingAngle) * 5;
        
        // Left wing
        this.ctx.beginPath();
        this.ctx.ellipse(this.bird.x - 5, this.bird.y + this.bird.height / 2 + wingOffset, 
                        12, 8, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right wing
        this.ctx.beginPath();
        this.ctx.ellipse(this.bird.x + this.bird.width + 5, this.bird.y + this.bird.height / 2 - wingOffset, 
                        12, 8, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x + 12, this.bird.y + 8, 6, 0, Math.PI * 2);
        this.ctx.arc(this.bird.x + 28, this.bird.y + 8, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye pupils (with occasional blink)
        if (Math.sin(this.bird.eyeBlink) > -0.8) {
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(this.bird.x + 12, this.bird.y + 8, 3, 0, Math.PI * 2);
            this.ctx.arc(this.bird.x + 28, this.bird.y + 8, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Beak
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.x + this.bird.width, this.bird.y + 12);
        this.ctx.lineTo(this.bird.x + this.bird.width + 8, this.bird.y + 15);
        this.ctx.lineTo(this.bird.x + this.bird.width, this.bird.y + 18);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    renderObstacles() {
        this.obstacles.forEach(obstacle => {
            this.ctx.save();
            
            if (obstacle.type === 'cloud') {
                // Draw cute cloud obstacle
                this.ctx.fillStyle = obstacle.color;
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                
                // Cloud body
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + obstacle.width * 0.3, obstacle.y + obstacle.height * 0.3, obstacle.width * 0.25, 0, Math.PI * 2);
                this.ctx.arc(obstacle.x + obstacle.width * 0.7, obstacle.y + obstacle.height * 0.3, obstacle.width * 0.2, 0, Math.PI * 2);
                this.ctx.arc(obstacle.x + obstacle.width * 0.5, obstacle.y + obstacle.height * 0.6, obstacle.width * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Cute face
                this.ctx.fillStyle = '#000000';
                // Eyes
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + obstacle.width * 0.35, obstacle.y + obstacle.height * 0.25, 3, 0, Math.PI * 2);
                this.ctx.arc(obstacle.x + obstacle.width * 0.65, obstacle.y + obstacle.height * 0.25, 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Smile
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + obstacle.width * 0.5, obstacle.y + obstacle.height * 0.4, 8, 0, Math.PI);
                this.ctx.stroke();
            } else {
                // Draw balloon obstacle
                this.ctx.fillStyle = obstacle.color;
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                
                // Balloon
                this.ctx.beginPath();
                this.ctx.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height * 0.4, 
                               obstacle.width * 0.4, obstacle.height * 0.4, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // String
                this.ctx.strokeStyle = '#666666';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height * 0.8);
                this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }
    
    renderCollectibles() {
        this.collectibles.forEach(collectible => {
            this.ctx.save();
            this.ctx.translate(collectible.x + collectible.size / 2, collectible.y + collectible.size / 2);
            this.ctx.rotate(collectible.rotation);
            
            this.ctx.fillStyle = collectible.color;
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            
            if (collectible.type === 'heart') {
                // Draw heart
                this.ctx.beginPath();
                const size = collectible.size / 2;
                this.ctx.moveTo(0, size * 0.3);
                this.ctx.bezierCurveTo(-size, -size * 0.3, -size, -size * 0.8, 0, -size * 0.3);
                this.ctx.bezierCurveTo(size, -size * 0.8, size, -size * 0.3, 0, size * 0.3);
                this.ctx.fill();
                this.ctx.stroke();
            } else {
                // Draw star
                this.ctx.beginPath();
                const spikes = 5;
                const outerRadius = collectible.size / 2;
                const innerRadius = outerRadius * 0.4;
                
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.particleCtx.save();
            this.particleCtx.globalAlpha = particle.life;
            this.particleCtx.fillStyle = particle.color;
            this.particleCtx.beginPath();
            this.particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.particleCtx.fill();
            this.particleCtx.restore();
        });
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new HealingBirdGame();
    game.init();
});