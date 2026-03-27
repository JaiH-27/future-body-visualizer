import { motion } from 'framer-motion';
import type { OrganRisk, RiskLevel } from '@/lib/health-types';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'oklch(0.72 0.22 150)',
  moderate: 'oklch(0.78 0.18 80)',
  high: 'oklch(0.68 0.22 45)',
  critical: 'oklch(0.58 0.26 20)',
};

interface OrganShapeProps {
  risk: OrganRisk;
  children: React.ReactNode;
  onClick?: () => void;
}

function OrganShape({ risk, children, onClick }: OrganShapeProps) {
  const color = RISK_COLORS[risk.risk];
  const pulseScale = risk.risk === 'critical' ? [1, 1.08, 1] : risk.risk === 'high' ? [1, 1.05, 1] : [1, 1.02, 1];

  return (
    <motion.g
      onClick={onClick}
      className="cursor-pointer"
      animate={{ scale: pulseScale as number[] }}
      transition={{ duration: risk.risk === 'critical' ? 1.2 : 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ filter: `drop-shadow(0 0 ${6 + risk.score * 0.15}px ${color})` }}
    >
      <g opacity={0.85}>
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
          <linearGradient id="bodyGradLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.25 310)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="oklch(0.65 0.28 350)" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Body silhouette */}
        <g opacity="0.35">
          {/* Head */}
          <ellipse cx="150" cy="48" rx="26" ry="30" fill="url(#bodyGradLight)" stroke="oklch(0.70 0.08 310)" strokeWidth="1.2" />
          {/* Neck */}
          <rect x="141" y="76" width="18" height="18" rx="5" fill="url(#bodyGradLight)" stroke="oklch(0.70 0.08 310)" strokeWidth="0.8" />
          {/* Torso */}
          <path
            d="M112 94 Q106 94 100 112 L96 205 Q94 238 112 268 L122 318 Q127 330 142 330 L158 330 Q173 330 178 318 L188 268 Q206 238 204 205 L200 112 Q194 94 188 94 Z"
            fill="url(#bodyGradLight)"
            stroke="oklch(0.70 0.08 310)"
            strokeWidth="1"
          />
          {/* Arms */}
          <path d="M100 112 Q78 118 68 160 Q62 182 66 210" fill="none" stroke="oklch(0.70 0.08 310)" strokeWidth="1" strokeLinecap="round" />
          <path d="M200 112 Q222 118 232 160 Q238 182 234 210" fill="none" stroke="oklch(0.70 0.08 310)" strokeWidth="1" strokeLinecap="round" />
          {/* Legs */}
          <path d="M126 330 Q120 360 118 392 Q117 408 126 408" fill="none" stroke="oklch(0.70 0.08 310)" strokeWidth="1" strokeLinecap="round" />
          <path d="M174 330 Q180 360 182 392 Q183 408 174 408" fill="none" stroke="oklch(0.70 0.08 310)" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* === ORGANS === */}

        {/* Brain */}
        <OrganShape risk={getRisk('brain')} onClick={() => onOrganClick?.(getRisk('brain'))}>
          <ellipse cx="150" cy="42" rx="18" ry="16" fill={getColor('brain')} opacity="0.6" />
          <path d="M138 42 Q142 34 150 34 Q158 34 162 42" fill="none" stroke={getColor('brain')} strokeWidth="1.2" opacity="0.8" />
          <line x1="150" y1="28" x2="150" y2="56" stroke={getColor('brain')} strokeWidth="0.8" opacity="0.4" />
        </OrganShape>

        {/* Lungs */}
        <OrganShape risk={getRisk('lungs')} onClick={() => onOrganClick?.(getRisk('lungs'))}>
          <ellipse cx="132" cy="148" rx="16" ry="22" fill={getColor('lungs')} opacity="0.45" />
          <ellipse cx="168" cy="148" rx="16" ry="22" fill={getColor('lungs')} opacity="0.45" />
          <ellipse cx="132" cy="148" rx="10" ry="14" fill={getColor('lungs')} opacity="0.25" />
          <ellipse cx="168" cy="148" rx="10" ry="14" fill={getColor('lungs')} opacity="0.25" />
        </OrganShape>

        {/* Heart */}
        <OrganShape risk={getRisk('heart')} onClick={() => onOrganClick?.(getRisk('heart'))}>
          <path d="M145 158 Q140 148 145 142 Q150 136 155 142 Q160 148 155 158 L150 168 Z" fill={getColor('heart')} opacity="0.75" />
          <circle cx="150" cy="153" r="5" fill={getColor('heart')} opacity="0.35" />
        </OrganShape>

        {/* Liver */}
        <OrganShape risk={getRisk('liver')} onClick={() => onOrganClick?.(getRisk('liver'))}>
          <ellipse cx="130" cy="210" rx="22" ry="14" fill={getColor('liver')} opacity="0.55" transform="rotate(-10 130 210)" />
          <ellipse cx="130" cy="210" rx="14" ry="8" fill={getColor('liver')} opacity="0.3" transform="rotate(-10 130 210)" />
        </OrganShape>

        {/* Body fat */}
        <OrganShape risk={getRisk('body-fat')} onClick={() => onOrganClick?.(getRisk('body-fat'))}>
          <ellipse cx="150" cy="262" rx="28" ry="18" fill={getColor('body-fat')} opacity="0.3" />
          <ellipse cx="150" cy="262" rx="18" ry="10" fill={getColor('body-fat')} opacity="0.2" />
        </OrganShape>

        {/* Organ labels */}
        {[
          { organ: 'brain', x: 185, y: 46, align: 'start' },
          { organ: 'lungs', x: 196, y: 148, align: 'start' },
          { organ: 'heart', x: 103, y: 156, align: 'end' },
          { organ: 'liver', x: 96, y: 215, align: 'end' },
          { organ: 'body-fat', x: 188, y: 266, align: 'start' },
        ].map(({ organ, x, y, align }) => {
          const r = getRisk(organ);
          return (
            <g key={organ}>
              <line
                x1={align === 'end' ? x + 20 : x - 8}
                y1={y}
                x2={align === 'end' ? x + 8 : x - 2}
                y2={y}
                stroke={RISK_COLORS[r.risk]}
                strokeWidth="0.6"
                opacity="0.5"
              />
              <text
                x={x}
                y={y + 3}
                fill="oklch(0.35 0.04 280)"
                fontSize={9}
                fontWeight="500"
                fontFamily="var(--font-sans)"
                textAnchor={align as 'start' | 'end'}
              >
                {r.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Scan line */}
      <motion.div
        className="absolute left-4 right-4 pointer-events-none h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, oklch(0.55 0.25 310 / 30%) 50%, transparent 100%)',
        }}
        animate={{ top: ['5%', '95%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Corner accents */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-primary/20 rounded-tl-md" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-primary/20 rounded-tr-md" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-primary/20 rounded-bl-md" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-primary/20 rounded-br-md" />
    </div>
  );
}
