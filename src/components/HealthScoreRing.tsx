import { motion } from 'framer-motion';

interface HealthScoreRingProps {
  score: number; // 0-100 average risk score
}

export default function HealthScoreRing({ score }: HealthScoreRingProps) {
  // Health score is inverse of risk: 100 - avgRisk
  const healthScore = Math.max(0, Math.min(100, 100 - score));
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (healthScore / 100) * circumference;

  const label = healthScore >= 85 ? 'Excellent' : healthScore >= 60 ? 'Moderate' : healthScore >= 35 ? 'At Risk' : 'Critical';
  const color = healthScore >= 85 ? 'var(--severity-good)' : healthScore >= 60 ? 'var(--severity-warn)' : 'var(--severity-bad)';
  const bgGradient = healthScore >= 85
    ? 'from-severity-good/5 to-severity-good/10'
    : healthScore >= 60
      ? 'from-severity-warn/5 to-severity-warn/10'
      : 'from-severity-bad/5 to-severity-bad/10';

  return (
    <div className={`card-glass rounded-2xl p-5 bg-gradient-to-br ${bgGradient}`}>
      <div className="flex items-center gap-5">
        {/* Ring */}
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/40" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-2xl font-bold"
              style={{ color }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {healthScore}
            </motion.span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">score</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-sm font-bold" style={{ color }}>{label}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {healthScore >= 85
              ? 'Your habits support excellent long-term health. Keep it up!'
              : healthScore >= 60
                ? 'Room for improvement in some areas. Small changes can make a big difference.'
                : healthScore >= 35
                  ? 'Several risk factors detected. Consider adjusting your lifestyle habits.'
                  : 'Multiple critical risk factors. Immediate lifestyle changes are strongly recommended.'}
          </p>
        </div>
      </div>
    </div>
  );
}
