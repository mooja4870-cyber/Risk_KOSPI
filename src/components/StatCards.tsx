import { formatNumber } from '../utils/analysis';
import type { StatsSummary } from '../utils/analysis';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
} from 'lucide-react';

interface StatCardsProps {
  stats: StatsSummary;
}

export default function StatCards({ stats }: StatCardsProps) {
  const formatAmount = (amount: number) => `${Math.round(amount).toLocaleString('ko-KR')}억`;

  const buyDetailRows = [
    { label: '총매수', value: stats.totalBuyAmount },
    { label: '개인', value: stats.individualBuyAmount },
    { label: '외국인', value: stats.foreignBuyAmount },
    { label: '기관계', value: stats.institutionBuyAmount },
    { label: '금융투자', value: stats.financialInvestmentBuyAmount },
    { label: '보험', value: stats.insuranceBuyAmount },
    { label: '투신', value: stats.investmentTrustBuyAmount },
    { label: '연기금', value: stats.pensionBuyAmount },
    { label: '기타법인', value: stats.otherCorporationBuyAmount },
  ];

  const cards = [
    {
      label: '총 순매수 금액',
      value: `${formatNumber(Math.round(stats.totalNetBuy))}억`,
      icon: stats.totalNetBuy >= 0 ? TrendingUp : TrendingDown,
      color: stats.totalNetBuy >= 0 ? 'text-emerald-400' : 'text-rose-400',
      bg: stats.totalNetBuy >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: '매수비중',
      value: `${stats.financialBuySharePct.toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      hasPopup: true,
    },
    {
      label: '순매수 일수',
      value: `${stats.netBuyDays}일`,
      icon: ArrowUpCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: '순매도 일수',
      value: `${stats.netSellDays}일`,
      icon: ArrowDownCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: '최대 순매수',
      value: `${formatNumber(Math.round(stats.maxNetBuy))}억`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: '최대 순매도',
      value: `${formatNumber(Math.round(stats.maxNetSell))}억`,
      icon: TrendingDown,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: '표준편차 (변동성)',
      value: `${formatNumber(Math.round(stats.standardDeviation))}억`,
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: '거래일수',
      value: `${stats.tradingDays}일`,
      icon: Calendar,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative rounded-xl border p-4 ${card.bg} backdrop-blur-sm transition-all ${card.hasPopup ? 'group cursor-help hover:z-50' : 'hover:scale-[1.02]'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`w-4 h-4 ${card.color}`} />
            <span className="text-xs text-gray-400 font-medium">{card.label}</span>
          </div>
          <div className={`text-lg md:text-xl font-bold ${card.color}`}>
            {card.value}
          </div>
          {card.hasPopup && (
            <div className="pointer-events-none absolute left-0 top-full mt-2 z-[70] w-72 rounded-xl border border-cyan-300/50 bg-[#030915] p-4 opacity-0 shadow-2xl shadow-black/70 ring-1 ring-cyan-200/20 transition-[opacity,transform] duration-150 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100">
              <div className="mb-3 flex items-center gap-2 border-b border-cyan-300/25 pb-2 text-xs font-bold text-cyan-200">
                <div className="h-3 w-1 rounded-full bg-cyan-400" />
                매수금액 세부내역 (선택 기간 합계)
              </div>
              <div className="space-y-2">
                {buyDetailRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b border-slate-800 pb-1 text-xs last:border-0 last:pb-0">
                    <span className="font-medium text-slate-300">{row.label}</span>
                    <span className="font-mono font-bold text-white">{formatAmount(row.value)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-slate-800 pt-2 text-[10px] italic text-slate-400">
                * 각 투자자별 순수 매수량의 합계입니다.
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
