import type { ConsecutiveSellInfo } from '../utils/analysis';
import { formatNumber, formatDateKR } from '../utils/analysis';
import { Flame, AlertTriangle, TrendingDown } from 'lucide-react';

interface Props {
  info: ConsecutiveSellInfo;
}

export default function ConsecutiveSells({ info }: Props) {
  const getRiskBadge = (days: number) => {
    if (days >= 7)
      return { label: '고위험', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    if (days >= 5)
      return { label: '위험', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    return { label: '주의', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  };

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-rose-500/20">
          <Flame className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">연속 순매도 감지</h3>
          <p className="text-gray-400 text-xs">Consecutive Net Selling Detection</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-500 mb-1">최대 연속 순매도</div>
          <div className="text-2xl font-bold text-rose-400">{info.maxStreak}일</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-500 mb-1">3일+ 연속 순매도 횟수</div>
          <div className="text-2xl font-bold text-amber-400">{info.streaks.length}회</div>
        </div>
      </div>

      {/* Current streak warning */}
      {info.currentStreak >= 3 && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-sm text-rose-300">
            현재 <strong>{info.currentStreak}일</strong> 연속 순매도 진행 중
          </span>
        </div>
      )}

      {/* Streaks list */}
      {info.streaks.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {info.streaks.slice(0, 10).map((streak, i) => {
            const badge = getRiskBadge(streak.days);
            return (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-900/40 border border-gray-700/30 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="text-sm text-white font-medium">
                      {formatDateKR(streak.startDate)} ~ {formatDateKR(streak.endDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      총 {formatNumber(streak.totalAmount)}억
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-rose-400">{streak.days}일</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-6 text-sm">
          3일 이상 연속 순매도 구간이 없습니다
        </div>
      )}
    </div>
  );
}
