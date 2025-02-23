import { ANIMALS } from './animals/config.js';

class FlashCardGame {
    constructor() {
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flashcardHighScore')) || 0;
        this.timeLeft = 30;
        this.timer = null;
        this.cards = [];
        this.selectedCards = [];
        this.matchedPairs = 0;
        this.audioPlayers = new Map();
        this.gameStarted = false;
        this.isHardMode = false;
        this.setupDifficultySelector();

        // Get DOM elements
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.endScreen = document.getElementById('end-screen');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.timerElement = document.getElementById('timer');
        this.progressFill = document.getElementById('progress-fill');
        this.cardsGrid = document.querySelector('.cards-grid');

        // Add event listeners
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('play-again').addEventListener('click', () => this.startGame());

        // Initialize display
        this.updateScore();
        this.preloadSounds();
    }

    setupDifficultySelector() {
        const easyBtn = document.getElementById('easy-mode');
        const hardBtn = document.getElementById('hard-mode');
        const easyDesc = document.getElementById('easy-description');
        const hardDesc = document.getElementById('hard-description');

        easyBtn.addEventListener('click', () => {
            easyBtn.classList.add('active');
            hardBtn.classList.remove('active');
            easyDesc.classList.remove('hidden');
            hardDesc.classList.add('hidden');
            this.timeLeft = 60;
            this.isHardMode = false;
        });

        hardBtn.addEventListener('click', () => {
            hardBtn.classList.add('active');
            easyBtn.classList.remove('active');
            hardDesc.classList.remove('hidden');
            easyDesc.classList.add('hidden');
            this.timeLeft = 30;
            this.isHardMode = true;
        });
    }

    preloadSounds() {
        Object.values(ANIMALS).forEach(animal => {
            if (animal.sounds) {
                const audio = new Audio(animal.sounds.found);
                this.audioPlayers.set(animal.name, audio);
            }
        });
    }

    startGame() {
        this.gameStarted = true;
        this.score = 0;
        this.matchedPairs = 0;
        this.selectedCards = [];
        this.cards = [];
        this.cardsGrid.innerHTML = '';

        // Show game screen
        this.startScreen.classList.add('hidden');
        this.endScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');

        // Create cards
        this.createCards();

        // Start timer
        this.startTimer();

        // Update display
        this.updateScore();
        this.updateTimer();
    }

    createCards() {
        // Get random animals
        const gameAnimals = Object.values(ANIMALS)
            .filter(animal => animal.sounds && animal.sounds.found)
            .sort(() => Math.random() - 0.5)
            .slice(0, 6);
        
        // Create pairs of cards (animal + sound)
        let cardPairs = [];
        gameAnimals.forEach(animal => {
            // Add animal card
            cardPairs.push({
                type: 'animal',
                content: `<img src="${animal.sprite}" alt="${animal.name}">
                         <div>${animal.name}</div>`,
                match: animal.name,
                sound: animal.sounds.found
            });

            // Add sound card
            cardPairs.push({
                type: 'sound',
                content: `<div class="sound-card">
                            <i class="fas fa-volume-up"></i>
                            <div>Play Sound</div>
                         </div>`,
                match: animal.name,
                sound: animal.sounds.found
            });
        });

        // Shuffle cards
        this.cards = cardPairs.sort(() => Math.random() - 0.5);

        // Create and add card elements
        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            
            // Create front and back of card
            const front = document.createElement('div');
            front.className = 'card-front';
            front.innerHTML = '<i class="fas fa-question"></i>';

            const back = document.createElement('div');
            back.className = 'card-back';
            back.innerHTML = card.content;
            
            cardElement.appendChild(front);
            cardElement.appendChild(back);
            cardElement.dataset.index = index;
            
            cardElement.addEventListener('click', () => this.handleCardClick(index));
            this.cardsGrid.appendChild(cardElement);
        });
    }

    handleCardClick(index) {
        const cardElement = this.cardsGrid.children[index];
        const card = this.cards[index];

        // Ignore if card is already matched or selected
        if (cardElement.classList.contains('matched') || 
            this.selectedCards.includes(index) ||
            this.selectedCards.length >= 2) {
            return;
        }

        // Add to selected cards
        this.selectedCards.push(index);
        cardElement.classList.add('flipped');

        // Play sound automatically if it's a sound card
        if (card.type === 'sound') {
            const audio = new Audio(card.sound);
            audio.play();
        }

        // If we have a pair selected
        if (this.selectedCards.length === 2) {
            const [firstIndex, secondIndex] = this.selectedCards;
            const firstCard = this.cards[firstIndex];
            const secondCard = this.cards[secondIndex];

            // Check if they match
            if (firstCard.match === secondCard.match) {
                // Mark as matched
                setTimeout(() => {
                    this.cardsGrid.children[firstIndex].classList.add('matched');
                    this.cardsGrid.children[secondIndex].classList.add('matched');
                }, 500);
                
                this.matchedPairs++;
                this.score += 100;
                this.updateScore();

                // Check if game is won
                if (this.matchedPairs === 6) {
                    this.endGame(true);
                }
            } else {
                // Show wrong match briefly
                setTimeout(() => {
                    this.cardsGrid.children[firstIndex].classList.add('wrong');
                    this.cardsGrid.children[secondIndex].classList.add('wrong');
                }, 500);
                
                this.score = Math.max(0, this.score - 20);
                this.updateScore();

                // Reset cards after delay
                setTimeout(() => {
                    this.cardsGrid.children[firstIndex].classList.remove('flipped', 'wrong');
                    this.cardsGrid.children[secondIndex].classList.remove('flipped', 'wrong');
                }, 1500);
            }

            // Reset selection
            setTimeout(() => {
                this.selectedCards = [];
            }, 1500);
        }
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.endGame(false);
            }
        }, 1000);
    }

    updateTimer() {
        this.timerElement.textContent = this.timeLeft;
        const progress = (this.timeLeft / 30) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
    }

    endGame(won) {
        clearInterval(this.timer);
        this.gameStarted = false;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flashcardHighScore', this.highScore);
        }

        // Show end screen with appropriate message
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-high-score').textContent = this.highScore;
        
        const endMessage = won 
            ? `Congratulations! You matched all the animals with their sounds!<br>Score: ${this.score}`
            : `Time's up! You matched ${this.matchedPairs} pairs.<br>Score: ${this.score}`;
        
        document.getElementById('end-message').innerHTML = endMessage;
        
        this.gameScreen.classList.add('hidden');
        this.endScreen.classList.remove('hidden');

        // Setup share buttons
        const shareText = `I scored ${this.score} points in Animal Sound Cards! Can you beat my score? 🎮 Play now at`;
        const shareUrl = 'https://findhiddenanimals.com/flashcards.html';

        // Twitter share
        document.querySelector('.twitter').addEventListener('click', () => {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            window.open(twitterUrl, '_blank');
        });

        // Facebook share
        document.querySelector('.facebook').addEventListener('click', () => {
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
            window.open(facebookUrl, '_blank');
        });
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    const game = new FlashCardGame();
}); 