// public/sw.js

const CACHE_NAME = 'trade-simulator-cache-v1';
const urlsToCache = [
    '/',
    '/manifest.json',
    '/pwa-192x192.png',
];

const INITIAL_BALANCE = 150;
const TRADING_TIME_LIMIT_SECONDS = 14400; // 4 hours

const TRADING_SYMBOLS = [
  'BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'Volkswagen', 'BMW', 
  'SpaceX', 'Samsung', 'Oil', 'Gold', 'Silver'
];

const ROBOTS = [
  // min/maxInterval in ms
  { id: 'risk-averse', minInterval: 15000, maxInterval: 30000, pnlFactor: 1.05, winChance: 0.6 },
  { id: 'balanced', minInterval: 10000, maxInterval: 20000, pnlFactor: 1.15, winChance: 0.5 },
  { id: 'high-growth', minInterval: 5000, maxInterval: 15000, pnlFactor: 1.3, winChance: 0.4 },
];

let state = {
    balance: INITIAL_BALANCE,
    trades: [],
    isRunning: false,
    selectedRobot: null,
    totalPnl: 0,
    totalTradingTime: 0,
    timeLimit: TRADING_TIME_LIMIT_SECONDS,
    timeLimitReached: false,
};

let simulationInterval = null;
let timerInterval = null;

// --- Service Worker Lifecycle ---

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Cache-first strategy
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// --- Communication & State Management ---

self.addEventListener('message', (event) => {
    switch (event.data.type) {
        case 'GET_STATE':
            broadcastState(event.source);
            break;
        case 'SELECT_ROBOT':
            selectRobot(event.data.payload.robot, event.data.payload.shouldPause);
            break;
        case 'TOGGLE_SIMULATOR':
            toggleSimulator();
            break;
        case 'RESET_SIMULATOR':
            resetSimulator(event.data.payload.mode);
            break;
    }
});

function broadcastState(client = null) {
    const message = {
        type: 'STATE_UPDATE',
        payload: {
            ...state,
            trades: state.trades.map(t => ({...t, timestamp: t.timestamp.toISOString()}))
        },
    };

    if (client) {
        client.postMessage(message);
    } else {
        self.clients.matchAll().then((clients) => {
            clients.forEach((c) => c.postMessage(message));
        });
    }
}

// --- Simulation Logic ---

function selectRobot(robot, shouldPause) {
    state.selectedRobot = ROBOTS.find(r => r.id === robot.id);
    if (shouldPause) {
        stopSimulator();
    }
    broadcastState();
}

function toggleSimulator() {
    if (state.timeLimitReached || !state.selectedRobot) return;

    if (state.isRunning) {
        stopSimulator();
    } else {
        startSimulator();
    }
}

function startSimulator() {
    if (state.isRunning || !state.selectedRobot || state.timeLimitReached) return;
    state.isRunning = true;
    
    if (!timerInterval) {
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    runSimulation();
    broadcastState();
}

function stopSimulator() {
    if (!state.isRunning) return;
    state.isRunning = false;

    if (simulationInterval) {
        clearTimeout(simulationInterval);
        simulationInterval = null;
    }
    
    broadcastState();
}

function resetSimulator(mode = 'normal') {
    stopSimulator();

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    state.balance = INITIAL_BALANCE;
    state.trades = [];
    state.isRunning = false;
    state.selectedRobot = null;
    state.totalPnl = 0;
    state.totalTradingTime = 0;
    state.timeLimit = mode === 'demo' ? 10 : TRADING_TIME_LIMIT_SECONDS;
    state.timeLimitReached = false;
    broadcastState();
}

function updateTimer() {
    if (state.isRunning) {
        state.totalTradingTime++;
        if (state.totalTradingTime >= state.timeLimit) {
            state.timeLimitReached = true;
            stopSimulator();
        }
    }
    broadcastState();
}

function runSimulation() {
    if (!state.isRunning || !state.selectedRobot || state.timeLimitReached) {
        if (simulationInterval) clearTimeout(simulationInterval);
        simulationInterval = null;
        return;
    }

    createTrade();
    
    const randomInterval = Math.random() * (state.selectedRobot.maxInterval - state.selectedRobot.minInterval) + state.selectedRobot.minInterval;
    simulationInterval = setTimeout(runSimulation, randomInterval);
}

function createTrade() {
    if (!state.selectedRobot) return;

    const symbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];
    const type = Math.random() < 0.5 ? 'BUY' : 'SELL';
    const quantity = Math.floor(Math.random() * 5) + 1;
    const entryPrice = Math.random() * 100 + 50;
    const tradeAmount = entryPrice * quantity;

    if (type === 'BUY' && state.balance < tradeAmount) {
        return;
    }

    const isWin = Math.random() < state.selectedRobot.winChance;
    const pnlMagnitude = tradeAmount * (state.selectedRobot.pnlFactor - 1) * (Math.random() * 0.5 + 0.5);
    const pnl = isWin ? pnlMagnitude : -pnlMagnitude;

    if (state.balance + pnl < 0) {
      return; 
    }

    let exitPrice;
    if (type === 'BUY') {
        exitPrice = (tradeAmount + pnl) / quantity;
    } else { // SELL
        exitPrice = (tradeAmount - pnl) / quantity;
    }

    const newTrade = {
        id: Date.now().toString() + Math.random().toString(),
        symbol,
        type,
        quantity,
        entryPrice,
        exitPrice,
        pnl,
        timestamp: new Date(),
    };

    state.trades.unshift(newTrade);
    state.balance += pnl;
    state.totalPnl += pnl;

    broadcastState();
}
