import { motion } from 'framer-motion';
import type { OrganRisk, RiskLevel } from '@/lib/health-types';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'var(--color-risk-low)',
  moderate: 'var(--color-risk-moderate)',
  high: 'var(--color-risk-high)',
  critical: 'var(--color-risk-critical)',
};

const RISK_GLOW: Record<RiskLevel, string> = {
  low: '0 0 20px -5px var(--color-risk-low)',
  moderate: '0 0 25px -5px var(--color-risk-moderate)',
  high: '0 0 30px -5px var(--color-risk-high)',
  critical: '0 0 35px -3px var(--color-risk-critical)',
};

interface OrganDotProps {
  risk: OrganRisk;
  cx: number;
  cy: number;
}

function OrganDot({ risk, cx, cy }: OrganDotProps) {
  const color = RISK_COLORS[risk.risk];
  const pulseScale = risk.risk === 'critical' ? 1.6 : risk.risk === 'high' ? 1.4 : 1.2;

  return (
    <g>
      {/* Pulse ring */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={14}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.3}
        animate={{ r: [14, 14 * pulseScale], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      {/* Glow */}
      <circle cx={cx} cy={cy} r={12} fill={color} opacity={0.15} />
      {/* Core dot */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={8}
        fill={color}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Label */}
      <text
        x={cx + 18}
        y={cy + 4}
        fill="var(--color-foreground)"
        fontSize={11}
        fontFamily="var(--font-sans)"
        opacity={0.8}
      >
        {risk.label}
      </text>
    </g>
  );
}

interface BodyVisualizationProps {
  risks: OrganRisk[];
  onOrganClick?: (organ: OrganRisk) => void;
}

export default function BodyVisualization({ risks, onOrganClick }: BodyVisualizationProps) {
  const organPositions: Record<string, { cx: number; cy: number }> = {
    brain: { cx: 150, cy: 60 },
    heart: { cx: 140, cy: 165 },
    lungs: { cx: 170, cy: 145 },
    liver: { cx: 130, cy: 210 },
    'body-fat': { cx: 150, cy: 270 },
  };

  return (
    <div className="relative flex items-center justify-center h-full w-full min-h-[400px]">
      <svg viewBox="0 0 300 400" className="w-full max-w-[280px] h-auto">
        {/* Body silhouette */}
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-glow)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--color-glow)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Head */}
        <ellipse cx="150" cy="45" rx="28" ry="32" fill="url(#bodyGrad)" stroke="var(--color-border)" strokeWidth="1" />
        {/* Neck */}
        <rect x="140" y="75" width="20" height="20" rx="5" fill="url(#bodyGrad)" stroke="var(--color-border)" strokeWidth="1" />
        {/* Torso */}
        <path
          d="M110 95 Q105 95 100 110 L95 200 Q93 230 110 260 L120 310 Q125 320 140 320 L160 320 Q175 320 180 310 L190 260 Q207 230 205 200 L200 110 Q195 95 190 95 Z"
          fill="url(#bodyGrad)"
          stroke="var(--color-border)"
          strokeWidth="1"
        />
        {/* Left arm */}
        <path d="M100 110 Q80 115 70 155 Q65 175 68 200" fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Right arm */}
        <path d="M200 110 Q220 115 230 155 Q235 175 232 200" fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left leg */}
        <path d="M125 320 Q120 350 118 380 Q117 395 125 395" fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Right leg */}
        <path d="M175 320 Q180 350 182 380 Q183 395 175 395" fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Organ dots */}
        {risks.map((risk) => {
          const pos = organPositions[risk.organ];
          if (!pos) return null;
          return (
            <g
              key={risk.organ}
              onClick={() => onOrganClick?.(risk)}
              className="cursor-pointer"
            >
              <OrganDot risk={risk} cx={pos.cx} cy={pos.cy} />
            </g>
          );
        })}
      </svg>

      {/* Subtle scan line effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, var(--color-glow) 50%, transparent 100%)',
          opacity: 0.03,
          height: '30%',
        }}
        animate={{ top: ['-30%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
