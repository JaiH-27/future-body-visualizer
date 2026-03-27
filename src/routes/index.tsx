import { useState, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import BodyVisualization3D from '@/components/BodyVisualization3D';
import HabitSelector from '@/components/HabitSelector';
import TimelineSelector from '@/components/TimelineSelector';
import AISummaryCard from '@/components/AISummaryCard';
import OrganInsightCard from '@/components/OrganInsightCard';
import ChatInput from '@/components/ChatInput';
import { toast } from 'sonner';
import {
  type Habits,
  type HabitLevel,
  type TimelineYear,
  type OrganRisk,
  DEFAULT_HABITS,
  PRESETS,
  calculateOrganRisks,
} from '@/lib/health-types';

export const Route = createFileRoute('/')({
  component: FutureYou,
});

function FutureYou() {
  const [habits, setHabits] = useState<Habits>(DEFAULT_HABITS);
  const [years, setYears] = useState<TimelineYear>(0);
  const [selectedOrgan, setSelectedOrgan] = useState<OrganRisk | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const risks = calculateOrganRisks(habits, years);

  const handleOrganClick = useCallback((organ: OrganRisk) => {
    setSelectedOrgan(organ);
  }, []);

  const handleChat = useCallback(async (message: string) => {
    setChatMessages((prev) => [...prev, { role: 'user', text: message }]);
    setChatLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !anonKey) {
        toast.error('Configuration error. Please try again.');
        setChatLoading(false);
        return;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/parse-habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ message }),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Something went wrong parsing your habits.');
        setChatLoading(false);
        return;
      }
      
      const data = await res.json();
      const error = null;

      if (error) {
        toast.error('Something went wrong parsing your habits.');
        setChatLoading(false);
        return;
      }
      if (data.habits) {
        setHabits({
          smoking: data.habits.smoking as HabitLevel,
          alcohol: data.habits.alcohol as HabitLevel,
          sleep: data.habits.sleep as HabitLevel,
          exercise: data.habits.exercise as HabitLevel,
          diet: data.habits.diet as HabitLevel,
        });
      }
      if (data.summary) {
        setChatMessages((prev) => [...prev, { role: 'ai', text: data.summary }]);
      }
    } catch (e) {
      console.error('Chat error:', e);
      toast.error('Failed to parse habits. Try again.');
    } finally {
      setChatLoading(false);
    }
  }, []);

  const applyPreset = useCallback((presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) setHabits(preset.habits);
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
          <p className="hidden sm:block text-sm text-muted-foreground max-w-xs text-right">
            Visualize how your habits may affect your body over time
          </p>
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
          {/* Left: Body */}
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
              <div className="card-elevated rounded-2xl p-4 space-y-2 max-h-40 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <p key={i} className={`text-xs leading-relaxed ${msg.role === 'ai' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    <span className="font-semibold">{msg.role === 'user' ? '→' : '✦'}</span>{' '}
                    {msg.text}
                  </p>
                ))}
                {chatLoading && (
                  <p className="text-xs text-primary animate-pulse font-medium">✦ Analyzing your habits...</p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
