import type { BloodBiomarkers } from './biomarker-types';

export type HabitLevel = 0 | 1 | 2;

export interface HabitConfig {
  id: string;
  label: string;
  icon: string;
  levels: [string, string, string];
}

export interface Habits {
  smoking: HabitLevel;
  alcohol: HabitLevel;
  sleep: HabitLevel;
  exercise: HabitLevel;
  diet: HabitLevel;
  stress: HabitLevel;
  hydration: HabitLevel;
}

export interface Demographics {
  age: number | null;
  height: number | null; // cm
  weight: number | null; // kg
  sex: 'male' | 'female' | 'other' | null;
}

export type OrganId = 'brain' | 'heart' | 'lungs' | 'liver' | 'body-fat' | 'kidneys';

export type TimelineYear = 0 | 5 | 10 | 20;

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface OrganRisk {
  organ: OrganId;
  label: string;
  risk: RiskLevel;
  score: number; // 0-100
  summary: string;
}

export const HABIT_CONFIGS: HabitConfig[] = [
  { id: 'smoking', label: 'Smoking', icon: '🚬', levels: ['None', 'Occasional', 'Daily'] },
  { id: 'alcohol', label: 'Alcohol', icon: '🍷', levels: ['None', 'Weekends', 'Frequent'] },
  { id: 'sleep', label: 'Sleep', icon: '😴', levels: ['7-9h', '6h', '≤5h'] },
  { id: 'exercise', label: 'Exercise', icon: '🏃', levels: ['150+ min/wk', '60-149', '<60'] },
  { id: 'diet', label: 'Diet', icon: '🥗', levels: ['Balanced', 'Average', 'Poor'] },
  { id: 'stress', label: 'Stress', icon: '🧠', levels: ['Low', 'Moderate', 'High'] },
  { id: 'hydration', label: 'Hydration', icon: '💧', levels: ['8+ cups', '4-7 cups', '<4 cups'] },
];

export const TIMELINE_YEARS: TimelineYear[] = [0, 5, 10, 20];

export const DEFAULT_HABITS: Habits = {
  smoking: 0,
  alcohol: 0,
  sleep: 0,
  exercise: 0,
  diet: 0,
  stress: 0,
  hydration: 0,
};

export const DEFAULT_DEMOGRAPHICS: Demographics = {
  age: null,
  height: null,
  weight: null,
  sex: null,
};

export const PRESETS: Record<string, { label: string; habits: Habits }> = {
  healthy: { label: '💚 Healthy', habits: { smoking: 0, alcohol: 0, sleep: 0, exercise: 0, diet: 0, stress: 0, hydration: 0 } },
  smoker: { label: '🚬 Smoker', habits: { smoking: 2, alcohol: 1, sleep: 1, exercise: 1, diet: 1, stress: 1, hydration: 1 } },
  poorSleep: { label: '😵 Poor Sleep', habits: { smoking: 0, alcohol: 1, sleep: 2, exercise: 1, diet: 1, stress: 2, hydration: 1 } },
  stressCombo: { label: '⚡ Stress Combo', habits: { smoking: 1, alcohol: 2, sleep: 2, exercise: 2, diet: 2, stress: 2, hydration: 2 } },
};

/**
 * Evidence-informed risk calculator.
 * Based on relative risk multipliers from:
 * - WHO Global Health Risks report
 * - CDC Chronic Disease Risk Factors
 * - AHA Cardiovascular Risk Guidelines
 * - NIH Sleep & Cognition studies
 *
 * Note: This is for EDUCATIONAL purposes only and does not constitute medical advice.
 */
