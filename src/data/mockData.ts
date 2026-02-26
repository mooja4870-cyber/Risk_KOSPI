export interface DailyTradingData {
  date: string;
  kospiIndex: number;
  kospiChange: number;
  individual: number;
  foreign: number;
  institution: number;
  financialInvestment: number;
  insurance: number;
  investmentTrust: number;
  bank: number;
  otherFinancial: number;
  pension: number;
  otherCorporation: number;
}

// Generate realistic mock data simulating various market conditions
function generateMockData(): DailyTradingData[] {
  const data: DailyTradingData[] = [];

  let kospi = 2400;

  // Define long-term cycles
  const phases = [
    { name: '2000s_IT_Bubble', days: 800, fiBias: 500, kospiDrift: 0.1, volatility: 30 },
    { name: '2004_Growth', days: 1000, fiBias: 800, kospiDrift: 0.8, volatility: 15 },
    { name: '2008_Crisis', days: 500, fiBias: -1500, kospiDrift: -2.5, volatility: 50 },
    { name: '2010_Recovery', days: 1200, fiBias: 600, kospiDrift: 1.2, volatility: 20 },
    { name: '2015_Stagnation', days: 1500, fiBias: -200, kospiDrift: 0.05, volatility: 10 },
    { name: '2020_Pandemic', days: 500, fiBias: 2000, kospiDrift: 3.5, volatility: 60 },
    { name: '2022_Correction', days: 600, fiBias: -1200, kospiDrift: -1.8, volatility: 25 },
    { name: '2024_Current', days: 1500, fiBias: -800, kospiDrift: -0.5, volatility: 20 },
  ];

  // Calculate total trading days needed to reach today
  const totalDays = phases.reduce((acc, p) => acc + p.days, 0);

  // Work backwards from today to find start date
  const endDate = new Date();

  // Roughly 250 trading days per year, but we'll just step backward
  let currentTargetDate = new Date(endDate);
  let tradingDaysCounted = 0;
  const targetDates: Date[] = [];

  while (tradingDaysCounted < totalDays) {
    const dow = currentTargetDate.getDay();
    if (dow !== 0 && dow !== 6) {
      targetDates.push(new Date(currentTargetDate));
      tradingDaysCounted++;
    }
    currentTargetDate.setDate(currentTargetDate.getDate() - 1);
  }

  // Revert for chronological generation
  targetDates.reverse();

  let globalDayIdx = 0;
  for (const phase of phases) {
    for (let i = 0; i < phase.days; i++) {
      const currentDate = targetDates[globalDayIdx];
      if (!currentDate) break;

      const drift = phase.kospiDrift;
      const vol = phase.volatility;
      const noise = () => (Math.random() - 0.5) * 2;
      const bigNoise = () => (Math.random() - 0.5) * vol * 20;

      let fi = phase.fiBias + bigNoise();

      // Create some streaks
      if (fi < 0 && Math.random() > 0.4) {
        fi -= Math.random() * 800;
      }

      const individual = -fi * 0.4 + bigNoise();
      const foreignInv = -fi * 0.3 + bigNoise();
      const insurance = (Math.random() - 0.4) * 400;
      const investmentTrust = (Math.random() - 0.45) * 500;
      const bank = (Math.random() - 0.5) * 200;
      const otherFinancial = (Math.random() - 0.5) * 150;
      const pension = (Math.random() - 0.3) * 600;
      const otherCorp = (Math.random() - 0.5) * 300;

      const institution = fi + insurance + investmentTrust + bank + otherFinancial + pension;

      const kospiChange = drift + noise() * vol;
      kospi += kospiChange;
      kospi = Math.max(kospi, 500);
      kospi = Math.min(kospi, 3500);

      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

      data.push({
        date: dateStr,
        kospiIndex: Math.round(kospi * 100) / 100,
        kospiChange: Math.round(kospiChange * 100) / 100,
        individual: Math.round(individual),
        foreign: Math.round(foreignInv),
        institution: Math.round(institution),
        financialInvestment: Math.round(fi),
        insurance: Math.round(insurance),
        investmentTrust: Math.round(investmentTrust),
        bank: Math.round(bank),
        otherFinancial: Math.round(otherFinancial),
        pension: Math.round(pension),
        otherCorporation: Math.round(otherCorp)
      });

      globalDayIdx++;
    }
  }

  return data;
}

