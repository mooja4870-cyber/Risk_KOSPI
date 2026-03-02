import type { DailyTradeData } from '../data/mockData';

export interface StatsSummary {
  totalNetBuy: number;
  averageDailyNetBuy: number;
  netBuyDays: number;
  netSellDays: number;
  maxNetBuy: number;
  maxNetSell: number;
  standardDeviation: number;
  tradingDays: number;
}

export interface ConsecutiveSellInfo {
  maxStreak: number;
  streaks: { startDate: string; endDate: string; days: number; totalAmount: number }[];
  currentStreak: number;
}

export interface RiskAssessment {
  score: number;
  level: 'normal' | 'caution' | 'warning' | 'danger';
  label: string;
  factors: string[];
}

// Filter data by date range
export function filterByDateRange(
  data: DailyTradeData[],
  startDate: string,
  endDate: string
): DailyTradeData[] {
  return data.filter((d) => d.date >= startDate && d.date <= endDate);
}

// Calculate statistics
export function calculateStats(data: DailyTradeData[]): StatsSummary {
  if (data.length === 0) {
    return {
      totalNetBuy: 0,
      averageDailyNetBuy: 0,
      netBuyDays: 0,
      netSellDays: 0,
      maxNetBuy: 0,
      maxNetSell: 0,
      standardDeviation: 0,
      tradingDays: 0,
    };
  }

  const values = data.map((d) => d.financialInvestment);
  const total = values.reduce((a, b) => a + b, 0);
  const mean = total / values.length;

  const netBuyDays = values.filter((v) => v > 0).length;
  const netSellDays = values.filter((v) => v < 0).length;

  const maxNetBuy = Math.max(...values);
  const maxNetSell = Math.min(...values);

  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    totalNetBuy: total,
    averageDailyNetBuy: mean,
    netBuyDays,
    netSellDays,
    maxNetBuy,
    maxNetSell,
    standardDeviation,
    tradingDays: data.length,
  };
}

// Detect consecutive sell streaks
export function detectConsecutiveSells(
  data: DailyTradeData[]
): ConsecutiveSellInfo {
  const streaks: ConsecutiveSellInfo['streaks'] = [];
  let maxStreak = 0;
  let currentStreak = 0;
  let streakStart = '';
  let streakAmount = 0;

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].financialInvestment < 0) {
      if (currentStreak === 0) {
        streakStart = sorted[i].date;
        streakAmount = 0;
      }
      currentStreak++;
      streakAmount += sorted[i].financialInvestment;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      if (currentStreak >= 3) {
        streaks.push({
          startDate: streakStart,
          endDate: sorted[i - 1].date,
          days: currentStreak,
          totalAmount: streakAmount,
        });
      }
      currentStreak = 0;
      streakAmount = 0;
    }
  }

  // Handle streak at end of data
  if (currentStreak >= 3) {
    streaks.push({
      startDate: streakStart,
      endDate: sorted[sorted.length - 1].date,
      days: currentStreak,
      totalAmount: streakAmount,
    });
  }

  return {
    maxStreak,
    streaks: streaks.sort((a, b) => b.days - a.days),
    currentStreak:
      sorted.length > 0 &&
      sorted[sorted.length - 1].financialInvestment < 0
        ? currentStreak
        : 0,
  };
}

// Calculate risk score
export function calculateRiskScore(
  data: DailyTradeData[],
  stats: StatsSummary,
  consecutiveInfo: ConsecutiveSellInfo
): RiskAssessment {
  let score = 0;
  const factors: string[] = [];

  // Condition 1: 3+ consecutive sell days
  if (consecutiveInfo.maxStreak >= 3) {
    score += 1;
    factors.push(`연속 순매도 ${consecutiveInfo.maxStreak}일 감지 (+1)`);
  }

  // Condition 2: 5+ consecutive sell days
  if (consecutiveInfo.maxStreak >= 5) {
    score += 2;
    factors.push(`5일 이상 연속 순매도 - 프로그램 매도 동반 가능 (+2)`);
  }

  // Condition 3: 7+ consecutive sell days
  if (consecutiveInfo.maxStreak >= 7) {
    score += 1;
    factors.push(`7일 이상 연속 순매도 - 고위험 신호 (+1)`);
  }

  // Condition 4: Average is negative
  if (stats.averageDailyNetBuy < 0) {
    score += 1;
    factors.push(`평균 일별 순매수 음수 (${formatNumber(Math.round(stats.averageDailyNetBuy))}억) (+1)`);
  }

  // Condition 5: High standard deviation (> 2000)
  if (stats.standardDeviation > 2000) {
    score += 1;
    factors.push(`높은 변동성 (표준편차: ${formatNumber(Math.round(stats.standardDeviation))}억) (+1)`);
  }

  // Condition 6: Recent 3 days total below -5000
  if (data.length >= 3) {
    const sorted = [...data].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const recent3Sum =
      sorted[0].financialInvestment +
      sorted[1].financialInvestment +
      sorted[2].financialInvestment;
    if (recent3Sum < -5000) {
      score += 2;
      factors.push(`최근 3일 합계 ${formatNumber(recent3Sum)}억 (< -5,000억) (+2)`);
    }
  }

  // Condition 7: Single day with -10000+ sell
  if (stats.maxNetSell < -10000) {
    score += 1;
    factors.push(`대규모 단일일 순매도 ${formatNumber(stats.maxNetSell)}억 (+1)`);
  }

  // Condition 8: Foreign + Financial both selling (last day)
  if (data.length > 0) {
    const sorted = [...data].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latest = sorted[0];
    if (latest.financialInvestment < 0 && latest.foreign < 0) {
      score += 1;
      factors.push(`최근일 외국인+금융투자 동시 순매도 (+1)`);
    }
  }

  let level: RiskAssessment['level'];
  let label: string;

  if (score <= 1) {
    level = 'normal';
    label = '정상';
  } else if (score <= 3) {
    level = 'caution';
    label = '경계';
  } else if (score <= 5) {
    level = 'warning';
    label = '위험';
  } else {
    level = 'danger';
    label = '고위험';
  }

  if (factors.length === 0) {
    factors.push('특이 리스크 요인 없음');
  }

  return { score, level, label, factors };
}

// Calculate moving averages
export function calculateMovingAverages(
  data: DailyTradeData[]
): {
  date: string;
  value: number;
  ma5: number | null;
  ma20: number | null;
  cumulative: number;
  foreign: number;
  isSell: boolean;
}[] {
  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let cumSum = 0;

  return sorted.map((d, i) => {
    cumSum += d.financialInvestment;

    let ma5: number | null = null;
    let ma20: number | null = null;

    if (i >= 4) {
      const slice5 = sorted.slice(i - 4, i + 1);
      ma5 = slice5.reduce((s, x) => s + x.financialInvestment, 0) / 5;
    }

    if (i >= 19) {
      const slice20 = sorted.slice(i - 19, i + 1);
      ma20 = slice20.reduce((s, x) => s + x.financialInvestment, 0) / 20;
    }

    return {
      date: d.date,
      value: d.financialInvestment,
      ma5,
      ma20,
      cumulative: cumSum,
      foreign: d.foreign,
      isSell: d.financialInvestment < 0,
    };
  });
}

// Format number with commas and sign
export function formatNumber(num: number): string {
  const sign = num > 0 ? '+' : '';
  return sign + num.toLocaleString('ko-KR');
}

// Format date to Korean style
export function formatDateKR(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
