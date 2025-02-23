import { ANIMALS, ANIMAL_FACTS_CLEAN } from './animals/config.js';

class FactCardGame {
    constructor() {
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('factcardHighScore')) || 0;
        this.easyHighScore = parseInt(localStorage.getItem('factcardEasyHighScore')) || 0;
        this.hardHighScore = parseInt(localStorage.getItem('factcardHardHighScore')) || 0;
        this.timeLeft = 60;
        this.timer = null;
        this.cards = [];
        this.selectedCards = [];
        this.matchedPairs = 0;
        this.difficulty = 'easy'; // default mode

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
        document.getElementById('restart-button').addEventListener('click', () => this.startGame());
        document.getElementById('easy-mode').addEventListener('click', () => this.setDifficulty('easy'));
        document.getElementById('hard-mode').addEventListener('click', () => this.setDifficulty('hard'));

        // Initialize display
        this.updateScore();
        this.setDifficulty('easy');
    }

    setDifficulty(mode) {
        this.difficulty = mode;
        this.timeLeft = mode === 'easy' ? 60 : 30;
        
        // Update UI to show active mode
        document.getElementById('easy-mode').classList.toggle('active', mode === 'easy');
        document.getElementById('hard-mode').classList.toggle('active', mode === 'hard');
        
        // Update high score display based on mode
        this.highScore = mode === 'easy' ? 
            parseInt(localStorage.getItem('factcardEasyHighScore')) || 0 :
            parseInt(localStorage.getItem('factcardHardHighScore')) || 0;
        this.updateScore();
    }

    startGame() {
        // Reset game state
        this.score = 0;
        this.timeLeft = this.difficulty === 'easy' ? 60 : 30;
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
        // Create pairs of cards (animal + fact)
        let cardPairs = [];
        Object.entries(ANIMALS).forEach(([key, animal]) => {
            // Add animal card
            cardPairs.push({
                type: 'animal',
                content: `<img src="${animal.sprite}" alt="${animal.name}">
                         <div>${animal.name}</div>`,
                match: animal.name
            });

            // Add fact card using clean facts
            const facts = ANIMAL_FACTS_CLEAN[key];
            const fact = facts[Math.floor(Math.random() * facts.length)];
            cardPairs.push({
                type: 'fact',
                content: `<div class="fact-card">${fact}</div>`,
                match: animal.name
            });
        });

        // Shuffle and slice to get 6 pairs
        this.cards = cardPairs
            .sort(() => Math.random() - 0.5)
            .slice(0, 12);

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

        // Ignore if card is already matched or selected
        if (cardElement.classList.contains('matched') || 
            this.selectedCards.includes(index) ||
            this.selectedCards.length >= 2) {
            return;
        }

        // Add to selected cards
        this.selectedCards.push(index);
        cardElement.classList.add('flipped');

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
        
        // Calculate bonus points for remaining time
        if (won) {
            const timeBonus = Math.floor(this.timeLeft * 5); // 5 points per second remaining
            this.score += timeBonus;
        }
        
        // Update appropriate high score based on difficulty
        const highScoreKey = this.difficulty === 'easy' ? 'factcardEasyHighScore' : 'factcardHardHighScore';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem(highScoreKey, this.highScore);
        }

        // Show end screen with appropriate message
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-high-score').textContent = this.highScore;
        
        const endMessage = won 
            ? `Congratulations! You matched all the animals with their facts!<br>
               Score: ${this.score}<br>
               ${this.timeLeft > 0 ? `Time Bonus: ${Math.floor(this.timeLeft * 5)} points!` : ''}`
            : `Time's up! You matched ${this.matchedPairs} pairs.<br>Score: ${this.score}`;
        
        document.getElementById('end-message').innerHTML = endMessage;
        
        this.gameScreen.classList.add('hidden');
        this.endScreen.classList.remove('hidden');
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    const game = new FactCardGame();
}); 