'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { INITIAL_BALANCE, TRADING_TIME_LIMIT_SECONDS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';

const TUTORIAL_STORAGE_KEY = 'tradeSimulatorTutorialCompleted';
const SIMULATOR_STATE_KEY = 'tradeSimulatorState';

export function useTradeSimulator() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [totalPnl, setTotalPnl] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState(true);
  const [totalTradingTime, setTotalTradingTime] = useState(0);
  const [timeLimitReached, setTimeLimitReached] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const isMounted = useRef(false);

  const getRobotName = useCallback((robot: Robot): string => {
    const formattedId = robot.id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const key = `robot${formattedId}Name`;
    return t(key);
  }, [t]);

  // Load state from localStorage on initial component mount
  useEffect(() => {
    try {
      const savedTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (savedTutorial === 'true') {
        setTutorialCompleted(true);
      } else {
        setTutorialCompleted(false);
      }

      const savedStateJSON = localStorage.getItem(SIMULATOR_STATE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        setBalance(savedState.balance ?? INITIAL_BALANCE);
        setTrades(savedState.trades?.map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })) ?? []);
        setSelectedRobot(savedState.selectedRobot ?? null);
        setTotalPnl(savedState.totalPnl ?? 0);
        setTotalTradingTime(savedState.totalTradingTime ?? 0);
        // Load the running state, but only if the time limit hasn't been reached
        if ((savedState.totalTradingTime ?? 0) < TRADING_TIME_LIMIT_SECONDS) {
          setIsRunning(savedState.isRunning ?? false);
        }
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, String(tutorialCompleted));
      const stateToSave = {
        balance,
        trades,
        isRunning,
        selectedRobot,
        totalPnl,
        totalTradingTime,
      };
      localStorage.setItem(SIMULATOR_STATE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [balance, trades, isRunning, selectedRobot, totalPnl, totalTradingTime, tutorialCompleted]);

  const completeTutorial = useCallback(() => {
    setTutorialCompleted(true);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && !timeLimitReached) {
      timer = setInterval(() => {
        setTotalTradingTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLimitReached]);

  useEffect(() => {
    if (totalTradingTime >= TRADING_TIME_LIMIT_SECONDS) {
      if (isRunning) {
        setIsRunning(false);
      }
      if (!timeLimitReached) {
        setTimeLimitReached(true);
      }
    }
  }, [totalTradingTime, isRunning, timeLimitReached]);

  const runTradeCycle = useCallback(() => {
    if (!selectedRobot) return;

    // Simplified quantity to keep trades small
    const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2

    // 70% chance of a profitable trade for a positive trend
    const isProfitable = Math.random() < 0.7;

    let pnlPerUnit;
    if (isProfitable) {
      // Smaller, controlled profit based on robot's pnlFactor
      pnlPerUnit = (0.05 + Math.random() * 0.05) * selectedRobot.pnlFactor;
    } else {
      // Losses are smaller than profits to ensure overall gain
      pnlPerUnit = -(0.03 + Math.random() * 0.03) * selectedRobot.pnlFactor;
    }

    const pnl = pnlPerUnit * quantity;
    
    // Simulate entry and exit prices based on P/L
    const entryPrice = 100 + (Math.random() - 0.5) * 10;
    const exitPrice = entryPrice + pnlPerUnit;

    const newTrade: Trade = {
      id: new Date().toISOString() + Math.random(),
      symbol: 'BTC-USDT',
      type: pnl > 0 ? 'BUY' : 'SELL',
      quantity,
      entryPrice,
      exitPrice,
      pnl,
      timestamp: new Date(),
    };
    
    setTrades(prev => [newTrade, ...prev].slice(0, 100));
    setBalance(prev => prev + pnl);
    setTotalPnl(prev => prev + pnl);
  }, [selectedRobot]);

  useEffect(() => {
    if (!isRunning || !selectedRobot) {
      return;
    }

    let timeoutId: NodeJS.Timeout;
    const scheduleNextTrade = () => {
      // Interval between 5 and 60 seconds
      const randomInterval = Math.random() * 55000 + 5000;
      
      timeoutId = setTimeout(() => {
        runTradeCycle();
        // The check is inside the timeout to ensure it uses the latest isRunning state
        if (isRunning) {
          scheduleNextTrade();
        }
      }, randomInterval);
    };
    
    // Start the first trade cycle immediately, then schedule subsequent ones
    runTradeCycle();
    scheduleNextTrade();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isRunning, selectedRobot, runTradeCycle]);


  const handleSelectRobot = (robot: Robot) => {
    if (isRunning) {
      toast({
        titleKey: "simulatorPaused",
        descriptionKey: "simulatorPausedDesc",
      });
      setIsRunning(false);
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
    if (timeLimitReached) {
      return;
    }

    if (isRunning) {
      setIsRunning(false);
       toast({
        titleKey: "tradingStopped",
        descriptionKey: "tradingStoppedDesc",
      });
    } else if (selectedRobot) {
      setIsRunning(true);
      const robotName = getRobotName(selectedRobot);
      toast({
          titleKey: "tradingStarted",
          descriptionKey: "tradingStartedDesc",
          descriptionParams: { robotName },
      });
    }
  }

  const resetSimulator = () => {
    setIsRunning(false);
    setBalance(INITIAL_BALANCE);
    setTrades([]);
    setSelectedRobot(null);
    setTotalPnl(0);
    setTotalTradingTime(0);
    setTimeLimitReached(false);
    
    try {
        localStorage.removeItem(TUTORIAL_STORAGE_KEY);
        localStorage.removeItem(SIMULATOR_STATE_KEY);
    } catch (error) {
        console.error("Could not access local storage", error);
    }
    
    toast({
      titleKey: "sessionReset",
      descriptionKey: "sessionResetDesc",
    });
    setTimeout(() => window.location.reload(), 500);
  }

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
  };
}
