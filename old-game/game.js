// Game state
const state = {
    currentPlayer: 'green', // 'green' or 'yellow'
    scores: {
        green: 0,
        yellow: 0
    },
    revealedCards: [],
    gameOver: false,
    winScore: 6, // Vitória com 6 pontos!
    totalCards: 28, // 4 columns x 7 rows
    gameMode: null, // 'pvp' or 'pvc' (player vs computer)
    isComputerTurn: false
};

// Card types with their probabilities
const cardTypes = [
    { type: 'green', label: '💚', weight: 25 },
    { type: 'yellow', label: '💛', weight: 25 },
    { type: 'diamond', label: '💎', weight: 15 },
    { type: 'bomb', label: '💣', weight: 20 },
    { type: 'nuclear', label: '☢️', weight: 15 }
];

// Sound Effects System using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const sounds = {
    // Card flip sound
    flip: () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(800, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.1);
    },

    // Positive points sound (rising tone)
    positive: () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.25);
        gain.gain.setValueAtTime(0.4, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.3);
    },

    // Diamond bonus sound
    diamond: () => {
        [800, 1000, 1200, 1400].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.2);
            osc.start(audioContext.currentTime + i * 0.1);
            osc.stop(audioContext.currentTime + i * 0.1 + 0.2);
        });
    },

    // Bomb explosion sound
    explosion: () => {
        const noise = audioContext.createBufferSource();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.1));
        }
        noise.buffer = buffer;
        const gain = audioContext.createGain();
        noise.connect(gain);
        gain.connect(audioContext.destination);
        gain.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        noise.start(audioContext.currentTime);
    },

    // Nuclear explosion sound (longer, deeper)
    nuclear: () => {
        // Deep rumble
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 1);
        gain.gain.setValueAtTime(0.4, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 1);

        // White noise
        const noise = audioContext.createBufferSource();
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 1, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.2));
        }
        noise.buffer = buffer;
        const noiseGain = audioContext.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        noise.start(audioContext.currentTime);
    },

    // Victory fanfare
    victory: () => {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0, audioContext.currentTime + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + i * 0.15 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.4);
            osc.start(audioContext.currentTime + i * 0.15);
            osc.stop(audioContext.currentTime + i * 0.15 + 0.4);
        });
    }
};

// Resume audio context on first user interaction (required by browsers)
document.addEventListener('click', () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, { once: true });

