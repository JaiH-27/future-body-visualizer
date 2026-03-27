import { useState, useCallback } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw, Clock, FlaskConical } from 'lucide-react';
import BodyVisualization3D from '@/components/BodyVisualization3D';
import HabitSelector from '@/components/HabitSelector';
import DemographicsInput from '@/components/DemographicsInput';
import TimelineSelector from '@/components/TimelineSelector';
import AISummaryCard from '@/components/AISummaryCard';
import OrganInsightCard from '@/components/OrganInsightCard';
import ChatInput from '@/components/ChatInput';
import HealthReportPDF from '@/components/HealthReportPDF';
import KPIStrip from '@/components/KPIStrip';
import BodyContextPanel from '@/components/BodyContextPanel';
import WhatIfMode from '@/components/WhatIfMode';
import HealthProgressBar from '@/components/HealthProgressBar';
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tglfrgxkinkoxbocadum.supabase.co';
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbGZyZ3hraW5rb3hib2NhZHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDg4MjEsImV4cCI6MjA5MDE4NDgyMX0.l6qzeNnFKwKt6D1pj6qQvQ4jmPg6f2lZ9WFFGX6ZJck';

export const Route = createFileRoute('/')({
  component: FutureYou,
});

function FutureYou() {
  const [habits, setHabits] = useState<Habits>(DEFAULT_HABITS);
  const [demographics, setDemographics] = useState<Demographics>(DEFAULT_DEMOGRAPHICS);
  const [years, setYears] = useState<TimelineYear>(0);
  const [selectedOrgan, setSelectedOrgan] = useState<OrganRisk | null>(null);
  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const risks = calculateOrganRisks(habits, years, demographics);
  const avgScore = Math.round(risks.reduce((sum, r) => sum + r.score, 0) / risks.length);
  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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
    setHoveredOrgan(null);
    setChatMessages([]);
    toast.success('All settings reset to defaults.');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-2.5 sm:px-6 lg:px-8 bg-card sticky top-0 z-20">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-foreground tracking-tight font-display">Future You</h1>
            <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border border-border bg-muted text-muted-foreground font-semibold">
              Health Analytics
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="font-mono">Updated {now}</span>
            <div className="w-px h-4 bg-border mx-1" />
            <Link to="/health-data">
              <Button variant="outline" size="sm" className="text-[11px] gap-1 h-7 px-2">
                <FlaskConical className="w-3 h-3" />
                Blood Work & Disease Risk
              </Button>
            </Link>
            <HealthReportPDF risks={risks} habits={habits} demographics={demographics} years={years} chatMessages={chatMessages} />
            <Button variant="outline" size="sm" onClick={handleReset} className="text-[11px] gap-1 h-7 px-2">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-[1440px] mx-auto space-y-4">

          {/* Top: Health Progress Bar + Life Expectancy */}
          <HealthProgressBar risks={risks} demographics={demographics} habits={habits} years={years} />

          {/* Presets + KPI */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overview</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Presets:</span>
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="text-[10px] px-2 py-0.5 rounded border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <KPIStrip risks={risks} onOrganHover={setHoveredOrgan} hoveredOrgan={hoveredOrgan} />
          </section>

          {/* Main 3-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* LEFT: AI Chat + Organ Insight + What If + Lifestyle Drivers */}
            <aside className="lg:col-span-3 space-y-3 order-2 lg:order-1">
              {/* AI Chat */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">AI Health Chat</h2>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Describe your habits naturally</p>
                </div>
                <div className="p-3">
                  <ChatInput onSend={handleChat} disabled={chatLoading} />
                </div>
                {(chatMessages.length > 0 || chatLoading) && (
                  <div className="px-4 pb-3 space-y-2 max-h-60 overflow-y-auto">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`text-[11px] leading-relaxed ${msg.role === 'ai' ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                      >
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
                      <p className="text-[11px] text-primary animate-pulse font-medium">✦ Analyzing...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Organ Insight Detail */}
              <OrganInsightCard organ={selectedOrgan} />

              {/* What If */}
              <WhatIfMode habits={habits} demographics={demographics} years={years} />

              {/* Lifestyle Drivers */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">Lifestyle Drivers</h2>
                </div>
                <div className="p-4">
                  <AISummaryCard risks={risks} years={years} />
                </div>
              </div>

              <p className="text-[9px] text-muted-foreground/50 text-center px-2">
                ⚕️ Educational tool only. References WHO, CDC, AHA & NIH guidelines. Not medical advice.
              </p>
            </aside>

            {/* CENTER: Body Visualization + Organ Table */}
            <section className="lg:col-span-5 space-y-3 order-1 lg:order-2">
              {/* Body Card */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Your Body Today</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Hover organs for details · Click for insights
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {years === 0 ? 'Now' : `+${years}y`}
                  </span>
                </div>
                <div className="relative min-h-[480px] lg:min-h-[560px]">
                  <BodyVisualization3D
                    risks={risks}
                    onOrganClick={handleOrganClick}
                    highlightedOrgan={hoveredOrgan}
                  />
                  <BodyContextPanel
                    risks={risks}
                    hoveredOrgan={hoveredOrgan}
                    selectedOrgan={selectedOrgan}
                  />
                </div>
              </div>

              {/* Organ Breakdown */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Organ Health</h2>
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {years === 0 ? 'current' : `${years}y projection`}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {risks.map((risk) => {
                    const healthVal = 100 - risk.score;
                    const isHovered = hoveredOrgan === risk.organ;
                    const barColor = healthVal >= 70 ? 'bg-severity-good' : healthVal >= 40 ? 'bg-severity-warn' : 'bg-severity-bad';
                    const textColor = healthVal >= 70 ? 'text-severity-good' : healthVal >= 40 ? 'text-severity-warn' : 'text-severity-bad';
                    const ICONS: Record<string, string> = { brain: '🧠', heart: '❤️', lungs: '🫁', liver: '🫀', kidneys: '🫘', 'body-fat': '🏋️' };

                    return (
                      <div
                        key={risk.organ}
                        onMouseEnter={() => setHoveredOrgan(risk.organ)}
                        onMouseLeave={() => setHoveredOrgan(null)}
                        onClick={() => handleOrganClick(risk)}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                          isHovered ? 'bg-primary/[0.03]' : 'hover:bg-muted/30'
                        }`}
                      >
                        <span className="text-sm w-5 text-center">{ICONS[risk.organ]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-foreground">{risk.label}</span>
                            <span className={`text-[11px] font-bold font-mono ${textColor}`}>{healthVal}</span>
                          </div>
                          <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${healthVal}%` }} />
                          </div>
                        </div>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                          risk.risk === 'low' ? 'bg-severity-good/10 text-severity-good'
                          : risk.risk === 'moderate' ? 'bg-severity-warn/10 text-severity-warn'
                          : 'bg-severity-bad/10 text-severity-bad'
                        }`}>
                          {risk.risk}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* RIGHT: Profile + Habits + Timeline */}
            <aside className="lg:col-span-4 space-y-3 order-3">
              {/* Profile */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">Profile</h2>
                </div>
                <div className="p-4">
                  <DemographicsInput demographics={demographics} onChange={setDemographics} />
                </div>
              </div>

              {/* Habits */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">Lifestyle Habits</h2>
                </div>
                <div className="p-4">
                  <HabitSelector habits={habits} onChange={setHabits} />
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">Timeline Projection</h2>
                </div>
                <div className="p-4">
                  <TimelineSelector value={years} onChange={setYears} habits={habits} demographics={demographics} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
