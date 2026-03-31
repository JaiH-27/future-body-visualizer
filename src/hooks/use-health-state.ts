import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
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
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  // Notify other useHealthState instances on the SAME page
  window.dispatchEvent(new CustomEvent('health-state-sync', { detail: { key } }));
}

// Global revision counter to trigger re-renders across all hook instances
let revision = 0;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return revision;
}

function bump() {
  revision++;
  listeners.forEach(cb => cb());
}

export function useHealthState() {
  // Subscribe to cross-instance sync events
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const [habits, setHabitsState] = useState<Habits>(DEFAULT_HABITS);
  const [demographics, setDemographicsState] = useState<Demographics>(DEFAULT_DEMOGRAPHICS);
  const [biomarkers, setBiomarkersState] = useState<BloodBiomarkers>(DEFAULT_BIOMARKERS);
  const [years, setYearsState] = useState<TimelineYear>(0 as TimelineYear);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setHabitsState(loadJSON(STORAGE_KEYS.habits, DEFAULT_HABITS));
    setDemographicsState(loadJSON(STORAGE_KEYS.demographics, DEFAULT_DEMOGRAPHICS));
    setBiomarkersState(loadJSON(STORAGE_KEYS.biomarkers, DEFAULT_BIOMARKERS));
    setYearsState(loadJSON(STORAGE_KEYS.timeline, 0 as TimelineYear));
  }, []);

  // Listen for sync events from other instances on the same page
  useEffect(() => {
    const handler = (e: Event) => {
      const key = (e as CustomEvent).detail?.key;
      if (key === STORAGE_KEYS.habits) setHabitsState(loadJSON(STORAGE_KEYS.habits, DEFAULT_HABITS));
      if (key === STORAGE_KEYS.demographics) setDemographicsState(loadJSON(STORAGE_KEYS.demographics, DEFAULT_DEMOGRAPHICS));
      if (key === STORAGE_KEYS.biomarkers) setBiomarkersState(loadJSON(STORAGE_KEYS.biomarkers, DEFAULT_BIOMARKERS));
      if (key === STORAGE_KEYS.timeline) setYearsState(loadJSON(STORAGE_KEYS.timeline, 0 as TimelineYear));
    };
    window.addEventListener('health-state-sync', handler);
    return () => window.removeEventListener('health-state-sync', handler);
  }, []);

  const setHabits = useCallback((h: Habits | ((prev: Habits) => Habits)) => {
    setHabitsState(prev => {
      const next = typeof h === 'function' ? h(prev) : h;
      saveJSON(STORAGE_KEYS.habits, next);
      bump();
      return next;
    });
  }, []);

  const setDemographics = useCallback((d: Demographics | ((prev: Demographics) => Demographics)) => {
    setDemographicsState(prev => {
      const next = typeof d === 'function' ? d(prev) : d;
      saveJSON(STORAGE_KEYS.demographics, next);
      bump();
      return next;
    });
  }, []);

  const setBiomarkers = useCallback((b: BloodBiomarkers | ((prev: BloodBiomarkers) => BloodBiomarkers)) => {
    setBiomarkersState(prev => {
      const next = typeof b === 'function' ? b(prev) : b;
      saveJSON(STORAGE_KEYS.biomarkers, next);
      bump();
      return next;
    });
  }, []);

  const setYears = useCallback((y: TimelineYear) => {
    setYearsState(y);
    saveJSON(STORAGE_KEYS.timeline, y);
    bump();
  }, []);

  const risks = calculateOrganRisks(habits, years, demographics, biomarkers);

  const resetAll = useCallback(() => {
    setHabitsState(DEFAULT_HABITS);
    setDemographicsState(DEFAULT_DEMOGRAPHICS);
    setBiomarkersState(DEFAULT_BIOMARKERS);
    setYearsState(0);
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    bump();
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
