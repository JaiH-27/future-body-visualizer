import { Html } from '@react-three/drei';
import type { OrganRisk } from '@/lib/health-types';
import { RISK_COLORS, ORGAN_LABELS, RISK_LABELS } from './organ-utils';

export function OrganTooltip({ risk, visible }: { risk: OrganRisk; visible: boolean }) {
  if (!visible) return null;
  return (
    <Html center distanceFactor={3} style={{ pointerEvents: 'none' }}>
      <div
        className="px-3 py-2 rounded-xl text-[11px] font-medium whitespace-nowrap shadow-lg border backdrop-blur-sm"
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderColor: RISK_COLORS[risk.risk],
          color: '#1a1a2e',
          transform: 'translateY(-24px)',
        }}
      >
        <span style={{ color: RISK_COLORS[risk.risk] }}>●</span>{' '}
        {ORGAN_LABELS[risk.organ] || risk.label}: {RISK_LABELS[risk.risk]}
        <span className="ml-1.5 opacity-60">{Math.round(risk.score)}%</span>
      </div>
    </Html>
  );
}
