// public/sw.js

const DB_NAME = 'TradeSimulatorDB';
const DB_VERSION = 1;
const STATE_KEY = 'tradeSimulatorState';

const ROBOTS = [
  { id: 'risk-averse', pnlFactor: 0.4 },
  { id: 'balanced', pnlFactor: 0.7 },
  { id: 'high-growth', pnlFactor: 1.0 }
];
const INITIAL_BALANCE = 150;
const TRADING_TIME_LIMIT_SECONDS = 14400; // 4 hours
const TRADING_SYMBOLS = [
  'BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'Volkswagen', 'BMW', 'SpaceX', 'Samsung', 'Oil', 'Gold', 'Silver'
];

let state = {
  balance: INITIAL_BALANCE,
  trades: [],
  isRunning: false,
  selectedRobot: null,
  totalPnl: 0,
  tutorialCompleted: false,
  totalTradingTime: 0,
  timeLimit: TRADING_TIME_LIMIT_SECONDS,
  timeLimitReached: false,
};

let tradeTimeoutId = null;
let timerIntervalId = null;

// --- IndexedDB Functions ---
function openDB() {
  return new Promise((resolve, reject) => {
    const request = self.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STATE_KEY)) {
        db.createObjectStore(STATE_KEY);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveState() {
  openDB().then(db => {
    const transaction = db.transaction(STATE_KEY, 'readwrite');
    const store = transaction.objectStore(STATE_KEY);
    store.put(JSON.parse(JSON.stringify(state)), STATE_KEY);
  }).catch(err => console.error('Failed to save state to IndexedDB', err));
}

function loadState() {
  return new Promise((resolve, reject) => {
    openDB().then(db => {
      const transaction = db.transaction(STATE_KEY, 'readonly');
      const store = transaction.objectStore(STATE_KEY);
      const request = store.get(STATE_KEY);

      request.onsuccess = () => {
        if (request.result) {
          Object.assign(state, request.result);
          state.trades = state.trades.map(t => ({...t, timestamp: new Date(t.timestamp)}));
        }
        resolve();
      };
      request.onerror = () => {
        console.error('Failed to load state from IndexedDB', request.error);
        reject(request.error);
      };
    }).catch(reject);
  });
}

// --- Broadcast Function ---
function broadcastState(clientId) {
  const message = {
    type: 'STATE_UPDATE',
    payload: {
      ...state,
      trades: state.trades.map(t => ({ ...t, timestamp: t.timestamp.toISOString() }))
    }
  };
  if (clientId) {
    self.clients.get(clientId).then(client => {
      if (client) client.postMessage(message);
    });
  } else {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage(message));
    });
  }
}

// --- Simulator Logic ---
function generateTrade() {
  if (!state.isRunning || !state.selectedRobot) return;

  const robot = ROBOTS.find(r => r.id === state.selectedRobot.id);
  const pnlFactor = robot ? robot.pnlFactor : 1;
  const symbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];
  
  const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
  const quantity = Math.floor(Math.random() * 5) + 1;
  const entryPrice = Math.random() * 100 + 50;

  const tradeCost = quantity * entryPrice;
  if (state.balance < tradeCost && type === 'BUY') {
    return;
  }
  
  const priceChange = (Math.random() - 0.48) * 10 * pnlFactor;
  const exitPrice = entryPrice + priceChange;
  
  const pnl = (exitPrice - entryPrice) * quantity * (type === 'BUY' ? 1 : -1);
  
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
  if (state.trades.length > 50) {
    state.trades.pop();
  }

  state.balance += newTrade.pnl;
  state.totalPnl += newTrade.pnl;

  broadcastState();
  saveState();
}

function scheduleNextTrade() {
  if (!state.isRunning) return;
  const delay = Math.random() * 8000 + 4000;
  tradeTimeoutId = setTimeout(() => {
    generateTrade();
    scheduleNextTrade();
  }, delay);
}

function startTimer() {
  if (timerIntervalId) clearInterval(timerIntervalId);
  timerIntervalId = setInterval(() => {
    if (!state.isRunning) {
      clearInterval(timerIntervalId);
      return;
    }
    state.totalTradingTime += 1;
    if (state.totalTradingTime >= state.timeLimit) {
      state.isRunning = false;
      state.timeLimitReached = true;
      clearTimeout(tradeTimeoutId);
      clearInterval(timerIntervalId);
      saveState();
    }
    broadcastState();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
}

// --- Event Handlers ---
function handleReset(mode = 'normal') {
  clearTimeout(tradeTimeoutId);
  stopTimer();
  state.balance = INITIAL_BALANCE;
  state.trades = [];
  state.isRunning = false;
  state.selectedRobot = null;
  state.totalPnl = 0;
  state.totalTradingTime = 0;
  state.timeLimitReached = false;
  state.timeLimit = mode === 'demo' ? 10 : TRADING_TIME_LIMIT_SECONDS;
  broadcastState();
  saveState();
}

function handleSelectRobot(robot, shouldPause) {
  state.selectedRobot = robot;
  if (shouldPause) {
    state.isRunning = false;
    clearTimeout(tradeTimeoutId);
    stopTimer();
  }
  broadcastState();
  saveState();
}

function handleToggleSimulator() {
  if (!state.selectedRobot || state.timeLimitReached) return;
  state.isRunning = !state.isRunning;
  if (state.isRunning) {
    scheduleNextTrade();
    startTimer();
  } else {
    clearTimeout(tradeTimeoutId);
    stopTimer();
  }
  broadcastState();
  saveState();
}

// --- Service Worker Event Listeners ---
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    loadState().then(() => {
      if (state.isRunning) {
        startTimer();
        scheduleNextTrade();
      }
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'GET_STATE':
      broadcastState(event.source.id);
      break;
    case 'SELECT_ROBOT':
      handleSelectRobot(event.data.payload.robot, event.data.payload.shouldPause);
      break;
    case 'TOGGLE_SIMULATOR':
      handleToggleSimulator();
      break;
    case 'RESET_SIMULATOR':
      handleReset(event.data.payload.mode);
      break;
  }
});

self.addEventListener('fetch', () => {
  // This is a no-op but it's important to have a fetch handler
  // to make the service worker installable as a PWA and to keep it active.
  return;
});
