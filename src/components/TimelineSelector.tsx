import { TIMELINE_YEARS, type TimelineYear } from '@/lib/health-types';
import { Button } from '@/components/ui/button';

function getTimelineVariant(year: TimelineYear): 'pill-good' | 'pill-warn' | 'pill-bad' | 'pill' {
  if (year === 0) return 'pill-good';
  if (year === 5) return 'pill-warn';
  return 'pill-bad';
}

interface TimelineSelectorProps {
  value: TimelineYear;
  onChange: (year: TimelineYear) => void;
}

export default function TimelineSelector({ value, onChange }: TimelineSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Timeline</span>
        <span className="text-sm font-mono font-semibold text-primary">
          +{value} years
        </span>
      </div>
      <div className="flex gap-2">
        {TIMELINE_YEARS.map((year) => (
          <Button
            key={year}
            variant={getTimelineVariant(year)}
            size="sm"
            data-active={value === year}
            onClick={() => onChange(year)}
            className="flex-1 font-mono text-xs"
          >
            {year === 0 ? 'Now' : `${year}y`}
          </Button>
        ))}
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.max(5, (value / 20) * 100)}%`,
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
