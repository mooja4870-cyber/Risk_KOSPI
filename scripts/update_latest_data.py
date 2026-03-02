#!/usr/bin/env python3
import concurrent.futures
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

PAGE_SIZE = 60
PAGE_COUNT = 4
TREND_BATCH_MAX_WORKERS = 10

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://m.stock.naver.com/",
    "Accept": "application/json, text/plain, */*",
}


def fetch_json(url: str) -> Any:
    response = requests.get(url, headers=HEADERS, timeout=10)
    response.raise_for_status()
    return response.json()


def parse_number(value: Optional[str]) -> int:
    if value is None:
        return 0
    normalized = str(value).replace(",", "").replace("+", "").strip()
    if normalized == "":
        return 0
    try:
        return int(float(normalized))
    except ValueError:
        return 0


def to_bizdate(date_str: str) -> str:
    return date_str.replace("-", "")


def format_kst_now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def fetch_prices() -> List[Dict[str, Any]]:
    seen = {}
    for page in range(1, PAGE_COUNT + 1):
        url = f"https://m.stock.naver.com/api/index/KOSPI/price?page={page}&pageSize={PAGE_SIZE}"
        data = fetch_json(url)
        if not isinstance(data, list):
            continue

        for row in data:
            local_date = row.get("localTradedAt")
            if local_date:
                seen[local_date] = row

    return [seen[key] for key in sorted(seen.keys())]


def fetch_trend(bizdate: str) -> Optional[Dict[str, Any]]:
    try:
        url = f"https://m.stock.naver.com/api/index/KOSPI/trend?bizdate={bizdate}"
        trend = fetch_json(url)
        if isinstance(trend, dict):
            return trend
    except Exception:
        return None
    return None


def fetch_trend_map(bizdates: List[str]) -> Dict[str, Dict[str, Any]]:
    trend_map: Dict[str, Dict[str, Any]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=TREND_BATCH_MAX_WORKERS) as executor:
        futures = {executor.submit(fetch_trend, bizdate): bizdate for bizdate in bizdates}
        for future in concurrent.futures.as_completed(futures):
            bizdate = futures[future]
            result = future.result()
            if result:
                trend_map[bizdate] = result
    return trend_map


def build_rows(prices: List[Dict[str, Any]], trend_map: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []

    for price in prices:
        date = price.get("localTradedAt")
        if not date:
            continue

        bizdate = to_bizdate(date)
        trend = trend_map.get(bizdate, {})

        individual = parse_number(trend.get("personalValue"))
        foreign = parse_number(trend.get("foreignValue"))
        institution = parse_number(trend.get("institutionalValue"))

        rows.append(
            {
                "date": date,
                "individual": individual,
                "foreign": foreign,
                "institution": institution,
                "financialInvestment": institution,
                "insurance": 0,
                "investmentTrust": 0,
                "bank": 0,
                "otherFinancial": 0,
                "pension": 0,
                "otherCorporation": -(individual + foreign + institution),
            }
        )

    rows.sort(key=lambda x: x["date"])
    return rows


def main() -> None:
    prices = fetch_prices()
    if not prices:
        raise RuntimeError("No KOSPI price data returned")

    bizdates = sorted({to_bizdate(price["localTradedAt"]) for price in prices}, reverse=True)
    trend_map = fetch_trend_map(bizdates)
    rows = build_rows(prices, trend_map)

    latest_date = rows[-1]["date"] if rows else prices[-1]["localTradedAt"]
    payload = {
        "meta": {
            "source": "Naver Mobile API (6-hour pipeline)",
            "updatedAtKst": format_kst_now(),
            "latestTradingDate": latest_date,
            "refreshIntervalHours": 6,
        },
        "data": rows,
    }

    project_root = Path(__file__).resolve().parent.parent
    out_path = project_root / "public" / "latest-trading-data.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Updated {out_path}")
    print(f"Rows: {len(rows)}, latest trading date: {latest_date}")


if __name__ == "__main__":
    main()
