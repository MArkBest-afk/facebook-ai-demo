
const INITIAL_BALANCE = 150;
const TRADING_TIME_LIMIT_SECONDS = 14400;
const TRADING_SYMBOLS = [
  'BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'Volkswagen', 'BMW',
  'SpaceX', 'Samsung', 'Oil', 'Gold', 'Silver'
];
const SIMULATOR_STATE_KEY = 'tradeSimulatorState';
const TUTORIAL_STORAGE_KEY = 'tradeSimulatorTutorialCompleted';

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

let timerInterval = null;
let tradeTimeout = null;

function saveState() {
  try {
    self.localStorage.setItem(SIMULATOR_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Service Worker: Failed to save state', e);
  }
}

function loadState() {
  try {
    const savedStateJSON = self.localStorage.getItem(SIMULATOR_STATE_KEY);
    if (savedStateJSON) {
      const savedState = JSON.parse(savedStateJSON);
      
      if (savedState.totalTradingTime >= savedState.timeLimit) {
        savedState.isRunning = false;
        savedState.timeLimitReached = true;
      }
      
      state = { ...state, ...savedState };
    }
  } catch (e) {
    console.error('Service Worker: Failed to load state', e);
  }
}

async function broadcastState() {
  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: 'window',
  });
  clients.forEach(client => {
    client.postMessage({ type: 'STATE_UPDATE', payload: state });
  });
}

function runTradeCycle() {
    if (!state.isRunning || !state.selectedRobot || state.timeLimitReached) return;
    
    const fourHourMark = 4 * 3600;
    const progress = Math.min(state.totalTradingTime / fourHourMark, 1);

    const targetPnlMap = {
      'risk-averse': 30 + progress * 5,
      'balanced': 36 + progress * 9,
      'high-growth': 46 + progress * 9,
    };

    const targetPnl = targetPnlMap[state.selectedRobot.id];
    const pnlDiscrepancy = targetPnl - state.totalPnl;

    let profitProbability = 0.65;
    if (pnlDiscrepancy > 5) {
      profitProbability = 0.85;
    } 
    else if (pnlDiscrepancy < -5) {
      profitProbability = 0.45;
    }

    const isProfitable = Math.random() < profitProbability;
    
    let pnl;
    if (isProfitable) {
      pnl = (0.05 + Math.random() * 0.15);
    } else {
      pnl = -(0.03 + Math.random() * 0.08);
    }
    
    const quantity = 1;
    const entryPrice = 100 + (Math.random() - 0.5) * 10;
    const exitPrice = entryPrice + pnl;
    const randomSymbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];

    const newTrade = {
      id: new Date().toISOString() + Math.random(),
      symbol: randomSymbol,
      type: pnl > 0 ? 'BUY' : 'SELL',
      quantity,
      entryPrice,
      exitPrice,
      pnl,
      timestamp: new Date().toJSON(),
    };
    
    state.trades = [newTrade, ...state.trades].slice(0, 100);
    state.balance += pnl;
    state.totalPnl += pnl;

    broadcastState();
    saveState();
    
    scheduleNextTrade();
}

function scheduleNextTrade() {
    if (!state.isRunning) return;
    clearTimeout(tradeTimeout);
    const randomInterval = Math.random() * 55000 + 5000;
    tradeTimeout = setTimeout(runTradeCycle, randomInterval);
}

function stopTrading() {
    clearInterval(timerInterval);
    timerInterval = null;
    clearTimeout(tradeTimeout);
    tradeTimeout = null;
    state.isRunning = false;
    broadcastState();
    saveState();
}

function startTrading() {
    if (timerInterval || state.timeLimitReached || !state.selectedRobot) return;
    
    state.isRunning = true;
    
    timerInterval = setInterval(() => {
        if (!state.isRunning) {
            stopTrading();
            return;
        }

        state.totalTradingTime += 1;
        
        if (state.totalTradingTime >= state.timeLimit) {
            state.timeLimitReached = true;
            stopTrading();
        }
        
        broadcastState();

        if(state.totalTradingTime % 5 === 0) {
            saveState();
        }

    }, 1000);
    
    scheduleNextTrade();
    broadcastState();
    saveState();
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
      self.clients.claim().then(() => {
          loadState();
          if (state.isRunning) {
            startTrading();
          }
      })
  );
});

self.addEventListener('message', async (event) => {
  if (!event.data) return;
  const { type, payload } = event.data;

  switch (type) {
    case 'GET_STATE':
        loadState();
        if (state.isRunning && !timerInterval) {
            startTrading();
        }
        if (event.source) {
            event.source.postMessage({ type: 'STATE_UPDATE', payload: state });
        } else {
            broadcastState();
        }
        break;

    case 'TOGGLE_SIMULATOR':
        if (state.isRunning) {
            stopTrading();
        } else {
            startTrading();
        }
        break;
        
    case 'SELECT_ROBOT':
        state.selectedRobot = payload.robot;
        if(payload.shouldPause) {
          if (state.isRunning) stopTrading();
        }
        broadcastState();
        saveState();
        break;
        
    case 'RESET_SIMULATOR':
        stopTrading();
        state = {
            balance: INITIAL_BALANCE,
            trades: [],
            isRunning: false,
            selectedRobot: null,
            totalPnl: 0,
            totalTradingTime: 0,
            timeLimit: payload.mode === 'demo' ? 10 : TRADING_TIME_LIMIT_SECONDS,
            timeLimitReached: false,
        };
        try {
            self.localStorage.removeItem(TUTORIAL_STORAGE_KEY);
        } catch (e) {
            console.error(e);
        }
        broadcastState();
        saveState();
        break;
  }
});
