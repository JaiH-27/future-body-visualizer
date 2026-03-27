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
}

export type OrganId = 'brain' | 'heart' | 'lungs' | 'liver' | 'body-fat';

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
  { id: 'sleep', label: 'Sleep', icon: '😴', levels: ['8h+', '6h', '≤5h'] },
  { id: 'exercise', label: 'Exercise', icon: '🏃', levels: ['Regular', 'Low', 'None'] },
  { id: 'diet', label: 'Diet', icon: '🥗', levels: ['Balanced', 'Average', 'Poor'] },
];

export const TIMELINE_YEARS: TimelineYear[] = [0, 5, 10, 20];

export const DEFAULT_HABITS: Habits = {
  smoking: 0,
  alcohol: 0,
  sleep: 0,
  exercise: 0,
  diet: 0,
};

export const PRESETS: Record<string, { label: string; habits: Habits }> = {
  healthy: { label: '💚 Healthy', habits: { smoking: 0, alcohol: 0, sleep: 0, exercise: 0, diet: 0 } },
  smoker: { label: '🚬 Smoker', habits: { smoking: 2, alcohol: 1, sleep: 1, exercise: 1, diet: 1 } },
  poorSleep: { label: '😵 Poor Sleep', habits: { smoking: 0, alcohol: 1, sleep: 2, exercise: 1, diet: 1 } },
  stressCombo: { label: '⚡ Stress Combo', habits: { smoking: 1, alcohol: 2, sleep: 2, exercise: 2, diet: 2 } },
};

// Simple risk calculator (no medical accuracy needed)
export function calculateOrganRisks(habits: Habits, years: TimelineYear): OrganRisk[] {
  const timeFactor = years / 20;

  const lungScore = Math.min(100, (habits.smoking * 35 + habits.exercise * 10 + habits.diet * 5) * (0.3 + timeFactor * 0.7));
  const heartScore = Math.min(100, (habits.smoking * 15 + habits.exercise * 20 + habits.diet * 15 + habits.alcohol * 10) * (0.3 + timeFactor * 0.7));
  const liverScore = Math.min(100, (habits.alcohol * 30 + habits.diet * 15 + habits.smoking * 5) * (0.3 + timeFactor * 0.7));
  const brainScore = Math.min(100, (habits.sleep * 25 + habits.alcohol * 15 + habits.smoking * 10) * (0.3 + timeFactor * 0.7));
  const fatScore = Math.min(100, (habits.exercise * 20 + habits.diet * 25 + habits.sleep * 10) * (0.3 + timeFactor * 0.7));

  const toRisk = (score: number): RiskLevel =>
    score < 20 ? 'low' : score < 45 ? 'moderate' : score < 70 ? 'high' : 'critical';

  const summaries: Record<OrganId, (r: RiskLevel) => string> = {
    lungs: (r) => r === 'low' ? 'Lungs appear healthy with current habits.' : r === 'moderate' ? 'Some strain on respiratory function over time.' : r === 'high' ? 'Noticeable decline in lung capacity expected.' : 'Severe respiratory risk from sustained habits.',
    heart: (r) => r === 'low' ? 'Heart health looks strong.' : r === 'moderate' ? 'Mild cardiovascular strain developing.' : r === 'high' ? 'Elevated risk of heart-related issues.' : 'Significant cardiovascular stress projected.',
    liver: (r) => r === 'low' ? 'Liver function remains normal.' : r === 'moderate' ? 'Some metabolic strain on the liver.' : r === 'high' ? 'Liver showing signs of increased load.' : 'Liver health critically impacted.',
    brain: (r) => r === 'low' ? 'Cognitive function well-maintained.' : r === 'moderate' ? 'Mild impact on focus and memory.' : r === 'high' ? 'Noticeable cognitive decline risk.' : 'Significant brain health concerns.',
    'body-fat': (r) => r === 'low' ? 'Body composition looks healthy.' : r === 'moderate' ? 'Gradual increase in body fat likely.' : r === 'high' ? 'Notable body composition changes.' : 'Significant metabolic and weight concerns.',
  };

  return [
    { organ: 'brain', label: 'Brain', risk: toRisk(brainScore), score: brainScore, summary: summaries.brain(toRisk(brainScore)) },
    { organ: 'heart', label: 'Heart', risk: toRisk(heartScore), score: heartScore, summary: summaries.heart(toRisk(heartScore)) },
    { organ: 'lungs', label: 'Lungs', risk: toRisk(lungScore), score: lungScore, summary: summaries.lungs(toRisk(lungScore)) },
    { organ: 'liver', label: 'Liver', risk: toRisk(liverScore), score: liverScore, summary: summaries.liver(toRisk(liverScore)) },
    { organ: 'body-fat', label: 'Body Fat', risk: toRisk(fatScore), score: fatScore, summary: summaries['body-fat'](toRisk(fatScore)) },
  ];
}
