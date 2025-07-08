'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { ROBOTS, INITIAL_BALANCE, TRADING_SYMBOLS, TRADING_TIME_LIMIT_SECONDS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';

const STATE_STORAGE_KEY = 'tradeSimulatorState';
const TUTORIAL_STORAGE_KEY = 'tradeSimulatorTutorialCompleted';

type SimulatorState = {
  balance: number;
  trades: Trade[];
  selectedRobotId: string | null;
  totalPnl: number;
  totalTradingTime: number;
  timeLimit: number;
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

  const tradeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(false);

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
      };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [balance, trades, selectedRobot, totalPnl, totalTradingTime, timeLimit]);
  
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
    if (isRunning && selectedRobot) {
      // Start trading timer
      timerIntervalRef.current = setInterval(() => {
        setTotalTradingTime(prevTime => prevTime + 1);
      }, 1000);

      const performTrade = () => {
        setBalance(currentBalance => {
          const symbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];
          const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
      
          // Define trade parameters based on a controlled trade amount
          const tradeAmount = Math.random() * 5 + 5; // Trade amount between $5 and $10
          const entryPrice = Math.random() * 100 + 100; // Realistic price between 100 and 200
          const quantity = tradeAmount / entryPrice;
      
          // Check for sufficient balance BEFORE calculating PNL
          if (currentBalance < tradeAmount) {
            return currentBalance; // Not enough balance, skip trade
          }
      
          let pnl = 0;
          let pnlFactor = 0;
      
          // Controlled PNL calculation based on robot's risk tolerance
          switch (selectedRobot.riskTolerance) {
            case 'low': {
              const positiveBias = 0.1956;
              const baseVolatility = 0.05;
              pnlFactor = (Math.random() - 0.5 + positiveBias) * baseVolatility;
              break;
            }
            case 'medium': {
              const positiveBias = 0.1524;
              const baseVolatility = 0.08;
              pnlFactor = (Math.random() - 0.5 + positiveBias) * baseVolatility;
              break;
            }
            case 'high': {
              const positiveBias = 0.1267;
              const baseVolatility = 0.12;
              pnlFactor = (Math.random() - 0.5 + positiveBias) * baseVolatility;
              break;
            }
          }
      
          pnl = tradeAmount * pnlFactor;
          
          const exitPrice = entryPrice + (pnl / quantity) * (type === 'BUY' ? 1 : -1)

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
          return currentBalance + newTrade.pnl;
        });
      };
      
      const tradeLoop = () => {
        performTrade();
        // After performing a trade, schedule the next one.
        const nextInterval = Math.random() * 55000 + 5000; // 5-60 seconds
        tradeIntervalRef.current = setTimeout(tradeLoop, nextInterval);
      };

      // Schedule the first trade to happen within 1-5 seconds
      const firstTradeDelay = Math.random() * 4000 + 1000; 
      tradeIntervalRef.current = setTimeout(tradeLoop, firstTradeDelay);
      
      // Return cleanup function to be called on unmount or when dependencies change
      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (tradeIntervalRef.current) clearTimeout(tradeIntervalRef.current);
        timerIntervalRef.current = null;
        tradeIntervalRef.current = null;
      };
    }
  }, [isRunning, selectedRobot]);

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
