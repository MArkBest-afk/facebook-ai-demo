'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { ROBOTS, INITIAL_BALANCE, TRADING_TIME_LIMIT_SECONDS, TRADING_SYMBOLS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';
import { sendTelegramNotification } from '@/app/actions';

const STATE_STORAGE_KEY = 'tradeSimulatorState';
const TUTORIAL_STORAGE_KEY = 'tradeSimulatorTutorialCompleted';

type SimulatorState = {
  balance: number;
  trades: Trade[];
  selectedRobotId: string | null;
  totalPnl: number;
  sessionStartTime: number | null;
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

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLimit, setTimeLimit] = useState(TRADING_TIME_LIMIT_SECONDS);
  const [timeLimitReached, setTimeLimitReached] = useState(false);
  const [sessionResetFlag, setSessionResetFlag] = useState(0);

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
  const isRunningRef = useRef(isRunning);
  const prevIsRunning = useRef(isRunning);
  const prevSelectedRobot = useRef(selectedRobot);

  useEffect(() => {
    robotRef.current = selectedRobot;
  }, [selectedRobot]);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

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
          prevSelectedRobot.current = robot;
        }
        setTotalPnl(savedState.totalPnl);
        setSessionStartTime(savedState.sessionStartTime);
        setTimeLimit(savedState.timeLimit);
        
        if (savedState.sessionStartTime) {
            const now = Date.now();
            const currentElapsedTime = Math.floor((now - savedState.sessionStartTime) / 1000);
            if (currentElapsedTime < savedState.timeLimit) {
                setIsRunning(savedState.isRunning);
                prevIsRunning.current = savedState.isRunning;
            }
        }
      } else {
        sendTelegramNotification();
      }
      const savedTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      setTutorialCompleted(savedTutorial === 'true');
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (typeof tutorialCompleted === 'undefined' || !isMounted.current) return;
    try {
      const stateToSave: SimulatorState = {
        balance,
        trades,
        selectedRobotId: selectedRobot?.id ?? null,
        totalPnl,
        sessionStartTime,
        timeLimit,
        isRunning,
      };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [balance, trades, selectedRobot, totalPnl, sessionStartTime, timeLimit, isRunning, tutorialCompleted]);
  
  useEffect(() => {
    if (typeof tutorialCompleted === 'undefined' || !isMounted.current) return;
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, String(tutorialCompleted));
    } catch (error) {
      console.error("Failed to save tutorial state to localStorage", error);
    }
  }, [tutorialCompleted]);

  useEffect(() => {
    let clockTimerId: NodeJS.Timeout | null = null;
    
    if (sessionStartTime) {
      const updateElapsedTime = () => {
        const now = Date.now();
        const currentElapsedTime = Math.floor((now - sessionStartTime) / 1000);
        setElapsedTime(currentElapsedTime);

        if (currentElapsedTime >= timeLimit) {
          setTimeLimitReached(true);
          setIsRunning(false);
          if (clockTimerId) clearInterval(clockTimerId);
        }
      };

      updateElapsedTime();
      clockTimerId = setInterval(updateElapsedTime, 1000);
    }

    return () => {
      if (clockTimerId) clearInterval(clockTimerId);
    };
  }, [sessionStartTime, timeLimit]);

  const performTrade = useCallback(() => {
    if (!isRunningRef.current) return;

    const currentRobot = robotRef.current;
    if (!currentRobot) return;

    if (balanceRef.current < 10) {
      return; 
    }
    
    const tradeAmount = Math.random() * (10 - 5) + 5; 
    const symbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const entryPrice = Math.random() * 100 + 100;
    const quantity = tradeAmount / entryPrice;

    
    let pnlFactor;
    switch (currentRobot.riskTolerance) {
        case 'low': 
            pnlFactor = (Math.random() - 0.40) * 0.05;
            break;
        case 'medium':
            pnlFactor = (Math.random() - 0.38) * 0.08;
            break;
        case 'high':
            pnlFactor = (Math.random() - 0.35) * 0.12;
            break;
        default:
            pnlFactor = (Math.random() - 0.5) * 0.05;
    }
    
    const pnl = tradeAmount * pnlFactor;
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

    const nextInterval = Math.random() * (60000 - 5000) + 5000;
    tradeTimerRef.current = setTimeout(performTrade, nextInterval);
  }, []);

  useEffect(() => {
    if (tradeTimerRef.current) {
        clearTimeout(tradeTimerRef.current);
        tradeTimerRef.current = null;
    }
    if (isRunning) {
        const firstTradeDelay = Math.random() * 4000 + 1000;
        tradeTimerRef.current = setTimeout(performTrade, firstTradeDelay);
    }
  }, [isRunning, performTrade]);

  useEffect(() => {
    if (!isMounted.current) return;

    if (isRunning && !prevIsRunning.current && selectedRobot) {
      const robotName = getRobotName(selectedRobot);
      toast({
        titleKey: "tradingStarted",
        descriptionKey: "tradingStartedDesc",
        descriptionParams: { robotName },
      });
    } else if (!isRunning && prevIsRunning.current) {
      toast({
        titleKey: "tradingStopped",
        descriptionKey: "tradingStoppedDesc",
      });
    }
    prevIsRunning.current = isRunning;
  }, [isRunning, selectedRobot, getRobotName, toast]);

  useEffect(() => {
    if (!isMounted.current || !selectedRobot) return;
    
    if (selectedRobot.id !== prevSelectedRobot.current?.id) {
       if(isRunning) {
          setIsRunning(false);
          toast({
              titleKey: "simulatorPaused",
              descriptionKey: "simulatorPausedDesc",
          });
      }
      const robotName = getRobotName(selectedRobot);
      toast({
          titleKey: "robotSelected",
          titleParams: { robotName },
          descriptionKey: "robotSelectedDesc",
      });
    }
    prevSelectedRobot.current = selectedRobot;
  }, [selectedRobot, isRunning, getRobotName, toast]);
  
  useEffect(() => {
    if (sessionResetFlag > 0) {
      toast({
        titleKey: "sessionReset",
        descriptionKey: "sessionResetDesc",
      });
    }
  }, [sessionResetFlag, toast]);


  const handleSelectRobot = useCallback((robot: Robot) => {
    setSelectedRobot(robot);
  }, []);

  const handleToggleSimulator = () => {
    if (timeLimitReached || !selectedRobot) return;
    
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
    setIsRunning(currentIsRunning => !currentIsRunning);
  };

  const resetSimulator = useCallback((mode: 'normal' | 'demo' = 'normal') => {
    setIsRunning(false);
    setBalance(INITIAL_BALANCE);
    setTrades([]);
    setSelectedRobot(null);
    setTotalPnl(0);
    setSessionStartTime(null);
    setElapsedTime(0);
    
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
    setSessionResetFlag(f => f + 1);

    sendTelegramNotification();
    
  }, []);

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
    totalTradingTime: elapsedTime,
    timeLimitReached,
    timeLimit,
  };
}