// DOM elements
const elements = {
    grid: document.getElementById('game-grid'),
    scoreGreen: document.getElementById('score-green'),
    scoreYellow: document.getElementById('score-yellow'),
    turnIndicator: document.getElementById('turn-indicator'),
    turnDot: document.getElementById('turn-dot'),
    turnText: document.getElementById('turn-text'),
    modalOverlay: document.getElementById('modal-overlay'),
    winnerText: document.getElementById('winner-text'),
    winnerScore: document.getElementById('winner-score'),
    confettiContainer: document.getElementById('confetti-container'),
    newGameBtn: document.getElementById('new-game-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    resultPopup: document.getElementById('result-popup'),
    resultContent: document.getElementById('result-content'),
    resultPoints: document.getElementById('result-points'),
    explosionOverlay: document.getElementById('explosion-overlay'),
    modeOverlay: document.getElementById('mode-overlay'),
    pvpBtn: document.getElementById('pvp-btn'),
    pvcBtn: document.getElementById('pvc-btn'),
    player2Name: document.getElementById('player2-name'),
    onlineBtn: document.getElementById('online-btn'),
    onlineControls: document.getElementById('online-controls'),
    createRoomBtn: document.getElementById('create-room-btn'),
    joinRoomBtn: document.getElementById('join-room-btn'),
    roomCodeInput: document.getElementById('room-code-input'),
    roomStatus: document.getElementById('room-status')
};

// Show mode selection menu
function showModeMenu() {
    elements.modeOverlay.classList.add('active');
}

// Hide mode selection menu
function hideModeMenu() {
    elements.modeOverlay.classList.remove('active');
}

// Start game with selected mode
function startGame(mode) {
    state.gameMode = mode;
    hideModeMenu();

    // Update player 2 name based on mode
    if (mode === 'pvc') {
        elements.player2Name.textContent = '🤖 Máquina';
    } else {
        elements.player2Name.textContent = 'Jogador 2';
    }

    initGame();
}

// Initialize the game
function initGame() {
    state.currentPlayer = 'green';
    state.scores = { green: 0, yellow: 0 };
    state.revealedCards = [];
    state.gameOver = false;
    state.isComputerTurn = false;

    updateScores();
    updateTurnIndicator();
    createGrid();
    hideModal();
}

// Create the game grid (4x7 = 28 cards)
function createGrid() {
    elements.grid.innerHTML = '';

    for (let i = 0; i < state.totalCards; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <span class="card-front-icon">?</span>
                </div>
                <div class="card-back"></div>
            </div>
        `;
        card.addEventListener('click', () => handleCardClick(card, i));
        elements.grid.appendChild(card);
    }
}

// Get weighted random card type
function getRandomCardType() {
    const totalWeight = cardTypes.reduce((sum, card) => sum + card.weight, 0);
    let random = Math.random() * totalWeight;

    for (const card of cardTypes) {
        random -= card.weight;
        if (random <= 0) {
            return card;
        }
    }
    return cardTypes[0];
}

// Computer makes a move
function computerPlay() {
    if (state.gameOver || state.currentPlayer !== 'yellow') return;

    state.isComputerTurn = true;
    updateTurnIndicator();

    // Get available cards
    const availableCards = [];
    const cards = elements.grid.querySelectorAll('.card');
    cards.forEach((card, index) => {
        if (!state.revealedCards.includes(index) && !card.classList.contains('flipped')) {
            availableCards.push({ card, index });
        }
    });

    if (availableCards.length === 0) return;

    // Random delay to simulate "thinking" (800-1500ms)
    const thinkingTime = 800 + Math.random() * 700;

    setTimeout(() => {
        // Choose a random available card
        const choice = availableCards[Math.floor(Math.random() * availableCards.length)];
        handleCardClick(choice.card, choice.index);
        state.isComputerTurn = false;
    }, thinkingTime);
}

// Handle card click
function handleCardClick(card, index, fromRemote = false) {
    if (state.gameOver || state.revealedCards.includes(index) || card.classList.contains('flipped')) {
        return;
    }

    // Online Check
    if (state.gameMode === 'online') {
        if (!fromRemote) {
            // Local User Click checking
            if (state.currentPlayer !== state.myPlayerColor) return; // Not my turn

            // If it is my turn, send move to server and DO NOT PROCESS locally yet (wait for echo or optimistic?)
            // We will execute logically here, but we need to tell server
            // But wait, we need to know the RESULT (card type).
            // If Host, we know it from state.serverBoard.
            // If Client, we know it from line 287 (random?).
            // FIX: We must use state.serverBoard[index] instead of random!

            // Emit move
            // To prevent double execution, we proceed only if logic allows
        }
    }

    // Block human clicks when it's computer's turn
    if (state.gameMode === 'pvc' && state.currentPlayer === 'yellow' && !state.isComputerTurn) {
        return;
    }

    // Determine Result
    let result;
    if (state.gameMode === 'online') {
        // Use pre-determined board
        if (state.serverBoard && state.serverBoard[index]) {
            // Find the cardType object matching the string type
            result = cardTypes.find(c => c.type === state.serverBoard[index]);
        } else {
            // Fallback
            result = getRandomCardType();
        }

        // If local click, notify server
        if (!fromRemote) {
            socket.emit('makeMove', { index: index, cardType: result.type });
        }
    } else {
        // Local/PVC Random
        result = getRandomCardType();
    }

    // Setup the back of the card
    const cardBack = card.querySelector('.card-back');
    cardBack.className = 'card-back ' + result.type;
    cardBack.textContent = result.label;

    // Flip the card
    card.classList.add('flipped');
    card.classList.add('disabled');
    state.revealedCards.push(index);

    // Play flip sound
    sounds.flip();

    // Calculate points and determine who gets them
    let pointsForCurrent = 0;
    let pointsForOpponent = 0;
    const opponent = state.currentPlayer === 'green' ? 'yellow' : 'green';

    if (result.type === 'green') {
        if (state.currentPlayer === 'green') {
            pointsForCurrent = 1; // My color = I get point
        } else {
            pointsForOpponent = 1; // Green's color = green gets point
        }
    } else if (result.type === 'yellow') {
        if (state.currentPlayer === 'yellow') {
            pointsForCurrent = 1; // My color = I get point
        } else {
            pointsForOpponent = 1; // Yellow's color = yellow gets point
        }
    } else if (result.type === 'diamond') {
        pointsForCurrent = 2; // Diamond = +2 for current player
    } else if (result.type === 'bomb') {
        pointsForCurrent = -1; // Bomb = -1 for current player
    } else if (result.type === 'nuclear') {
        pointsForCurrent = -2; // Nuclear = -2 for current player
    }

    // Show animations and sounds
    setTimeout(() => {
        if (result.type === 'bomb') {
            showExplosion('bomb');
            sounds.explosion();
        } else if (result.type === 'nuclear') {
            showExplosion('nuclear');
            sounds.nuclear();
        } else if (result.type === 'diamond') {
            sounds.diamond();
        } else if (pointsForCurrent > 0 || pointsForOpponent > 0) {
            sounds.positive();
        }

        showResultPopup(result, pointsForCurrent, pointsForOpponent, opponent);
    }, 400);

    // Update scores
    state.scores[state.currentPlayer] += pointsForCurrent;
    if (state.scores[state.currentPlayer] < 0) {
        state.scores[state.currentPlayer] = 0;
    }

    state.scores[opponent] += pointsForOpponent;

    // Update display after animation
    setTimeout(() => {
        updateScores();

        // Check for winner
        if (state.scores[state.currentPlayer] >= state.winScore) {
            state.gameOver = true;
            setTimeout(() => showVictory(state.currentPlayer), 500);
            return;
        }

        if (state.scores[opponent] >= state.winScore) {
            state.gameOver = true;
            setTimeout(() => showVictory(opponent), 500);
            return;
        }

        // Check if all cards revealed
        if (state.revealedCards.length >= state.totalCards) {
            state.gameOver = true;
            const winner = state.scores.green > state.scores.yellow ? 'green' :
                state.scores.yellow > state.scores.green ? 'yellow' : null;
            if (winner) {
                setTimeout(() => showVictory(winner), 500);
            } else {
                // Tie - restart game
                setTimeout(() => initGame(), 1000);
            }
            return;
        }

        // Switch player
        switchPlayer();

        // If it's PvC mode and now yellow's turn, computer plays
        if (state.gameMode === 'pvc' && state.currentPlayer === 'yellow') {
            setTimeout(() => computerPlay(), 500);
        }
    }, 1500);
}

// Show explosion animation
function showExplosion(type) {
    const overlay = elements.explosionOverlay;
    overlay.className = 'explosion-overlay ' + type + ' active';
    overlay.innerHTML = type === 'nuclear' ? '☢️💥' : '💥';

    setTimeout(() => {
        overlay.classList.remove('active');
    }, 1000);
}

// Show result popup
function showResultPopup(result, pointsForCurrent, pointsForOpponent, opponent) {
    const popup = elements.resultPopup;
    const content = elements.resultContent;
    const points = elements.resultPoints;

    content.textContent = result.label;
    content.className = 'result-content ' + result.type;

    let pointsText = '';
    if (pointsForCurrent !== 0) {
        const sign = pointsForCurrent > 0 ? '+' : '';
        let playerName;
        if (state.currentPlayer === 'green') {
            playerName = 'J1';
        } else {
            playerName = state.gameMode === 'pvc' ? '🤖' : 'J2';
        }
        pointsText = `${playerName}: ${sign}${pointsForCurrent}`;
    }
    if (pointsForOpponent > 0) {
        let opponentName;
        if (opponent === 'green') {
            opponentName = 'J1';
        } else {
            opponentName = state.gameMode === 'pvc' ? '🤖' : 'J2';
        }
        if (pointsText) pointsText += ' | ';
        pointsText += `${opponentName}: +${pointsForOpponent}`;
    }

    points.textContent = pointsText;
    points.className = 'result-points ' + (pointsForCurrent >= 0 ? 'positive' : 'negative');

    popup.classList.add('active');
    setTimeout(() => {
        popup.classList.remove('active');
    }, 1200);
}

// Switch to next player
function switchPlayer() {
    state.currentPlayer = state.currentPlayer === 'green' ? 'yellow' : 'green';
    updateTurnIndicator();
}

// Update score display
function updateScores() {
    elements.scoreGreen.textContent = state.scores.green;
    elements.scoreYellow.textContent = state.scores.yellow;

    // Add pulse animation
    if (state.currentPlayer === 'green') {
        elements.scoreGreen.classList.add('pulse');
        setTimeout(() => elements.scoreGreen.classList.remove('pulse'), 500);
    } else {
        elements.scoreYellow.classList.add('pulse');
        setTimeout(() => elements.scoreYellow.classList.remove('pulse'), 500);
    }
}

// Update turn indicator
function updateTurnIndicator() {
    elements.turnIndicator.className = 'turn-indicator ' + state.currentPlayer + '-turn';
    elements.turnDot.className = 'turn-dot ' + state.currentPlayer;

    if (state.currentPlayer === 'green') {
        elements.turnText.textContent = 'Vez do Jogador 1 (Verde)';
    } else {
        if (state.gameMode === 'pvc') {
            if (state.isComputerTurn) {
                elements.turnText.textContent = '🤖 Máquina pensando...';
                elements.turnText.classList.add('computer-thinking');
            } else {
                elements.turnText.textContent = 'Vez da Máquina 🤖';
                elements.turnText.classList.remove('computer-thinking');
            }
        } else {
            elements.turnText.textContent = 'Vez do Jogador 2 (Amarelo)';
        }
    }
}

// Show victory modal
function showVictory(winner) {
    let winnerName;
    if (winner === 'green') {
        winnerName = 'Jogador 1 (Verde)';
    } else {
        winnerName = state.gameMode === 'pvc' ? 'Máquina 🤖' : 'Jogador 2 (Amarelo)';
    }

    elements.winnerText.textContent = `${winnerName} Venceu!`;
    elements.winnerText.className = winner + '-winner';
    elements.winnerScore.textContent = `${state.scores[winner]} pontos`;

    elements.modalOverlay.classList.add('active');
    createConfetti();

    // Play victory fanfare
    sounds.victory();
}

// Hide victory modal
function hideModal() {
    elements.modalOverlay.classList.remove('active');
    elements.confettiContainer.innerHTML = '';
}

// Create confetti effect
function createConfetti() {
    const colors = ['#009739', '#FEDD00', '#002776', '#ffffff', '#00c04b'];

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        elements.confettiContainer.appendChild(confetti);
    }
}

// Event listeners
elements.newGameBtn.addEventListener('click', showModeMenu);
elements.playAgainBtn.addEventListener('click', () => {
    hideModal();
    showModeMenu();
});
elements.pvpBtn.addEventListener('click', () => startGame('pvp'));
elements.pvcBtn.addEventListener('click', () => startGame('pvc'));

// Socket.io initialization
const socket = io({ autoConnect: false });
let roomCode = null;

socket.on('connect', () => {
    console.log('Connected to server');
    elements.roomStatus.textContent = 'Conectado ao servidor!';
});

socket.on('roomCreated', (data) => {
    roomCode = data.roomCode;
    elements.roomStatus.textContent = `Sala criada! Código: ${roomCode}. Aguardando oponente...`;
    elements.roomCodeInput.value = roomCode;
    state.myPlayerColor = 'green'; // Host is always green
});

socket.on('roomJoined', (data) => {
    roomCode = data.roomCode;
    elements.roomStatus.textContent = `Entrou na sala ${roomCode}! Aguardando início...`;
    state.myPlayerColor = 'yellow'; // Joiner is always yellow
});

socket.on('error', (msg) => {
    elements.roomStatus.textContent = `Erro: ${msg}`;
    elements.roomStatus.style.color = '#ff4444';
});

socket.on('playerJoined', () => {
    elements.roomStatus.textContent = 'Oponente conectado! Iniciando...';
    // Host generates board and sends it
    // We reuse the existing random generation but now we share it
    // Actually, simple way: Host generates specific card types for indices 0-27
    const boardData = [];
    for (let i = 0; i < state.totalCards; i++) {
        boardData.push(getRandomCardType().type);
    }
    socket.emit('startGame', boardData);
});

socket.on('gameStart', (boardData) => {
    state.serverBoard = boardData; // Store fixed board
    state.gameMode = 'online';
    hideModeMenu();
    elements.player2Name.textContent = 'Oponente Online';
    initGame();
});

socket.on('remoteMove', (data) => {
    // data = { index, cardType, player }
    const cards = elements.grid.querySelectorAll('.card');
    handleCardClick(cards[data.index], data.index, true);
});

socket.on('playerLeft', () => {
    alert('Oponente desconectou!');
    location.reload();
});


// Online UI Listeners
elements.onlineBtn.addEventListener('click', () => {
    elements.onlineControls.style.display = 'flex';
    socket.connect();
});

elements.createRoomBtn.addEventListener('click', () => {
    socket.emit('createRoom');
    elements.roomStatus.textContent = 'Criando sala...';
});

elements.joinRoomBtn.addEventListener('click', () => {
    const code = elements.roomCodeInput.value.trim().toUpperCase();
    if (code) {
        socket.emit('joinRoom', code);
        elements.roomStatus.textContent = 'Entrando...';
    }
});

// Start by showing mode menu
showModeMenu();
