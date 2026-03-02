import { BookOpen, ExternalLink, Globe2 } from 'lucide-react';
import type { DailyTradeData } from '../data/mockData';

interface BenchmarkingProps {
  selectedData: DailyTradeData[];
  allData: DailyTradeData[];
  selectedStart: string;
  selectedEnd: string;
}

interface BenchmarkCase {
  market: '한국' | '미국';
  title: string;
  period: string;
  shock: string;
  mechanism: string;
  takeaway: string;
  sources: { label: string; url: string }[];
}

interface SellSummary {
  negativeDays: number;
  negativeRatioPct: number;
  worstSingleDay: { date: string; amount: number };
  longestStreak: { startDate: string; endDate: string; days: number; totalAmount: number };
}

function formatSignedEok(value: number): string {
  const abs = Math.abs(Math.round(value)).toLocaleString('ko-KR');
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${abs}억`;
}

function summarizeFinancialSell(data: DailyTradeData[]): SellSummary {
  if (data.length === 0) {
    return {
      negativeDays: 0,
      negativeRatioPct: 0,
      worstSingleDay: { date: '-', amount: 0 },
      longestStreak: { startDate: '-', endDate: '-', days: 0, totalAmount: 0 },
    };
  }

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const negativeDays = sorted.filter((row) => row.financialInvestment < 0).length;

  let worstSingleDay = sorted[0];
  for (const row of sorted) {
    if (row.financialInvestment < worstSingleDay.financialInvestment) {
      worstSingleDay = row;
    }
  }

  let bestStreak: SellSummary['longestStreak'] = { startDate: '-', endDate: '-', days: 0, totalAmount: 0 };
  let currentStart = '';
  let currentDays = 0;
  let currentAmount = 0;

  for (const row of sorted) {
    if (row.financialInvestment < 0) {
      if (currentDays === 0) {
        currentStart = row.date;
      }
      currentDays += 1;
      currentAmount += row.financialInvestment;
      if (currentDays > bestStreak.days) {
        bestStreak = {
          startDate: currentStart,
          endDate: row.date,
          days: currentDays,
          totalAmount: currentAmount,
        };
      }
    } else {
      currentDays = 0;
      currentAmount = 0;
      currentStart = '';
    }
  }

  return {
    negativeDays,
    negativeRatioPct: (negativeDays / sorted.length) * 100,
    worstSingleDay: {
      date: worstSingleDay.date,
      amount: worstSingleDay.financialInvestment,
    },
    longestStreak: bestStreak,
  };
}

function marketBadge(market: BenchmarkCase['market']): string {
  if (market === '한국') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
}

function findByDate(data: DailyTradeData[], date: string): DailyTradeData | undefined {
  return data.find((row) => row.date === date);
}

function findWorstFinancialSellInYear(data: DailyTradeData[], year: string): DailyTradeData | undefined {
  const rows = data.filter((row) => row.date.startsWith(`${year}-`));
  if (rows.length === 0) return undefined;
  return rows.reduce((worst, row) =>
    row.financialInvestment < worst.financialInvestment ? row : worst
  );
}

export default function Benchmarking({
  selectedData,
  allData,
  selectedStart,
  selectedEnd,
}: BenchmarkingProps) {
  const summary = summarizeFinancialSell(selectedData);
  const earliestAvailable = allData[0]?.date ?? '-';
  const latestAvailable = allData[allData.length - 1]?.date ?? '-';
  const kr2008WorstSellDay = findWorstFinancialSellInYear(allData, '2008');
  const kr2008CrashDay = findByDate(allData, '2008-10-24');

  const benchmarkCases: BenchmarkCase[] = [
    {
      market: '한국',
      title: '2008 리먼 사태 구간 (금융투자 실측 가능)',
      period: '2008-09 ~ 2008-10',
      shock:
        kr2008WorstSellDay
          ? `2008년 금융투자 최대 순매도: ${kr2008WorstSellDay.date} ${formatSignedEok(kr2008WorstSellDay.financialInvestment)}`
          : '글로벌 금융위기 구간에서 KOSPI 급락과 유동성 경색 동반',
      mechanism:
        '신용경색 국면에서 증권사(금융투자)와 프로그램 매매 계정의 포지션 축소·차익실현 매도가 반복되면, 하락 변동성이 더 커지는 패턴이 나타날 수 있음.',
      takeaway:
        '금융투자 순매도 절대금액이 급증하고 연속일수가 길어질수록, 지수 하방 리스크 관리(현금비중/헤지) 우선순위를 높여야 함.',
      sources: [
        {
          label: 'Naver 금융투자 일별 추이 (KOSPI)',
          url: 'https://finance.naver.com/sise/investorDealTrendDay.nhn?bizdate=215600&sosok=',
        },
        {
          label: 'Federal Reserve History: 2008 Financial Crisis',
          url: 'https://www.federalreservehistory.org/essays/great-recession-of-200709',
        },
      ],
    },
    {
      market: '한국',
      title: '1998 IMF 외환위기 구간 (정성 벤치마킹)',
      period: '1997-11 ~ 1998',
      shock:
        '위기 국면에서 주가 급락과 자금경색이 동반. 다만 본 앱 데이터 공급원은 2005-01-03 이후만 제공되어 일별 금융투자 실측치는 별도 DB 필요.',
      mechanism:
        '유동성 확보를 위한 금융중개기관의 동시 매도는 급락장에서 가격 하방 압력을 키우는 방향으로 작동할 수 있음.',
      takeaway:
        '1998 구간까지 정량 검증하려면 KRX 장기 투자자별 수급 DB를 별도 적재해 금융투자 순매도-지수수익률 시차 분석을 수행해야 함.',
      sources: [
        {
          label: 'Federal Reserve History: The Asian Financial Crisis',
          url: 'https://www.federalreservehistory.org/essays/asian-financial-crisis',
        },
        {
          label: 'BIS: Korea and the 1997 crisis (historical review)',
          url: 'https://www.bis.org/publ/qtrpdf/r_qt1412f.htm',
        },
      ],
    },
    {
      market: '미국',
      title: '1987 블랙먼데이',
      period: '1987-10-19',
      shock: 'DJIA -22.6% (일일 최대 하락률)',
      mechanism:
        '포트폴리오 인슈어런스와 프로그램 매매(기관계 규칙기반 매도)가 하락 시 추가 매도를 유발하는 피드백 루프를 형성.',
      takeaway:
        '금융투자/기관계 자동매도 전략이 동시 작동하면 펀더멘털 대비 과도한 급락이 발생할 수 있음.',
      sources: [
        {
          label: 'Federal Reserve History: Stock Market Crash of 1987',
          url: 'https://www.federalreservehistory.org/essays/stock-market-crash-of-1987',
        },
        {
          label: 'Federal Reserve FEDS: 1987 Crash and Fed response',
          url: 'https://www.federalreserve.gov/pubs/feds/2007/200713/index.html',
        },
      ],
    },
    {
      market: '미국',
      title: '2010 플래시 크래시',
      period: '2010-05-06',
      shock: '수분 내 급락·급반등, 유동성 급격 위축',
      mechanism:
        '대형 펀드의 대량 매도 알고리즘이 시장 미시구조와 상호작용하면서 주문장 유동성이 빠르게 사라지는 현상이 확인됨.',
      takeaway:
        '금융투자사의 주문 실행 규칙(속도·물량·가격제약)은 하락장 전이 속도에 직접적 영향을 준다.',
      sources: [
        {
          label: 'SEC/CFTC Joint Report (May 6, 2010)',
          url: 'https://www.sec.gov/about/reports-publications/joint-report-cftc-sec-2010-0926',
        },
        {
          label: 'CFTC Staff Report portal',
          url: 'https://www.cftc.gov/MarketReports/StaffReportonMay6MarketEvents/index.htm',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <Globe2 className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-white font-bold">벤치마킹: 금융투자 집중매도 중심</h3>
            <p className="text-gray-400 text-xs">
              이 탭은 일반 기관/외국인보다 &quot;금융투자(증권사) 순매도 집중&quot;을 핵심 변수로 둡니다.
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-300 space-y-1">
          <p>
            선택 구간: <span className="text-cyan-300">{selectedStart}</span> ~{' '}
            <span className="text-cyan-300">{selectedEnd}</span>
          </p>
          <p>
            보유 원천 범위: <span className="text-gray-200">{earliestAvailable}</span> ~{' '}
            <span className="text-gray-200">{latestAvailable}</span>
          </p>
          {kr2008CrashDay && (
            <p className="text-xs text-amber-300">
              참고: 2008-10-24 금융투자 {formatSignedEok(kr2008CrashDay.financialInvestment)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
          <div className="text-gray-400 text-xs mb-1">선택구간 매도일 비중</div>
          <div className="text-rose-300 font-bold text-lg">
            {summary.negativeRatioPct.toFixed(1)}% ({summary.negativeDays}일)
          </div>
        </div>
        <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
          <div className="text-gray-400 text-xs mb-1">최대 단일 순매도</div>
          <div className="text-rose-300 font-bold text-lg">{formatSignedEok(summary.worstSingleDay.amount)}</div>
          <div className="text-gray-500 text-xs mt-1">{summary.worstSingleDay.date}</div>
        </div>
        <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
          <div className="text-gray-400 text-xs mb-1">최장 연속 순매도</div>
          <div className="text-rose-300 font-bold text-lg">{summary.longestStreak.days}일</div>
          <div className="text-gray-500 text-xs mt-1">
            {summary.longestStreak.startDate} ~ {summary.longestStreak.endDate}
          </div>
        </div>
        <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
          <div className="text-gray-400 text-xs mb-1">해당 연속구간 누적</div>
          <div className="text-rose-300 font-bold text-lg">{formatSignedEok(summary.longestStreak.totalAmount)}</div>
          <div className="text-gray-500 text-xs mt-1">금융투자 순매수/순매도 합계</div>
        </div>
      </div>

      {benchmarkCases.map((item) => (
        <div
          key={`${item.market}-${item.title}`}
          className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5"
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full border text-xs ${marketBadge(item.market)}`}>
              {item.market}
            </span>
            <h4 className="text-white font-bold">{item.title}</h4>
            <span className="text-gray-500 text-xs">{item.period}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
              <div className="text-gray-400 text-xs mb-1">충격</div>
              <div className="text-rose-300 font-medium">{item.shock}</div>
            </div>
            <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
              <div className="text-gray-400 text-xs mb-1">메커니즘</div>
              <div className="text-gray-200">{item.mechanism}</div>
            </div>
            <div className="rounded-lg bg-gray-900/50 border border-gray-700/40 p-3">
              <div className="text-gray-400 text-xs mb-1">실무 시사점</div>
              <div className="text-emerald-300">{item.takeaway}</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-700/40">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              출처
            </div>
            <div className="flex flex-col gap-1.5">
              {item.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 hover:underline w-fit"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {source.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
