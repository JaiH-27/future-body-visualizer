import { motion, AnimatePresence } from 'framer-motion';
import type { OrganRisk, TimelineYear } from '@/lib/health-types';

interface AISummaryCardProps {
  risks: OrganRisk[];
  years: TimelineYear;
}

export default function AISummaryCard({ risks, years }: AISummaryCardProps) {
  const highestRisk = risks.reduce((a, b) => (a.score > b.score ? a : b), risks[0]);
  const avgScore = Math.round(risks.reduce((sum, r) => sum + r.score, 0) / risks.length);

  const overallSummary =
    avgScore < 15
      ? 'Your projected health outlook is excellent. Current habits support long-term wellbeing across all major organs.'
      : avgScore < 35
        ? `After ${years || 'a few'} years, mild strain is emerging in some areas. Small habit adjustments could make a significant difference.`
        : avgScore < 60
          ? `At the ${years}-year mark, several organs show moderate to high risk. The primary concern is your ${highestRisk.label.toLowerCase()}.`
          : `Critical health risks are projected across multiple organs by year ${years}. Immediate lifestyle changes are strongly recommended.`;

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <h3 className="text-sm font-medium text-foreground">AI Summary</h3>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={`${years}-${avgScore}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          {overallSummary}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
