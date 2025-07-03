'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Play, Square, Zap } from 'lucide-react';
import type { Robot } from '@/lib/types';
import { ROBOTS, INITIAL_BALANCE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { recommendRobot } from '@/ai/flows/robot-recommendation';
import { useI18n } from '@/hooks/use-i18n';


interface RobotSelectionProps {
  selectedRobot: Robot | null;
  onSelect: (robot: Robot) => void;
  isRunning: boolean;
  onToggle: () => void;
}

function RobotDescription({ robot }: { robot: Robot }) {
  const [description, setDescription] = useState<string | null>(null);
  const { locale, t } = useI18n();

  useEffect(() => {
    const fetchDescription = async () => {
      try {
        const result = await recommendRobot({ 
          riskTolerance: robot.riskTolerance, 
          investmentGoals: robot.investmentGoals,
          language: locale,
        });
        setDescription(result.robotDescription);
      } catch (e) {
        console.error("Failed to get robot description", e);
        setDescription(t('robotDescriptionError'));
      }
    };
    fetchDescription();
  }, [robot, locale, t]);

  if (!description) {
    return <Skeleton className="h-4 w-full" />;
  }

  return <p className="text-sm text-muted-foreground">{description}</p>;
}

export function RobotSelection({ selectedRobot, onSelect, isRunning, onToggle }: RobotSelectionProps) {
  const { t } = useI18n();
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6" />
            <span>{t('selectARobot')}</span>
        </CardTitle>
        <CardDescription>{t('selectARobotDescription', { initialBalance: INITIAL_BALANCE })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {ROBOTS.map((robot) => {
            const isActive = selectedRobot?.id === robot.id;
            return (
              <div
                key={robot.id}
                onClick={() => onSelect(robot)}
                className={cn(
                  "border p-4 rounded-lg cursor-pointer transition-all duration-300 relative",
                  isActive ? "border-primary ring-2 ring-primary shadow-lg" : "hover:border-primary/50 hover:bg-card/80"
                )}
              >
                {isActive && (
                    <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
                )}
                <h3 className="font-bold font-headline">{robot.name}</h3>
                <RobotDescription robot={robot} />
              </div>
            );
          })}
        </div>
        <Button onClick={onToggle} disabled={!selectedRobot} size="lg" className="w-full">
          {isRunning ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {isRunning ? t('stopTrading') : t('startTrading')}
        </Button>
      </CardContent>
    </Card>
  );
}
