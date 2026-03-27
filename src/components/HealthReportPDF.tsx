import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import type { OrganRisk, Habits, Demographics, TimelineYear } from '@/lib/health-types';

interface HealthReportPDFProps {
  risks: OrganRisk[];
  habits: Habits;
  demographics: Demographics;
  years: TimelineYear;
  chatMessages: { role: 'user' | 'ai'; text: string }[];
}

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const ORGAN_ICONS: Record<string, string> = {
  brain: '🧠',
  heart: '❤️',
  lungs: '🫁',
  liver: '🫀',
  kidneys: '🫘',
  'body-fat': '🏋️',
};

export default function HealthReportPDF({ risks, habits, demographics, years, chatMessages }: HealthReportPDFProps) {
  const generatePDF = useCallback(() => {
    const avgScore = Math.round(risks.reduce((s, r) => s + r.score, 0) / risks.length);
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const bmi = demographics.height && demographics.weight
      ? (demographics.weight / ((demographics.height / 100) ** 2)).toFixed(1)
      : null;

    const habitLabels: Record<string, string[]> = {
      smoking: ['None', 'Occasional', 'Daily'],
      alcohol: ['None', 'Weekends', 'Frequent'],
      sleep: ['7-9h', '6h', '≤5h'],
      exercise: ['150+ min/wk', '60-149', '<60'],
      diet: ['Balanced', 'Average', 'Poor'],
      stress: ['Low', 'Moderate', 'High'],
      hydration: ['8+ cups', '4-7 cups', '<4 cups'],
    };

    const aiMessages = chatMessages.filter(m => m.role === 'ai');

    // Build HTML content for printing
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Future You - Health Report</title>
<style>
  @media print { @page { margin: 0.7in; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #7c3aed; }
  .header h1 { font-size: 28px; background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .header p { color: #6b7280; font-size: 13px; margin-top: 4px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 16px; color: #7c3aed; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .stat { background: #f9fafb; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
  .stat .label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat .value { font-weight: 600; margin-top: 2px; }
  .organ-card { background: #f9fafb; border-radius: 10px; padding: 14px; margin-bottom: 10px; border-left: 4px solid; }
  .organ-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .organ-name { font-weight: 600; font-size: 14px; }
  .risk-badge { font-size: 11px; padding: 2px 10px; border-radius: 12px; font-weight: 600; color: white; text-transform: uppercase; }
  .score-bar { height: 6px; background: #e5e7eb; border-radius: 3px; margin: 8px 0; overflow: hidden; }
  .score-fill { height: 100%; border-radius: 3px; }
  .organ-summary { font-size: 12px; color: #4b5563; }
  .habits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
  .habit-item { background: #f9fafb; padding: 8px 12px; border-radius: 8px; font-size: 12px; }
  .habit-item .name { color: #6b7280; font-size: 11px; }
  .habit-item .level { font-weight: 600; margin-top: 2px; }
  .ai-msg { background: #f0f4ff; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 8px; white-space: pre-wrap; }
  .disclaimer { margin-top: 32px; padding: 14px; background: #fef3c7; border-radius: 8px; font-size: 11px; color: #92400e; text-align: center; }
  .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af; }
  .overall-score { text-align: center; padding: 16px; background: linear-gradient(135deg, #f5f3ff, #fce7f3); border-radius: 12px; margin-bottom: 16px; }
  .overall-score .number { font-size: 42px; font-weight: 700; color: ${avgScore < 25 ? '#22c55e' : avgScore < 50 ? '#eab308' : avgScore < 70 ? '#f97316' : '#ef4444'}; }
  .overall-score .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Future You — Health Report</h1>
    <p>Generated ${now} · ${years}-year projection</p>
  </div>

  ${demographics.age || demographics.height || demographics.weight ? `
  <div class="section">
    <h2>👤 Your Profile</h2>
    <div class="grid">
      ${demographics.age ? `<div class="stat"><div class="label">Age</div><div class="value">${demographics.age} years</div></div>` : ''}
      ${demographics.sex ? `<div class="stat"><div class="label">Sex</div><div class="value">${demographics.sex}</div></div>` : ''}
      ${demographics.height ? `<div class="stat"><div class="label">Height</div><div class="value">${demographics.height} cm</div></div>` : ''}
      ${demographics.weight ? `<div class="stat"><div class="label">Weight</div><div class="value">${demographics.weight} kg</div></div>` : ''}
      ${bmi ? `<div class="stat"><div class="label">BMI</div><div class="value">${bmi} (${parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'})</div></div>` : ''}
    </div>
  </div>` : ''}

  <div class="section">
    <h2>📊 Overall Risk Score</h2>
    <div class="overall-score">
      <div class="number">${avgScore}</div>
      <div class="label">out of 100 · ${avgScore < 25 ? 'Low Risk' : avgScore < 50 ? 'Moderate Risk' : avgScore < 70 ? 'High Risk' : 'Critical Risk'}</div>
    </div>
  </div>

  <div class="section">
    <h2>🫀 Organ Risk Projections (+${years} years)</h2>
    ${risks.map(r => `
    <div class="organ-card" style="border-color: ${RISK_COLORS[r.risk]}">
      <div class="organ-header">
        <span class="organ-name">${ORGAN_ICONS[r.organ] || '🫀'} ${r.label}</span>
        <span class="risk-badge" style="background: ${RISK_COLORS[r.risk]}">${r.risk} · ${r.score}%</span>
      </div>
      <div class="score-bar"><div class="score-fill" style="width: ${r.score}%; background: ${RISK_COLORS[r.risk]}"></div></div>
      <div class="organ-summary">${r.summary}</div>
    </div>`).join('')}
  </div>

  <div class="section">
    <h2>🧬 Current Habits</h2>
    <div class="habits-grid">
      ${Object.entries(habits).map(([key, val]) => `
      <div class="habit-item">
        <div class="name">${key.charAt(0).toUpperCase() + key.slice(1)}</div>
        <div class="level" style="color: ${val === 0 ? '#22c55e' : val === 1 ? '#f97316' : '#ef4444'}">${habitLabels[key]?.[val] || val}</div>
      </div>`).join('')}
    </div>
  </div>

  ${aiMessages.length > 0 ? `
  <div class="section">
    <h2>✦ AI Analysis</h2>
    ${aiMessages.map(m => `<div class="ai-msg">${m.text}</div>`).join('')}
  </div>` : ''}

  <div class="section">
    <h2>📚 Sources & References</h2>
    <ul style="font-size: 12px; color: #4b5563; padding-left: 20px; line-height: 2;">
      <li>WHO Global Health Risks Report — Physical inactivity & chronic disease</li>
      <li>CDC Sleep Guidelines — Adults need 7+ hours per night</li>
      <li>AHA Cardiovascular Risk Guidelines — Exercise & heart health</li>
      <li>NIH National Institute on Alcohol Abuse — Liver disease risk factors</li>
      <li>NIH National Institute of Neurological Disorders — Sleep & cognition</li>
      <li>NIH National Institute of Diabetes and Digestive and Kidney Diseases — Hydration & renal health</li>
      <li>NHS Health Guidelines — BMI categories & lifestyle recommendations</li>
    </ul>
  </div>

  <div class="disclaimer">
    ⚕️ This report is for EDUCATIONAL purposes only. Risk projections are based on population-level data from WHO, CDC, AHA & NIH guidelines and do not constitute medical advice. Always consult a healthcare professional for personalized health assessments.
  </div>

  <div class="footer">
    Generated by Future You · Educational Health Visualization Tool
  </div>
</body>
</html>`;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }, [risks, habits, demographics, years, chatMessages]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generatePDF}
      className="text-xs gap-1.5"
    >
      <FileDown className="w-3.5 h-3.5" />
      Export Report
    </Button>
  );
}
