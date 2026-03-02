import { BookOpen, ExternalLink, Globe2 } from 'lucide-react';

interface BenchmarkCase {
  market: '한국' | '미국' | '영국';
  title: string;
  period: string;
  shock: string;
  mechanism: string;
  takeaway: string;
  sources: { label: string; url: string }[];
}

const benchmarkCases: BenchmarkCase[] = [
  {
    market: '한국',
    title: '2024-08-05 KOSPI 급락 (블랙먼데이)',
    period: '2024-08-05',
    shock: 'KOSPI -8.77%, 장중 서킷브레이커/사이드카 발동',
    mechanism:
      '글로벌 리스크오프에서 외국인·기관 동반 순매도가 지수 하방 압력을 확대. 파생·프로그램 거래 제한 장치가 발동될 정도로 유동성 스트레스가 커짐.',
    takeaway:
      '연속 순매도 + 변동성 급등 + 파생시장 동조화가 겹치면 하락이 비선형적으로 커질 수 있음.',
    sources: [
      {
        label: 'Yonhap: U.S. recession fears send KOSPI dipping by record high of nearly 9 pct',
        url: 'https://en.yna.co.kr/view/AEN20240805006051320',
      },
      {
        label: 'Reuters (재게재): South Korean stocks slump most since late 2008 in tech rout',
        url: 'https://www.investing.com/news/economy-news/skorean-shares-trigger-trading-curb-for-first-time-since-2020-amid-tech-rout-3553824',
      },
    ],
  },
  {
    market: '한국',
    title: '2020-03-19 코로나 패닉 구간',
    period: '2020-03-19',
    shock: 'KOSPI 급락, 거래중단(서킷브레이커) 재발동',
    mechanism:
      '팬데믹 충격 속에서 대규모 매도 주문이 집중되며 호가 공백이 확대. 거래중단 장치가 연속적으로 사용될 수준의 급변동 발생.',
    takeaway:
      '거시충격 시기에는 기관/외국인 동조 매도가 시장 미시구조(호가·체결) 스트레스를 빠르게 증폭시킴.',
    sources: [
      {
        label: 'Yonhap: Stock trading halted as KOSPI plummets',
        url: 'https://en.yna.co.kr/view/AEN20200319006300320',
      },
      {
        label: 'Bloomberg: South Korea stocks resume plunge after circuit-breaker halt',
        url: 'https://www.bloomberg.com/news/articles/2020-03-19/circuit-breaker-triggered-for-korean-stocks-after-8-plunge',
      },
    ],
  },
  {
    market: '미국',
    title: '1987-10-19 블랙먼데이',
    period: '1987-10-19',
    shock: 'DJIA -22.6% (일일 최대 하락률)',
    mechanism:
      '포트폴리오 인슈어런스(동적 헤지)와 프로그램 매매가 하락 시 추가 매도를 유발하는 피드백 루프를 형성.',
    takeaway:
      '규칙 기반 대량 매도 전략이 같은 방향으로 작동하면, 펀더멘털 대비 과도한 가격 붕괴가 나타날 수 있음.',
    sources: [
      {
        label: 'Federal Reserve History: Stock Market Crash of 1987',
        url: 'https://www.federalreservehistory.org/essays/stock-market-crash-of-1987',
      },
      {
        label: 'Federal Reserve FEDS 2007-13: 1987 Crash and Fed response',
        url: 'https://www.federalreserve.gov/Pubs/feds/2007/200713/index.html',
      },
    ],
  },
  {
    market: '미국',
    title: '2010-05-06 플래시 크래시',
    period: '2010-05-06',
    shock: '수분 내 급락·급반등, 유동성 급격 위축',
    mechanism:
      '대형 펀드의 E-mini 대량 매도 알고리즘(가격·시간 제약 없음)이 고빈도 거래와 상호작용하며 유동성 공백을 심화.',
    takeaway:
      '체결 알고리즘의 설계(가격/시간 제약, 실행 속도)가 시장 안정성에 직접적인 영향을 줄 수 있음.',
    sources: [
      {
        label: 'SEC/CFTC Joint Report: Findings Regarding the Market Events of May 6, 2010',
        url: 'https://www.sec.gov/about/reports-publications/newsstudies2010marketevents-reportpdf',
      },
      {
        label: 'CFTC Staff Reports Portal (May 6 Market Events)',
        url: 'https://www.cftc.gov/MarketReports/StaffReportonMay6MarketEvents/staffreport050610marketevents.html',
      },
    ],
  },
  {
    market: '영국',
    title: '2022-09 영국 길트(국채) LDI 위기',
    period: '2022-09 ~ 2022-10',
    shock: 'LDI 펀드 디레버리징, 길트시장 기능 훼손',
    mechanism:
      '마진콜 대응을 위한 강제매도(파이어세일) 압력이 금리 급등·가격 급락을 재증폭, 중앙은행이 한시적 매입으로 시장기능 복원.',
    takeaway:
      '레버리지+담보콜 구조는 변동성 국면에서 ‘강제매도의 자기강화 루프’를 만들 수 있음.',
    sources: [
      {
        label: 'Bank of England FSR (Dec 2022): LDI forced deleveraging',
        url: 'https://www.bankofengland.co.uk/financial-stability-report/2022/december-2022',
      },
      {
        label: 'BIS Quarterly Review: Leverage and liquidity backstops',
        url: 'https://www.bis.org/publ/qtrpdf/r_qt2212v.htm',
      },
    ],
  },
];

function marketBadge(market: BenchmarkCase['market']): string {
  if (market === '한국') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  if (market === '미국') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
}

export default function Benchmarking() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <Globe2 className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-white font-bold">벤치마킹: 연속매도·급락 사례</h3>
            <p className="text-gray-400 text-xs">
              한국/미국/영국 사례를 기반으로 &quot;강제·동조 매도 루프&quot; 패턴을 비교
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-300">
          아래 사례들은 공통적으로 <span className="text-rose-300">대규모 매도 흐름 + 유동성 약화 + 파생/레버리지 메커니즘</span>이
          결합될 때 급락이 증폭될 수 있음을 보여줍니다.
        </p>
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

