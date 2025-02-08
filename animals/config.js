const ANIMAL_FACTS = {
    cow: [
        "Cows can sleep while standing up!",
        "Cows have 40,000 jaw movements a day!",
        "A cow can climb up stairs but not down!",
        "Cows have best friends and get stressed when separated!",
        "Cows can smell things up to 6 miles away!",
        "Cows have 360-degree panoramic vision!",
        "Each cow has a unique nose print, like human fingerprints!",
        "Cows can recognize over 100 other cows' faces!",
        "Cows are excellent swimmers!"
    ],
    sheep: [
        "Sheep have excellent memory and can remember up to 50 faces!",
        "A sheep's wool never stops growing!",
        "Sheep have rectangular pupils that give them 320° vision!",
        "Baby sheep can walk within minutes of being born!",
        "Sheep are as intelligent as dogs and can solve problems!"
    ],
    chicken: [
        "Chickens can remember over 100 different faces!",
        "Chickens dream just like humans!",
        "Mother hens talk to their chicks while still in the egg!",
        "Chickens can run up to 9 miles per hour!",
        "Chickens have better color vision than humans!"
    ],
    pig: [
        "Pigs are considered the 4th most intelligent animal!",
        "Pigs can run at speeds of up to 11mph!",
        "Pigs can dream, just like humans!",
        "A pig's squeal can reach 115 decibels!",
        "Pigs are excellent swimmers!"
    ],
    horse: [
        "Horses can sleep both lying down and standing up!",
        "Horses can run shortly after birth!",
        "Horses have nearly 360-degree vision!",
        "A horse's brain weighs half as much as a human brain!",
        "Horses can't breathe through their mouth!"
    ]
};

const ANIMALS = {
    cow: {
        name: 'Cow',
        level: 1,
        sprite: 'animals/cow/animal.png',
        sounds: {
            bell: 'animals/cow/sounds/bell.mp3',
            found: 'animals/cow/sounds/moo.mp3'
        },
        size: { width: 100, height: 100 },
        unlockRequirement: 0, // Available from start
        difficulty: {
            moveSpeed: 0,
            searchRadius: 50,
            scoreMultiplier: 1,
            soundRange: { min: 0.02, max: 1 } // Increased sound range
        },
        background: '#87CEEB', // Sky blue
        facts: ANIMAL_FACTS.cow
    },
    sheep: {
        name: 'Sheep',
        level: 2,
        sprite: 'animals/sheep/animal.png',
        sounds: {
            bell: 'animals/sheep/sounds/bell.mp3',
            found: 'animals/sheep/sounds/baa.mp3'
        },
        size: { width: 90, height: 90 },
        unlockRequirement: 5, // Need 5 cow finds
        difficulty: {
            moveSpeed: 0.1,
            searchRadius: 45,
            scoreMultiplier: 1.2,
            soundRange: { min: 0.01, max: 0.9 }
        },
        background: '#90EE90',
        facts: ANIMAL_FACTS.sheep
    },
    chicken: {
        name: 'Chicken',
        level: 3,
        sprite: 'animals/chicken/animal.png',
        sounds: {
            bell: 'animals/chicken/sounds/bell.mp3',
            found: 'animals/chicken/sounds/cluck.mp3'
        },
        size: { width: 70, height: 70 },
        unlockRequirement: 5, // Need 5 sheep finds
        difficulty: {
            moveSpeed: 0,
            searchRadius: 35,
            scoreMultiplier: 1.5,
            soundRange: { min: 0.01, max: 0.8 }
        },
        background: '#DEB887',
        facts: ANIMAL_FACTS.chicken
    },
    pig: {
        name: 'Pig',
        level: 4,
        sprite: 'animals/pig/animal.png',
        sounds: {
            bell: 'animals/pig/sounds/bell.mp3',
            found: 'animals/pig/sounds/oink.mp3'
        },
        size: { width: 85, height: 85 },
        unlockRequirement: 5, // Need 5 chicken finds
        difficulty: {
            moveSpeed: 0.2,
            searchRadius: 40,
            scoreMultiplier: 1.8,
            soundRange: { min: 0.005, max: 0.7 }
        },
        background: '#DDA0DD',
        facts: ANIMAL_FACTS.pig
    },
    horse: {
        name: 'Horse',
        level: 5,
        sprite: 'animals/horse/animal.png',
        sounds: {
            bell: 'animals/horse/sounds/bell.mp3',
            found: 'animals/horse/sounds/neigh.mp3'
        },
        size: { width: 110, height: 110 },
        unlockRequirement: 5, // Need 5 pig finds
        difficulty: {
            moveSpeed: 0.3,
            searchRadius: 30,
            scoreMultiplier: 2,
            soundRange: { min: 0.001, max: 0.6 }
        },
        background: '#F4A460',
        facts: ANIMAL_FACTS.horse
    }
};

// Progress tracking functions
const Progress = {
    getFinds: (animal) => {
        return parseInt(localStorage.getItem(`${animal}_finds`) || '0');
    },

    incrementFinds: (animal) => {
        const finds = Progress.getFinds(animal);
        localStorage.setItem(`${animal}_finds`, finds + 1);
        return finds + 1;
    },

    getHighScore: (animal) => {
        return parseInt(localStorage.getItem(`${animal}_highscore`) || '0');
    },

    setHighScore: (animal, score) => {
        const currentHigh = Progress.getHighScore(animal);
        if (score > currentHigh) {
            localStorage.setItem(`${animal}_highscore`, score);
            return true;
        }
        return false;
    },

    isUnlocked: (animal) => {
        if (animal === 'cow') return true;
        const previousAnimal = Object.keys(ANIMALS).find(key => 
            ANIMALS[key].level === ANIMALS[animal].level - 1
        );
        return Progress.getFinds(previousAnimal) >= ANIMALS[animal].unlockRequirement;
    },

    getNextUnlock: () => {
        for (const [animal, config] of Object.entries(ANIMALS)) {
            if (!Progress.isUnlocked(animal)) {
                const previousAnimal = Object.keys(ANIMALS).find(key => 
                    ANIMALS[key].level === config.level - 1
                );
                const currentFinds = Progress.getFinds(previousAnimal);
                return {
                    animal,
                    required: config.unlockRequirement,
                    current: currentFinds,
                    previous: previousAnimal
                };
            }
        }
        return null; // All animals unlocked
    }
};

export { ANIMALS, Progress }; 