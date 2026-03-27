import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Habits, HabitLevel, Demographics, TimelineYear } from '@/lib/health-types';
import { DEFAULT_HABITS, calculateOrganRisks } from '@/lib/health-types';

interface WhatIfModeProps {
  habits: Habits;
  demographics: Demographics;
  years: TimelineYear;
}

type WhatIfScenario = {
  id: string;
  label: string;
  emoji: string;
  apply: (h: Habits) => Habits;
};

const SCENARIOS: WhatIfScenario[] = [
  { id: 'quit-smoking', label: 'Quit smoking', emoji: '🚭', apply: (h) => ({ ...h, smoking: 0 as HabitLevel }) },
  { id: 'quit-alcohol', label: 'Stop drinking', emoji: '🚫', apply: (h) => ({ ...h, alcohol: 0 as HabitLevel }) },
  { id: 'fix-sleep', label: 'Sleep 8 hours', emoji: '😴', apply: (h) => ({ ...h, sleep: 0 as HabitLevel }) },
  { id: 'exercise', label: 'Exercise daily', emoji: '🏃', apply: (h) => ({ ...h, exercise: 0 as HabitLevel }) },
  { id: 'eat-healthy', label: 'Eat balanced', emoji: '🥗', apply: (h) => ({ ...h, diet: 0 as HabitLevel }) },
  { id: 'hydrate', label: 'Drink more water', emoji: '💧', apply: (h) => ({ ...h, hydration: 0 as HabitLevel }) },
  { id: 'destress', label: 'Manage stress', emoji: '🧘', apply: (h) => ({ ...h, stress: 0 as HabitLevel }) },
];

export default function WhatIfMode({ habits, demographics, years }: WhatIfModeProps) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const currentRisks = useMemo(() => calculateOrganRisks(habits, years, demographics), [habits, years, demographics]);
  const currentAvg = Math.round(currentRisks.reduce((s, r) => s + r.score, 0) / currentRisks.length);
  const currentHealth = 100 - currentAvg;

  const scenarioResult = useMemo(() => {
    if (!activeScenario) return null;
    const scenario = SCENARIOS.find(s => s.id === activeScenario);
    if (!scenario) return null;
    const newHabits = scenario.apply(habits);
    const newRisks = calculateOrganRisks(newHabits, years, demographics);
    const newAvg = Math.round(newRisks.reduce((s, r) => s + r.score, 0) / newRisks.length);
    return { health: 100 - newAvg, diff: (100 - newAvg) - currentHealth, risks: newRisks };
  }, [activeScenario, habits, years, demographics, currentHealth]);

  // Only show scenarios that would actually change something
  const relevantScenarios = SCENARIOS.filter(s => {
    const key = s.id === 'quit-smoking' ? 'smoking'
      : s.id === 'quit-alcohol' ? 'alcohol'
      : s.id === 'fix-sleep' ? 'sleep'
      : s.id === 'exercise' ? 'exercise'
      : s.id === 'eat-healthy' ? 'diet'
      : s.id === 'hydrate' ? 'hydration'
      : 'stress';
    return habits[key as keyof Habits] > 0;
  });

  if (relevantScenarios.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">What If?</h3>
        </div>
      </div>
      <div className="p-4 space-y-3">

      <div className="flex flex-wrap gap-1.5">
        {relevantScenarios.map(scenario => (
          <button
            key={scenario.id}
            onClick={() => setActiveScenario(activeScenario === scenario.id ? null : scenario.id)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all hover-scale ${
              activeScenario === scenario.id
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                : 'bg-card text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            {scenario.emoji} {scenario.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {scenarioResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between py-2 px-3 bg-severity-good/8 rounded-lg border border-severity-good/15">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">Health Score Change</p>
                <p className="text-[10px] text-muted-foreground">
                  {currentHealth} → {scenarioResult.health}
                </p>
              </div>
              <span className={`text-lg font-bold ${scenarioResult.diff > 0 ? 'text-severity-good' : 'text-muted-foreground'}`}>
                {scenarioResult.diff > 0 ? '+' : ''}{scenarioResult.diff}
              </span>
            </div>

            {/* Per-organ changes */}
            <div className="mt-2 space-y-1">
              {currentRisks.map((risk, i) => {
                const newRisk = scenarioResult.risks[i];
                const diff = risk.score - newRisk.score;
                if (diff <= 0) return null;
                return (
                  <div key={risk.organ} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{risk.label}</span>
                    <span className="text-severity-good font-medium">−{diff}% risk</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
