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
      title: t('tutorial.step1.title'),
      content: t('tutorial.step1.content'),
    },
    {
      title: t('tutorial.step2.title'),
      content: t('tutorial.step2.content'),
    },
    {
      title: t('tutorial.step3.title'),
      content: t('tutorial.step3.content'),
    },
    {
      title: t('tutorial.step4.title'),
      content: t('tutorial.step4.content'),
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

  return (
    <>
      <Dialog open={isTutorialOpen} onOpenChange={(open) => !open && handleTutorialClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{tutorialSteps[tutorialStep].title}</DialogTitle>
            <DialogDescription>
              {tutorialSteps[tutorialStep].content}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex w-full justify-between items-center">
              <div>
                {tutorialStep > 0 && (
                  <Button variant="outline" onClick={() => setTutorialStep(tutorialStep - 1)}>
                    {t('tutorial.previous')}
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
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
