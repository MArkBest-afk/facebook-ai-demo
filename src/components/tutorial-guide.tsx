'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { ArrowRight, Bot, Play, TrendingUp } from 'lucide-react';

interface TutorialGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const TUTORIAL_COMPLETED_KEY = 'hasCompletedTutorial';

export function TutorialGuide({ isOpen, onClose }: TutorialGuideProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  const steps = [
    {
      titleKey: 'tutorialWelcomeTitle',
      descriptionKey: 'tutorialWelcomeDescription',
      icon: <TrendingUp className="h-10 w-10 text-primary" />,
    },
    {
      titleKey: 'tutorialRobotSelectionTitle',
      descriptionKey: 'tutorialRobotSelectionDescription',
      icon: <Bot className="h-10 w-10 text-primary" />,
    },
    {
      titleKey: 'tutorialStartTradingTitle',
      descriptionKey: 'tutorialStartTradingDescription',
      icon: <Play className="h-10 w-10 text-primary" />,
    },
    {
      titleKey: 'tutorialRealDataTitle',
      descriptionKey: 'tutorialRealDataDescription',
      icon: <TrendingUp className="h-10 w-10 text-primary" />,
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      try {
        localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      } catch (error) {
        console.error("Failed to save tutorial completion state", error);
      }
      onClose();
    }
  };

  const handleClose = () => {
     try {
        localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      } catch (error) {
        console.error("Failed to save tutorial completion state", error);
      }
      onClose();
  }

  const currentStep = steps[step];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="items-center text-center">
          <div className="mb-4">{currentStep.icon}</div>
          <DialogTitle className="text-2xl font-headline">{t(currentStep.titleKey)}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {t(currentStep.descriptionKey)}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">{t('tutorialStep', { current: step + 1, total: steps.length })}</p>
        </div>
        <DialogFooter>
          <Button onClick={handleNext} className="w-full">
            {step < steps.length - 1 ? t('tutorialNext') : t('tutorialFinish')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
