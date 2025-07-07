'use client';
import React from 'react';
import { useTradeSimulator } from '@/hooks/use-trade-simulator';
import { BalanceCard } from '@/components/balance-card';
import { RobotSelection } from '@/components/robot-selection';
import { TradeHistory } from '@/components/trade-history';
import { Bot, RotateCcw, PartyPopper, CandlestickChart, BrainCircuit, PlayCircle, CheckCircle, Hourglass, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";


export default function Home() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { 
    balance, 
    trades, 
    isRunning, 
    selectedRobot, 
    totalPnl,
    totalTradingTime,
    timeLimitReached,
    handleSelectRobot, 
    handleToggleSimulator,
    resetSimulator,
    tutorialCompleted,
    completeTutorial,
  } = useTradeSimulator();

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    if (!tutorialCompleted) {
      setIsTutorialOpen(true);
    }
  }, [tutorialCompleted]);

  const tutorialSteps = [
    {
      icon: PartyPopper,
      title: t('tutorial.step1.title'),
      content: t('tutorial.step1.content'),
    },
    {
      icon: CandlestickChart,
      title: t('tutorial.step2.title'),
      content: t('tutorial.step2.content'),
    },
    {
      icon: BrainCircuit,
      title: t('tutorial.step3.title'),
      content: t('tutorial.step3.content'),
    },
    {
      icon: Bot,
      title: t('tutorial.step4.title'),
      content: t('tutorial.step4.content'),
    },
    {
      icon: PlayCircle,
      title: t('tutorial.step5.title'),
      content: t('tutorial.step5.content'),
    },
    {
      icon: Hourglass,
      title: t('tutorial.step6.title'),
      content: t('tutorial.step6.content'),
    },
    {
      icon: CheckCircle,
      title: t('tutorial.step7.title'),
      content: t('tutorial.step7.content'),
    },
  ];

  const handleTutorialClose = () => {
    setIsTutorialOpen(false);
    completeTutorial();
    setTutorialStep(0);
  };

  const handleWithdraw = () => {
    toast({
      titleKey: 'withdrawTitle',
      descriptionKey: 'withdrawDescription',
      duration: 10000,
    });
  };

  if (timeLimitReached) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-4 text-center">
        <Clock className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl md:text-4xl font-headline text-primary mb-4">{t('timeLimitReachedTitle')}</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          {t('timeLimitReachedDesc')}
        </p>
      </div>
    );
  }

  return (
    <>
      <Dialog open={isTutorialOpen} onOpenChange={(open) => !open && handleTutorialClose()}>
        <DialogContent className="sm:max-w-md">
           <DialogHeader>
            <div className="flex flex-col items-center text-center gap-4">
              {tutorialSteps[tutorialStep].icon &&
                React.createElement(tutorialSteps[tutorialStep].icon, {
                  className: "w-12 h-12 text-primary",
                })}
              <DialogTitle className="text-2xl">{tutorialSteps[tutorialStep].title}</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="text-center text-base px-4">
            {tutorialSteps[tutorialStep].content}
          </DialogDescription>
          
          {tutorialStep === 0 && (
            <div className="flex justify-center">
              <LanguageSwitcher />
            </div>
          )}

          <DialogFooter className="!justify-between !items-center !flex-row pt-4">
              <div>
                {tutorialStep > 0 ? (
                  <Button variant="outline" onClick={() => setTutorialStep(tutorialStep - 1)}>
                    {t('tutorial.previous')}
                  </Button>
                ) : <div style={{width: '90px'}} /> /* Spacer */}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {tutorialStep + 1} / {tutorialSteps.length}
              </div>
              <div>
                {tutorialStep < tutorialSteps.length - 1 ? (
                  <Button onClick={() => setTutorialStep(tutorialStep + 1)}>
                    {t('tutorial.next')}
                  </Button>
                ) : (
                  <Button onClick={handleTutorialClose}>
                    {t('tutorial.finish')}
                  </Button>
                )}
              </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                totalTradingTime={totalTradingTime}
                timeLimitReached={timeLimitReached}
              />
            </div>
            <div className="lg:col-span-2">
              <TradeHistory trades={trades} isRunning={isRunning} />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
