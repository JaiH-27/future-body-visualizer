import { type Demographics } from '@/lib/health-types';

interface DemographicsInputProps {
  demographics: Demographics;
  onChange: (d: Demographics) => void;
}

export default function DemographicsInput({ demographics, onChange }: DemographicsInputProps) {
  const update = (field: keyof Demographics, value: string) => {
    if (field === 'sex') {
      onChange({ ...demographics, sex: value as Demographics['sex'] });
    } else {
      const num = value === '' ? null : parseInt(value, 10);
      onChange({ ...demographics, [field]: isNaN(num as number) ? null : num });
    }
  };

  const bmi = demographics.height && demographics.weight
    ? (demographics.weight / ((demographics.height / 100) ** 2)).toFixed(1)
    : null;

  const bmiCategory = bmi
    ? parseFloat(bmi) < 18.5 ? 'Underweight'
      : parseFloat(bmi) < 25 ? 'Normal'
      : parseFloat(bmi) < 30 ? 'Overweight'
      : 'Obese'
    : null;

  const bmiColor = bmiCategory === 'Normal' ? 'text-severity-good'
    : bmiCategory === 'Overweight' ? 'text-severity-warn'
    : bmiCategory === 'Underweight' ? 'text-severity-warn'
    : bmiCategory === 'Obese' ? 'text-severity-bad'
    : 'text-muted-foreground';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Age</label>
          <input
            type="number"
            min={1}
            max={120}
            placeholder="25"
            value={demographics.age ?? ''}
            onChange={(e) => update('age', e.target.value)}
            className="w-full h-8 px-2.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Sex</label>
          <select
            value={demographics.sex ?? ''}
            onChange={(e) => update('sex', e.target.value)}
            className="w-full h-8 px-2 text-xs bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Height (cm)</label>
          <input
            type="number"
            min={50}
            max={250}
            placeholder="170"
            value={demographics.height ?? ''}
            onChange={(e) => update('height', e.target.value)}
            className="w-full h-8 px-2.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Weight (kg)</label>
          <input
            type="number"
            min={20}
            max={300}
            placeholder="70"
            value={demographics.weight ?? ''}
            onChange={(e) => update('weight', e.target.value)}
            className="w-full h-8 px-2.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {bmi && (
        <div className="flex items-center justify-between px-2 py-1.5 bg-muted/50 rounded-lg">
          <span className="text-[11px] text-muted-foreground">BMI</span>
          <span className={`text-xs font-semibold ${bmiColor}`}>
            {bmi} · {bmiCategory}
          </span>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        BMI categories per WHO standards. Demographics improve projection accuracy.
      </p>
    </div>
  );
}
