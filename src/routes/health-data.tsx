import { useState, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import {
  type BloodBiomarkers,
  type DiseaseRisk,
  DEFAULT_BIOMARKERS,
  BIOMARKER_FIELDS,
  calculateDiseaseRisks,
} from '@/lib/biomarker-types';
import {
  type Habits,
  type Demographics,
  DEFAULT_HABITS,
  DEFAULT_DEMOGRAPHICS,
} from '@/lib/health-types';

export const Route = createFileRoute('/health-data')({
  component: HealthDataPage,
});

function BiomarkerInput({
  field,
  value,
  onChange,
}: {
  field: typeof BIOMARKER_FIELDS[number];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const status = value === null ? 'empty' : 'filled';

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-foreground">{field.label}</span>
          <span className="text-[9px] text-muted-foreground/60">({field.unit})</span>
        </div>
        <span className="text-[9px] text-muted-foreground">Normal: {field.normalRange}</span>
      </div>
      <input
        type="number"
        step="any"
        placeholder="—"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : parseFloat(v));
        }}
        className="w-20 h-7 px-2 text-xs font-mono text-right bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/30"
      />
    </div>
  );
}

function DiseaseCard({ disease, index }: { disease: DiseaseRisk; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const healthVal = 100 - disease.score;
  const barColor = disease.risk === 'low' ? 'bg-severity-good' : disease.risk === 'moderate' ? 'bg-severity-warn' : 'bg-severity-bad';
  const textColor = disease.risk === 'low' ? 'text-severity-good' : disease.risk === 'moderate' ? 'text-severity-warn' : 'text-severity-bad';
  const Icon = disease.risk === 'low' ? CheckCircle2 : disease.risk === 'moderate' ? AlertTriangle : AlertCircle;
  const bgColor = disease.risk === 'low' ? 'bg-severity-good/[0.03]' : disease.risk === 'moderate' ? 'bg-severity-warn/[0.03]' : 'bg-severity-bad/[0.03]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-xl border border-border bg-card overflow-hidden ${expanded ? bgColor : ''}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <Icon className={`w-4 h-4 shrink-0 ${textColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-foreground">{disease.name}</span>
            <span className={`text-xs font-bold font-mono ${textColor}`}>{disease.score}%</span>
          </div>
          <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${disease.score}%` }} />
          </div>
        </div>
        <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0 ${
          disease.risk === 'low' ? 'bg-severity-good/10 text-severity-good'
          : disease.risk === 'moderate' ? 'bg-severity-warn/10 text-severity-warn'
          : 'bg-severity-bad/10 text-severity-bad'
        }`}>
          {disease.risk}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2.5">
              <p className="text-[11px] text-muted-foreground leading-relaxed">{disease.description}</p>

              {/* Risk factors */}
              <div>
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contributing Factors</p>
                <div className="flex flex-wrap gap-1">
                  {disease.factors.map((f, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Source */}
              <div className="flex items-start gap-1.5 pt-1 border-t border-border/50">
                <Info className="w-3 h-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                <p className="text-[9px] text-muted-foreground/60">{disease.source}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HealthDataPage() {
  const [biomarkers, setBiomarkers] = useState<BloodBiomarkers>(DEFAULT_BIOMARKERS);
  const [habits] = useState<Habits>(DEFAULT_HABITS);
  const [demographics, setDemographics] = useState<Demographics>(DEFAULT_DEMOGRAPHICS);

  // Quick demographics for this page
  const updateDemo = (field: keyof Demographics, value: string) => {
    if (field === 'sex') {
      setDemographics(prev => ({ ...prev, sex: value as Demographics['sex'] }));
    } else {
      const num = value === '' ? null : parseInt(value, 10);
      setDemographics(prev => ({ ...prev, [field]: isNaN(num as number) ? null : num }));
    }
  };

  const updateBiomarker = (key: keyof BloodBiomarkers, val: number | null) => {
    setBiomarkers(prev => ({ ...prev, [key]: val }));
  };

  const diseases = useMemo(() => calculateDiseaseRisks(habits, demographics, biomarkers), [habits, demographics, biomarkers]);

  const filledCount = Object.values(biomarkers).filter(v => v !== null).length;
  const totalCount = Object.keys(biomarkers).length;

  // Group biomarker fields
  const groups = BIOMARKER_FIELDS.reduce<Record<string, typeof BIOMARKER_FIELDS>>((acc, f) => {
    if (f.maleOnly && demographics.sex === 'female') return acc;
    (acc[f.group] ??= []).push(f);
    return acc;
  }, {});

  const [expandedGroup, setExpandedGroup] = useState<string | null>('Lipid Panel');

  // Disease overview summary
  const criticalCount = diseases.filter(d => d.risk === 'critical' || d.risk === 'high').length;
  const moderateCount = diseases.filter(d => d.risk === 'moderate').length;
  const lowCount = diseases.filter(d => d.risk === 'low').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-2.5 sm:px-6 lg:px-8 bg-card sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-7 px-2">
                <ArrowLeft className="w-3 h-3" />
                Dashboard
              </Button>
            </Link>
            <div className="w-px h-4 bg-border" />
            <h1 className="text-sm font-bold text-foreground font-display">Health Data & Disease Risk</h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="font-mono">{filledCount}/{totalCount} fields filled</span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-muted">All fields optional</span>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-[1200px] mx-auto">

          {/* Overview bar */}
          <div className="rounded-xl border border-border bg-card px-4 py-3 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Disease Screening</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {diseases.length} conditions analyzed
                </p>
              </div>
              <div className="w-px h-8 bg-border" />
              {criticalCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-severity-bad" />
                  <span className="text-xs font-semibold text-severity-bad">{criticalCount} elevated</span>
                </div>
              )}
              {moderateCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-severity-warn" />
                  <span className="text-xs font-medium text-severity-warn">{moderateCount} moderate</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-severity-good" />
                <span className="text-xs font-medium text-severity-good">{lowCount} low risk</span>
              </div>
              <div className="ml-auto">
                <p className="text-[9px] text-muted-foreground/50">
                  Add blood test results for more accurate predictions
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* LEFT: Biomarker Inputs */}
            <div className="lg:col-span-5 space-y-3">
              {/* Quick demographics */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">Quick Profile</h2>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Needed for age/sex-adjusted reference ranges</p>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground uppercase">Age</label>
                    <input
                      type="number" min={1} max={120} placeholder="30"
                      value={demographics.age ?? ''}
                      onChange={(e) => updateDemo('age', e.target.value)}
                      className="w-full h-7 px-2 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary/30 text-foreground font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground uppercase">Sex</label>
                    <select
                      value={demographics.sex ?? ''}
                      onChange={(e) => updateDemo('sex', e.target.value)}
                      className="w-full h-7 px-1.5 text-xs bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                    >
                      <option value="">—</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-medium text-muted-foreground uppercase">BMI</label>
                    <input
                      type="number" step="0.1" placeholder="24"
                      value={demographics.weight && demographics.height ? (demographics.weight / ((demographics.height / 100) ** 2)).toFixed(1) : ''}
                      readOnly
                      className="w-full h-7 px-2 text-xs bg-muted/30 border border-border rounded-md text-muted-foreground font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Biomarker groups */}
              {Object.entries(groups).map(([group, fields]) => (
                <div key={group} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-foreground">{group}</h3>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {fields.filter(f => biomarkers[f.key] !== null).length}/{fields.length}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expandedGroup === group ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {expandedGroup === group && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 divide-y divide-border/50">
                          {fields.map(field => (
                            <BiomarkerInput
                              key={field.key}
                              field={field}
                              value={biomarkers[field.key]}
                              onChange={(v) => updateBiomarker(field.key, v)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* RIGHT: Disease Risk Results */}
            <div className="lg:col-span-7 space-y-3">
              <div className="rounded-xl border border-border bg-card px-4 py-2.5">
                <h2 className="text-sm font-semibold text-foreground">Disease Risk Overview</h2>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  Based on your profile, habits, and any blood test results entered. Risk scores update in real-time.
                </p>
              </div>

              {diseases.map((disease, i) => (
                <DiseaseCard key={disease.name} disease={disease} index={i} />
              ))}

              {/* Disclaimer */}
              <div className="rounded-xl border border-severity-warn/20 bg-severity-warn/[0.03] p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-severity-warn shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-semibold text-foreground mb-1">Medical Disclaimer</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      This tool provides <strong>educational estimates only</strong> based on published clinical guidelines (WHO, CDC, AHA, ADA, NIDDK, NCI).
                      It is <strong>not a diagnostic tool</strong>. Always consult a qualified healthcare provider for medical diagnosis, treatment decisions,
                      and interpretation of lab results. Risk scores are population-level estimates and do not account for family history, genetics, or other individual factors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
