import { motion } from 'framer-motion';
import type { OrganRisk, RiskLevel } from '@/lib/health-types';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'oklch(0.72 0.19 145)',
  moderate: 'oklch(0.80 0.18 85)',
  high: 'oklch(0.70 0.20 55)',
  critical: 'oklch(0.60 0.24 25)',
};

interface OrganShapeProps {
  risk: OrganRisk;
  children: React.ReactNode;
  onClick?: () => void;
}

function OrganShape({ risk, children, onClick }: OrganShapeProps) {
  const color = RISK_COLORS[risk.risk];
  const glowIntensity = risk.risk === 'critical' ? 0.6 : risk.risk === 'high' ? 0.4 : risk.risk === 'moderate' ? 0.25 : 0.12;
  const pulseScale = risk.risk === 'critical' ? [1, 1.08, 1] : risk.risk === 'high' ? [1, 1.05, 1] : [1, 1.02, 1];

  return (
    <motion.g
      onClick={onClick}
      className="cursor-pointer"
      animate={{ scale: pulseScale as number[] }}
      transition={{ duration: risk.risk === 'critical' ? 1.2 : 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ filter: `drop-shadow(0 0 ${8 + risk.score * 0.2}px ${color})` }}
    >
      <g opacity={glowIntensity + 0.1}>
        {children}
      </g>
    </motion.g>
  );
}

interface BodyVisualizationProps {
  risks: OrganRisk[];
  onOrganClick?: (organ: OrganRisk) => void;
}

