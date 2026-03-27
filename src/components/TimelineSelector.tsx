import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TIMELINE_YEARS, type TimelineYear, type Habits, calculateOrganRisks, DEFAULT_HABITS, type Demographics } from '@/lib/health-types';
import { Button } from '@/components/ui/button';

function getTimelineVariant(year: TimelineYear): 'pill-good' | 'pill-warn' | 'pill-bad' | 'pill' {
  if (year === 0) return 'pill-good';
  if (year === 5) return 'pill-warn';
  return 'pill-bad';
}

interface TimelineSelectorProps {
  value: TimelineYear;
  onChange: (year: TimelineYear) => void;
  habits?: Habits;
  demographics?: Demographics;
}

export default function TimelineSelector({ value, onChange, habits, demographics }: TimelineSelectorProps) {
  // Mini sparkline data: health score at each timeline point
  const sparkline = useMemo(() => {
    const h = habits || DEFAULT_HABITS;
    return TIMELINE_YEARS.map(year => {
      const risks = calculateOrganRisks(h, year, demographics);
      const avgRisk = risks.reduce((sum, r) => sum + r.score, 0) / risks.length;
      return { year, score: Math.max(0, 100 - avgRisk) };
    });
  }, [habits, demographics]);

  const maxScore = 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Timeline</span>
        <span className="text-sm font-mono font-semibold text-primary">
          +{value} years
        </span>
      </div>

      {/* Mini health score graph */}
      <div className="relative h-12 rounded-lg bg-muted/30 border border-border/50 overflow-hidden">
        <svg viewBox="0 0 200 48" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[25, 50, 75].map(y => (
            <line key={y} x1="0" y1={48 - (y / maxScore) * 44 - 2} x2="200" y2={48 - (y / maxScore) * 44 - 2} stroke="currentColor" className="text-border" strokeWidth="0.5" strokeDasharray="4,4" />
          ))}

          {/* Area fill */}
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sparkline[sparkline.length - 1].score >= 60 ? 'var(--severity-good)' : 'var(--severity-bad)'} stopOpacity="0.2" />
              <stop offset="100%" stopColor={sparkline[sparkline.length - 1].score >= 60 ? 'var(--severity-good)' : 'var(--severity-bad)'} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path
            d={`M ${sparkline.map((p, i) => `${(i / (sparkline.length - 1)) * 200},${48 - (p.score / maxScore) * 44 - 2}`).join(' L ')} L 200,48 L 0,48 Z`}
            fill="url(#scoreGrad)"
          />

          {/* Line */}
          <path
            d={`M ${sparkline.map((p, i) => `${(i / (sparkline.length - 1)) * 200},${48 - (p.score / maxScore) * 44 - 2}`).join(' L ')}`}
            fill="none"
            stroke={sparkline[sparkline.length - 1].score >= 60 ? 'var(--severity-good)' : sparkline[sparkline.length - 1].score >= 35 ? 'var(--severity-warn)' : 'var(--severity-bad)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active dot */}
          {sparkline.map((p, i) => {
            const isActive = TIMELINE_YEARS[i] === value;
            const x = (i / (sparkline.length - 1)) * 200;
            const y = 48 - (p.score / maxScore) * 44 - 2;
            return isActive ? (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="white" stroke="var(--primary)" strokeWidth="2" />
                <text x={x} y={y - 8} textAnchor="middle" fontSize="8" fill="currentColor" className="text-foreground font-mono">
                  {Math.round(p.score)}
                </text>
              </g>
            ) : (
              <circle key={i} cx={x} cy={y} r="2.5" fill="currentColor" className="text-muted-foreground" opacity="0.4" />
            );
          })}
        </svg>

        {/* Y-axis label */}
        <span className="absolute top-1 left-1.5 text-[8px] text-muted-foreground/50 font-mono">Health</span>
      </div>

      <div className="flex gap-2">
        {TIMELINE_YEARS.map((year) => (
          <Button
            key={year}
            variant={getTimelineVariant(year)}
            size="sm"
            data-active={value === year}
            onClick={() => onChange(year)}
            className="flex-1 font-mono text-xs hover-scale"
          >
            {year === 0 ? 'Now' : `${year}y`}
          </Button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          animate={{
            width: `${Math.max(5, (value / 20) * 100)}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: value <= 0
              ? 'var(--severity-good)'
              : value <= 5
                ? `linear-gradient(90deg, var(--severity-good), var(--severity-warn))`
                : value <= 10
                  ? `linear-gradient(90deg, var(--severity-warn), var(--severity-bad))`
                  : 'var(--severity-bad)',
          }}
        />
      </div>
    </div>
  );
}
