import { useState, useCallback } from 'react';
import {
  type Habits,
  type HabitLevel,
  type TimelineYear,
  type Demographics,
  DEFAULT_HABITS,
  DEFAULT_DEMOGRAPHICS,
  calculateOrganRisks,
} from '@/lib/health-types';
import { type BloodBiomarkers, DEFAULT_BIOMARKERS } from '@/lib/biomarker-types';

const STORAGE_KEYS = {
  habits: 'health-habits',
  demographics: 'health-demographics',
  biomarkers: 'health-biomarkers',
  timeline: 'health-timeline',
} as const;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useHealthState() {
  const [habits, setHabitsState] = useState<Habits>(() => loadJSON(STORAGE_KEYS.habits, DEFAULT_HABITS));
  const [demographics, setDemographicsState] = useState<Demographics>(() => loadJSON(STORAGE_KEYS.demographics, DEFAULT_DEMOGRAPHICS));
  const [biomarkers, setBiomarkersState] = useState<BloodBiomarkers>(() => loadJSON(STORAGE_KEYS.biomarkers, DEFAULT_BIOMARKERS));
  const [years, setYearsState] = useState<TimelineYear>(() => loadJSON(STORAGE_KEYS.timeline, 0 as TimelineYear));

  const setHabits = useCallback((h: Habits | ((prev: Habits) => Habits)) => {
    setHabitsState(prev => {
      const next = typeof h === 'function' ? h(prev) : h;
      saveJSON(STORAGE_KEYS.habits, next);
      return next;
    });
  }, []);

  const setDemographics = useCallback((d: Demographics | ((prev: Demographics) => Demographics)) => {
    setDemographicsState(prev => {
      const next = typeof d === 'function' ? d(prev) : d;
      saveJSON(STORAGE_KEYS.demographics, next);
      return next;
    });
  }, []);

  const setBiomarkers = useCallback((b: BloodBiomarkers | ((prev: BloodBiomarkers) => BloodBiomarkers)) => {
    setBiomarkersState(prev => {
      const next = typeof b === 'function' ? b(prev) : b;
      saveJSON(STORAGE_KEYS.biomarkers, next);
      return next;
    });
  }, []);

  const setYears = useCallback((y: TimelineYear) => {
    setYearsState(y);
    saveJSON(STORAGE_KEYS.timeline, y);
  }, []);

  const risks = calculateOrganRisks(habits, years, demographics, biomarkers);

  const resetAll = useCallback(() => {
    setHabitsState(DEFAULT_HABITS);
    setDemographicsState(DEFAULT_DEMOGRAPHICS);
    setBiomarkersState(DEFAULT_BIOMARKERS);
    setYearsState(0);
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }, []);

  return {
    habits, setHabits,
    demographics, setDemographics,
    biomarkers, setBiomarkers,
    years, setYears,
    risks,
    resetAll,
  };
}