export const tradingData = generateMockData();

// Calculate consecutive selling days for financial investment
export function getConsecutiveSellingDays(data: DailyTradingData[], endIndex: number): number {
  let count = 0;
  for (let i = endIndex; i >= 0; i--) {
    if (data[i].financialInvestment < 0) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

// Calculate financial investment selling ratio
export function getFISellRatio(data: DailyTradingData[], index: number): number {
  const d = data[index];
  const totalSelling = Math.abs(d.individual < 0 ? d.individual : 0) +
    Math.abs(d.foreign < 0 ? d.foreign : 0) +
    Math.abs(d.financialInvestment < 0 ? d.financialInvestment : 0) +
    Math.abs(d.insurance < 0 ? d.insurance : 0) +
    Math.abs(d.investmentTrust < 0 ? d.investmentTrust : 0) +
    Math.abs(d.bank < 0 ? d.bank : 0) +
    Math.abs(d.otherFinancial < 0 ? d.otherFinancial : 0) +
    Math.abs(d.pension < 0 ? d.pension : 0);

  if (totalSelling === 0) return 0;
  const fiSelling = d.financialInvestment < 0 ? Math.abs(d.financialInvestment) : 0;
  return (fiSelling / totalSelling) * 100;
}

// Risk level calculation
export interface RiskAssessment {
  level: number; // 1-5
  label: string;
  color: string;
  consecutiveSellDays: number;
  avgSellAmount: number;
  sellRatio: number;
  description: string;
}

export function calculateRisk(data: DailyTradingData[], endIndex: number): RiskAssessment {
  const consecutiveDays = getConsecutiveSellingDays(data, endIndex);

  // Average selling amount over last N days
  const lookback = Math.min(10, endIndex + 1);
  let totalSell = 0;
  let sellDays = 0;
  for (let i = endIndex; i > endIndex - lookback; i--) {
    if (i < 0) break;
    if (data[i].financialInvestment < 0) {
      totalSell += Math.abs(data[i].financialInvestment);
      sellDays++;
    }
  }
  const avgSell = sellDays > 0 ? totalSell / sellDays : 0;
  const sellRatio = getFISellRatio(data, endIndex);

  // Scoring
  let score = 0;

  // Consecutive days scoring
  if (consecutiveDays >= 10) score += 3;
  else if (consecutiveDays >= 7) score += 2.5;
  else if (consecutiveDays >= 5) score += 2;
  else if (consecutiveDays >= 3) score += 1;

  // Average sell amount scoring
  if (avgSell >= 2000) score += 3;
  else if (avgSell >= 1500) score += 2.5;
  else if (avgSell >= 1000) score += 2;
  else if (avgSell >= 500) score += 1;

  // Sell ratio scoring
  if (sellRatio >= 40) score += 2;
  else if (sellRatio >= 30) score += 1.5;
  else if (sellRatio >= 20) score += 1;
  else if (sellRatio >= 10) score += 0.5;

  // Determine level
  let level: number;
  let label: string;
  let color: string;
  let description: string;

  if (score >= 7) {
    level = 5;
    label = '극심한 위험';
    color = '#DC2626';
    description = '금융투자 대규모 연속 매도. 역사적 폭락 패턴과 매우 유사. 즉각적인 리스크 관리 필요.';
  } else if (score >= 5.5) {
    level = 4;
    label = '높은 위험';
    color = '#EA580C';
    description = '금융투자 매도 강도 증가. 매수 주체 공백 가능성 높음. 포지션 축소 권고.';
  } else if (score >= 4) {
    level = 3;
    label = '주의';
    color = '#F59E0B';
    description = '금융투자 매도 전환 신호 감지. 추이 모니터링 필요.';
  } else if (score >= 2) {
    level = 2;
    label = '관심';
    color = '#3B82F6';
    description = '일부 매도 움직임 있으나 추세 전환은 미확인.';
  } else {
    level = 1;
    label = '안정';
    color = '#10B981';
    description = '금융투자 매수 유지 또는 소규모 매도. 정상 범위.';
  }

  return {
    level,
    label,
    color,
    consecutiveSellDays: consecutiveDays,
    avgSellAmount: Math.round(avgSell),
    sellRatio: Math.round(sellRatio * 10) / 10,
    description,
  };
}
