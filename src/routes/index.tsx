import { useState, useCallback, useRef, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, X } from 'lucide-react';
import BodyVisualization3D from '@/components/BodyVisualization3D';
import KPIStrip from '@/components/KPIStrip';
import BodyContextPanel from '@/components/BodyContextPanel';
import HealthProgressBar from '@/components/HealthProgressBar';
import HealthReportPDF from '@/components/HealthReportPDF';
import AppHeader from '@/components/AppHeader';
import { useHealthState } from '@/hooks/use-health-state';
import { toast } from 'sonner';
import type { OrganRisk, HabitLevel } from '@/lib/health-types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tglfrgxkinkoxbocadum.supabase.co';
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbGZyZ3hraW5rb3hib2NhZHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDg4MjEsImV4cCI6MjA5MDE4NDgyMX0.l6qzeNnFKwKt6D1pj6qQvQ4jmPg6f2lZ9WFFGX6ZJck';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const { habits, setHabits, demographics, years, risks, resetAll } = useHealthState();
  const [selectedOrgan, setSelectedOrgan] = useState<OrganRisk | null>(null);
  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const handleOrganClick = useCallback((organ: OrganRisk) => {
    setSelectedOrgan(organ);
  }, []);

  const handleReset = useCallback(() => {
    resetAll();
    setSelectedOrgan(null);
    setHoveredOrgan(null);
    setChatMessages([]);
    toast.success('All settings reset.');
  }, [resetAll]);

  const handleChat = useCallback(async (message: string) => {
    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
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
      if (data.sources?.length > 0) {
        aiText += '\n📚 Sources: ' + data.sources.join(' · ');
      }
      if (data.bmi_note) {
        aiText += '\n📊 ' + data.bmi_note;
      }
      setChatMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (e) {
      console.error('Chat error:', e);
      toast.error('Failed to parse habits. Try again.');
    } finally {
      setChatLoading(false);
    }
  }, [demographics, setHabits]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    handleChat(chatInput.trim());
    setChatInput('');
  };

  const ICONS: Record<string, string> = { brain: '🧠', heart: '❤️', lungs: '🫁', liver: '🫀', kidneys: '🫘', 'body-fat': '🏋️' };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader
        onReset={handleReset}
        extraActions={
          <HealthReportPDF risks={risks} habits={habits} demographics={demographics} years={years} chatMessages={chatMessages} />
        }
      />

      <main className="px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-[1440px] mx-auto space-y-5">

          <HealthProgressBar risks={risks} demographics={demographics} habits={habits} years={years} />
          <KPIStrip risks={risks} onOrganHover={setHoveredOrgan} hoveredOrgan={hoveredOrgan} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Body Visualization */}
            <section className="lg:col-span-7">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Your Body</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Hover organs for details · Click for insights</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded">
                    {years === 0 ? 'Now' : `+${years}y projection`}
                  </span>
                </div>
                <div className="relative min-h-[500px] lg:min-h-[600px]">
                  <BodyVisualization3D risks={risks} onOrganClick={handleOrganClick} highlightedOrgan={hoveredOrgan} />
                  <BodyContextPanel risks={risks} hoveredOrgan={hoveredOrgan} selectedOrgan={selectedOrgan} />
                </div>
              </div>
            </section>

            {/* Organ Health Table */}
            <section className="lg:col-span-5 space-y-4">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Organ Health Breakdown</h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    {years === 0 ? 'current' : `${years}y projection`}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {risks.map((risk) => {
                    const healthVal = 100 - risk.score;
                    const isHovered = hoveredOrgan === risk.organ;
                    const barColor = healthVal >= 70 ? 'bg-severity-good' : healthVal >= 40 ? 'bg-severity-warn' : 'bg-severity-bad';
                    const textColor = healthVal >= 70 ? 'text-severity-good' : healthVal >= 40 ? 'text-severity-warn' : 'text-severity-bad';

                    return (
                      <div
                        key={risk.organ}
                        onMouseEnter={() => setHoveredOrgan(risk.organ)}
                        onMouseLeave={() => setHoveredOrgan(null)}
                        onClick={() => handleOrganClick(risk)}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                          isHovered ? 'bg-primary/[0.03]' : 'hover:bg-muted/30'
                        }`}
                      >
                        <span className="text-base w-6 text-center">{ICONS[risk.organ]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-foreground">{risk.label}</span>
                            <span className={`text-xs font-bold font-mono ${textColor}`}>{healthVal}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${healthVal}%` }} />
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
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

              {selectedOrgan && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{ICONS[selectedOrgan.organ]}</span>
                    <h3 className="text-sm font-semibold text-foreground">{selectedOrgan.label} — Detail</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedOrgan.summary}</p>
                </div>
              )}
            </section>
          </div>

          {/* AI Chat Response Log — bottom of page */}
          {chatMessages.length > 0 && (
            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">AI Analysis Log</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Chat history and health insights from the AI</p>
              </div>
              <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      {msg.text.split('\n').map((line, j) => (
                        <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-xl px-4 py-2.5 text-sm animate-pulse">✦ Analyzing...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </section>
          )}

          <p className="text-[10px] text-muted-foreground/50 text-center px-2">
            ⚕️ Educational tool only. References WHO, CDC, AHA & NIH guidelines. Not medical advice.
          </p>
        </div>
      </main>

      {/* Floating Chat Bar with Rainbow Aura */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-[700px] mx-auto px-4 pb-5 pointer-events-auto">
          <AnimatePresence mode="wait">
            {chatOpen ? (
              <motion.div
                key="open"
                initial={{ y: 20, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="rainbow-aura rounded-2xl"
              >
                <div className="rounded-2xl bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                      </span>
                      AI Health Chat
                    </span>
                    <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 p-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder='Try: "I smoke daily and sleep 5 hours"'
                      disabled={chatLoading}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none px-2 py-1"
                      autoFocus
                    />
                    <button
                      onClick={sendMessage}
                      disabled={chatLoading || !chatInput.trim()}
                      className="shrink-0 h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 transition-all active:scale-95"
                    >
                      {chatLoading ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="closed"
                initial={{ y: 20, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={() => setChatOpen(true)}
                className="w-full rainbow-aura rounded-2xl"
              >
                <div className="rounded-2xl bg-card px-5 py-3.5 flex items-center gap-3 hover:bg-card/90 transition-colors cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-violet to-brand-pink text-primary-foreground flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm text-muted-foreground">Describe your habits to the AI...</span>
                  <div className="ml-auto flex items-center gap-1">
                    <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground font-mono">↵</kbd>
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
