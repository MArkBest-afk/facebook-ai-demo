'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Play, Square, Zap } from 'lucide-react';
import type { Robot } from '@/lib/types';
import { ROBOTS, INITIAL_BALANCE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';


interface RobotSelectionProps {
  selectedRobot: Robot | null;
  onSelect: (robot: Robot) => void;
  isRunning: boolean;
  onToggle: () => void;
}

function RobotDescription({ robot }: { robot: Robot }) {
  const { t } = useI18n();

  const descriptionKeyMap: Record<Robot['id'], string> = {
    'risk-averse': 'robotRiskAverseDescription',
    'balanced': 'robotBalancedDescription',
    'high-growth': 'robotHighGrowthDescription',
  };

  const description = t(descriptionKeyMap[robot.id]);

  return <p className="text-sm text-muted-foreground">{description}</p>;
}

export function RobotSelection({ selectedRobot, onSelect, isRunning, onToggle }: RobotSelectionProps) {
  const { t } = useI18n();

  const getRobotName = (robot: Robot) => {
    const formattedId = robot.id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const key = `robot${formattedId}Name`;
    return t(key);
  };

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
                <h3 className="font-bold font-headline">{getRobotName(robot)}</h3>
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
