import type { DailyTradeData } from '../data/mockData';
import { formatNumber, formatDateKR } from '../utils/analysis';
import { Table } from 'lucide-react';

interface Props {
  data: DailyTradeData[];
}

export default function DataTable({ data }: Props) {
  const sorted = [...data].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Table className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">상세 데이터 테이블</h3>
          <p className="text-gray-400 text-xs">총 {sorted.length}일 데이터 표시</p>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <th className="text-left text-gray-400 font-medium py-2 px-2 text-xs">날짜</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 text-xs">개인</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 text-xs">외국인</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 text-xs whitespace-nowrap">금융투자</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 text-xs">보험</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 text-xs">투신</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 text-xs">연기금</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.date}
                className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
              >
                <td className="py-2 px-2 text-gray-300 text-xs whitespace-nowrap">
                  {formatDateKR(row.date)}
                </td>
                <td
                  className={`py-2 px-2 text-right text-xs font-mono ${row.individual >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                >
                  {formatNumber(row.individual)}
                </td>
                <td
                  className={`py-2 px-2 text-right text-xs font-mono ${row.foreign >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                >
                  {formatNumber(row.foreign)}
                </td>
                <td
                  className={`py-2 px-2 text-right text-xs font-mono font-bold ${row.financialInvestment >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                >
                  {formatNumber(row.financialInvestment)}
                </td>
                <td
                  className={`py-2 px-2 text-right text-xs font-mono ${row.insurance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                >
                  {formatNumber(row.insurance)}
                </td>
                <td
                  className={`py-2 px-2 text-right text-xs font-mono ${row.investmentTrust >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                >
                  {formatNumber(row.investmentTrust)}
                </td>
                <td
                  className={`py-2 px-2 text-right text-xs font-mono ${row.pension >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                >
                  {formatNumber(row.pension)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
