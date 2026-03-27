import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TIMELINE_YEARS, type TimelineYear, type Habits, calculateOrganRisks, DEFAULT_HABITS, type Demographics } from '@/lib/health-types';

interface TimelineSelectorProps {
  value: TimelineYear;
  onChange: (year: TimelineYear) => void;
  habits?: Habits;
  demographics?: Demographics;
}

export default function TimelineSelector({ value, onChange, habits, demographics }: TimelineSelectorProps) {
  const sparkline = useMemo(() => {
    const h = habits || DEFAULT_HABITS;
    return TIMELINE_YEARS.map(year => {
      const risks = calculateOrganRisks(h, year, demographics);
      const avgRisk = risks.reduce((sum, r) => sum + r.score, 0) / risks.length;
      return { year, score: Math.max(0, 100 - avgRisk) };
    });
  }, [habits, demographics]);

  const activeIdx = TIMELINE_YEARS.indexOf(value);
  const activeScore = sparkline[activeIdx]?.score ?? 100;
  const scoreColor = activeScore >= 70 ? 'var(--severity-good)' : activeScore >= 40 ? 'var(--severity-warn)' : 'var(--severity-bad)';

  // Build smooth curve path using catmull-rom-like approach
  const graphW = 240;
  const graphH = 64;
  const padY = 8;
  const points = sparkline.map((p, i) => ({
    x: (i / (sparkline.length - 1)) * graphW,
    y: graphH - padY - ((p.score / 100) * (graphH - padY * 2)),
  }));

  const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaPath = `${linePath} L ${graphW},${graphH} L 0,${graphH} Z`;

  // Gradient ID unique per render
  const gradId = 'tl-grad';
  const lastScore = sparkline[sparkline.length - 1]?.score ?? 100;
  const trendColor = lastScore >= 70 ? 'var(--severity-good)' : lastScore >= 40 ? 'var(--severity-warn)' : 'var(--severity-bad)';

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold font-mono" style={{ color: scoreColor }}>
            {Math.round(activeScore)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {value === 0 ? 'current score' : `projected in ${value}y`}
          </span>
        </div>
      </div>

      {/* Graph */}
      <div className="relative rounded-lg border border-border bg-muted/20 overflow-hidden">
        <svg
          viewBox={`0 0 ${graphW} ${graphH}`}
          className="w-full"
          style={{ height: 80 }}
          preserveAspectRatio="none"
        >
          {/* Horizontal guide lines */}
          {[25, 50, 75].map(v => {
            const y = graphH - padY - ((v / 100) * (graphH - padY * 2));
            return (
              <line
                key={v}
                x1={0} y1={y} x2={graphW} y2={y}
                stroke="currentColor"
                className="text-border"
                strokeWidth="0.5"
                strokeDasharray="3,3"
              />
            );
          })}

          {/* Area gradient */}
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={trendColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((pt, i) => {
            const isActive = i === activeIdx;
            const score = sparkline[i].score;
            const dotColor = score >= 70 ? 'var(--severity-good)' : score >= 40 ? 'var(--severity-warn)' : 'var(--severity-bad)';

            return (
              <g key={i}>
                {isActive && (
                  <>
                    {/* Vertical indicator line */}
                    <line
                      x1={pt.x} y1={pt.y + 6} x2={pt.x} y2={graphH}
                      stroke={dotColor}
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      opacity="0.4"
                    />
                    {/* Outer ring */}
                    <circle cx={pt.x} cy={pt.y} r="7" fill={dotColor} opacity="0.12" />
                    {/* Active dot */}
                    <circle cx={pt.x} cy={pt.y} r="4" fill="white" stroke={dotColor} strokeWidth="2.5" />
                  </>
                )}
                {!isActive && (
                  <circle cx={pt.x} cy={pt.y} r="2.5" fill={dotColor} opacity="0.35" />
                )}
              </g>
            );
          })}
        </svg>

        {/* X-axis labels overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 pb-0.5">
          {TIMELINE_YEARS.map((year, i) => (
            <span
              key={year}
              className={`text-[8px] font-mono ${i === activeIdx ? 'text-foreground font-semibold' : 'text-muted-foreground/50'}`}
            >
              {year === 0 ? 'Now' : `${year}y`}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline buttons */}
      <div className="flex gap-1">
        {TIMELINE_YEARS.map((year, i) => {
          const isActive = value === year;
          const score = sparkline[i]?.score ?? 100;
          const barColor = score >= 70 ? 'bg-severity-good' : score >= 40 ? 'bg-severity-warn' : 'bg-severity-bad';

          return (
            <button
              key={year}
              onClick={() => onChange(year)}
              className={`flex-1 relative rounded-lg border py-2 px-1.5 transition-all ${
                isActive
                  ? 'border-foreground/15 bg-foreground/[0.03] shadow-sm'
                  : 'border-transparent hover:border-border hover:bg-muted/30'
              }`}
            >
              <span className={`block text-[11px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {year === 0 ? 'Now' : `${year}y`}
              </span>
              <div className="h-1 rounded-full bg-muted/40 mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all`}
                  style={{ width: `${score}%`, opacity: isActive ? 1 : 0.3 }}
                />
              </div>
              {isActive && (
                <motion.div
                  layoutId="timeline-active"
                  className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full bg-foreground/60"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
