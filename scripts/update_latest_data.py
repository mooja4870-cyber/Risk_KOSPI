#!/usr/bin/env python3
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup

DETAIL_TREND_URL = "https://finance.naver.com/sise/investorDealTrendDay.nhn"
HISTORICAL_START_DATE = "2020-01-01"
BOOTSTRAP_MAX_PAGES = 300
RECENT_REFRESH_PAGES = 20

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://finance.naver.com/sise/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


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


def format_kst_now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def normalize_detail_date(text: str) -> Optional[str]:
    # finance.naver.com date format: "26.02.27" -> "2026-02-27"
    m = re.match(r"^(\d{2})\.(\d{2})\.(\d{2})$", text.strip())
    if not m:
        return None
    yy, mm, dd = m.groups()
    yy_num = int(yy)
    year = 1900 + yy_num if yy_num >= 90 else 2000 + yy_num
    return f"{year:04d}-{mm}-{dd}"


def parse_detail_rows(html: str) -> List[Dict[str, int]]:
    soup = BeautifulSoup(html, "html.parser")
    parsed: List[Dict[str, int]] = []

    for tr in soup.select("table.type_1 tr"):
        cols = [td.get_text(strip=True) for td in tr.select("td")]
        if len(cols) < 11 or "." not in cols[0]:
            continue

        date = normalize_detail_date(cols[0])
        if not date:
            continue

        parsed.append(
            {
                "date": date,
                "individual": parse_number(cols[1]),
                "foreign": parse_number(cols[2]),
                "institution": parse_number(cols[3]),
                "financialInvestment": parse_number(cols[4]),
                "insurance": parse_number(cols[5]),
                "investmentTrust": parse_number(cols[6]),
                "bank": parse_number(cols[7]),
                "otherFinancial": parse_number(cols[8]),
                "pension": parse_number(cols[9]),
                "otherCorporation": parse_number(cols[10]),
            }
        )

    return parsed


def fetch_detail_trend_map(max_pages: int, min_date: str) -> Dict[str, Dict[str, int]]:
    detail_map: Dict[str, Dict[str, int]] = {}

    for page in range(1, max_pages + 1):
        params = {"bizdate": "215600", "sosok": "", "page": page}
        response = requests.get(DETAIL_TREND_URL, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()

        rows = parse_detail_rows(response.text)
        if not rows:
            break

        for row in rows:
            date = row["date"]
            if date < min_date:
                continue
            detail_map[date] = row

        oldest_on_page = rows[-1]["date"]
        if oldest_on_page < min_date:
            break

    return detail_map


def load_existing_data(path: Path) -> Tuple[Dict[str, Dict[str, int]], Optional[str]]:
    if not path.exists():
        return {}, None

    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("data", [])
    if not isinstance(rows, list):
        return {}, None

    row_map: Dict[str, Dict[str, int]] = {}
    for row in rows:
        date = row.get("date")
        if not isinstance(date, str):
            continue
        row_map[date] = {
            "date": date,
            "individual": int(row.get("individual", 0)),
            "foreign": int(row.get("foreign", 0)),
            "institution": int(row.get("institution", 0)),
            "financialInvestment": int(row.get("financialInvestment", 0)),
            "insurance": int(row.get("insurance", 0)),
            "investmentTrust": int(row.get("investmentTrust", 0)),
            "bank": int(row.get("bank", 0)),
            "otherFinancial": int(row.get("otherFinancial", 0)),
            "pension": int(row.get("pension", 0)),
            "otherCorporation": int(row.get("otherCorporation", 0)),
        }

    if not row_map:
        return {}, None

    earliest = min(row_map.keys())
    return row_map, earliest


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    out_path = project_root / "public" / "latest-trading-data.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    existing_map, earliest_existing = load_existing_data(out_path)

    needs_backfill = True
    if earliest_existing:
        earliest_dt = datetime.strptime(earliest_existing, "%Y-%m-%d").date()
        target_dt = datetime.strptime(HISTORICAL_START_DATE, "%Y-%m-%d").date()
        # If earliest row is within one week from the target start, treat it as covered.
        needs_backfill = (earliest_dt - target_dt).days > 7
    max_pages = BOOTSTRAP_MAX_PAGES if needs_backfill else RECENT_REFRESH_PAGES

    fetched_map = fetch_detail_trend_map(max_pages=max_pages, min_date=HISTORICAL_START_DATE)
    merged_map = {
        date: row
        for date, row in {**existing_map, **fetched_map}.items()
        if date >= HISTORICAL_START_DATE
    }

    if not merged_map:
        raise RuntimeError("No investor detail data returned")

    rows = [merged_map[date] for date in sorted(merged_map.keys())]
    earliest_date = rows[0]["date"]
    latest_date = rows[-1]["date"]

    payload = {
        "meta": {
            "source": "Naver Finance investor detail (historical + 24-hour refresh)",
            "updatedAtKst": format_kst_now(),
            "earliestTradingDate": earliest_date,
            "latestTradingDate": latest_date,
            "refreshIntervalHours": 24,
            "historicalStartDate": HISTORICAL_START_DATE,
        },
        "data": rows,
    }

    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Updated {out_path}")
    print(
        f"Rows: {len(rows)}, range: {earliest_date} ~ {latest_date}, "
        f"mode: {'bootstrap' if needs_backfill else 'incremental'}"
    )


if __name__ == "__main__":
    main()
