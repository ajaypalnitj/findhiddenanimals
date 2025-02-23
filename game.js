import { ANIMALS, Progress } from "./animals/config.js";

class CowGame {
    constructor() {
        // Initialize currentAnimal first
        this.currentAnimal = localStorage.getItem('currentAnimal') || "cow";
        
        // Validate that the currentAnimal exists in ANIMALS config
        if (!ANIMALS[this.currentAnimal]) {
            console.warn(`Invalid animal ${this.currentAnimal}, defaulting to cow`);
            this.currentAnimal = "cow";
            localStorage.setItem('currentAnimal', 'cow');
        }

        // Initialize properties
        this.isPlaying = false;
        this.startTime = 0;
        this.timerInterval = null;
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.totalFinds = localStorage.getItem('totalFinds') || 0;
        this.cowPosition = { x: 0, y: 0 };
        this.sounds = { bell: null, found: null };

        // Get DOM elements
        this.gameArea = document.getElementById('game-area');
        this.startButton = document.getElementById('start-game');
        this.playAgainButton = document.getElementById('play-again');
        this.winMessage = document.getElementById('win-message');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.timeElement = document.getElementById('time');
        this.totalFindsElement = document.getElementById('total-finds');
        this.changeAnimalButton = document.getElementById('change-animal');

        // Update display elements
        this.highScoreElement.textContent = this.highScore;
        this.totalFindsElement.textContent = this.totalFinds;

        // Set up difficulty levels
        this.difficultyLevels = {
            easy: { searchRadius: 70, scoreMultiplier: 1 },
            medium: { searchRadius: 50, scoreMultiplier: 1.5 },
            hard: { searchRadius: 30, scoreMultiplier: 2 }
        };
        this.currentDifficulty = 'medium';

        // Initialize audio context on user interaction
        const initAudio = async () => {
            if (!this.audioContext) {
                await this.initializeAudio().catch(console.error);
            }
            this.startButton.removeEventListener('click', initAudio);
            this.gameArea.removeEventListener('click', initAudio);
        };

        // Add event listeners
        this.startButton.addEventListener('click', initAudio);
        this.gameArea.addEventListener('click', initAudio);
        this.startButton.addEventListener('click', () => this.startGame());
        this.playAgainButton.addEventListener('click', () => this.startGame());
        this.gameArea.addEventListener('click', e => this.handleClick(e));
        this.changeAnimalButton.addEventListener('click', () => this.showAnimalSelection());
        window.addEventListener('resize', () => this.handleResize());

        // Social share buttons
        document.querySelector('.twitter').addEventListener('click', () => this.shareOnTwitter());
        document.querySelector('.facebook').addEventListener('click', () => this.shareOnFacebook());
        document.querySelector('.copy-link').addEventListener('click', () => this.copyLink());

        // Initialize animal sprite (after currentAnimal is set)
        this.cow = document.createElement('img');
        
        // Add error handling for sprite loading
        try {
            if (!ANIMALS[this.currentAnimal] || !ANIMALS[this.currentAnimal].sprite) {
                throw new Error(`Sprite not found for ${this.currentAnimal}`);
            }
            this.cow.src = ANIMALS[this.currentAnimal].sprite;
            this.cow.onerror = () => {
                console.error(`Failed to load sprite for ${this.currentAnimal}`);
                // Fallback to a default image or show an error state
                this.cow.src = 'animals/cow/animal.png';
            };
        } catch (error) {
            console.error('Error loading animal sprite:', error);
            // Fallback to cow sprite
            this.cow.src = 'animals/cow/animal.png';
        }
        
        this.cow.className = 'cow';
        this.gameArea.appendChild(this.cow);

        // Initialize the animal grid
        this.initializeAnimalGrid();
    }
    
