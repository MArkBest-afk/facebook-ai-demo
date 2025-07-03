'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Play, Square, Zap, Clock } from 'lucide-react';
import type { Robot } from '@/lib/types';
import { ROBOTS, INITIAL_BALANCE, TRADING_TIME_LIMIT_SECONDS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';
import { Progress } from "@/components/ui/progress";


interface RobotSelectionProps {
  selectedRobot: Robot | null;
  onSelect: (robot: Robot) => void;
  isRunning: boolean;
  onToggle: () => void;
  totalTradingTime: number;
  timeLimitReached: boolean;
}

export function RobotSelection({ selectedRobot, onSelect, isRunning, onToggle, totalTradingTime, timeLimitReached }: RobotSelectionProps) {
  const { t } = useI18n();

  const getRobotName = (robot: Robot) => {
    const formattedId = robot.id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const key = `robot${formattedId}Name`;
    return t(key);
  };
  
  const getRobotDescription = (robot: Robot) => {
    const formattedId = robot.id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const key = `robot${formattedId}Description`;
    return t(key);
  };
  
  const progress = (totalTradingTime / TRADING_TIME_LIMIT_SECONDS) * 100;

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
  };
  const time = TRADING_TIME_LIMIT_SECONDS - totalTradingTime;
  const remainingTime = formatTime(time < 0 ? 0 : time);

  return (
    <Card className="shadow-lg" id="robot-selection-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6" />
            <span>{t('selectARobot')}</span>
        </CardTitle>
        <CardDescription>{t('selectARobotDescription', { initialBalance: INITIAL_BALANCE })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-muted-foreground">{t('remainingTime')}</span>
            <span>{remainingTime}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="space-y-4">
          {ROBOTS.map((robot) => {
            const isActive = selectedRobot?.id === robot.id;
            return (
              <div
                key={robot.id}
                id={`robot-card-${robot.id}`}
                onClick={() => onSelect(robot)}
                className={cn(
                  "border p-4 rounded-lg cursor-pointer transition-all duration-300 relative",
                  isActive ? "border-primary ring-2 ring-primary shadow-lg" : "hover:border-primary/50 hover:bg-card/80",
                  (timeLimitReached || isRunning) && "pointer-events-none opacity-50"
                )}
              >
                {isActive && (
                    <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
                )}
                <h3 className="font-bold font-headline">{getRobotName(robot)}</h3>
                <p className="text-sm text-muted-foreground">{getRobotDescription(robot)}</p>
              </div>
            );
          })}
        </div>
        <Button id="start-trading-button" onClick={onToggle} disabled={!selectedRobot || timeLimitReached} size="lg" className="w-full">
            {timeLimitReached ? (
                <>
                    <Clock className="mr-2 h-4 w-4" />
                    {t('timeLimitReached')}
                </>
            ) : isRunning ? (
                <>
                    <Square className="mr-2 h-4 w-4" />
                    {t('stopTrading')}
                </>
            ) : (
                <>
                    <Play className="mr-2 h-4 w-4" />
                    {t('startTrading')}
                </>
            )}
        </Button>
      </CardContent>
    </Card>
  );
}
