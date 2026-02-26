import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  calculateRisk,
  getConsecutiveSellingDays,
  getFISellRatio,
  type DailyTradingData,
  tradingData as mockTradingData
} from './data/mockData';
import { historicalCases, riskThresholds, significantHistoricalStreaks } from './data/historicalCases';
import { fetchLiveKOSPITradingData, type LiveDataMeta } from './data/liveData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart, Area, ReferenceLine, Cell,
  RadialBarChart, RadialBar, Line
} from 'recharts';
import {
  AlertTriangle, TrendingDown, TrendingUp, Activity, Shield,
  BarChart3, History, Eye, ChevronDown, ChevronUp, Info
} from 'lucide-react';

type TabType = 'dashboard' | 'daily' | 'risk' | 'historical';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [tradingData, setTradingData] = useState<DailyTradingData[]>([]);
  const [dataMeta, setDataMeta] = useState<LiveDataMeta | null>(null);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(60_000);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: '대시보드', icon: <Activity size={18} /> },
    { id: 'risk', label: '리스크 분석', icon: <Shield size={18} /> },
    { id: 'daily', label: '일별 수급 데이터', icon: <BarChart3 size={18} /> },
    { id: 'historical', label: '과거 사례 비교', icon: <History size={18} /> },
  ];

  const refreshData = useCallback(async (isInitialLoad: boolean) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      }

      const live = await fetchLiveKOSPITradingData(60);
      setTradingData(live.tradingData);
      setDataMeta(live.meta);
      setRefreshIntervalMs(live.meta.pollingIntervalMs);
      setLoadError(null);
    } catch {
      setLoadError('실시간 수급 데이터 갱신에 실패했습니다. (CORS/네트워크 오류) 분석용 시뮬레이션 데이터를 표시합니다.');

      // Fallback to Mock Data
      if (tradingData.length === 0) {
        setTradingData(mockTradingData.slice(-60));
        setDataMeta({
          asOfKst: new Date().toLocaleString('ko-KR'),
          latestTradingDate: mockTradingData[mockTradingData.length - 1].date,
          source: '시뮬레이션 데이터 (Fallback)',
          note: '실시간 API 연결 실패로 사전 정의된 시뮬레이션 데이터를 불러왔습니다.',
          pollingIntervalMs: 600_000
        });
      }

      setRefreshIntervalMs(60_000);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  }, [tradingData.length]);

  useEffect(() => {
    void refreshData(true);
  }, []); // Run only once on mount

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshData(false);
    }, refreshIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [refreshData, refreshIntervalMs]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <Activity size={44} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">코스피 <span className="text-white" style={{ WebkitTextStroke: '1px #EF4444' }}>금융투자사</span> 매매동향 분석</h1>
                <p className="text-2xl text-gray-400 mt-1">Financial Investment Flow Risk Analysis System</p>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>{`실시간 기준: ${dataMeta?.asOfKst ?? '-'}`}</p>
              <p className="mt-0.5 text-gray-600">최신 거래일: {dataMeta?.latestTradingDate ?? '-'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="max-w-[1400px] mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.id
                  ? 'bg-gray-950 text-white border-t-2 border-red-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {isLoading && tradingData.length === 0 && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-sm text-gray-300">
            실시간 데이터를 불러오는 중입니다...
          </div>
        )}

        {!isLoading && tradingData.length === 0 && (
          <div className="bg-red-950/30 rounded-xl p-6 border border-red-800/50 text-sm text-red-200">
            데이터가 비어 있습니다. API 연결 상태를 확인해 주세요.
          </div>
        )}

        {tradingData.length > 0 && (
          <div className="space-y-4">
            {loadError && (
              <div className="bg-yellow-950/30 rounded-lg p-3 border border-yellow-800/40 text-xs text-yellow-200">
                {loadError}
              </div>
            )}
            {dataMeta && (
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 text-xs text-gray-400">
                <p>데이터 소스: {dataMeta.source}</p>
                <p className="mt-1">{dataMeta.note}</p>
              </div>
            )}

            {activeTab === 'dashboard' && <Dashboard tradingData={tradingData} />}
            {activeTab === 'daily' && <DailyTrading tradingData={tradingData} />}
            {activeTab === 'risk' && <RiskAnalysis tradingData={tradingData} />}
            {activeTab === 'historical' && <HistoricalComparison />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-4 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 text-center text-xs text-gray-500">
          <p>⚠️ 본 시스템은 공개 시세/수급 데이터 기반 분석 참고 도구이며 투자 손익을 보장하지 않습니다.</p>
          <p className="mt-1">과거 패턴이 미래를 보장하지 않으며, 시점(Timing) 예측은 본질적으로 불가능합니다.</p>
        </div>
      </footer>
    </div>
  );
}

/* ==============================
   Dashboard
   ============================== */
function Dashboard({ tradingData }: { tradingData: DailyTradingData[] }) {
  if (tradingData.length === 0) return null;

  const latestIndex = tradingData.length - 1;
  const risk = calculateRisk(tradingData, latestIndex);
  const latest = tradingData[latestIndex];

  // Recent trend data (last 30 days)
  const recentData = tradingData.slice(-60);
  const globalStartIndex = Math.max(0, tradingData.length - recentData.length);

  // Calculate 10-day moving averages
  const chartData = recentData.map((d, i) => {
    const globalIdx = globalStartIndex + i;
    const lookback = Math.min(10, globalIdx + 1);
    let fiSum = 0;
    for (let j = 0; j < lookback; j++) {
      fiSum += tradingData[globalIdx - j].financialInvestment;
    }
    return {
      date: d.date.slice(5),
      kospi: d.kospiIndex,
      fi: d.financialInvestment,
      fiMA10: Math.round(fiSum / lookback),
      individual: d.individual,
      foreign: d.foreign,
    };
  });

  const riskGaugeData = [
    { name: 'risk', value: risk.level * 20, fill: risk.color },
  ];

  return (
    <div className="space-y-6">
      {/* Risk Banner */}
      <div
        className="rounded-xl p-6 border"
        style={{
          borderColor: risk.color + '40',
          background: `linear-gradient(135deg, ${risk.color}10, transparent)`,
        }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%" cy="50%" innerRadius="60%" outerRadius="100%"
                  startAngle={180} endAngle={0}
                  data={riskGaugeData}
                >
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#374151' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-sm text-gray-400">현재 리스크 레벨</div>
              <div className="text-3xl font-bold" style={{ color: risk.color }}>
                Level {risk.level}
              </div>
              <div className="text-lg font-semibold" style={{ color: risk.color }}>
                {risk.label}
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-gray-300">{risk.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="bg-gray-800 px-3 py-1 rounded-full">
                연속 매도: <strong className="text-white">{risk.consecutiveSellDays}일</strong>
              </span>
              <span className="bg-gray-800 px-3 py-1 rounded-full">
                평균 매도량: <strong className="text-white">{risk.avgSellAmount.toLocaleString()}억</strong>
              </span>
              <span className="bg-gray-800 px-3 py-1 rounded-full">
                매도 비중: <strong className="text-white">{risk.sellRatio}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="코스피 지수"
          value={latest.kospiIndex.toFixed(2)}
          change={latest.kospiChange}
          icon={<Activity size={20} />}
        />
        <SummaryCard
          title="금융투자 순매수"
          value={`${latest.financialInvestment > 0 ? '+' : ''}${latest.financialInvestment.toLocaleString()}억`}
          change={latest.financialInvestment}
          icon={latest.financialInvestment >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        />
        <SummaryCard
          title="외국인 순매수"
          value={`${latest.foreign > 0 ? '+' : ''}${latest.foreign.toLocaleString()}억`}
          change={latest.foreign}
          icon={latest.foreign >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        />
        <SummaryCard
          title="개인 순매수"
          value={`${latest.individual > 0 ? '+' : ''}${latest.individual.toLocaleString()}억`}
          change={latest.individual}
          icon={latest.individual >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KOSPI + FI Flow */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">코스피 지수 & 금융투자 순매수 추이 (최근 60일)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={9} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="kospi" name="코스피" stroke="#60A5FA" dot={false} strokeWidth={2} />
              <Bar yAxisId="right" dataKey="fi" name="금융투자 순매수(억)">
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fi >= 0 ? '#10B981' : '#EF4444'} />
                ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="fiMA10" name="금투 10일 이평" stroke="#F59E0B" dot={false} strokeWidth={2} strokeDasharray="4 2" />
              <ReferenceLine yAxisId="right" y={0} stroke="#6B7280" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Entity Comparison */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">주체별 순매수 비교 (최근 60일)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={9} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#6B7280" />
              <Bar dataKey="individual" name="개인" fill="#8B5CF6" stackId="a" />
              <Bar dataKey="foreign" name="외국인" fill="#06B6D4" stackId="a" />
              <Bar dataKey="fi" name="금융투자" fill="#EF4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pattern Alert */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-yellow-500" />
          공통 폭락 패턴 체크리스트
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { label: '장기 투자자 매수 둔화', status: true, detail: '보험/연기금 매수 부재' },
            { label: '금융투자가 마지막 매수 주체', status: true, detail: '차익거래·프로그램·LP' },
            { label: '외부 충격 또는 차익 소멸', status: false, detail: '트리거 대기 중' },
            { label: '매수 주체 소멸 → 유동성 공백', status: false, detail: '잠재적 위험' },
            { label: '마진콜/강제청산 악순환', status: false, detail: '미발생' },
          ].map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${item.status
                ? 'bg-red-950/30 border-red-800/50'
                : 'bg-gray-800/50 border-gray-700/50'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${item.status ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-xs font-medium">{`단계 ${i + 1}`}</span>
              </div>
              <p className="text-xs text-gray-300 font-medium">{item.label}</p>
              <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, change, icon }: { title: string; value: string; change: number; icon: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{title}</span>
        <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>{icon}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}

/* ==============================
   Daily Trading
   ============================== */
function DailyTrading({ tradingData }: { tradingData: DailyTradingData[] }) {
  const [page, setPage] = useState(0);
  const [dataRange, setDataRange] = useState<string>('1M');
  const [pageSize, setPageSize] = useState(30);

  const filteredData = useMemo(() => {
    let count = 30;
    if (dataRange === '7D') count = 7;
    else if (dataRange === '1M') count = 20;
    else if (dataRange === '3M') count = 60;
    else if (dataRange === '6M') count = 120;
    else if (dataRange === '1Y') count = 250;
    else if (dataRange === '5Y') count = 1250;
    else if (dataRange === '10Y') count = 2500;
    else if (dataRange === '20Y') count = 5000;
    else if (dataRange === '30Y') count = 7500;

    return tradingData.slice(-count);
  }, [tradingData, dataRange]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pageData = [...filteredData].reverse().slice(safePage * pageSize, (safePage + 1) * pageSize);

  const formatNum = (n: number) => {
    const sign = n >= 0 ? '+' : '';
    return `${sign}${n.toLocaleString()}`;
  };

  const cellColor = (n: number) => n >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">일자별 주체별 순매수 데이터</h2>
          <p className="text-xs text-gray-500 mt-1">
            {dataRange.includes('Y') ? '※ 장기 관점에서는 주요 변곡점 및 트렌드 데이터가 표시됩니다.' : '실시간 거래소 수급 데이터'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-lg">
            {['7D', '1M', '3M', '6M', '1Y', '5Y', '10Y', '20Y', '30Y'].map((range) => (
              <button
                key={range}
                onClick={() => { setDataRange(range); setPage(0); }}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${dataRange === range
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-gray-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Rows:</span>
            {[30, 50, 100].map(s => (
              <button
                key={s}
                onClick={() => { setPageSize(s); setPage(0); }}
                className={`w-8 h-6 flex items-center justify-center text-[10px] rounded font-bold ${pageSize === s ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-3 py-3 text-left text-gray-400 font-medium sticky left-0 bg-gray-900">날짜</th>
              <th className="px-3 py-3 text-right text-gray-400 font-medium">코스피</th>
              <th className="px-3 py-3 text-right text-gray-400 font-medium">등락</th>
              <th className="px-3 py-3 text-right text-purple-400 font-medium">개인</th>
              <th className="px-3 py-3 text-right text-cyan-400 font-medium">외국인</th>
              <th className="px-2 py-3 text-center text-gray-600">│</th>
              <th className="px-3 py-3 text-right font-bold text-red-400">금융투자</th>
              <th className="px-3 py-3 text-right text-gray-400 font-medium">보험</th>
              <th className="px-3 py-3 text-right text-gray-400 font-medium">투신</th>
              <th className="px-3 py-3 text-right text-gray-400 font-medium">은행</th>
              <th className="px-3 py-3 text-right text-gray-400 font-medium">기타금융</th>
              <th className="px-3 py-3 text-right text-gray-400 font-medium">연기금</th>
              <th className="px-2 py-3 text-center text-gray-600">│</th>
              <th className="px-3 py-3 text-right text-yellow-400 font-medium">연속매도</th>
              <th className="px-3 py-3 text-right text-orange-400 font-medium">매도비중</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((d) => {
              const globalIdx = tradingData.findIndex(td => td.date === d.date);
              const consecutive = getConsecutiveSellingDays(tradingData, globalIdx);
              const sellRatio = getFISellRatio(tradingData, globalIdx);
              const isSelling = d.financialInvestment < 0;
              const isHeavySelling = isSelling && consecutive >= 5;

              return (
                <tr
                  key={d.date}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${isHeavySelling ? 'bg-red-950/20' : ''
                    }`}
                >
                  <td className="px-3 py-2.5 font-mono text-gray-300 sticky left-0 bg-gray-900">{d.date}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-white">{d.kospiIndex.toFixed(2)}</td>
                  <td className={`px-3 py-2.5 text-right font-mono ${cellColor(d.kospiChange)}`}>
                    {formatNum(Math.round(d.kospiChange * 100) / 100)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${cellColor(d.individual)}`}>
                    {formatNum(d.individual)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${cellColor(d.foreign)}`}>
                    {formatNum(d.foreign)}
                  </td>
                  <td className="px-2 py-2.5 text-center text-gray-700">│</td>
                  <td className={`px-3 py-2.5 text-right font-mono font-bold ${isHeavySelling ? 'text-red-400 bg-red-950/30' : cellColor(d.financialInvestment)
                    }`}>
                    {formatNum(d.financialInvestment)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${cellColor(d.insurance)}`}>
                    {formatNum(d.insurance)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${cellColor(d.investmentTrust)}`}>
                    {formatNum(d.investmentTrust)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${cellColor(d.bank)}`}>
                    {formatNum(d.bank)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${cellColor(d.otherFinancial)}`}>
                    {formatNum(d.otherFinancial)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${cellColor(d.pension)}`}>
                    {formatNum(d.pension)}
                  </td>
                  <td className="px-2 py-2.5 text-center text-gray-700">│</td>
                  <td className="px-3 py-2.5 text-right">
                    {isSelling ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${consecutive >= 10 ? 'bg-red-600 text-white' :
                        consecutive >= 7 ? 'bg-orange-600 text-white' :
                          consecutive >= 5 ? 'bg-yellow-600 text-white' :
                            consecutive >= 3 ? 'bg-blue-600 text-white' :
                              'bg-gray-700 text-gray-300'
                        }`}>
                        {consecutive}일
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {isSelling ? (
                      <span className={`font-mono ${sellRatio >= 40 ? 'text-red-400 font-bold' :
                        sellRatio >= 30 ? 'text-orange-400' :
                          sellRatio >= 20 ? 'text-yellow-400' :
                            'text-gray-400'
                        }`}>
                        {sellRatio.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage <= 0}
            className="px-3 py-1.5 text-xs bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 transition-colors"
          >
            ← 앞페이지
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {safePage + 1}
            </span>
            <span className="text-xs text-gray-500">/ {totalPages} 페이지</span>
            <span className="text-[10px] text-gray-600 ml-2">({filteredData.length}일 중)</span>
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="px-3 py-1.5 text-xs bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-30 transition-colors"
          >
            뒷페이지 →
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h4 className="text-xs font-semibold text-gray-400 mb-2">연속 매도일수 색상 범례</h4>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-700" /> 1~2일</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600" /> 3~4일 (관심)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-600" /> 5~6일 (주의)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-600" /> 7~9일 (위험)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600" /> 10일+ (극심)</span>
        </div>
      </div>
    </div>
  );
}

/* ==============================
   Risk Analysis
   ============================== */
function RiskAnalysis({ tradingData }: { tradingData: DailyTradingData[] }) {
  const [streakRange, setStreakRange] = useState<string>('3M');

  // Compute risk timeline
  const riskTimeline = useMemo(() => {
    return tradingData.map((d, i) => {
      const r = calculateRisk(tradingData, i);
      return {
        date: d.date.slice(5),
        level: r.level,
        kospi: d.kospiIndex,
        fi: d.financialInvestment,
        consecutiveDays: r.consecutiveSellDays,
      };
    }).slice(-120);
  }, [tradingData]);

  // Streak analysis with range filtering
  const streakAnalysis = useMemo(() => {
    // 1. Calculate from current data
    const streaks: { start: string; end: string; days: number; totalSold: number; kospiChange: number; isHistorical?: boolean }[] = [];
    let streakStart = -1;

    // Filter trading data by selected range (for short ranges)
    let filteredData = tradingData;
    if (streakRange === '7D') {
      filteredData = tradingData.slice(-7);
    } else if (streakRange === '1M') {
      filteredData = tradingData.slice(-20);
    } else if (streakRange === '3M') {
      filteredData = tradingData.slice(-60);
    } else if (streakRange === '6M') {
      filteredData = tradingData.slice(-120);
    }

    for (let i = 0; i < filteredData.length; i++) {
      if (filteredData[i].financialInvestment < 0) {
        if (streakStart === -1) streakStart = i;
      } else {
        if (streakStart !== -1) {
          const days = i - streakStart;
          if (days >= 3) {
            let totalSold = 0;
            for (let j = streakStart; j < i; j++) {
              totalSold += filteredData[j].financialInvestment;
            }
            streaks.push({
              start: filteredData[streakStart].date,
              end: filteredData[i - 1].date,
              days,
              totalSold,
              kospiChange: filteredData[i - 1].kospiIndex - filteredData[streakStart].kospiIndex,
            });
          }
          streakStart = -1;
        }
      }
    }

    // 2. Add Historical Data if range is long enough
    const currentYear = new Date().getFullYear();
    const filterHistorical = (years: number) => {
      return significantHistoricalStreaks.filter(s => {
        const year = parseInt(s.start.split('-')[0]);
        return year >= (currentYear - years);
      });
    };

    if (streakRange === '1Y') streaks.push(...filterHistorical(1));
    if (streakRange === '5Y') streaks.push(...filterHistorical(5));
    if (streakRange === '10Y') streaks.push(...filterHistorical(10));
    if (streakRange === '20Y') streaks.push(...filterHistorical(20));
    if (streakRange === '30Y') streaks.push(...significantHistoricalStreaks);

    return streaks.sort((a, b) => {
      // Sort by date descending
      return new Date(b.end).getTime() - new Date(a.end).getTime();
    });
  }, [tradingData, streakRange]);

  const thresholds = Object.values(riskThresholds);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">금융투자 매도 리스크 분석 모델</h2>

      {/* Risk Level Reference */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Shield size={16} />
          리스크 등급 기준표
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {thresholds.map((t, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border"
              style={{ borderColor: t.color + '40', background: t.color + '10' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: t.color }}>
                  {i + 1}
                </div>
                <span className="font-semibold text-sm" style={{ color: t.color }}>{t.name}</span>
              </div>
              <div className="space-y-1 text-xs text-gray-400">
                <p>연속매도: <span className="text-gray-200">{t.consecutiveDays}</span></p>
                <p>매도비중: <span className="text-gray-200">{t.sellRatio}</span></p>
                <p className="mt-2 text-gray-300">{t.description}</p>
                <p className="mt-1 font-medium" style={{ color: t.color }}>{t.historicalOutcome}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Level Timeline */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">리스크 레벨 변화 추이 (최근 120일)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={riskTimeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={19} />
            <YAxis yAxisId="left" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area yAxisId="left" type="stepAfter" dataKey="level" name="리스크 레벨" fill="#EF444430" stroke="#EF4444" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="kospi" name="코스피" stroke="#60A5FA" dot={false} strokeWidth={2} />
            <ReferenceLine yAxisId="left" y={4} stroke="#EA580C" strokeDasharray="3 3" label={{ value: '위험', fill: '#EA580C', fontSize: 10 }} />
            <ReferenceLine yAxisId="left" y={3} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '주의', fill: '#F59E0B', fontSize: 10 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Consecutive Selling Streaks */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <TrendingDown size={16} className="text-red-400" />
            금융투자 연속 매도 구간 분석 (3일 이상)
          </h3>
          <div className="flex flex-wrap items-center gap-1 bg-gray-800/50 p-1 rounded-lg">
            {['7D', '1M', '3M', '6M', '1Y', '5Y', '10Y', '20Y', '30Y'].map((range) => (
              <button
                key={range}
                onClick={() => setStreakRange(range)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${streakRange === range
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-3 py-2 text-left text-gray-400">시작일</th>
                <th className="px-3 py-2 text-left text-gray-400">종료일</th>
                <th className="px-3 py-2 text-right text-gray-400">연속 일수</th>
                <th className="px-3 py-2 text-right text-gray-400">총 매도 금액(억)</th>
                <th className="px-3 py-2 text-right text-gray-400">코스피 변동</th>
                <th className="px-3 py-2 text-center text-gray-400">위험도</th>
              </tr>
            </thead>
            <tbody>
              {streakAnalysis.map((s, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-3 py-2 font-mono text-gray-300">{s.start}</td>
                  <td className="px-3 py-2 font-mono text-gray-300">{s.end}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`px-2 py-0.5 rounded font-bold ${s.days >= 10 ? 'bg-red-600 text-white' :
                      s.days >= 7 ? 'bg-orange-600 text-white' :
                        s.days >= 5 ? 'bg-yellow-600 text-white' :
                          'bg-blue-600 text-white'
                      }`}>
                      {s.days}일
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-red-400 font-mono font-bold">
                    {s.totalSold.toLocaleString()}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${s.kospiChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {s.kospiChange >= 0 ? '+' : ''}{s.kospiChange.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {s.days >= 10 ? '🔴' : s.days >= 7 ? '🟠' : s.days >= 5 ? '🟡' : '🔵'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlation Chart */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">연속 매도일수 vs 코스피 변동 상관관계</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={streakAnalysis.map(s => ({
            label: `${s.start.slice(5)}`,
            days: s.days,
            kospiChange: Math.round(s.kospiChange * 100) / 100,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="days" name="연속매도 일수" fill="#EF4444" />
            <Bar yAxisId="right" dataKey="kospiChange" name="코스피 변동">
              {streakAnalysis.map((s, idx) => (
                <Cell key={idx} fill={s.kospiChange >= 0 ? '#10B981' : '#F59E0B'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-br from-red-950/30 to-gray-900 rounded-xl p-5 border border-red-800/30">
        <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
          <Info size={16} />
          핵심 분석 인사이트
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-1">📊 비대칭 위험 구조</h4>
            <p>금융투자가 매수를 유지하면 지수 소폭 상승, 매도 전환 시 매수 공백으로 급격한 하락. 리스크-리턴이 극도로 비대칭적입니다.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">⚙️ 구조적 필연성</h4>
            <p>금융투자 자금은 단기 차익 목적으로 설계되어 있어, 차익 기회 소멸 시 매도는 '선택'이 아닌 '필수'입니다.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">🔄 반복성</h4>
            <p>한국에서만 2008, 2018, 2021-22년 최소 3회 이상 동일 패턴이 확인되었습니다.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">🌍 글로벌 보편성</h4>
            <p>미국(1987, 2008, 2010, 2018), 중국(2015) 등 시장과 시대를 초월하여 동일 구조가 급락을 유발합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==============================
   Historical Comparison
   ============================== */
function HistoricalComparison() {
  const [selectedCase, setSelectedCase] = useState<string>(historicalCases[0].id);
  const [expandedCase, setExpandedCase] = useState<string | null>(historicalCases[0].id);

  const activeCase = historicalCases.find(c => c.id === selectedCase)!;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">과거 폭락 사례와 현재 비교 분석</h2>

      {/* Summary Table */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">금융투자/딜러 주도 매수 후 급락 사례 종합</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-3 py-2 text-left text-gray-400">시기</th>
              <th className="px-3 py-2 text-left text-gray-400">시장</th>
              <th className="px-3 py-2 text-right text-gray-400">고점</th>
              <th className="px-3 py-2 text-right text-gray-400">저점</th>
              <th className="px-3 py-2 text-right text-gray-400">하락률</th>
              <th className="px-3 py-2 text-left text-gray-400">금융투자/딜러 역할</th>
              <th className="px-3 py-2 text-center text-gray-400">상세</th>
            </tr>
          </thead>
          <tbody>
            {historicalCases.map((c) => (
              <tr
                key={c.id}
                className={`border-b border-gray-800/50 cursor-pointer transition-colors ${selectedCase === c.id ? 'bg-red-950/20' : 'hover:bg-gray-800/30'
                  }`}
                onClick={() => { setSelectedCase(c.id); setExpandedCase(c.id); }}
              >
                <td className="px-3 py-2.5 text-gray-300">{c.period}</td>
                <td className="px-3 py-2.5 text-gray-300">{c.market}</td>
                <td className="px-3 py-2.5 text-right text-green-400 font-mono">{c.peakValue}</td>
                <td className="px-3 py-2.5 text-right text-red-400 font-mono">{c.troughValue}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className="bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded font-bold">
                    {c.decline}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-gray-400 max-w-xs truncate">{c.fiRole}</td>
                <td className="px-3 py-2.5 text-center">
                  <Eye size={14} className="inline text-gray-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Decline Comparison Bar Chart */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">사례별 하락률 비교</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={historicalCases.map(c => ({
              name: c.title.length > 15 ? c.title.slice(0, 15) + '…' : c.title,
              decline: c.declinePercent,
              id: c.id,
            }))}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={[0, 60]} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} width={130} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              itemStyle={{ color: '#FBBF24', fontWeight: 'bold' }}
            />
            <Bar dataKey="decline" name="하락률(%)">
              {historicalCases.map((c, i) => (
                <Cell
                  key={i}
                  fill={selectedCase === c.id ? '#FBBF24' : '#D97706'}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Case Detail */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div
          className="p-5 cursor-pointer flex items-center justify-between"
          onClick={() => setExpandedCase(expandedCase === activeCase.id ? null : activeCase.id)}
        >
          <div>
            <h3 className="text-base font-bold text-white">{activeCase.title}</h3>
            <p className="text-xs text-gray-400">{activeCase.titleEn} | {activeCase.market} | {activeCase.period}</p>
          </div>
          {expandedCase === activeCase.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {expandedCase === activeCase.id && (
          <div className="px-5 pb-5 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">고점</div>
                <div className="text-lg font-bold text-green-400">{activeCase.peakValue}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">저점</div>
                <div className="text-lg font-bold text-red-400">{activeCase.troughValue}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">하락률</div>
                <div className="text-lg font-bold text-red-500">{activeCase.decline}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">금융투자 역할</div>
                <div className="text-sm font-semibold text-orange-400">{activeCase.fiRole}</div>
              </div>
            </div>

            {/* Timeline Chart */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-3">지수 및 금융투자 자금 흐름</h4>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={activeCase.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={['auto', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="index" name="지수" stroke="#60A5FA" strokeWidth={2} dot={{ r: 4 }} />
                  <Bar yAxisId="right" dataKey="fiFlow" name="금융투자 흐름">
                    {activeCase.timelineData.map((entry, index) => (
                      <Cell key={index} fill={entry.fiFlow >= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                  <ReferenceLine yAxisId="right" y={0} stroke="#6B7280" strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Mechanism */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-2">붕괴 메커니즘</h4>
              <div className="space-y-2">
                {activeCase.mechanism.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-red-400 font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-300">{m}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Lesson */}
            <div className="bg-gradient-to-r from-yellow-950/30 to-gray-800/30 rounded-lg p-4 border border-yellow-800/30">
              <h4 className="text-xs font-semibold text-yellow-500 mb-1 flex items-center gap-1">
                <AlertTriangle size={14} />
                핵심 교훈
              </h4>
              <p className="text-sm text-gray-300">{activeCase.keyLesson}</p>
            </div>
          </div>
        )}
      </div>

      {/* Common Pattern */}
      <div className="bg-gradient-to-br from-gray-900 to-red-950/20 rounded-xl p-6 border border-red-800/30">
        <h3 className="text-base font-bold text-white mb-4">🔄 반복되는 공통 폭락 패턴</h3>
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          {[
            { step: 1, text: '상승 후반부\n장기 투자자 매수 둔화', color: '#3B82F6' },
            { step: 2, text: '금융투자가\n마지막 매수 주체', color: '#F59E0B' },
            { step: 3, text: '외부 충격 또는\n차익 소멸', color: '#EA580C' },
            { step: 4, text: '매수 주체 소멸\n유동성 공백', color: '#EF4444' },
            { step: 5, text: '마진콜/강제청산\n악순환 → 폭락', color: '#DC2626' },
          ].map((s) => (
            <div key={s.step} className="flex-1 flex flex-col items-center">
              <div
                className="w-full p-4 rounded-lg border text-center"
                style={{ borderColor: s.color + '60', background: s.color + '15' }}
              >
                <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: s.color }}>
                  {s.step}
                </div>
                <p className="text-xs text-gray-200 whitespace-pre-line">{s.text}</p>
              </div>
              {s.step < 5 && (
                <div className="text-gray-600 text-lg my-1 md:hidden">↓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-400 space-y-1">
            <p><strong className="text-gray-300">⚠️ "급락 가능성이 높다" ≠ "반드시 급락한다"</strong></p>
            <p>반례도 존재합니다: 금융투자 매수가 장기 투자자 진입을 위한 징검다리 역할을 한 경우, 정부/중앙은행의 적극적 개입으로 급락이 방어된 경우(2020년 3월), 기업 실적이 실제로 뒷받침되어 밸류에이션이 정당화된 경우.</p>
            <p>"급락 가능성이 구조적으로 높다"는 진단은 타당하나, "반드시 급락한다"는 예측은 과도합니다. 시점(Timing) 예측은 불가능합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
