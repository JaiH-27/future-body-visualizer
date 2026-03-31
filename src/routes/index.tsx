import { useState, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import BodyVisualization3D from '@/components/BodyVisualization3D';
import KPIStrip from '@/components/KPIStrip';
import BodyContextPanel from '@/components/BodyContextPanel';
import HealthProgressBar from '@/components/HealthProgressBar';
import HealthReportPDF from '@/components/HealthReportPDF';
import AppHeader from '@/components/AppHeader';
import FloatingAIChat, { type ChatMessage } from '@/components/FloatingAIChat';
import { useHealthState } from '@/hooks/use-health-state';
import { toast } from 'sonner';
import { PRESETS, type OrganRisk } from '@/lib/health-types';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const { habits, setHabits, demographics, biomarkers, years, risks, resetAll } = useHealthState();
  const [selectedOrgan, setSelectedOrgan] = useState<OrganRisk | null>(null);
  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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

          <HealthProgressBar risks={risks} demographics={demographics} habits={habits} years={years} biomarkers={biomarkers} />
          <KPIStrip risks={risks} onOrganHover={setHoveredOrgan} hoveredOrgan={hoveredOrgan} />

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Quick presets:</span>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setHabits(preset.habits)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

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
                            <span className={`text-xs font-bold font-mono ${textColor}`}>{healthVal.toFixed(2)}%</span>
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

          {/* AI Chat Log + Floating Bar */}
          <FloatingAIChat chatMessages={chatMessages} setChatMessages={setChatMessages} />

          <p className="text-[10px] text-muted-foreground/50 text-center px-2">
            ⚕️ Educational tool only. References WHO, CDC, AHA & NIH guidelines. Not medical advice.
          </p>
        </div>
      </main>
    </div>
  );
}
