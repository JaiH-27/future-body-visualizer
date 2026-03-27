import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrganRisk } from '@/lib/health-types';

interface BodyContextPanelProps {
  risks: OrganRisk[];
  hoveredOrgan: string | null;
  selectedOrgan: OrganRisk | null;
}

const ORGAN_ICONS: Record<string, string> = {
  brain: '🧠', heart: '❤️', lungs: '🫁', liver: '🫀', kidneys: '🫘', 'body-fat': '🏋️',
};

type FilterKey = 'all' | 'risks' | 'strengths';

export default function BodyContextPanel({ risks, hoveredOrgan, selectedOrgan }: BodyContextPanelProps) {
  const strongest = useMemo(() => {
    const sorted = [...risks].sort((a, b) => a.score - b.score);
    return sorted[0];
  }, [risks]);

  const weakest = useMemo(() => {
    const sorted = [...risks].sort((a, b) => b.score - a.score);
    return sorted[0];
  }, [risks]);

  const avgRisk = useMemo(() => Math.round(risks.reduce((s, r) => s + r.score, 0) / risks.length), [risks]);
  const overallLabel = avgRisk < 20 ? 'Low' : avgRisk < 45 ? 'Moderate' : avgRisk < 70 ? 'High' : 'Critical';
  const overallColor = avgRisk < 20 ? 'text-severity-good' : avgRisk < 45 ? 'text-severity-warn' : 'text-severity-bad';

  const activeOrgan = hoveredOrgan ? risks.find(r => r.organ === hoveredOrgan) : selectedOrgan;

  return (
    <div className="absolute left-3 top-12 bottom-14 w-[180px] z-10 pointer-events-none flex flex-col gap-2">
      {/* Quick summary */}
      <div className="pointer-events-auto rounded-lg border border-border/60 bg-card/90 backdrop-blur-sm p-3 shadow-sm">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</p>
        <p className={`text-sm font-bold ${overallColor}`}>
          Overall risk: {overallLabel}
        </p>
        <div className="mt-2 space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Strongest</span>
            <span className="font-medium text-severity-good flex items-center gap-1">
              {ORGAN_ICONS[strongest.organ]} {strongest.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Watch</span>
            <span className="font-medium text-severity-bad flex items-center gap-1">
              {ORGAN_ICONS[weakest.organ]} {weakest.label}
            </span>
          </div>
        </div>
      </div>

      {/* Active organ detail */}
      <AnimatePresence>
        {activeOrgan && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-auto rounded-lg border border-primary/20 bg-card/90 backdrop-blur-sm p-3 shadow-sm"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-base">{ORGAN_ICONS[activeOrgan.organ]}</span>
              <span className="text-xs font-bold text-foreground">{activeOrgan.label}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ml-auto ${
                activeOrgan.risk === 'low' ? 'bg-severity-good/15 text-severity-good'
                : activeOrgan.risk === 'moderate' ? 'bg-severity-warn/15 text-severity-warn'
                : 'bg-severity-bad/15 text-severity-bad'
              }`}>
                {activeOrgan.score.toFixed(2)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `var(--color-risk-${activeOrgan.risk})` }}
                initial={{ width: 0 }}
                animate={{ width: `${activeOrgan.score}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
              {activeOrgan.summary}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="pointer-events-auto rounded-lg border border-border/60 bg-card/90 backdrop-blur-sm p-2.5 mt-auto">
        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Risk Levels</p>
        <div className="space-y-1">
          {[
            { label: 'Low', color: 'bg-risk-low' },
            { label: 'Moderate', color: 'bg-risk-moderate' },
            { label: 'High', color: 'bg-risk-high' },
            { label: 'Critical', color: 'bg-risk-critical' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
