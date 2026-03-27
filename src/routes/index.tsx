import { useState, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import BodyVisualization3D from '@/components/BodyVisualization3D';
import HabitSelector from '@/components/HabitSelector';
import DemographicsInput from '@/components/DemographicsInput';
import TimelineSelector from '@/components/TimelineSelector';
import AISummaryCard from '@/components/AISummaryCard';
import OrganInsightCard from '@/components/OrganInsightCard';
import ChatInput from '@/components/ChatInput';
import HealthReportPDF from '@/components/HealthReportPDF';
import { toast } from 'sonner';
import {
  type Habits,
  type HabitLevel,
  type TimelineYear,
  type OrganRisk,
  type Demographics,
  DEFAULT_HABITS,
  DEFAULT_DEMOGRAPHICS,
  PRESETS,
  calculateOrganRisks,
} from '@/lib/health-types';

const SUPABASE_URL = 'https://tglfrgxkinkoxbocadum.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbGZyZ3hraW5rb3hib2NhZHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDg4MjEsImV4cCI6MjA5MDE4NDgyMX0.l6qzeNnFKwKt6D1pj6qQvQ4jmPg6f2lZ9WFFGX6ZJck';

export const Route = createFileRoute('/')({
  component: FutureYou,
});

function FutureYou() {
  const [habits, setHabits] = useState<Habits>(DEFAULT_HABITS);
  const [demographics, setDemographics] = useState<Demographics>(DEFAULT_DEMOGRAPHICS);
  const [years, setYears] = useState<TimelineYear>(0);
  const [selectedOrgan, setSelectedOrgan] = useState<OrganRisk | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const risks = calculateOrganRisks(habits, years, demographics);

  const handleOrganClick = useCallback((organ: OrganRisk) => {
    setSelectedOrgan(organ);
  }, []);

  const handleChat = useCallback(async (message: string) => {
    setChatMessages((prev) => [...prev, { role: 'user', text: message }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/parse-habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({ message, demographics }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Something went wrong parsing your habits.');
        setChatLoading(false);
        return;
      }

      const data = await res.json();

      if (data.habits) {
        setHabits({
          smoking: data.habits.smoking as HabitLevel,
          alcohol: data.habits.alcohol as HabitLevel,
          sleep: data.habits.sleep as HabitLevel,
          exercise: data.habits.exercise as HabitLevel,
          diet: data.habits.diet as HabitLevel,
          stress: (data.habits.stress ?? 0) as HabitLevel,
          hydration: (data.habits.hydration ?? 0) as HabitLevel,
        });
      }

      let aiText = data.summary || 'Habits analyzed.';
      if (data.sources && data.sources.length > 0) {
        aiText += '\n📚 Sources: ' + data.sources.join(' · ');
      }
      if (data.bmi_note) {
        aiText += '\n📊 ' + data.bmi_note;
      }
      setChatMessages((prev) => [...prev, { role: 'ai', text: aiText }]);
    } catch (e) {
      console.error('Chat error:', e);
      toast.error('Failed to parse habits. Try again.');
    } finally {
      setChatLoading(false);
    }
  }, [demographics]);

  const applyPreset = useCallback((presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) setHabits(preset.habits);
  }, []);

  const handleReset = useCallback(() => {
    setHabits(DEFAULT_HABITS);
    setDemographics(DEFAULT_DEMOGRAPHICS);
    setYears(0);
    setSelectedOrgan(null);
    setChatMessages([]);
    toast.success('All settings reset to defaults.');
  }, []);

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <header className="border-b border-border/50 px-4 py-5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.h1
              className="text-2xl sm:text-3xl font-bold text-gradient"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Future You
            </motion.h1>
            <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-primary/25 bg-primary/8 text-primary font-semibold">
              Educational Demo
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <HealthReportPDF risks={risks} habits={habits} demographics={demographics} years={years} chatMessages={chatMessages} />
            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Presets */}
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Quick presets:</span>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant="preset"
              size="sm"
              onClick={() => applyPreset(key)}
              className="text-xs shrink-0 rounded-xl"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Body — UNTOUCHED */}
          <motion.div
            className="lg:col-span-3 card-elevated rounded-2xl p-6 glow-subtle min-h-[520px] flex flex-col"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-brand-pink" />
                <h2 className="text-sm font-semibold text-foreground">Body Visualization</h2>
              </div>
              <span className="text-xs font-mono text-primary bg-primary/8 px-2 py-0.5 rounded-lg">
                +{years}y
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <BodyVisualization3D risks={risks} onOrganClick={handleOrganClick} />
            </div>
          </motion.div>

          {/* Right: Controls */}
          <motion.div
            className="lg:col-span-2 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Demographics */}
            <div className="card-elevated rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-brand-teal to-brand-blue" />
                Your Profile
              </h3>
              <DemographicsInput demographics={demographics} onChange={setDemographics} />
            </div>

            {/* Habits */}
            <div className="card-elevated rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-brand-teal to-primary" />
                Lifestyle Habits
              </h3>
              <HabitSelector habits={habits} onChange={setHabits} />
            </div>

            {/* Timeline */}
            <div className="card-elevated rounded-2xl p-5">
              <TimelineSelector value={years} onChange={setYears} />
            </div>

            {/* AI Summary */}
            <AISummaryCard risks={risks} years={years} />

            {/* Organ Insight */}
            <OrganInsightCard organ={selectedOrgan} />

            {/* Chat */}
            <ChatInput onSend={handleChat} disabled={chatLoading} />

            {/* Chat messages */}
            {(chatMessages.length > 0 || chatLoading) && (
              <div className="card-elevated rounded-2xl p-4 space-y-2 max-h-60 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`text-xs leading-relaxed ${msg.role === 'ai' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    <span className="font-semibold">{msg.role === 'user' ? '→' : '✦'}</span>{' '}
                    {msg.text.split('\n').map((line, j) => (
                      <span key={j}>
                        {line}
                        {j < msg.text.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                ))}
                {chatLoading && (
                  <p className="text-xs text-primary animate-pulse font-medium">✦ Analyzing your habits with verified health data...</p>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-[10px] text-muted-foreground/60 text-center px-2">
              ⚕️ Educational tool only. Risk projections reference WHO, CDC, AHA & NIH guidelines but do not constitute medical advice.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
