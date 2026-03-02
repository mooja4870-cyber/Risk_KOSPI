import type { ConsecutiveSellInfo } from '../utils/analysis';
import { formatNumber } from '../utils/analysis';
import { Flame, AlertTriangle, TrendingDown } from 'lucide-react';

interface Props {
  info: ConsecutiveSellInfo;
}

export default function ConsecutiveSells({ info }: Props) {
  const isCurrentlySelling = info.currentStreak > 0;

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-rose-500/20">
          <Flame className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">연속 순매도 감지</h3>
          <p className="text-gray-400 text-xs">종료일 기준 연속 매도 추적</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {isCurrentlySelling ? (
          <>
            <div className="mb-4 relative">
              <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full" />
              <div className="relative bg-gray-900 border border-rose-500/30 rounded-2xl px-8 py-6 shadow-2xl">
                <div className="text-gray-400 text-xs font-medium mb-1">현재 연속 매도</div>
                <div className="text-5xl font-black text-rose-500 mb-2">
                  {info.currentStreak}<span className="text-2xl ml-1 font-bold">일</span>
                </div>
                <div className="text-sm font-mono text-rose-300 font-semibold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  총 {formatNumber(Math.round(info.currentStreakAmount))}억
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-rose-400/80 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">종료일 포함 매도세 지속 중</span>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <TrendingDown className="w-8 h-8 text-emerald-500 rotate-180" />
            </div>
            <div>
              <div className="text-emerald-400 font-bold text-lg">연속 매도세 끊김</div>
              <p className="text-gray-500 text-sm mt-1">
                종료일 매도세가 없거나<br />매수세로 전환되었습니다.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700/30 text-[11px] text-gray-500">
        <p>• 선택한 기간의 '종료일'이 금융투자 순매도일 경우만 계산합니다.</p>
        <p>• 종료일부터 과거로 소급하여 매수 전환 전까지의 일수입니다.</p>
      </div>
    </div>
  );
}
