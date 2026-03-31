import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { OrganRisk, Habits, Demographics, TimelineYear } from '@/lib/health-types';
import type { BloodBiomarkers } from '@/lib/biomarker-types';

interface HealthProgressBarProps {
  risks: OrganRisk[];
  demographics: Demographics;
  habits: Habits;
  years: TimelineYear;
  biomarkers?: BloodBiomarkers | null;
}

/**
 * Life expectancy estimator based on published risk data.
 * Sources:
 * - CDC NCHS: US life tables (base LE by sex)
 * - CDC: Smoking reduces LE by ~10 years (MMWR 2014)
 * - WHO: Heavy alcohol use reduces LE by 3-7 years
 * - NIH/Sleep Foundation: Chronic short sleep linked to 3-5 year reduction
 * - AHA: Physical inactivity reduces LE by 3-5 years
 * - Lancet 2017: Poor diet responsible for ~4 year LE reduction
 * - AHA: BMI ≥30 reduces LE by 3-10 years; BMI ≥40 by 8-14 years
 * - Lancet 2010: Hypertension reduces LE by 5 years on average
 * - ADA: Diabetes reduces LE by 6 years (type 2), 12 years (type 1)
 *
 * NOTE: This is an EDUCATIONAL ESTIMATE, not an actuarial projection.
 */
function estimateLifeExpectancy(habits: Habits, demographics: Demographics, biomarkers?: BloodBiomarkers | null): number {
  // Base life expectancy — CDC NCHS 2023 (US)
  // Male: 76.3, Female: 81.2, Global WHO avg: ~73
  let base = demographics.sex === 'female' ? 81 : 76;

  // Actuarial-style age adjustment: older people who are alive have already
  // survived early risks, so their remaining LE is higher than population average.
  // Simplified: for each decade above 60, add 0.5 years to base (survivor bias).
  const age = demographics.age ?? 30;
  if (age > 60) {
    base += Math.min(8, (age - 60) * 0.15);
  }

  // === Habit impacts (level 0=none, 1=moderate, 2=severe) ===
  // Collect all penalty years, then apply diminishing returns
  // (risks overlap — smoking + poor diet aren't fully additive)
  let totalHabitPenalty = 0;

  // Smoking: CDC MMWR 2014 — daily smoking reduces LE by ~10 years
  totalHabitPenalty += [0, 4, 10][habits.smoking];

  // Alcohol: WHO Global Status Report — heavy drinking reduces LE by 5-7 years
  totalHabitPenalty += [0, 1.5, 5][habits.alcohol];

  // Sleep: NIH/Walker (2017) — chronic <6h linked to 3-5 year reduction
  totalHabitPenalty += [0, 1.5, 4][habits.sleep];

  // Exercise: AHA — sedentary lifestyle reduces LE by 3-5 years
  totalHabitPenalty += [0, 2, 4.5][habits.exercise];

  // Diet: Lancet GBD 2017 — poor diet ~4 year reduction
  totalHabitPenalty += [0, 1.5, 4][habits.diet];

  // Stress: APA/Lancet — chronic stress ~2-3 year reduction
  totalHabitPenalty += [0, 1, 2.5][habits.stress];

  // Hydration: NIH 2023 — ~1-2 year impact
  totalHabitPenalty += [0, 0.5, 1.5][habits.hydration];

  // Diminishing returns: first 10 years of penalty apply fully,
  // beyond that each additional year only counts ~50%.
  // This models overlapping risk pathways (e.g., smoking + poor diet
  // both affect CVD — they don't stack independently).
  let effectivePenalty: number;
  if (totalHabitPenalty <= 10) {
    effectivePenalty = totalHabitPenalty;
  } else {
    effectivePenalty = 10 + (totalHabitPenalty - 10) * 0.5;
  }

  // Cap maximum habit-based reduction at 20 years
  effectivePenalty = Math.min(20, effectivePenalty);
  base -= effectivePenalty;

  // === BMI impact (WHO/Lancet) ===
  if (demographics.height && demographics.weight) {
    const bmi = demographics.weight / ((demographics.height / 100) ** 2);
    if (bmi >= 40) base -= 8;
    else if (bmi >= 35) base -= 5;
    else if (bmi >= 30) base -= 3;
    else if (bmi >= 25) base -= 1;
    else if (bmi < 18.5) base -= 2;
  }

  // === Biomarker impacts ===
  let bioPenalty = 0;
  if (biomarkers) {
    if (biomarkers.systolic !== null) {
      if (biomarkers.systolic >= 160) bioPenalty += 5;
      else if (biomarkers.systolic >= 140) bioPenalty += 3;
      else if (biomarkers.systolic >= 130) bioPenalty += 1;
    }
    if (biomarkers.ldl !== null) {
      if (biomarkers.ldl >= 190) bioPenalty += 3;
      else if (biomarkers.ldl >= 160) bioPenalty += 1.5;
    }
    if (biomarkers.hdl !== null && biomarkers.hdl < 40) bioPenalty += 1.5;
    if (biomarkers.hba1c !== null) {
      if (biomarkers.hba1c >= 8) bioPenalty += 6;
      else if (biomarkers.hba1c >= 6.5) bioPenalty += 3;
      else if (biomarkers.hba1c >= 5.7) bioPenalty += 1;
    }
    if (biomarkers.egfr !== null) {
      if (biomarkers.egfr < 30) bioPenalty += 8;
      else if (biomarkers.egfr < 60) bioPenalty += 4;
      else if (biomarkers.egfr < 90) bioPenalty += 1;
    }
    if (biomarkers.crp !== null && biomarkers.crp >= 3) bioPenalty += 1.5;
    if (biomarkers.triglycerides !== null && biomarkers.triglycerides >= 500) bioPenalty += 2;
    else if (biomarkers.triglycerides !== null && biomarkers.triglycerides >= 200) bioPenalty += 1;
    if (biomarkers.hemoglobin !== null) {
      const low = demographics.sex === 'male' ? 13.5 : 12;
      if (biomarkers.hemoglobin < low - 3) bioPenalty += 2;
      else if (biomarkers.hemoglobin < low) bioPenalty += 0.5;
    }

    // Biomarker penalties also get diminishing returns (cap at 12)
    base -= Math.min(12, bioPenalty);
  }

  // Floor: no one's estimated LE should drop below age+10 or 55, whichever is higher.
  // Even with terrible habits, a 17-year-old still has decades of potential change.
  const floor = Math.max(55, age + 10);
  return Math.round(Math.max(floor, Math.min(95, base)));
}

export default function HealthProgressBar({ risks, demographics, habits, years, biomarkers }: HealthProgressBarProps) {
  const healthScore = useMemo(() => {
    const avgRisk = risks.reduce((s, r) => s + r.score, 0) / risks.length;
    return Math.round(100 - avgRisk);
  }, [risks]);

  const lifeExpectancy = useMemo(() => estimateLifeExpectancy(habits, demographics, biomarkers), [habits, demographics, biomarkers]);
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
