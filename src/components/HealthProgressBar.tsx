import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { OrganRisk, Habits, Demographics, TimelineYear } from '@/lib/health-types';

interface HealthProgressBarProps {
  risks: OrganRisk[];
  demographics: Demographics;
  habits: Habits;
  years: TimelineYear;
}

function estimateLifeExpectancy(habits: Habits, demographics: Demographics): number {
  // Base life expectancy (WHO global average ~73, US ~78)
  let base = demographics.sex === 'female' ? 81 : 76;

  // Age adjustment
  if (demographics.age) base = Math.max(base, demographics.age + 5);

  // Habit impacts (research-based rough estimates)
  // CDC: smoking reduces life expectancy by ~10 years
  base -= habits.smoking * 5;
  // WHO: heavy alcohol reduces by ~5 years
  base -= habits.alcohol * 2.5;
  // NIH: poor sleep linked to ~3-5 year reduction
  base -= habits.sleep * 1.5;
  // AHA: sedentary lifestyle reduces by ~3-5 years
  base -= habits.exercise * 2;
  // WHO: poor diet linked to ~4 year reduction
  base -= habits.diet * 2;
  // Stress ~2-3 years
  base -= habits.stress * 1.5;
  // Dehydration ~1-2 years
  base -= habits.hydration * 1;

  // BMI impact
  if (demographics.height && demographics.weight) {
    const bmi = demographics.weight / ((demographics.height / 100) ** 2);
    if (bmi >= 30) base -= 3;
    else if (bmi >= 25) base -= 1;
    else if (bmi < 18.5) base -= 2;
  }

  return Math.round(Math.max(40, Math.min(95, base)));
}

export default function HealthProgressBar({ risks, demographics, habits, years }: HealthProgressBarProps) {
  const healthScore = useMemo(() => {
    const avgRisk = risks.reduce((s, r) => s + r.score, 0) / risks.length;
    return Math.round(100 - avgRisk);
  }, [risks]);

  const lifeExpectancy = useMemo(() => estimateLifeExpectancy(habits, demographics), [habits, demographics]);
  const currentAge = demographics.age ?? 25;
  const projectedAge = currentAge + years;

  const scoreColor = healthScore >= 70 ? 'bg-severity-good' : healthScore >= 40 ? 'bg-severity-warn' : 'bg-severity-bad';
  const scoreTextColor = healthScore >= 70 ? 'text-severity-good' : healthScore >= 40 ? 'text-severity-warn' : 'text-severity-bad';
  const label = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : healthScore >= 20 ? 'Poor' : 'Critical';

  // Life progress
  const lifeProgress = Math.min(100, (projectedAge / lifeExpectancy) * 100);
  const lifeBarColor = lifeProgress >= 85 ? 'bg-severity-bad' : lifeProgress >= 65 ? 'bg-severity-warn' : 'bg-severity-good';

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Health Score */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold font-mono ${scoreTextColor}`}>{healthScore}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Health Score</span>
          </div>
          <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${scoreColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${healthScore}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="w-px h-10 bg-border" />

        {/* Life Expectancy */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-mono text-foreground">{lifeExpectancy}</span>
              <span className="text-[10px] text-muted-foreground font-medium">
                est. years{projectedAge > currentAge ? ` · age ${projectedAge}` : ''}
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Life Expectancy</span>
          </div>
          <div className="h-2 rounded-full bg-muted/40 overflow-hidden relative">
            <motion.div
              className={`h-full rounded-full ${lifeBarColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${lifeProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {/* Current age marker */}
            {demographics.age && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-foreground/40"
                style={{ left: `${Math.min(98, (currentAge / lifeExpectancy) * 100)}%` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[8px] text-muted-foreground/50 font-mono">0</span>
            {demographics.age && (
              <span className="text-[8px] text-muted-foreground/50 font-mono" style={{ marginLeft: `${Math.min(90, (currentAge / lifeExpectancy) * 100 - 5)}%` }}>
                now ({currentAge})
              </span>
            )}
            <span className="text-[8px] text-muted-foreground/50 font-mono">{lifeExpectancy}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
