import { HABIT_CONFIGS, type Habits, type HabitLevel } from '@/lib/health-types';
import { Button } from '@/components/ui/button';

const LEVEL_VARIANTS = ['pill-good', 'pill-warn', 'pill-bad'] as const;

interface HabitSelectorProps {
  habits: Habits;
  onChange: (habits: Habits) => void;
}

export default function HabitSelector({ habits, onChange }: HabitSelectorProps) {
  const setHabit = (id: string, level: HabitLevel) => {
    onChange({ ...habits, [id]: level });
  };

  return (
    <div className="space-y-4">
      {HABIT_CONFIGS.map((config) => (
        <div key={config.id} className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </div>
          <div className="flex gap-1.5">
            {config.levels.map((label, i) => (
              <Button
                key={i}
                variant={LEVEL_VARIANTS[i]}
                size="sm"
                data-active={habits[config.id as keyof Habits] === i}
                onClick={() => setHabit(config.id, i as HabitLevel)}
                className="flex-1 text-xs h-8"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
