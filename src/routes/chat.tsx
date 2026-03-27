import { useState, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import AppHeader from '@/components/AppHeader';
import ChatInput from '@/components/ChatInput';
import OrganInsightCard from '@/components/OrganInsightCard';
import { useHealthState } from '@/hooks/use-health-state';
import { toast } from 'sonner';
import type { OrganRisk, HabitLevel } from '@/lib/health-types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tglfrgxkinkoxbocadum.supabase.co';
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbGZyZ3hraW5rb3hib2NhZHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDg4MjEsImV4cCI6MjA5MDE4NDgyMX0.l6qzeNnFKwKt6D1pj6qQvQ4jmPg6f2lZ9WFFGX6ZJck';

export const Route = createFileRoute('/chat')({
  component: ChatPage,
});

function ChatPage() {
  const { habits, setHabits, demographics, risks } = useHealthState();
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedOrgan, setSelectedOrgan] = useState<OrganRisk | null>(null);

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
        toast.error(errData.error || 'Something went wrong.');
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
  }, [demographics, setHabits]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-[960px] mx-auto space-y-5">

          <div>
            <h2 className="text-lg font-bold text-foreground font-display">AI Health Chat</h2>
            <p className="text-sm text-muted-foreground mt-1">Describe your lifestyle naturally and the AI will analyze your habits and update your health profile.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

            {/* Chat area */}
            <div className="md:col-span-3">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Chat</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Try: "I smoke daily, sleep 5 hours, and eat mostly fast food"
                  </p>
                </div>

                {/* Messages */}
                <div className="min-h-[400px] max-h-[500px] overflow-y-auto p-5 space-y-4">
                  {chatMessages.length === 0 && !chatLoading && (
                    <div className="text-center py-16">
                      <p className="text-3xl mb-3">💬</p>
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Describe your daily habits to get started</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}>
                        {msg.text.split('\n').map((line, j) => (
                          <span key={j}>
                            {line}
                            {j < msg.text.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground rounded-xl px-4 py-3 text-sm animate-pulse">
                        ✦ Analyzing your habits...
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <ChatInput onSend={handleChat} disabled={chatLoading} />
                </div>
              </div>
            </div>

            {/* Sidebar: Organ insights + current habits */}
            <div className="md:col-span-2 space-y-4">
              {/* Quick organ selector */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Organ Insights</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Select an organ to see details</p>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  {risks.map(r => {
                    const ICONS: Record<string, string> = { brain: '🧠', heart: '❤️', lungs: '🫁', liver: '🫀', kidneys: '🫘', 'body-fat': '🏋️' };
                    const healthVal = 100 - r.score;
                    const color = healthVal >= 70 ? 'border-severity-good/30 bg-severity-good/5' : healthVal >= 40 ? 'border-severity-warn/30 bg-severity-warn/5' : 'border-severity-bad/30 bg-severity-bad/5';
                    const isSelected = selectedOrgan?.organ === r.organ;
                    return (
                      <button
                        key={r.organ}
                        onClick={() => setSelectedOrgan(r)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${color} ${isSelected ? 'ring-2 ring-primary/30' : ''}`}
                      >
                        <span className="text-lg">{ICONS[r.organ]}</span>
                        <span className="text-[10px] font-medium text-foreground">{r.label}</span>
                        <span className={`text-[10px] font-mono font-bold ${healthVal >= 70 ? 'text-severity-good' : healthVal >= 40 ? 'text-severity-warn' : 'text-severity-bad'}`}>
                          {healthVal}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <OrganInsightCard organ={selectedOrgan} />

              {/* Current habits summary */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Current Habits</h3>
                </div>
                <div className="p-4 space-y-2">
                  {Object.entries(habits).map(([key, val]) => {
                    const labels: Record<string, string[]> = {
                      smoking: ['None', 'Occasional', 'Daily'],
                      alcohol: ['None', 'Weekends', 'Frequent'],
                      sleep: ['7-9h', '6h', '≤5h'],
                      exercise: ['150+ min/wk', '60-149', '<60'],
                      diet: ['Balanced', 'Average', 'Poor'],
                      stress: ['Low', 'Moderate', 'High'],
                      hydration: ['8+ cups', '4-7 cups', '<4 cups'],
                    };
                    const color = val === 0 ? 'text-severity-good' : val === 1 ? 'text-severity-warn' : 'text-severity-bad';
                    return (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground capitalize">{key}</span>
                        <span className={`font-medium ${color}`}>{labels[key]?.[val] ?? '—'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
