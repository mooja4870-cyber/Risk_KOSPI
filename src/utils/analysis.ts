import type { DailyTradeData } from '../data/mockData';

export interface StatsSummary {
  totalNetBuy: number;
  averageDailyNetBuy: number;
  financialBuySharePct: number;
  totalBuyAmount: number;
  individualBuyAmount: number;
  foreignBuyAmount: number;
  institutionBuyAmount: number;
  financialInvestmentBuyAmount: number;
  insuranceBuyAmount: number;
  investmentTrustBuyAmount: number;
  pensionBuyAmount: number;
  otherCorporationBuyAmount: number;
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
  structuralStreakCount: number;
  highRiskStreakCount: number;
  repeatStrength: number;
  structuralCoveragePct: number;
  currentStreakAmount: number;
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
      financialBuySharePct: 0,
      totalBuyAmount: 0,
      individualBuyAmount: 0,
      foreignBuyAmount: 0,
      institutionBuyAmount: 0,
      financialInvestmentBuyAmount: 0,
      insuranceBuyAmount: 0,
      investmentTrustBuyAmount: 0,
      pensionBuyAmount: 0,
      otherCorporationBuyAmount: 0,
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
  const individualBuyAmount = data.reduce((sum, d) => sum + Math.max(0, d.individual), 0);
  const foreignBuyAmount = data.reduce((sum, d) => sum + Math.max(0, d.foreign), 0);
  const institutionBuyAmount = data.reduce((sum, d) => sum + Math.max(0, d.institution), 0);
  const financialInvestmentBuyAmount = data.reduce(
    (sum, d) => sum + Math.max(0, d.financialInvestment),
    0
  );
  const insuranceBuyAmount = data.reduce((sum, d) => sum + Math.max(0, d.insurance), 0);
  const investmentTrustBuyAmount = data.reduce(
    (sum, d) => sum + Math.max(0, d.investmentTrust),
    0
  );
  const pensionBuyAmount = data.reduce((sum, d) => sum + Math.max(0, d.pension), 0);
  const otherCorporationBuyAmount = data.reduce(
    (sum, d) => sum + Math.max(0, d.otherCorporation),
    0
  );

  const totalBuyAmount = data.reduce(
    (sum, d) =>
      sum +
      Math.max(0, d.individual) +
      Math.max(0, d.foreign) +
      Math.max(0, d.institution) +
      Math.max(0, d.otherCorporation),
    0
  );
  const financialBuySharePct =
    totalBuyAmount > 0 ? (financialInvestmentBuyAmount / totalBuyAmount) * 100 : 0;

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
    financialBuySharePct,
    totalBuyAmount,
    individualBuyAmount,
    foreignBuyAmount,
    institutionBuyAmount,
    financialInvestmentBuyAmount,
    insuranceBuyAmount,
    investmentTrustBuyAmount,
    pensionBuyAmount,
    otherCorporationBuyAmount,
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
  const allStreaks: ConsecutiveSellInfo['streaks'] = [];
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
      if (currentStreak > 0) {
        allStreaks.push({
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
  if (currentStreak > 0) {
    allStreaks.push({
      startDate: streakStart,
      endDate: sorted[sorted.length - 1].date,
      days: currentStreak,
      totalAmount: streakAmount,
    });
  }

  const structuralStreaks = allStreaks.filter((streak) => streak.days >= 3);
  const highRiskStreakCount = structuralStreaks.filter((streak) => streak.days >= 5).length;
  const repeatStrength = structuralStreaks.reduce((sum, streak) => sum + (streak.days - 2), 0);
  const structuralDays = structuralStreaks.reduce((sum, streak) => sum + streak.days, 0);
  const structuralCoveragePct = sorted.length > 0 ? (structuralDays / sorted.length) * 100 : 0;

  return {
    maxStreak,
    streaks: structuralStreaks.sort((a, b) => b.days - a.days),
    currentStreak:
      sorted.length > 0 &&
        sorted[sorted.length - 1].financialInvestment < 0
        ? currentStreak
        : 0,
    structuralStreakCount: structuralStreaks.length,
    highRiskStreakCount,
    repeatStrength,
    structuralCoveragePct,
    currentStreakAmount:
      sorted.length > 0 &&
        sorted[sorted.length - 1].financialInvestment < 0
        ? streakAmount
        : 0,
  };
}

// Calculate risk score
export function calculateRiskScore(
  consecutiveInfo: ConsecutiveSellInfo
): RiskAssessment {
  let score = 0;
  const factors: string[] = [];

  // 1) End-date continuity: if the latest day is still in a sell streak, treat as structural weakness.
  if (consecutiveInfo.currentStreak >= 2) {
    score += 1;
    factors.push(`종료일 기준 연속 순매도 ${consecutiveInfo.currentStreak}일 (+1)`);
  }
  if (consecutiveInfo.currentStreak >= 3) {
    score += 2;
    factors.push(`종료일 기준 3일+ 연속 순매도 진행 (+2)`);
  }
  if (consecutiveInfo.currentStreak >= 5) {
    score += 2;
    factors.push(`종료일 기준 5일+ 연속 순매도 (구조적 약세) (+2)`);
  }
  if (consecutiveInfo.currentStreak >= 7) {
    score += 1;
    factors.push(`종료일 기준 7일+ 연속 순매도 (고위험) (+1)`);
  }

  // 2) Repetition: repeated structural streaks in the selected period.
  if (consecutiveInfo.structuralStreakCount >= 2) {
    score += 1;
    factors.push(`3일+ 연속 순매도 구간 ${consecutiveInfo.structuralStreakCount}회 (+1)`);
  }
  if (consecutiveInfo.structuralStreakCount >= 4) {
    score += 1;
    factors.push(`연속 순매도 반복 빈도 높음 (${consecutiveInfo.structuralStreakCount}회) (+1)`);
  }
  if (consecutiveInfo.repeatStrength >= 6) {
    score += 1;
    factors.push(`반복 강도 지수 ${consecutiveInfo.repeatStrength} (연속성 누적) (+1)`);
  }
  if (consecutiveInfo.repeatStrength >= 10) {
    score += 1;
    factors.push(`반복 강도 지수 매우 높음 (${consecutiveInfo.repeatStrength}) (+1)`);
  }
  if (consecutiveInfo.highRiskStreakCount >= 2) {
    score += 1;
    factors.push(`5일+ 연속 순매도 고위험 구간 ${consecutiveInfo.highRiskStreakCount}회 (+1)`);
  }
  if (consecutiveInfo.structuralCoveragePct >= 35) {
    score += 1;
    factors.push(`선택구간 대비 연속 순매도 점유율 ${consecutiveInfo.structuralCoveragePct.toFixed(1)}% (+1)`);
  }

  score = Math.min(score, 10);

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
    factors.push('종료일 기준 연속 하락/순매도 구조 신호 없음');
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
