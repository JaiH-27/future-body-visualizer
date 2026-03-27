import { createFileRoute } from '@tanstack/react-router';
import AppHeader from '@/components/AppHeader';
import HabitSelector from '@/components/HabitSelector';
import DemographicsInput from '@/components/DemographicsInput';
import TimelineSelector from '@/components/TimelineSelector';
import WhatIfMode from '@/components/WhatIfMode';
import AISummaryCard from '@/components/AISummaryCard';
import { useHealthState } from '@/hooks/use-health-state';
import { toast } from 'sonner';
import { PRESETS } from '@/lib/health-types';
import { useCallback } from 'react';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { habits, setHabits, demographics, setDemographics, years, setYears, risks, resetAll } = useHealthState();

  const handleReset = useCallback(() => {
    resetAll();
    toast.success('All settings reset.');
  }, [resetAll]);

  const applyPreset = useCallback((key: string) => {
    const preset = PRESETS[key];
    if (preset) setHabits(preset.habits);
  }, [setHabits]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onReset={handleReset} />

      <main className="px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-[960px] mx-auto space-y-5">

          <div>
            <h2 className="text-lg font-bold text-foreground font-display">Profile & Lifestyle</h2>
            <p className="text-sm text-muted-foreground mt-1">Set your demographics, habits, and timeline to see how they affect your health projections.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Demographics */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Demographics</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Age, height, weight, and sex for adjusted risk ranges</p>
              </div>
              <div className="p-5">
                <DemographicsInput demographics={demographics} onChange={setDemographics} />
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Timeline Projection</h3>
                <p className="text-xs text-muted-foreground mt-0.5">See how your health changes over time</p>
              </div>
              <div className="p-5">
                <TimelineSelector value={years} onChange={setYears} habits={habits} demographics={demographics} />
              </div>
            </div>
          </div>

          {/* Habits */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Lifestyle Habits</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Rate each habit — this drives all organ risk calculations</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Presets:</span>
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="text-xs px-2.5 py-1 rounded border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              <HabitSelector habits={habits} onChange={setHabits} />
            </div>
          </div>

          {/* What If + Lifestyle Drivers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">What If Mode</h3>
                <p className="text-xs text-muted-foreground mt-0.5">See how changes would impact your health</p>
              </div>
              <div className="p-5">
                <WhatIfMode habits={habits} demographics={demographics} years={years} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Lifestyle Drivers</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Key factors influencing your projections</p>
              </div>
              <div className="p-5">
                <AISummaryCard risks={risks} years={years} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
