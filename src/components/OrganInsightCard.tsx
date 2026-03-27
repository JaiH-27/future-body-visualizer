import { motion, AnimatePresence } from 'framer-motion';
import type { OrganRisk, RiskLevel } from '@/lib/health-types';

const RISK_BADGE_STYLES: Record<RiskLevel, string> = {
  low: 'bg-risk-low/10 text-risk-low border-risk-low/25',
  moderate: 'bg-risk-moderate/10 text-risk-moderate border-risk-moderate/25',
  high: 'bg-risk-high/10 text-risk-high border-risk-high/25',
  critical: 'bg-risk-critical/10 text-risk-critical border-risk-critical/25',
};

const ORGAN_ICONS: Record<string, string> = {
  brain: '🧠',
  heart: '❤️',
  lungs: '🫁',
  liver: '🫀',
  kidneys: '🫘',
  'body-fat': '🏋️',
};

interface OrganInsightCardProps {
  organ: OrganRisk | null;
}

export default function OrganInsightCard({ organ }: OrganInsightCardProps) {
  return (
    <div className="card-elevated rounded-2xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Organ Insight</h3>
      <AnimatePresence mode="wait">
        {organ ? (
          <motion.div
            key={organ.organ}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground">
                <span className="text-lg">{ORGAN_ICONS[organ.organ] || '🫀'}</span>
                <span className="font-semibold text-sm">{organ.label}</span>
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${RISK_BADGE_STYLES[organ.risk]}`}>
                {organ.risk}
              </span>
            </div>
            {/* Risk bar */}
            <div className="h-2 rounded-full bg-muted overflow-hidden">
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
