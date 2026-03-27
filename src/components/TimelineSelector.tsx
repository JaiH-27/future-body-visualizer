import { TIMELINE_YEARS, type TimelineYear } from '@/lib/health-types';
import { Button } from '@/components/ui/button';

interface TimelineSelectorProps {
  value: TimelineYear;
  onChange: (year: TimelineYear) => void;
}

export default function TimelineSelector({ value, onChange }: TimelineSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Timeline Projection</span>
        <span className="text-sm font-mono text-primary">
          +{value} years
        </span>
      </div>
      <div className="flex gap-2">
        {TIMELINE_YEARS.map((year) => (
          <Button
            key={year}
            variant="pill"
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
      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${(value / 20) * 100}%` }}
        />
      </div>
    </div>
  );
}