export default function BodyVisualization({ risks, onOrganClick }: BodyVisualizationProps) {
  const getRisk = (id: string) => risks.find((r) => r.organ === id)!;
  const getColor = (id: string) => RISK_COLORS[getRisk(id).risk];

  return (
    <div className="relative flex items-center justify-center h-full w-full min-h-[420px]">
      <svg viewBox="0 0 300 420" className="w-full max-w-[300px] h-auto">
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-glow)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--color-glow)" stopOpacity="0.01" />
          </linearGradient>
          <filter id="organGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="scanGrad">
            <stop offset="0%" stopColor="var(--color-glow)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--color-glow)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Grid lines for sci-fi feel */}
        {[80, 140, 200, 260, 320].map((y) => (
          <line key={y} x1="60" y1={y} x2="240" y2={y} stroke="var(--color-glow)" strokeOpacity="0.04" strokeWidth="0.5" strokeDasharray="4 4" />
        ))}
        {[100, 150, 200].map((x) => (
          <line key={x} x1={x} y1="20" x2={x} y2="400" stroke="var(--color-glow)" strokeOpacity="0.04" strokeWidth="0.5" strokeDasharray="4 4" />
        ))}

        {/* Body silhouette */}
        <g opacity="0.5">
          {/* Head */}
          <ellipse cx="150" cy="48" rx="26" ry="30" fill="none" stroke="var(--color-border)" strokeWidth="1" />
          {/* Neck */}
          <rect x="141" y="76" width="18" height="18" rx="5" fill="none" stroke="var(--color-border)" strokeWidth="0.8" />
          {/* Torso */}
          <path
            d="M112 94 Q106 94 100 112 L96 205 Q94 238 112 268 L122 318 Q127 330 142 330 L158 330 Q173 330 178 318 L188 268 Q206 238 204 205 L200 112 Q194 94 188 94 Z"
            fill="url(#bodyGrad)"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
          {/* Arms */}
          <path d="M100 112 Q78 118 68 160 Q62 182 66 210" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeLinecap="round" />
          <path d="M200 112 Q222 118 232 160 Q238 182 234 210" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeLinecap="round" />
          {/* Legs */}
          <path d="M126 330 Q120 360 118 392 Q117 408 126 408" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeLinecap="round" />
          <path d="M174 330 Q180 360 182 392 Q183 408 174 408" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* === ORGANS === */}

        {/* Brain */}
        <OrganShape risk={getRisk('brain')} onClick={() => onOrganClick?.(getRisk('brain'))}>
          <ellipse cx="150" cy="42" rx="18" ry="16" fill={getColor('brain')} opacity="0.7" />
          <path d="M138 42 Q142 34 150 34 Q158 34 162 42" fill="none" stroke={getColor('brain')} strokeWidth="1" opacity="0.9" />
          <line x1="150" y1="28" x2="150" y2="56" stroke={getColor('brain')} strokeWidth="0.8" opacity="0.5" />
        </OrganShape>

        {/* Lungs */}
        <OrganShape risk={getRisk('lungs')} onClick={() => onOrganClick?.(getRisk('lungs'))}>
          <ellipse cx="132" cy="148" rx="16" ry="22" fill={getColor('lungs')} opacity="0.5" />
          <ellipse cx="168" cy="148" rx="16" ry="22" fill={getColor('lungs')} opacity="0.5" />
          <ellipse cx="132" cy="148" rx="12" ry="16" fill={getColor('lungs')} opacity="0.3" />
          <ellipse cx="168" cy="148" rx="12" ry="16" fill={getColor('lungs')} opacity="0.3" />
        </OrganShape>

        {/* Heart */}
        <OrganShape risk={getRisk('heart')} onClick={() => onOrganClick?.(getRisk('heart'))}>
          <path d="M145 158 Q140 148 145 142 Q150 136 155 142 Q160 148 155 158 L150 168 Z" fill={getColor('heart')} opacity="0.8" />
          <circle cx="150" cy="153" r="6" fill={getColor('heart')} opacity="0.3" />
        </OrganShape>

        {/* Liver */}
        <OrganShape risk={getRisk('liver')} onClick={() => onOrganClick?.(getRisk('liver'))}>
          <ellipse cx="130" cy="210" rx="22" ry="14" fill={getColor('liver')} opacity="0.6" transform="rotate(-10 130 210)" />
          <ellipse cx="130" cy="210" rx="16" ry="10" fill={getColor('liver')} opacity="0.3" transform="rotate(-10 130 210)" />
        </OrganShape>

        {/* Body fat / midsection */}
        <OrganShape risk={getRisk('body-fat')} onClick={() => onOrganClick?.(getRisk('body-fat'))}>
          <ellipse cx="150" cy="262" rx="28" ry="18" fill={getColor('body-fat')} opacity="0.35" />
          <ellipse cx="150" cy="262" rx="20" ry="12" fill={getColor('body-fat')} opacity="0.2" />
        </OrganShape>

        {/* Organ labels */}
        {[
          { organ: 'brain', x: 185, y: 46 },
          { organ: 'lungs', x: 196, y: 148 },
          { organ: 'heart', x: 103, y: 156 },
          { organ: 'liver', x: 96, y: 215 },
          { organ: 'body-fat', x: 188, y: 266 },
        ].map(({ organ, x, y }) => {
          const r = getRisk(organ);
          return (
            <g key={organ}>
              {/* Connector line */}
              <line
                x1={organ === 'heart' || organ === 'liver' ? x + 20 : x - 8}
                y1={y}
                x2={organ === 'heart' || organ === 'liver' ? x + 8 : x - 2}
                y2={y}
                stroke={RISK_COLORS[r.risk]}
                strokeWidth="0.5"
                opacity="0.4"
              />
              <text
                x={x}
                y={y + 3}
                fill="var(--color-foreground)"
                fontSize={9}
                fontFamily="var(--font-sans)"
                opacity={0.6}
                textAnchor={organ === 'heart' || organ === 'liver' ? 'end' : 'start'}
              >
                {r.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 right-0 pointer-events-none h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, var(--color-glow) 50%, transparent 100%)',
          opacity: 0.15,
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Corner brackets for scanner feel */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-primary/20 rounded-tl" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-primary/20 rounded-tr" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-primary/20 rounded-bl" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-primary/20 rounded-br" />
    </div>
  );
}
