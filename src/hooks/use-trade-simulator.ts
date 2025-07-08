'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { ROBOTS, INITIAL_BALANCE, TRADING_SYMBOLS, TRADING_TIME_LIMIT_SECONDS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';
import { sendTelegramNotification } from '@/app/actions';

const STATE_STORAGE_KEY = 'tradeSimulatorState';
const TUTORIAL_STORAGE_KEY = 'tradeSimulatorTutorialCompleted';
const TG_NOTIFICATION_SENT_KEY = 'tg_notification_sent';


type SimulatorState = {
  balance: number;
  trades: Trade[];
  selectedRobotId: string | null;
  totalPnl: number;
  totalTradingTime: number;
  timeLimit: number;
  isRunning: boolean;
};

export function useTradeSimulator() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [totalPnl, setTotalPnl] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>();

  const [totalTradingTime, setTotalTradingTime] = useState(0);
  const [timeLimit, setTimeLimit] = useState(TRADING_TIME_LIMIT_SECONDS);
  const [timeLimitReached, setTimeLimitReached] = useState(false);

  const { toast } = useToast();
  const { t } = useI18n();

  const getRobotName = useCallback((robot: Robot): string => {
    const formattedId = robot.id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const key = `robot${formattedId}Name`;
    return t(key);
  }, [t]);

  const isMounted = useRef(false);
  const robotRef = useRef(selectedRobot);
  const balanceRef = useRef(balance);

  useEffect(() => {
    robotRef.current = selectedRobot;
  }, [selectedRobot]);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  // Load state from local storage on initial mount
  useEffect(() => {
    isMounted.current = true;
    try {
      const savedStateJSON = localStorage.getItem(STATE_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState: SimulatorState = JSON.parse(savedStateJSON);
        setBalance(savedState.balance);
        setTrades(savedState.trades.map(t => ({...t, timestamp: new Date(t.timestamp)})));
        if (savedState.selectedRobotId) {
          const robot = ROBOTS.find(r => r.id === savedState.selectedRobotId) || null;
          setSelectedRobot(robot);
        }
        setTotalPnl(savedState.totalPnl);
        setTotalTradingTime(savedState.totalTradingTime);
        setTimeLimit(savedState.timeLimit);
        if (savedState.isRunning && savedState.totalTradingTime < savedState.timeLimit) {
          setIsRunning(true);
        }
      } else {
        // New session on first visit.
        // Check a session-only flag to prevent re-sending on reload after reset.
        const notificationSent = sessionStorage.getItem(TG_NOTIFICATION_SENT_KEY);
        if (!notificationSent) {
          sendTelegramNotification();
          sessionStorage.setItem(TG_NOTIFICATION_SENT_KEY, 'true');
        }
      }
      const savedTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      setTutorialCompleted(savedTutorial === 'true');
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    if (!isMounted.current) return;
    try {
      const stateToSave: SimulatorState = {
        balance,
        trades,
        selectedRobotId: selectedRobot?.id ?? null,
        totalPnl,
        totalTradingTime,
        timeLimit,
        isRunning,
      };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [balance, trades, selectedRobot, totalPnl, totalTradingTime, timeLimit, isRunning]);
  
  useEffect(() => {
    if (typeof tutorialCompleted === 'undefined' || !isMounted.current) return;
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, String(tutorialCompleted));
    } catch (error) {
      console.error("Failed to save tutorial state to localStorage", error);
    }
  }, [tutorialCompleted]);

  useEffect(() => {
    if (totalTradingTime >= timeLimit) {
      setTimeLimitReached(true);
      if (isRunning) {
        setIsRunning(false);
      }
    } else {
      setTimeLimitReached(false);
    }
  }, [totalTradingTime, timeLimit, isRunning]);

  useEffect(() => {
    let tradeTimerId: NodeJS.Timeout | null = null;
    let clockTimerId: NodeJS.Timeout | null = null;

    const performTrade = () => {
      const currentRobot = robotRef.current;
      if (!currentRobot) return;

      const tradeAmount = Math.random() * 5 + 5; // Trade amount between $5 and $10
      if (balanceRef.current < tradeAmount) {
        return; // Not enough balance, skip trade
      }
      
      const symbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];
      const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const entryPrice = Math.random() * 100 + 100; // Realistic price between 100 and 200
      const quantity = tradeAmount / entryPrice;

      let pnl = 0;
      let pnlFactor = 0;
      
      // These biases are calibrated to achieve the target PNL over 4 hours (14400 seconds)
      // with trades happening on average every ~32.5 seconds.
      // Average trades in 4 hours = 14400 / 32.5 ≈ 443 trades.
      // Average PNL per trade needed:
      // Low risk: $32.5 / 443 ≈ $0.073
      // Medium risk: $40.5 / 443 ≈ $0.091
      // High risk: $50.5 / 443 ≈ $0.114
      // Average trade amount: $7.5.
      // Required pnlFactor: (Average PNL per trade) / 7.5
      // Low: 0.073 / 7.5 = 0.0097 -> bias ~0.01
      // Med: 0.091 / 7.5 = 0.0121 -> bias ~0.012
      // High: 0.114 / 7.5 = 0.0152 -> bias ~0.015
      
      switch (currentRobot.riskTolerance) {
        case 'low': {
          const positiveBias = 0.01; 
          const baseVolatility = 0.05; // Smaller swings
          pnlFactor = (Math.random() - 0.5 + positiveBias) * baseVolatility;
          break;
        }
        case 'medium': {
          const positiveBias = 0.012;
          const baseVolatility = 0.08;
          pnlFactor = (Math.random() - 0.5 + positiveBias) * baseVolatility;
          break;
        }
        case 'high': {
          const positiveBias = 0.015;
          const baseVolatility = 0.12; // Wider swings
          pnlFactor = (Math.random() - 0.5 + positiveBias) * baseVolatility;
          break;
        }
      }

      pnl = tradeAmount * pnlFactor;
      
      const exitPrice = entryPrice + (pnl / quantity) * (type === 'BUY' ? 1 : -1);

      const newTrade: Trade = {
        id: new Date().toISOString() + Math.random(),
        symbol,
        type,
        quantity: parseFloat(quantity.toFixed(4)),
        entryPrice: parseFloat(entryPrice.toFixed(2)),
        exitPrice: parseFloat(exitPrice.toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
        timestamp: new Date(),
      };
      
      setTrades(currentTrades => [newTrade, ...currentTrades]);
      setTotalPnl(currentPnl => currentPnl + newTrade.pnl);
      setBalance(currentBalance => currentBalance + newTrade.pnl);
    };

    const tradeLoop = () => {
      performTrade();
      const nextInterval = Math.random() * 55000 + 5000; // 5-60 seconds
      tradeTimerId = setTimeout(tradeLoop, nextInterval);
    };

    if (isRunning) {
      clockTimerId = setInterval(() => {
        setTotalTradingTime(prevTime => prevTime + 1);
      }, 1000);

      const firstTradeDelay = Math.random() * 4000 + 1000; // 1-5 seconds
      tradeTimerId = setTimeout(tradeLoop, firstTradeDelay);
    }
    
    return () => {
      if (clockTimerId) clearInterval(clockTimerId);
      if (tradeTimerId) clearTimeout(tradeTimerId);
    };
  }, [isRunning]);

  const handleSelectRobot = (robot: Robot) => {
    if(isRunning) {
        setIsRunning(false);
        toast({
            titleKey: "simulatorPaused",
            descriptionKey: "simulatorPausedDesc",
        });
    }
    setSelectedRobot(robot);
    const robotName = getRobotName(robot);
    toast({
        titleKey: "robotSelected",
        titleParams: { robotName },
        descriptionKey: "robotSelectedDesc",
    });
  };

  const handleToggleSimulator = () => {
    if (timeLimitReached || !selectedRobot) return;
    setIsRunning(!isRunning);

    if (!isRunning) {
      const robotName = getRobotName(selectedRobot);
      toast({
          titleKey: "tradingStarted",
          descriptionKey: "tradingStartedDesc",
          descriptionParams: { robotName },
      });
    } else {
      toast({
        titleKey: "tradingStopped",
        descriptionKey: "tradingStoppedDesc",
      });
    }
  };

  const resetSimulator = (mode: 'normal' | 'demo' = 'normal') => {
    setIsRunning(false);
    setBalance(INITIAL_BALANCE);
    setTrades([]);
    setSelectedRobot(null);
    setTotalPnl(0);
    setTotalTradingTime(0);
    
    const newTimeLimit = mode === 'demo' ? 10 : TRADING_TIME_LIMIT_SECONDS;
    setTimeLimit(newTimeLimit);

    setTimeLimitReached(false);
    setTutorialCompleted(false);

    try {
      localStorage.removeItem(STATE_STORAGE_KEY);
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'false');
    } catch (error) {
      console.error("Failed to clear state from localStorage", error);
    }

    // Send notification on explicit reset and set the session flag
    sendTelegramNotification();
    sessionStorage.setItem(TG_NOTIFICATION_SENT_KEY, 'true');
    
    toast({
      titleKey: "sessionReset",
      descriptionKey: "sessionResetDesc",
    });
  };

  const completeTutorial = useCallback(() => {
    setTutorialCompleted(true);
  }, []);

  return {
    balance,
    trades,
    isRunning,
    selectedRobot,
    totalPnl,
    handleSelectRobot,
    handleToggleSimulator,
    resetSimulator,
    tutorialCompleted,
    completeTutorial,
    totalTradingTime,
    timeLimitReached,
    timeLimit,
  };
}
