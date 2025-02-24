import { ANIMALS } from './animals/config.js';

class AnimalMatchGame {
    constructor() {
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('animalMatchHighScore')) || 0;
        this.timeLeft = 30;
        this.timer = null;
        this.cards = [];
        this.selectedCards = [];
        this.matchedPairs = 0;
        this.isHardMode = false;

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
        document.getElementById('start-button').addEventListener('click', () => this.startNewGame());
        document.getElementById('play-again').addEventListener('click', () => this.startGame());
        document.getElementById('restart-button').addEventListener('click', () => this.startGame());
        document.getElementById('easy-mode').addEventListener('click', () => this.setDifficulty(false));
        document.getElementById('hard-mode').addEventListener('click', () => this.setDifficulty(true));

        // Add share button listeners
        document.querySelector('.twitter').addEventListener('click', () => this.shareOnTwitter());
        document.querySelector('.facebook').addEventListener('click', () => this.shareOnFacebook());
        document.querySelector('.copy-link').addEventListener('click', () => this.copyLink());

        // Initialize display
        this.updateScore();
    }

    setDifficulty(isHard) {
        this.isHardMode = isHard;
        this.timeLeft = isHard ? 30 : 60;
        document.getElementById('easy-mode').classList.toggle('active', !isHard);
        document.getElementById('hard-mode').classList.toggle('active', isHard);
        document.getElementById('easy-description').classList.toggle('hidden', isHard);
        document.getElementById('hard-description').classList.toggle('hidden', !isHard);
    }

    startGame() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.score = 0;
        this.timeLeft = this.isHardMode ? 30 : 60;
        this.matchedPairs = 0;
        this.selectedCards = [];
        this.cards = [];
        this.cardsGrid.innerHTML = '';
        
        this.startScreen.classList.remove('hidden');
        this.endScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        
        this.updateScore();
        this.updateTimer();
    }

    startNewGame() {
        this.startScreen.classList.add('hidden');
        this.endScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        this.createCards();
        this.startTimer();
        
        this.updateScore();
        this.updateTimer();
    }

    createCards() {
        // Get first 6 animals for 12 cards (6 pairs)
        const gameAnimals = Object.values(ANIMALS).slice(0, 6);
        
        let cardPairs = [];
        gameAnimals.forEach(animal => {
            // Create two identical cards for each animal
            for (let i = 0; i < 2; i++) {
                cardPairs.push({
                    name: animal.name,
                    content: `<img src="${animal.sprite}" alt="${animal.name}"><div>${animal.name}</div>`
                });
            }
        });

        this.cards = cardPairs.sort(() => Math.random() - 0.5);

        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                <div class="card-front"><i class="fas fa-question"></i></div>
                <div class="card-back">${card.content}</div>
            `;
            cardElement.dataset.index = index;
            cardElement.addEventListener('click', () => this.handleCardClick(index));
            this.cardsGrid.appendChild(cardElement);
        });
    }

    handleCardClick(index) {
        const cardElement = this.cardsGrid.children[index];
        const card = this.cards[index];

        if (cardElement.classList.contains('matched') || 
            this.selectedCards.includes(index) ||
            this.selectedCards.length >= 2) {
            return;
        }

        this.selectedCards.push(index);
        cardElement.classList.add('flipped');

        if (this.selectedCards.length === 2) {
            const [firstIndex, secondIndex] = this.selectedCards;
            const firstCard = this.cards[firstIndex];
            const secondCard = this.cards[secondIndex];

            if (firstCard.name === secondCard.name) {
                this.matchedPairs++;
                
                if (this.matchedPairs === 6) {
                    // Stop timer and update game state
                    clearInterval(this.timer);
                    this.timer = null;
                    
                    // Calculate final score with time bonus
                    const timeBonus = Math.floor(this.timeLeft * (this.isHardMode ? 10 : 5));
                    this.score += this.isHardMode ? 200 : 100;
                    this.score += timeBonus;
                    this.updateScore();
                    
                    this.endGame(true);
                    return;
                }
                
                setTimeout(() => {
                    this.cardsGrid.children[firstIndex].classList.add('matched');
                    this.cardsGrid.children[secondIndex].classList.add('matched');
                }, 500);
                
                this.score += this.isHardMode ? 200 : 100;
                this.updateScore();
            } else {
                setTimeout(() => {
                    this.cardsGrid.children[firstIndex].classList.remove('flipped');
                    this.cardsGrid.children[secondIndex].classList.remove('flipped');
                }, 1000);
                
                this.score = Math.max(0, this.score - (this.isHardMode ? 40 : 20));
                this.updateScore();
            }

            setTimeout(() => {
                this.selectedCards = [];
            }, 1000);
        }
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.timer = null;
                this.endGame(false);
            }
        }, 1000);
    }

    updateTimer() {
        this.timerElement.textContent = this.timeLeft;
        const progress = (this.timeLeft / (this.isHardMode ? 30 : 60)) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
    }

    endGame(won) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('animalMatchHighScore', this.highScore);
        }

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-high-score').textContent = this.highScore;
        
        const endMessage = won 
            ? `Congratulations! You matched all the animal pairs!<br>Score: ${this.score}`
            : `Time's up! You matched ${this.matchedPairs} pairs.<br>Score: ${this.score}`;
        
        document.getElementById('end-message').innerHTML = endMessage;
        
        this.gameScreen.classList.add('hidden');
        this.endScreen.classList.remove('hidden');
    }

    shareOnTwitter() {
        const text = `I matched ${this.matchedPairs} animal pairs and scored ${this.score} points in Animal Match! Can you beat my score?`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`);
    }

    shareOnFacebook() {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`);
    }

    copyLink() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Link copied to clipboard!');
        });
    }
}

// Initialize game
new AnimalMatchGame();

// Add CSS styles for flipped cards
const style = document.createElement('style');
style.textContent = `
    .card {
        cursor: pointer;
        transform-style: preserve-3d;
        transition: transform 0.6s;
    }
    
    .card.flipped {
        transform: rotateY(180deg);
    }
    
    .card-front {
        transform: rotateY(180deg);
        background: white;
    }
    
    .card-back {
        background: #4CAF50;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2em;
    }
    
    .card.matched {
        animation: matchPulse 0.5s ease-out;
    }
    
    @keyframes matchPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Add scroll behavior for header and footer
document.addEventListener('DOMContentLoaded', () => {
    let lastScrollY = window.scrollY;
    const nav = document.querySelector('.game-nav');
    const footer = document.querySelector('.site-footer');

    window.addEventListener('scroll', () => {
        // For header: hide on scroll down, show on scroll up
        if (window.scrollY > lastScrollY) {
            nav?.classList.add('nav-hidden');
        } else {
            nav?.classList.remove('nav-hidden');
        }
        
        // For footer: only show when scrolled to bottom
        const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight;
        if (isAtBottom) {
            footer?.classList.remove('footer-hidden');
        } else {
            footer?.classList.add('footer-hidden');
        }

        lastScrollY = window.scrollY;
    });
}); 