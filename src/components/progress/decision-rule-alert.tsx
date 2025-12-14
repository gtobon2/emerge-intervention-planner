'use client';

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { ProgressMonitoring } from '@/lib/supabase/types';

export interface DecisionRuleAlertProps {
  data: ProgressMonitoring[];
  goal?: number;
  className?: string;
}

interface DecisionRule {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  consecutivePoints: number;
  suggestion: string;
  resources?: string[];
}

function checkDecisionRule(data: ProgressMonitoring[], goal?: number): DecisionRule | null {
  if (!goal || data.length < 4) return null;

  // Sort data by date to ensure chronological order
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate aimline for each point
  const firstScore = sortedData[0].score;
  const aimlineScores = sortedData.map((_, index) => {
    const increment = (goal - firstScore) / (sortedData.length - 1 || 1);
    return firstScore + increment * index;
  });

  // Check last 4 points
  const recentData = sortedData.slice(-4);
  const recentAimline = aimlineScores.slice(-4);

  // Count consecutive points above/below aimline
  const belowAimline = recentData.filter((point, index) => point.score < recentAimline[index]);
  const aboveAimline = recentData.filter((point, index) => point.score > recentAimline[index]);

  // 4 consecutive points below aimline - INTERVENTION NEEDED
  if (belowAimline.length === 4) {
    return {
      type: 'negative',
      message: '4 consecutive points below aimline detected',
      consecutivePoints: 4,
      suggestion: 'Consider adjusting the intervention intensity or approach using Data-Based Individualization (DBI)',
      resources: [
        'Review intervention fidelity checklist',
        'Analyze error patterns for targeted instruction',
        'Consider increasing session duration or frequency',
        'Evaluate need for prerequisite skill instruction',
      ],
    };
  }

  // 4 consecutive points above aimline - RAISE GOAL
  if (aboveAimline.length === 4) {
    return {
      type: 'positive',
      message: '4 consecutive points above aimline detected',
      consecutivePoints: 4,
      suggestion: 'Student is exceeding expectations. Consider raising the goal or advancing in curriculum.',
      resources: [
        'Set a more ambitious goal',
        'Advance to next curriculum position',
        'Add complexity to practice items',
        'Consider reducing intervention intensity',
      ],
    };
  }

  // Variable performance - continue monitoring
  return {
    type: 'neutral',
    message: 'Variable performance',
    consecutivePoints: 0,
    suggestion: 'Continue monitoring progress. Maintain current intervention approach.',
    resources: [
      'Ensure consistent intervention delivery',
      'Monitor for patterns in performance variability',
      'Document any environmental or health factors',
    ],
  };
}

export function DecisionRuleAlert({ data, goal, className = '' }: DecisionRuleAlertProps) {
  const rule = checkDecisionRule(data, goal);

  if (!rule) {
    return (
      <div className={`p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-400 mb-1">Insufficient Data</h3>
            <p className="text-sm text-text-muted">
              Need at least 4 data points with a goal set to apply decision rules.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const config = {
    positive: {
      icon: CheckCircle,
      iconColor: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      titleColor: 'text-green-400',
    },
    negative: {
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      titleColor: 'text-red-400',
    },
    neutral: {
      icon: Info,
      iconColor: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      titleColor: 'text-yellow-400',
    },
  };

  const { icon: Icon, iconColor, bg, border, titleColor } = config[rule.type];

  return (
    <div className={`p-4 ${bg} border ${border} rounded-lg ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 space-y-3">
          {/* Title */}
          <div>
            <h3 className={`font-semibold ${titleColor} mb-1`}>{rule.message}</h3>
            <p className="text-sm text-text-muted">{rule.suggestion}</p>
          </div>

          {/* Action Items */}
          {rule.resources && rule.resources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-text-primary">Recommended Actions:</h4>
              <ul className="space-y-1.5">
                {rule.resources.map((resource, index) => (
                  <li key={index} className="text-sm text-text-muted flex items-start gap-2">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${iconColor.replace('text-', 'bg-')} mt-1.5 flex-shrink-0`} />
                    {resource}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* DBI Link for negative alerts */}
          {rule.type === 'negative' && (
            <div className="pt-2 border-t border-text-muted/10">
              <a
                href="https://intensiveintervention.org/intensive-intervention/data-based-individualization"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-movement hover:text-movement/80 underline"
              >
                Learn more about Data-Based Individualization (DBI)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