export function calculateOrganRisks(habits: Habits, years: TimelineYear, demographics?: Demographics, biomarkers?: BloodBiomarkers | null): OrganRisk[] {
  const timeFactor = years / 20;

  // Age modifier: risk increases with age (baseline 25, each decade adds ~10% risk)
  let ageMod = 1.0;
  if (demographics?.age) {
    ageMod = 1.0 + Math.max(0, (demographics.age - 25) * 0.008);
  }

  // BMI modifier (if height and weight provided)
  let bmiMod = 1.0;
  if (demographics?.height && demographics?.weight) {
    const heightM = demographics.height / 100;
    const bmi = demographics.weight / (heightM * heightM);
    if (bmi < 18.5) bmiMod = 1.1;
    else if (bmi >= 25 && bmi < 30) bmiMod = 1.15;
    else if (bmi >= 30) bmiMod = 1.3;
  }

  // === Biomarker boosts (add extra risk points when blood work is abnormal) ===
  let lungBioBoost = 0;
  let heartBioBoost = 0;
  let liverBioBoost = 0;
  let brainBioBoost = 0;
  let fatBioBoost = 0;
  let kidneyBioBoost = 0;

  if (biomarkers) {
    // Heart: cholesterol, BP, inflammation
    if (biomarkers.totalCholesterol !== null && biomarkers.totalCholesterol >= 240) heartBioBoost += 12;
    if (biomarkers.ldl !== null && biomarkers.ldl >= 160) heartBioBoost += 15;
    if (biomarkers.hdl !== null && biomarkers.hdl < 40) heartBioBoost += 10;
    if (biomarkers.triglycerides !== null && biomarkers.triglycerides >= 200) { heartBioBoost += 8; fatBioBoost += 8; }
    if (biomarkers.systolic !== null && biomarkers.systolic >= 140) heartBioBoost += 18;
    else if (biomarkers.systolic !== null && biomarkers.systolic >= 130) heartBioBoost += 8;
    if (biomarkers.crp !== null && biomarkers.crp >= 3) { heartBioBoost += 8; brainBioBoost += 5; }

    // Liver: ALT, AST
    if (biomarkers.alt !== null && biomarkers.alt > 56) liverBioBoost += 18;
    if (biomarkers.ast !== null && biomarkers.ast > 40) liverBioBoost += 12;

    // Kidneys: creatinine, eGFR, BUN
    if (biomarkers.creatinine !== null && biomarkers.creatinine > 1.3) kidneyBioBoost += 15;
    if (biomarkers.egfr !== null) {
      if (biomarkers.egfr < 60) kidneyBioBoost += 25;
      else if (biomarkers.egfr < 90) kidneyBioBoost += 10;
    }
    if (biomarkers.bun !== null && biomarkers.bun > 20) kidneyBioBoost += 8;

    // Brain: vitamin D, TSH, blood sugar (affects cognition)
    if (biomarkers.vitaminD !== null && biomarkers.vitaminD < 20) brainBioBoost += 8;
    if (biomarkers.tsh !== null && (biomarkers.tsh > 4 || biomarkers.tsh < 0.4)) brainBioBoost += 8;
    if (biomarkers.hba1c !== null && biomarkers.hba1c >= 6.5) brainBioBoost += 10;

    // Lungs: inflammation marker, hemoglobin (oxygen carrying)
    if (biomarkers.hemoglobin !== null) {
      const isMale = demographics?.sex === 'male';
      const low = isMale ? 13.5 : 12;
      if (biomarkers.hemoglobin < low) lungBioBoost += 10;
    }

    // Body fat / metabolic: blood sugar, triglycerides
    if (biomarkers.fastingGlucose !== null && biomarkers.fastingGlucose >= 126) fatBioBoost += 12;
    else if (biomarkers.fastingGlucose !== null && biomarkers.fastingGlucose >= 100) fatBioBoost += 5;
    if (biomarkers.hba1c !== null && biomarkers.hba1c >= 6.5) fatBioBoost += 10;

    // Anemia / ferritin affects energy → body fat score
    if (biomarkers.ferritin !== null && biomarkers.ferritin < 15) fatBioBoost += 5;
  }

  const r2 = (n: number) => parseFloat(n.toFixed(2));

  // Lung score
  const lungScore = r2(Math.min(100,
    (habits.smoking * 35 + habits.exercise * 12 + habits.diet * 5 + habits.hydration * 3) *
    (0.3 + timeFactor * 0.7) * ageMod + lungBioBoost
  ));

  // Heart score
  const heartScore = r2(Math.min(100,
    (habits.smoking * 15 + habits.exercise * 22 + habits.diet * 15 + habits.alcohol * 10 + habits.stress * 12) *
    (0.3 + timeFactor * 0.7) * ageMod * bmiMod + heartBioBoost
  ));

  // Liver score
  const liverScore = r2(Math.min(100,
    (habits.alcohol * 30 + habits.diet * 15 + habits.smoking * 5 + habits.hydration * 5) *
    (0.3 + timeFactor * 0.7) * ageMod + liverBioBoost
  ));

  // Brain score
  const brainScore = r2(Math.min(100,
    (habits.sleep * 25 + habits.alcohol * 12 + habits.smoking * 8 + habits.stress * 18 + habits.hydration * 5) *
    (0.3 + timeFactor * 0.7) * ageMod + brainBioBoost
  ));

  // Body fat score
  const fatScore = r2(Math.min(100,
    (habits.exercise * 22 + habits.diet * 25 + habits.sleep * 8 + habits.stress * 8 + habits.hydration * 4) *
    (0.3 + timeFactor * 0.7) * bmiMod + fatBioBoost
  ));

  // Kidney score
  const kidneyScore = r2(Math.min(100,
    (habits.hydration * 28 + habits.diet * 18 + habits.alcohol * 10 + habits.smoking * 5 + habits.stress * 5) *
    (0.3 + timeFactor * 0.7) * ageMod + kidneyBioBoost
  ));

  const toRisk = (score: number): RiskLevel =>
    score < 20 ? 'low' : score < 45 ? 'moderate' : score < 70 ? 'high' : 'critical';

  const summaries: Record<OrganId, (r: RiskLevel) => string> = {
    lungs: (r) =>
      r === 'low' ? 'Lungs appear healthy. The WHO notes non-smokers maintain ~95% lung function through life.'
      : r === 'moderate' ? 'Some respiratory strain. CDC data shows even occasional smoking reduces lung capacity by 5-10%.'
      : r === 'high' ? 'Significant decline in lung capacity projected. WHO: smokers lose lung function 2x faster than non-smokers.'
      : 'Severe respiratory risk. WHO reports smoking causes 80% of COPD deaths worldwide.',

    heart: (r) =>
      r === 'low' ? 'Heart health looks strong. AHA notes regular exercise reduces cardiovascular risk by 30-40%.'
      : r === 'moderate' ? 'Mild cardiovascular strain. AHA: sedentary adults have 2x the heart disease risk.'
      : r === 'high' ? 'Elevated heart risk. CDC: heart disease is the #1 cause of death, largely preventable through lifestyle.'
      : 'Critical cardiovascular stress. AHA warns this risk profile significantly increases heart attack probability.',

    liver: (r) =>
      r === 'low' ? 'Liver function remains healthy. NIH confirms moderate habits support full liver regeneration.'
      : r === 'moderate' ? 'Some metabolic strain on the liver. CDC: even moderate drinking can cause fatty liver over time.'
      : r === 'high' ? 'Increased liver load. WHO: alcohol is responsible for 50% of liver cirrhosis cases globally.'
      : 'Critical liver health risk. CDC: heavy drinking is the leading cause of preventable liver disease.',

    brain: (r) =>
      r === 'low' ? 'Cognitive function well-maintained. NIH: adequate sleep supports memory consolidation and neural repair.'
      : r === 'moderate' ? 'Mild impact on cognition. CDC: adults sleeping <7h have 33% higher risk of cognitive decline.'
      : r === 'high' ? 'Notable cognitive decline risk. NIH: chronic sleep deprivation linked to accelerated brain aging.'
      : 'Significant brain health concerns. WHO: combined stress and sleep deprivation dramatically increase dementia risk.',

    'body-fat': (r) =>
      r === 'low' ? 'Body composition healthy. WHO: regular activity maintains healthy metabolic function.'
      : r === 'moderate' ? 'Gradual body composition changes likely. CDC: adults gain ~1-2 lbs/year without active lifestyle.'
      : r === 'high' ? 'Notable metabolic changes projected. WHO: physical inactivity is the 4th leading mortality risk factor.'
      : 'Significant metabolic and weight concerns. CDC: obesity doubles the risk of 13 types of cancer.',

    kidneys: (r) =>
      r === 'low' ? 'Kidney function healthy. NIH notes adequate hydration supports optimal renal filtration and waste clearance.'
      : r === 'moderate' ? 'Mild kidney strain. CDC: chronic dehydration can reduce kidney efficiency by 10-20% over time.'
      : r === 'high' ? 'Elevated kidney risk. WHO: poor hydration and high-sodium diets are among the top modifiable risk factors for chronic kidney disease.'
      : 'Critical kidney risk. NIH: severe dehydration combined with poor diet can accelerate kidney disease progression significantly.',
  };

  return [
    { organ: 'brain', label: 'Brain', risk: toRisk(brainScore), score: brainScore, summary: summaries.brain(toRisk(brainScore)) },
    { organ: 'heart', label: 'Heart', risk: toRisk(heartScore), score: heartScore, summary: summaries.heart(toRisk(heartScore)) },
    { organ: 'lungs', label: 'Lungs', risk: toRisk(lungScore), score: lungScore, summary: summaries.lungs(toRisk(lungScore)) },
    { organ: 'liver', label: 'Liver', risk: toRisk(liverScore), score: liverScore, summary: summaries.liver(toRisk(liverScore)) },
    { organ: 'kidneys', label: 'Kidneys', risk: toRisk(kidneyScore), score: kidneyScore, summary: summaries.kidneys(toRisk(kidneyScore)) },
    { organ: 'body-fat', label: 'Body Fat', risk: toRisk(fatScore), score: fatScore, summary: summaries['body-fat'](toRisk(fatScore)) },
  ];
}
