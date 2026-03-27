import { useState } from 'react';
import { HABIT_CONFIGS, type Habits, type HabitLevel } from '@/lib/health-types';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const LEVEL_VARIANTS = ['pill-good', 'pill-warn', 'pill-bad'] as const;

const HABIT_DESCRIPTIONS: Record<string, string[]> = {
  smoking: ['No tobacco use', 'Social or occasional use', 'Daily cigarettes or vaping'],
  alcohol: ['No alcohol consumption', '≤7 drinks per week', '>14 drinks per week'],
  sleep: ['CDC recommended 7-9 hours', 'Below recommended at 6 hours', 'Sleep deprived at ≤5 hours'],
  exercise: ['WHO guideline: 150+ min/week', 'Below guideline: 60-149 min', 'Sedentary: <60 min/week'],
  diet: ['Rich in fruits, veg & whole grains', 'Mix of healthy & processed food', 'High processed & fast food intake'],
  stress: ['Well-managed, regular relaxation', 'Occasional stress, some coping', 'Chronic high stress, poor coping'],
  hydration: ['Adequate: 8+ cups per day', 'Moderate: 4-7 cups per day', 'Insufficient: <4 cups per day'],
};

const IMPACT_TAGS: Record<string, string[]> = {
  smoking: ['All clear ✨', 'Lungs −5%', 'Lungs −30%, Heart −15%'],
  alcohol: ['Liver healthy', 'Liver −10%', 'Liver −30%, Brain −12%'],
  sleep: ['Brain optimal', 'Brain −10%', 'Brain −25%, Heart −8%'],
  exercise: ['Heart +40%', 'Heart −10%', 'Heart −22%, Body fat ↑'],
  diet: ['All organs +', 'Mixed impact', 'Body fat ↑, Heart −15%'],
  stress: ['Brain healthy', 'Brain −8%', 'Brain −18%, Heart −12%'],
  hydration: ['Kidneys optimal', 'Kidneys −10%', 'Kidneys −28%'],
};

interface HabitSelectorProps {
  habits: Habits;
  onChange: (habits: Habits) => void;
}

export default function HabitSelector({ habits, onChange }: HabitSelectorProps) {
  const [hoveredHabit, setHoveredHabit] = useState<{ id: string; level: number } | null>(null);

  const setHabit = (id: string, level: HabitLevel) => {
    onChange({ ...habits, [id]: level });
  };

  return (
    <div className="space-y-3.5">
      {HABIT_CONFIGS.map((config, configIdx) => {
        const currentLevel = habits[config.id as keyof Habits];
        const descriptions = HABIT_DESCRIPTIONS[config.id] || [];
        const impacts = IMPACT_TAGS[config.id] || [];

        return (
          <motion.div
            key={config.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: configIdx * 0.03 }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="text-base">{config.icon}</span>
                <span>{config.label}</span>
              </div>
              {/* Impact tag on hover */}
              <AnimatePresence>
                {hoveredHabit?.id === config.id && (
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
                  >
                    {impacts[hoveredHabit.level] || ''}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-1.5">
              {config.levels.map((label, i) => (
                <Button
                  key={i}
                  variant={LEVEL_VARIANTS[i]}
                  size="sm"
                  data-active={currentLevel === i}
                  onClick={() => setHabit(config.id, i as HabitLevel)}
                  onMouseEnter={() => setHoveredHabit({ id: config.id, level: i })}
                  onMouseLeave={() => setHoveredHabit(null)}
                  className="flex-1 text-xs h-8 hover-scale"
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Description of current selection */}
            <p className="text-[10px] text-muted-foreground/70 pl-7 leading-relaxed">
              {descriptions[currentLevel] || ''}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
