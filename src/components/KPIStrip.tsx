import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { OrganRisk } from '@/lib/health-types';

interface KPIStripProps {
  risks: OrganRisk[];
  onOrganHover?: (organId: string | null) => void;
  hoveredOrgan?: string | null;
}

const ORGAN_ICONS: Record<string, string> = {
  brain: '🧠', heart: '❤️', lungs: '🫁', liver: '🫀', kidneys: '🫘', 'body-fat': '🏋️',
};

function MiniSparkline({ value }: { value: number }) {
  const healthVal = 100 - value;
  const color = healthVal >= 70 ? 'var(--severity-good)' : healthVal >= 40 ? 'var(--severity-warn)' : 'var(--severity-bad)';
  const width = Math.max(8, healthVal);

  return (
    <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden mt-1">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

export default function KPIStrip({ risks, onOrganHover, hoveredOrgan }: KPIStripProps) {
  const avgScore = useMemo(() => {
    const avg = risks.reduce((s, r) => s + r.score, 0) / risks.length;
    return Math.round(100 - avg);
  }, [risks]);

  const overallColor = avgScore >= 70 ? 'text-severity-good' : avgScore >= 40 ? 'text-severity-warn' : 'text-severity-bad';

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {/* Overall */}
      <div className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 min-w-[90px]">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Overall</p>
        <p className={`text-xl font-bold font-mono ${overallColor}`}>{avgScore}</p>
        <MiniSparkline value={100 - avgScore} />
      </div>

      {/* Per-organ KPIs */}
      {risks.map((risk) => {
        const healthVal = 100 - risk.score;
        const color = healthVal >= 70 ? 'text-severity-good' : healthVal >= 40 ? 'text-severity-warn' : 'text-severity-bad';
        const isHovered = hoveredOrgan === risk.organ;

        return (
          <motion.div
            key={risk.organ}
            onMouseEnter={() => onOrganHover?.(risk.organ)}
            onMouseLeave={() => onOrganHover?.(null)}
            className={`shrink-0 rounded-lg border px-3 py-2 min-w-[80px] cursor-pointer transition-all ${
              isHovered
                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                : 'border-border bg-card hover:border-primary/30'
            }`}
            whileHover={{ y: -1 }}
          >
            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <span className="text-xs">{ORGAN_ICONS[risk.organ]}</span>
              {risk.label}
            </p>
            <p className={`text-lg font-bold font-mono ${color}`}>{healthVal.toFixed(2)}</p>
            <MiniSparkline value={risk.score} />
          </motion.div>
        );
      })}
    </div>
  );
}
