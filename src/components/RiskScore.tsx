import type { RiskAssessment } from '../utils/analysis';
import { Shield, ShieldAlert, ShieldX, AlertTriangle } from 'lucide-react';

interface RiskScoreProps {
  risk: RiskAssessment;
}

export default function RiskScore({ risk }: RiskScoreProps) {
  const config = {
    normal: {
      icon: Shield,
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      textColor: 'text-emerald-400',
      barColor: 'bg-emerald-500',
      glow: 'shadow-emerald-500/20',
    },
    caution: {
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-yellow-600',
      bg: 'bg-amber-500/10 border-amber-500/30',
      textColor: 'text-amber-400',
      barColor: 'bg-amber-500',
      glow: 'shadow-amber-500/20',
    },
    warning: {
      icon: ShieldAlert,
      gradient: 'from-orange-500 to-red-500',
      bg: 'bg-orange-500/10 border-orange-500/30',
      textColor: 'text-orange-400',
      barColor: 'bg-orange-500',
      glow: 'shadow-orange-500/20',
    },
    danger: {
      icon: ShieldX,
      gradient: 'from-red-500 to-rose-700',
      bg: 'bg-rose-500/10 border-rose-500/30',
      textColor: 'text-rose-400',
      barColor: 'bg-rose-500',
      glow: 'shadow-rose-500/20',
    },
  };

  const c = config[risk.level];
  const Icon = c.icon;
  const scorePercent = Math.min((risk.score / 10) * 100, 100);

  return (
    <div className={`rounded-xl border p-5 ${c.bg} backdrop-blur-sm shadow-lg ${c.glow}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${c.gradient}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">리스크 점수</h3>
            <p className="text-gray-400 text-xs">Risk Assessment Score</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-black ${c.textColor}`}>{risk.score}</div>
          <div className={`text-sm font-bold ${c.textColor} px-2 py-0.5 rounded-full ${c.bg}`}>
            {risk.label}
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>0</span>
          <span>정상</span>
          <span>경계</span>
          <span>위험</span>
          <span>고위험</span>
          <span>10</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${c.gradient} transition-all duration-1000 ease-out`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Risk factors */}
      <div className="space-y-1.5">
        <p className="text-xs text-gray-500 font-medium mb-2">리스크 요인 분석</p>
        {risk.factors.map((factor, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-sm text-gray-300"
          >
            <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${c.barColor} shrink-0`} />
            <span>{factor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
