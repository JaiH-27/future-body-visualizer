import { motion, AnimatePresence } from 'framer-motion';
import type { OrganRisk, RiskLevel } from '@/lib/health-types';

const RISK_BADGE_STYLES: Record<RiskLevel, string> = {
  low: 'bg-risk-low/15 text-risk-low border-risk-low/30',
  moderate: 'bg-risk-moderate/15 text-risk-moderate border-risk-moderate/30',
  high: 'bg-risk-high/15 text-risk-high border-risk-high/30',
  critical: 'bg-risk-critical/15 text-risk-critical border-risk-critical/30',
};

const ORGAN_ICONS: Record<string, string> = {
  brain: '🧠',
  heart: '❤️',
  lungs: '🫁',
  liver: '🫀',
  'body-fat': '🏋️',
};

interface OrganInsightCardProps {
  organ: OrganRisk | null;
}

export default function OrganInsightCard({ organ }: OrganInsightCardProps) {
  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Organ Insight</h3>
      <AnimatePresence mode="wait">
        {organ ? (
          <motion.div
            key={organ.organ}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground">
                <span>{ORGAN_ICONS[organ.organ] || '🫀'}</span>
                <span className="font-medium text-sm">{organ.label}</span>
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${RISK_BADGE_STYLES[organ.risk]}`}>
                {organ.risk}
              </span>
            </div>
            {/* Risk bar */}
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: `var(--color-risk-${organ.risk})` }}
                initial={{ width: 0 }}
                animate={{ width: `${organ.score}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{organ.summary}</p>
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground"
          >
            Click an organ on the body diagram to see details.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
