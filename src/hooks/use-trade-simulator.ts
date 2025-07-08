'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { INITIAL_BALANCE, TRADING_TIME_LIMIT_SECONDS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';

const TUTORIAL_STORAGE_KEY = 'tradeSimulatorTutorialCompleted';

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
  const isMounted = useRef(false);

  const getRobotName = useCallback((robot: Robot): string => {
    const formattedId = robot.id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const key = `robot${formattedId}Name`;
    return t(key);
  }, [t]);

  useEffect(() => {
    isMounted.current = true;
    const handleStateUpdate = (event: MessageEvent) => {
        if (event.data && event.data.type === 'STATE_UPDATE') {
            const { payload } = event.data;
            setBalance(payload.balance);
            setTrades(payload.trades.map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })));
            setIsRunning(payload.isRunning);
            setSelectedRobot(payload.selectedRobot);
            setTotalPnl(payload.totalPnl);
            setTotalTradingTime(payload.totalTradingTime);
            setTimeLimit(payload.timeLimit);
            setTimeLimitReached(payload.timeLimitReached);
        }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleStateUpdate);

      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({ type: 'GET_STATE' });
      });
    }

    try {
      const savedTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      setTutorialCompleted(savedTutorial === 'true');
    } catch (error) {
      console.error("Failed to load tutorial state from localStorage", error);
    }
    
    return () => {
      isMounted.current = false;
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleStateUpdate);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current || typeof tutorialCompleted === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, String(tutorialCompleted));
    } catch (error) {
      console.error("Failed to save tutorial state to localStorage", error);
    }
  }, [tutorialCompleted]);
  
  const completeTutorial = useCallback(() => {
    setTutorialCompleted(true);
  }, []);

  const postToSw = (message: any) => {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
    } else {
        navigator.serviceWorker.ready.then(registration => {
            registration.active?.postMessage(message);
        }).catch(err => {
            console.error("Service Worker not ready:", err);
            toast({
                variant: 'destructive',
                title: 'Service Worker Error',
                description: 'Could not connect to the background service. Please reload.',
            });
        });
    }
  };

  const handleSelectRobot = (robot: Robot) => {
    const shouldPause = isRunning;
    if (shouldPause) {
      toast({
        titleKey: "simulatorPaused",
        descriptionKey: "simulatorPausedDesc",
      });
    }

    // Optimistic update
    setSelectedRobot(robot);
    if (shouldPause) {
      setIsRunning(false);
    }
    
    postToSw({ type: 'SELECT_ROBOT', payload: { robot, shouldPause } });

    const robotName = getRobotName(robot);
    toast({
        titleKey: "robotSelected",
        titleParams: { robotName },
        descriptionKey: "robotSelectedDesc",
    });
  };

  const handleToggleSimulator = () => {
    if (timeLimitReached || !selectedRobot) {
      return;
    }

    const nextIsRunning = !isRunning;
    setIsRunning(nextIsRunning); // Optimistic update

    if (nextIsRunning) {
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
    
    postToSw({ type: 'TOGGLE_SIMULATOR' });
  };

  const resetSimulator = (mode: 'normal' | 'demo' = 'normal') => {
    postToSw({ type: 'RESET_SIMULATOR', payload: { mode } });
    setTutorialCompleted(false);
    
    toast({
      titleKey: "sessionReset",
      descriptionKey: "sessionResetDesc",
    });
  };

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
