'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { ROBOTS, INITIAL_BALANCE, TRADING_SYMBOLS, TRADING_TIME_LIMIT_SECONDS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';
import { sendTelegramNotification, sendProgressUpdateNotification } from '@/app/actions';

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
  const tradeTimerRef = useRef<NodeJS.Timeout | null>(null);
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
        if (!isMounted.current) return;
        try {
            const savedStateJSON = localStorage.getItem(STATE_STORAGE_KEY);
            if (savedStateJSON) {
                const savedState: SimulatorState = JSON.parse(savedStateJSON);

                if (savedState.totalTradingTime > 0 || savedState.trades.length > 0) {
                    const robot = savedState.selectedRobotId 
                        ? ROBOTS.find(r => r.id === savedState.selectedRobotId) || null
                        : null;
                    
                    const remainingSeconds = Math.max(0, savedState.timeLimit - savedState.totalTradingTime);
                    const h = Math.floor(remainingSeconds / 3600).toString().padStart(2, '0');
                    const m = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0');
                    const s = Math.floor(remainingSeconds % 60).toString().padStart(2, '0');
                    const remainingTime = `${h}:${m}:${s}`;

                    sendProgressUpdateNotification({
                        balance: savedState.balance,
                        remainingTime: remainingTime,
                        robotName: robot?.name ?? null, 
                        isRunning: savedState.isRunning
                    });
                }
            }
        } catch (error) {
            console.error("Failed to send progress notification on unload:", error);
        }
        isMounted.current = false;
    };
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    if (typeof tutorialCompleted === 'undefined' || !isMounted.current) return;
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
  }, [balance, trades, selectedRobot, totalPnl, totalTradingTime, timeLimit, isRunning, tutorialCompleted]);
  
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

  const performTrade = useCallback(() => {
    const currentRobot = robotRef.current;
    if (!currentRobot) return;

    if (balanceRef.current < 10) {
      return; 
    }
    
    const tradeAmount = Math.random() * 5 + 5; 
    const symbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const entryPrice = Math.random() * 100 + 100;
    const quantity = tradeAmount / entryPrice;

    let pnl = 0;
    let pnlFactor = 0;
    
    switch (currentRobot.riskTolerance) {
      case 'low': {
        const positiveBias = 0.01; 
        const baseVolatility = 0.05;
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
        const baseVolatility = 0.12;
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

    const nextInterval = Math.random() * 55000 + 5000;
    tradeTimerRef.current = setTimeout(performTrade, nextInterval);
  }, []);

  useEffect(() => {
    let clockTimerId: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      clockTimerId = setInterval(() => {
        setTotalTradingTime(prevTime => prevTime + 1);
      }, 1000);

      const firstTradeDelay = Math.random() * 4000 + 1000;
      tradeTimerRef.current = setTimeout(performTrade, firstTradeDelay);
    }
    
    return () => {
      if (clockTimerId) clearInterval(clockTimerId);
      if (tradeTimerRef.current) {
        clearTimeout(tradeTimerRef.current);
        tradeTimerRef.current = null;
      }
    };
  }, [isRunning, performTrade]);

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
