import {
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
  Legend,
  Cell,
} from 'recharts';
import { formatNumber } from '../utils/analysis';

interface ChartDataPoint {
  date: string;
  value: number;
  ma5: number | null;
  ma20: number | null;
  cumulative: number;
  foreign: number;
  isSell: boolean;
  kospiClose: number | null;
}

interface ChartsProps {
  data: ChartDataPoint[];
  compact?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-gray-400 text-xs mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name}:{' '}
            {p.dataKey === 'kospiClose' || p.name === 'KOSPI'
              ? `${Number(p.value).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pt`
              : `${formatNumber(Math.round(p.value))}억`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DailyBarChart({ data, compact = false }: ChartsProps) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    value: d.value,
    kospiClose: d.kospiClose,
    fill: d.value >= 0 ? '#10b981' : '#f43f5e',
  }));

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">금융투자 순매수/순매도 및 KOSPI 추이</h3>
      <p className="text-gray-400 text-xs mb-4">막대: 금융투자 순매수/순매도(억원) · 선: KOSPI 지수(pt)</p>
      <div className={compact ? 'h-[357px]' : 'h-72'}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              interval={Math.max(Math.floor(chartData.length / 12), 0)}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              yAxisId="flow"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="kospi"
              orientation="right"
              tick={{ fill: '#67e8f9', fontSize: 10 }}
              axisLine={{ stroke: '#155e75' }}
              tickFormatter={(v) => Number(v).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine y={0} stroke="#6b7280" />
            <Bar yAxisId="flow" dataKey="value" name="금융투자" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
            <Line
              yAxisId="kospi"
              type="monotone"
              dataKey="kospiClose"
              name="KOSPI"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CumulativeChart({ data, compact = false }: ChartsProps) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    cumulative: d.cumulative,
  }));

  const isPositive =
    chartData.length > 0 && chartData[chartData.length - 1].cumulative >= 0;

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">누적 순매수 추이</h3>
      <p className="text-gray-400 text-xs mb-4">Cumulative Net Position (억원)</p>
      <div className={compact ? 'h-[248px]' : 'h-72'}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? '#10b981' : '#f43f5e'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? '#10b981' : '#f43f5e'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              interval={Math.max(Math.floor(chartData.length / 12), 0)}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#6b7280" />
            <Area
              type="monotone"
              dataKey="cumulative"
              name="누적 순매수"
              stroke={isPositive ? '#10b981' : '#f43f5e'}
              fill="url(#cumGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MovingAverageChart({ data }: ChartsProps) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    ma5: d.ma5 !== null ? Math.round(d.ma5) : null,
    ma20: d.ma20 !== null ? Math.round(d.ma20) : null,
  }));

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">이동평균 방향성 분석</h3>
      <p className="text-gray-400 text-xs mb-4">5일 / 20일 이동평균 (MA5 &lt; MA20 = 매도 압력 우세)</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              interval={Math.max(Math.floor(chartData.length / 12), 0)}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
            />
            <ReferenceLine y={0} stroke="#6b7280" />
            <Line
              type="monotone"
              dataKey="ma5"
              name="MA5"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="ma20"
              name="MA20"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ForeignCorrelationChart({ data }: ChartsProps) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    financial: d.value,
    foreign: d.foreign,
  }));

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
      <h3 className="text-white font-bold mb-1">금융투자 vs 외국인 수급 비교</h3>
      <p className="text-gray-400 text-xs mb-4">동시 순매도 구간 = 하락 위험 증가</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              interval={Math.max(Math.floor(chartData.length / 12), 0)}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine y={0} stroke="#6b7280" />
            <Line
              type="monotone"
              dataKey="financial"
              name="금융투자"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="foreign"
              name="외국인"
              stroke="#06b6d4"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
