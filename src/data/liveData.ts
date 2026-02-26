import type { DailyTradingData } from './mockData';

interface NaverIndexPrice {
  localTradedAt: string;
  closePrice: string;
  compareToPreviousClosePrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
}

interface NaverIndexTrend {
  bizdate: string;
  personalValue: string;
  foreignValue: string;
  institutionalValue: string;
}

interface PollingResponse {
  result?: {
    time?: number;
  };
}

export interface LiveDataMeta {
  asOfKst: string;
  latestTradingDate: string;
  source: string;
  note: string;
  usingFallback: boolean;
}

export interface LiveDataResult {
  tradingData: DailyTradingData[];
  meta: LiveDataMeta;
}

const NAVER_API_PREFIX = '/naver-api';
const POLLING_API_PREFIX = '/polling-api';
const MAX_PAGE_SIZE = 60;

function parseNumeric(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (!value) return 0;

  const normalized = value.replace(/,/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBizDate(date: string): string {
  return date.replace(/-/g, '');
}

function formatKstDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function fetchPriceData(days: number): Promise<NaverIndexPrice[]> {
  const targetDays = Math.max(20, days);
  const pageCount = Math.ceil(targetDays / MAX_PAGE_SIZE);
  const requests: Promise<NaverIndexPrice[]>[] = [];

  for (let page = 1; page <= pageCount; page++) {
    requests.push(
      fetchJson<NaverIndexPrice[]>(
        `${NAVER_API_PREFIX}/api/index/KOSPI/price?page=${page}&pageSize=${MAX_PAGE_SIZE}`,
      ),
    );
  }

  const pageResults = await Promise.all(requests);
  return pageResults.flat().slice(0, targetDays);
}

async function fetchTrendMap(dates: string[]): Promise<Map<string, NaverIndexTrend>> {
  const uniqueDates = Array.from(new Set(dates));
  const trendMap = new Map<string, NaverIndexTrend>();

  for (let i = 0; i < uniqueDates.length; i += 8) {
    const chunk = uniqueDates.slice(i, i + 8);
    const chunkResults = await Promise.all(
      chunk.map(async (bizdate) => {
        try {
          const trend = await fetchJson<NaverIndexTrend>(
            `${NAVER_API_PREFIX}/api/index/KOSPI/trend?bizdate=${bizdate}`,
          );
          return [bizdate, trend] as const;
        } catch {
          return [bizdate, null] as const;
        }
      }),
    );

    for (const [bizdate, trend] of chunkResults) {
      if (trend) {
        trendMap.set(bizdate, trend);
      }
    }
  }

  return trendMap;
}

function buildTradingRows(prices: NaverIndexPrice[], trendMap: Map<string, NaverIndexTrend>): DailyTradingData[] {
  const rows = prices.map((price) => {
    const bizdate = toBizDate(price.localTradedAt);
    const trend = trendMap.get(bizdate);

    const individual = Math.round(parseNumeric(trend?.personalValue));
    const foreign = Math.round(parseNumeric(trend?.foreignValue));
    const institution = Math.round(parseNumeric(trend?.institutionalValue));
    const financialInvestment = institution;
    const otherCorporation = -(individual + foreign + institution);

    return {
      date: price.localTradedAt,
      kospiIndex: parseNumeric(price.closePrice),
      kospiChange: parseNumeric(price.compareToPreviousClosePrice),
      individual,
      foreign,
      institution,
      financialInvestment,
      insurance: 0,
      investmentTrust: 0,
      bank: 0,
      otherFinancial: 0,
      pension: 0,
      otherCorporation,
    };
  });

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchLiveKOSPITradingData(days = 60): Promise<LiveDataResult> {
  const prices = await fetchPriceData(days);
  if (prices.length === 0) {
    throw new Error('No price data returned from source API.');
  }

  const bizDates = prices.map((p) => toBizDate(p.localTradedAt));
  const trendMap = await fetchTrendMap(bizDates);
  const tradingData = buildTradingRows(prices, trendMap);

  let pollingTime: number | undefined;
  try {
    const polling = await fetchJson<PollingResponse>(
      `${POLLING_API_PREFIX}/api/realtime?query=SERVICE_INDEX:KOSPI`,
    );
    pollingTime = polling?.result?.time;
  } catch {
    pollingTime = undefined;
  }

  const meta: LiveDataMeta = {
    asOfKst: formatKstDateTime(typeof pollingTime === 'number' ? new Date(pollingTime) : new Date()),
    latestTradingDate: prices[0].localTradedAt,
    source: 'Naver Finance Mobile API',
    note: '금융투자 세부 항목 부재로 기관계 순매수를 금융투자 대체지표로 사용합니다.',
    usingFallback: false,
  };

  return { tradingData, meta };
}
