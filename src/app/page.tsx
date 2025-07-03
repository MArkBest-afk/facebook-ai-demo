'use client';
import { useTradeSimulator } from '@/hooks/use-trade-simulator';
import { BalanceCard } from '@/components/balance-card';
import { RobotSelection } from '@/components/robot-selection';
import { TradeHistory } from '@/components/trade-history';
import { Bot, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';

export default function Home() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { 
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
  } = useTradeSimulator();

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!tutorialCompleted) {
      setTimeout(() => setRun(true), 500);
    }
  }, [tutorialCompleted]);

  // Effect to advance from "select robot" step
  useEffect(() => {
    if (selectedRobot && stepIndex === 2) {
      setTimeout(() => setStepIndex(3), 300);
    }
  }, [selectedRobot, stepIndex]);

  // Effect to advance from "start trading" step
  useEffect(() => {
    if (isRunning && stepIndex === 3) {
      setTimeout(() => setStepIndex(4), 300);
    }
  }, [isRunning, stepIndex]);


  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      completeTutorial();
      return;
    }

    if ([EVENTS.STEP_AFTER].includes(type as any)) {
        if (action === ACTIONS.NEXT) {
            setStepIndex(index + 1);
        } else if (action === ACTIONS.PREV) {
            setStepIndex(index - 1);
        }
    }
  };

  const tutorialSteps: Step[] = [
    {
      target: 'body',
      content: t('tutorialWelcomeContent'),
      title: t('tutorialWelcomeTitle'),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#robot-selection-card',
      content: t('tutorialSelectRobotContent'),
      title: t('tutorialSelectRobotTitle'),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '#robot-card-balanced',
      content: t('tutorialClickRobotContent'),
      title: t('tutorialClickRobotTitle'),
      placement: 'right',
      disableBeacon: true,
      hideFooter: true,
    },
    {
      target: '#start-trading-button',
      content: t('tutorialStartTradingContent'),
      title: t('tutorialStartTradingTitle'),
      placement: 'right',
      disableBeacon: true,
      hideFooter: true,
    },
    {
      target: 'body',
      content: t('tutorialFinishedContent'),
      title: t('tutorialFinishedTitle'),
      placement: 'center',
      disableBeacon: true,
    }
  ];

  const handleWithdraw = () => {
    toast({
      titleKey: 'withdrawTitle',
      descriptionKey: 'withdrawDescription',
      duration: 10000,
    });
  };

  return (
    <>
      <Joyride
        run={run}
        stepIndex={stepIndex}
        steps={tutorialSteps}
        continuous={false}
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            arrowColor: 'hsl(var(--card))',
            backgroundColor: 'hsl(var(--card))',
            primaryColor: 'hsl(var(--primary))',
            textColor: 'hsl(var(--card-foreground))',
            zIndex: 1000,
          },
          buttonClose: {
            display: 'none',
          }
        }}
      />
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <Bot className="w-10 h-10 text-primary" />
                <h1 className="text-3xl md:text-4xl font-headline text-primary">{t('appName')}</h1>
              </div>
              <p className="text-muted-foreground sm:ml-[56px]">
                {t('appDescription')}
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
              <LanguageSwitcher />
              <Button variant="outline" onClick={resetSimulator}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('resetSession')}
              </Button>
            </div>
          </header>
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-8">
              <BalanceCard balance={balance} pnl={totalPnl} onWithdraw={handleWithdraw} />
              <RobotSelection
                selectedRobot={selectedRobot}
                onSelect={handleSelectRobot}
                isRunning={isRunning}
                onToggle={handleToggleSimulator}
              />
            </div>
            <div className="lg:col-span-2">
              <TradeHistory trades={trades} />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