    handleResize() {
        if (this.isPlaying) {
            const gameRect = this.gameArea.getBoundingClientRect();
            // Keep cow within bounds after resize
            this.cowPosition.x = Math.min(this.cowPosition.x, gameRect.width - 100);
            this.cowPosition.y = Math.min(this.cowPosition.y, gameRect.height - 100);
            this.cow.style.left = `${this.cowPosition.x}px`;
            this.cow.style.top = `${this.cowPosition.y}px`;
        }
    }
    
    shareOnTwitter() {
        const fact = this.getRandomFact();
        const animalEmoji = ANIMALS[this.currentAnimal].emoji || '🐮';
        const animalName = ANIMALS[this.currentAnimal].name.toLowerCase();
        const text = `I just found the invisible ${animalName} with a score of ${this.score}! ${animalEmoji}\n\n${animalName} Fact: ${fact}\n\nCan you beat my score?`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`);
    }
    
    shareOnFacebook() {
        const animalEmoji = ANIMALS[this.currentAnimal].emoji || '🐮';
        const animalName = ANIMALS[this.currentAnimal].name;
        // Update meta tags dynamically before sharing
        document.querySelector('meta[property="og:title"]').setAttribute('content', `Find The ${animalName}! - I scored ${this.score} points! ${animalEmoji}`);
        document.querySelector('meta[property="og:description"]').setAttribute('content', `I just found the invisible ${animalName.toLowerCase()} with a score of ${this.score}! ${animalEmoji} Play this fun sound-based browser game and try to beat my score!`);
        
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href));
    }
    
    copyLink() {
        const fact = this.getRandomFact();
        const animalEmoji = ANIMALS[this.currentAnimal].emoji || '🐮';
        const animalName = ANIMALS[this.currentAnimal].name.toLowerCase();
        const text = `I just found the invisible ${animalName} with a score of ${this.score}! ${animalEmoji}\n\n${animalName} Fact: ${fact}\n\nCan you beat my score? Play here: ${window.location.href}`;
        navigator.clipboard.writeText(text).then(() => {
            const copyBtn = document.querySelector('.copy-link');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        });
    }
    
    async initializeAudio() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context if it's suspended (needed for Chrome)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            
            await this.loadAnimalSounds(this.currentAnimal);

            // Add event listener for visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.audioContext.suspend();
                } else {
                    this.audioContext.resume();
                }
            });
        } catch (error) {
            console.error('Error loading sounds:', error);
        }
    }
    
    async loadAnimalSounds(animalKey) {
        const animal = ANIMALS[animalKey];
        
        try {
            // Clear existing sounds
            this.sounds = { bell: null, found: null };
            
            // Load sounds with error handling
            const [bellResponse, foundResponse] = await Promise.all([
                fetch(animal.sounds.bell).catch(err => {
                    console.error(`Failed to fetch bell sound for ${animalKey}:`, err);
                    return null;
                }),
                fetch(animal.sounds.found).catch(err => {
                    console.error(`Failed to fetch found sound for ${animalKey}:`, err);
                    return null;
                })
            ]);
            
            if (!bellResponse || !foundResponse) {
                throw new Error(`Failed to load sound files for ${animalKey}`);
            }
            
            if (!bellResponse.ok || !foundResponse.ok) {
                throw new Error(`Failed to load sound files for ${animalKey}`);
            }
            
            const [bellBuffer, foundBuffer] = await Promise.all([
                bellResponse.arrayBuffer()
                    .then(buffer => this.audioContext.decodeAudioData(buffer))
                    .catch(err => {
                        console.error(`Failed to decode bell sound for ${animalKey}:`, err);
                        return null;
                    }),
                foundResponse.arrayBuffer()
                    .then(buffer => this.audioContext.decodeAudioData(buffer))
                    .catch(err => {
                        console.error(`Failed to decode found sound for ${animalKey}:`, err);
                        return null;
                    })
            ]);
            
            if (bellBuffer) this.sounds.bell = bellBuffer;
            if (foundBuffer) this.sounds.found = foundBuffer;
            
            console.log(`Successfully loaded sounds for ${animalKey}`);
        } catch (error) {
            console.error('Error loading sounds for', animalKey, error);
        }
    }
    
    startGame() {
        this.isPlaying = true;
        document.getElementById('start-screen').style.display = 'none';
        this.winMessage.style.display = 'none';
        
        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Reset score and timer with difficulty multiplier
        this.score = 1000 * this.difficultyLevels[this.currentDifficulty].scoreMultiplier;
        this.scoreElement.textContent = this.score;
        this.startTime = Date.now();
        
        // Add click handler for found animal sound
        this.cow.onclick = () => {
            if (!this.isPlaying && this.audioContext && this.sounds.found) {
                this.playSound(0, 'found');
            }
        };
        
        // Start timer with difficulty-based score reduction
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.timeElement.textContent = timeElapsed;
            // Decrease score over time based on difficulty
            this.score = Math.max(0, 
                1000 * this.difficultyLevels[this.currentDifficulty].scoreMultiplier - 
                timeElapsed * (10 * this.difficultyLevels[this.currentDifficulty].scoreMultiplier)
            );
            this.scoreElement.textContent = this.score;
            
            // End game if score hits zero
            if (this.score <= 0) {
                this.gameOver();
            }
        }, 100); // Update more frequently (10 times per second)
        
        // Random position for the cow with margin
        const gameRect = this.gameArea.getBoundingClientRect();
        const margin = 100; // Keep cow away from edges
        this.cowPosition = {
            x: margin + Math.random() * (gameRect.width - 2 * margin),
            y: margin + Math.random() * (gameRect.height - 2 * margin)
        };
        
        // Position the cow (hidden)
        this.cow.style.left = `${this.cowPosition.x}px`;
        this.cow.style.top = `${this.cowPosition.y}px`;
        this.cow.style.display = 'none';
        this.cow.style.transform = 'scale(1)';
    }
    
    handleClick(event) {
        if (!this.isPlaying) return;
        
        const rect = this.gameArea.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Add click feedback with hot/cold indication
        this.addClickFeedback(clickX, clickY);
        
        // Calculate distance
        const distance = Math.sqrt(
            Math.pow(clickX - (this.cowPosition.x + 50), 2) + 
            Math.pow(clickY - (this.cowPosition.y + 50), 2)
        );
        
        // Play sound with volume based on distance
        if (this.audioContext) {
            this.playSound(distance);
        }
        
        // Check if cow is found based on difficulty
        const searchRadius = this.difficultyLevels[this.currentDifficulty].searchRadius;
        if (distance < searchRadius) {
            this.cowFound();
        }
    }
    
    addClickFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.className = 'click-feedback';
        
        // Calculate distance for hot/cold effect
        const distance = Math.sqrt(
            Math.pow(x - (this.cowPosition.x + 50), 2) + 
            Math.pow(y - (this.cowPosition.y + 50), 2)
        );
        
        const maxDistance = Math.sqrt(
            Math.pow(this.gameArea.clientWidth, 2) + 
            Math.pow(this.gameArea.clientHeight, 2)
        );
        
        // Add hot/cold classes based on distance
        if (distance < maxDistance * 0.2) {
            feedback.classList.add('very-hot');
        } else if (distance < maxDistance * 0.4) {
            feedback.classList.add('hot');
        } else if (distance < maxDistance * 0.6) {
            feedback.classList.add('warm');
        } else {
            feedback.classList.add('cold');
        }
        
        feedback.style.left = `${x - 25}px`;
        feedback.style.top = `${y - 25}px`;
        this.gameArea.appendChild(feedback);
        
        setTimeout(() => {
            this.gameArea.removeChild(feedback);
        }, 500);
    }
    
    playSound(distance, soundType = 'bell') {
        if (!this.sounds[soundType] || !this.audioContext) return;

        try {
            // Check if context is suspended and resume it
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[soundType];
            
            const gainNode = this.audioContext.createGain();
            
            if (soundType === 'bell') {
                const maxDistance = Math.sqrt(
                    Math.pow(this.gameArea.clientWidth, 2) + 
                    Math.pow(this.gameArea.clientHeight, 2)
                );
                // Use exponential curve for more natural sound falloff
                const normalizedDistance = Math.min(distance / maxDistance, 1);
                const curve = 3; // Steeper curve for more dramatic sound changes
                const soundRange = ANIMALS[this.currentAnimal].difficulty.soundRange;
                let volume = Math.pow(1 - normalizedDistance, curve);
                // Scale volume between animal's min and max sound range
                volume = soundRange.min + (soundRange.max - soundRange.min) * volume;
                gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            } else {
                gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
            }
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start(0);
            
            // Clean up after sound finishes
            source.onended = () => {
                source.disconnect();
                gainNode.disconnect();
            };

            return new Promise(resolve => {
                source.onended = () => {
                    source.disconnect();
                    gainNode.disconnect();
                    resolve();
                };
            });
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
    
    getRandomFact() {
        const facts = ANIMALS[this.currentAnimal].facts;
        return facts[Math.floor(Math.random() * facts.length)];
    }
    
    async cowFound() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        
        // Show animal and play found sound
        this.cow.style.display = 'block';
        this.cow.style.opacity = '1';
        this.cow.style.transform = 'scale(2)';
        if (this.audioContext) {
            this.playSound(0, 'found'); // Play animal found sound
        }
        
        // Update scores and stats
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('highScore', this.highScore);
        }
        
        // Increment finds for current animal
        const newFinds = Progress.incrementFinds(this.currentAnimal);
        document.getElementById('animal-finds').textContent = newFinds;
        
        // Update total finds
        this.totalFinds++;
        this.totalFindsElement.textContent = this.totalFinds;
        localStorage.setItem('totalFinds', this.totalFinds);
        
        // Check for newly unlocked animals
        const nextUnlock = Progress.getNextUnlock();
        const unlockNotification = document.getElementById('unlock-notification');
        if (nextUnlock && Progress.isUnlocked(nextUnlock.animal)) {
            // Show unlock notification
            document.getElementById('unlocked-animal').textContent = ANIMALS[nextUnlock.animal].name;
            unlockNotification.style.display = 'block';
        } else {
            unlockNotification.style.display = 'none';
        }
        
        // Show win message
        const winMessageH2 = this.winMessage.querySelector('h2');
        winMessageH2.innerHTML = `You found the ${ANIMALS[this.currentAnimal].name}! 🎉<br>
            Score: ${this.score}<br><br>
            Fun Fact: ${this.getRandomFact()}`;
        
        this.winMessage.style.display = 'block';
        
        // Update animal grid with new stats
        this.updateAnimalGrid();
        
        // Play bell sound after showing everything
        if (this.audioContext) {
            this.playSound(0, 'bell');
        }
    }
    
    showAnimalSelection() {
        const startScreen = document.getElementById('start-screen');
        const winMessage = document.getElementById('win-message');
        startScreen.style.display = 'block';
        winMessage.style.display = 'none';
        this.updateAnimalGrid();
    }
    
    initializeAnimalGrid() {
        const grid = document.querySelector('.animal-grid');
        grid.innerHTML = ''; // Clear existing content
        
        Object.entries(ANIMALS).forEach(([key, animal]) => {
            const card = document.createElement('div');
            card.className = `animal-card${Progress.isUnlocked(key) ? '' : ' locked'}`;
            if (key === this.currentAnimal) card.classList.add('selected');
            
            card.innerHTML = `
                <img src="${animal.sprite}" alt="${animal.name}" class="animal-icon">
                <div class="animal-name">${animal.name}</div>
                <div class="animal-stats">
                    Level ${animal.level}<br>
                    Finds: ${Progress.getFinds(key)}
                </div>
            `;
            
            if (Progress.isUnlocked(key)) {
                card.addEventListener('click', () => this.selectAnimal(key));
            }
            
            grid.appendChild(card);
        });
        
        this.updateUnlockProgress();
    }
    
    updateAnimalGrid() {
        const grid = document.querySelector('.animal-grid');
        grid.querySelectorAll('.animal-card').forEach(card => {
            const animalKey = card.querySelector('.animal-name').textContent.toLowerCase();
            card.className = `animal-card${Progress.isUnlocked(animalKey) ? '' : ' locked'}`;
            if (animalKey === this.currentAnimal) card.classList.add('selected');
            
            const stats = card.querySelector('.animal-stats');
            stats.innerHTML = `
                Level ${ANIMALS[animalKey].level}<br>
                Finds: ${Progress.getFinds(animalKey)}
            `;
        });
        
        this.updateUnlockProgress();
    }
    
    updateUnlockProgress() {
        const nextUnlock = Progress.getNextUnlock();
        const progressText = document.getElementById('next-unlock');
        const progressFill = document.getElementById('unlock-progress-fill');
        
        if (nextUnlock) {
            progressText.textContent = `Find ${nextUnlock.previous} ${nextUnlock.required - nextUnlock.current} more times`;
            const percentage = (nextUnlock.current / nextUnlock.required) * 100;
            progressFill.style.width = `${percentage}%`;
        } else {
            progressText.textContent = 'All animals unlocked!';
            progressFill.style.width = '100%';
        }
    }
    
    selectAnimal(animalKey) {
        if (!ANIMALS[animalKey]) {
            console.error(`Invalid animal selected: ${animalKey}`);
            return;
        }
        
        this.currentAnimal = animalKey;
        localStorage.setItem('currentAnimal', animalKey);
        
        // Update animal sprite
        try {
            if (!ANIMALS[animalKey].sprite) {
                throw new Error(`Sprite not found for ${animalKey}`);
            }
            this.cow.src = ANIMALS[animalKey].sprite;
            this.cow.onerror = () => {
                console.error(`Failed to load sprite for ${animalKey}`);
                this.cow.src = 'animals/cow/animal.png';
            };
            
            // Update animal name display
            document.getElementById('animal-name').textContent = ANIMALS[animalKey].name;
            document.getElementById('current-level').textContent = ANIMALS[animalKey].level;
            
            // Load new animal sounds
            if (this.audioContext) {
                this.loadAnimalSounds(animalKey).catch(error => {
                    console.error('Error loading animal sounds:', error);
                });
            }
            
            // Start new game with selected animal
            this.startGame();
        } catch (error) {
            console.error('Error selecting animal:', error);
            // Fallback to cow
            this.currentAnimal = 'cow';
            this.cow.src = 'animals/cow/animal.png';
        }
    }

    gameOver() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        
        // Show game over message
        const winMessageH2 = this.winMessage.querySelector('h2');
        winMessageH2.innerHTML = `Time's up! The ${ANIMALS[this.currentAnimal].name} got away! 😢<br>
            Score: 0<br><br>
            Try again!`;
        
        this.winMessage.style.display = 'block';
        
        // Show where the animal was
        this.cow.style.display = 'block';
        this.cow.style.opacity = '0.5';
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    const game = new CowGame();
});

// Add scroll behavior for header and footer
let lastScrollY = window.scrollY;
const nav = document.querySelector('.game-nav');
const footer = document.querySelector('.site-footer');

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    // Header behavior - hide on scroll down, show on scroll up
    if (currentScrollY > lastScrollY) {
        nav.classList.add('nav-hidden');
    } else {
        nav.classList.remove('nav-hidden');
    }
    
    // Footer behavior - show only when scrolled to bottom
    const isAtBottom = window.innerHeight + currentScrollY >= document.documentElement.scrollHeight;
    if (isAtBottom) {
        footer.classList.remove('footer-hidden');
    } else {
        footer.classList.add('footer-hidden');
    }
    
    lastScrollY = currentScrollY;
}); 