import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import type { OrganRisk, TimelineYear, RiskLevel } from '@/lib/health-types';

interface AISummaryCardProps {
  risks: OrganRisk[];
  years: TimelineYear;
}

const RISK_ICONS: Record<string, typeof AlertTriangle> = {
  critical: AlertCircle,
  high: AlertTriangle,
  moderate: AlertTriangle,
  low: CheckCircle2,
};

const RISK_CARD_STYLES: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  critical: { bg: 'bg-severity-bad/6', border: 'border-severity-bad/20', icon: 'text-severity-bad', badge: 'bg-severity-bad text-white' },
  high: { bg: 'bg-severity-bad/5', border: 'border-severity-bad/15', icon: 'text-severity-bad', badge: 'bg-severity-bad/80 text-white' },
  moderate: { bg: 'bg-severity-warn/5', border: 'border-severity-warn/20', icon: 'text-severity-warn', badge: 'bg-severity-warn text-severity-warn-foreground' },
  low: { bg: 'bg-severity-good/5', border: 'border-severity-good/20', icon: 'text-severity-good', badge: 'bg-severity-good text-severity-good-foreground' },
};

const ORGAN_ICONS: Record<string, string> = {
  brain: '🧠', heart: '❤️', lungs: '🫁', liver: '🫀', kidneys: '🫘', 'body-fat': '🏋️',
};

function getAdvice(organ: string, risk: RiskLevel): string {
  const advice: Record<string, Record<string, string>> = {
    brain: {
      critical: 'Prioritize 7-9 hours of sleep and stress management techniques like meditation.',
      high: 'Improve sleep quality and reduce screen time before bed.',
      moderate: 'Consider adding mindfulness practices to your routine.',
      low: 'Keep maintaining healthy sleep and stress habits.',
    },
    heart: {
      critical: 'Immediate lifestyle changes needed: quit smoking, start daily walking, reduce sodium.',
      high: 'Increase cardio exercise to 150+ min/week and improve diet quality.',
      moderate: 'Add more cardiovascular exercise and reduce processed food intake.',
      low: 'Great cardiovascular habits — maintain regular exercise.',
    },
    lungs: {
      critical: 'Quitting smoking is the single most impactful change you can make.',
      high: 'Reduce smoking frequency and start breathing exercises.',
      moderate: 'Consider reducing exposure to smoke and increasing aerobic activity.',
      low: 'Lung health is excellent — keep avoiding tobacco products.',
    },
    liver: {
      critical: 'Significantly reduce alcohol intake and improve diet immediately.',
      high: 'Limit alcohol to <7 drinks/week and increase whole foods.',
      moderate: 'Consider alcohol-free days and add more vegetables to your diet.',
      low: 'Liver function looks healthy — maintain balanced habits.',
    },
    kidneys: {
      critical: 'Increase water intake to 8+ cups/day and reduce sodium consumption.',
      high: 'Drink more water throughout the day and improve diet quality.',
      moderate: 'Aim for 6-8 cups of water daily and moderate salt intake.',
      low: 'Kidney health is good — keep staying hydrated.',
    },
    'body-fat': {
      critical: 'Start with 30 min walks daily and reduce caloric intake from processed foods.',
      high: 'Increase physical activity and focus on whole, unprocessed foods.',
      moderate: 'Add more movement to your day and balance meal portions.',
      low: 'Body composition is healthy — maintain active lifestyle.',
    },
  };
  return advice[organ]?.[risk] || 'Maintain healthy lifestyle habits.';
}

export default function AISummaryCard({ risks, years }: AISummaryCardProps) {
  const [expandedOrgan, setExpandedOrgan] = useState<string | null>(null);

  const criticalRisks = risks.filter(r => r.risk === 'critical' || r.risk === 'high');
  const warningRisks = risks.filter(r => r.risk === 'moderate');
  const healthyRisks = risks.filter(r => r.risk === 'low');

  const avgScore = Math.round(risks.reduce((sum, r) => sum + r.score, 0) / risks.length);

  return (
    <div className="space-y-2.5">
      {/* Critical/High Risk Cards */}
      {criticalRisks.map((risk, idx) => {
        const styles = RISK_CARD_STYLES[risk.risk];
        const Icon = RISK_ICONS[risk.risk];
        const isExpanded = expandedOrgan === risk.organ;

        return (
          <motion.div
            key={risk.organ}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`rounded-xl border ${styles.bg} ${styles.border} overflow-hidden`}
          >
            <button
              onClick={() => setExpandedOrgan(isExpanded ? null : risk.organ)}
              className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-black/[0.02] transition-colors"
            >
              <span className="text-lg">{ORGAN_ICONS[risk.organ]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{risk.label} at Risk</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${styles.badge}`}>
                    {risk.score.toFixed(2)}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {risk.risk === 'critical' ? 'Immediate attention recommended' : 'Elevated risk detected'}
                </p>
              </div>
              <Icon className={`w-4 h-4 ${styles.icon} shrink-0`} />
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5 space-y-2.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">{risk.summary}</p>
                    <div className="flex items-start gap-2 p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                      <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[11px] text-primary font-medium leading-relaxed">
                        {getAdvice(risk.organ, risk.risk)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Warning Cards */}
      {warningRisks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: criticalRisks.length * 0.05 }}
          className="rounded-xl border bg-severity-warn/[0.04] border-severity-warn/[0.15] p-3.5"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-severity-warn" />
            <span className="text-xs font-semibold text-foreground">Warnings</span>
          </div>
          <div className="space-y-1.5">
            {warningRisks.map(risk => (
              <div key={risk.organ} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span>{ORGAN_ICONS[risk.organ]}</span> {risk.label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-severity-warn text-severity-warn-foreground font-medium">
                  {risk.score.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Healthy Cards */}
      {healthyRisks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (criticalRisks.length + 1) * 0.05 }}
          className="rounded-xl border bg-severity-good/[0.04] border-severity-good/[0.15] p-3.5"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-severity-good" />
            <span className="text-xs font-semibold text-foreground">Healthy</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {healthyRisks.map(risk => (
              <span key={risk.organ} className="text-[11px] px-2 py-0.5 rounded-full bg-severity-good/10 text-severity-good font-medium flex items-center gap-1">
                {ORGAN_ICONS[risk.organ]} {risk.label}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
