import json
from pathlib import Path

import requests
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="Risk_KOSPI", layout="wide")

from datetime import datetime, timedelta
import concurrent.futures

def get_current_window():
    """Returns a string key that changes at 06, 12, 18, 00 KST."""
    now = datetime.utcnow() + timedelta(hours=9) # KST
    # Define windows: 00-06, 06-12, 12-18, 18-00
    window_hour = (now.hour // 6) * 6
    return f"{now.strftime('%Y-%m-%d')}_{window_hour:02d}"

@st.cache_data(ttl=900) # Fallback TTL 15 mins, but window key ensures 6-hour refresh
def fetch_naver_data(window_key):
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        
        # 1. Fetch Price Data
        price_url = "https://m.stock.naver.com/api/index/KOSPI/price?page=1&pageSize=120"
        price_res = requests.get(price_url, headers=headers, timeout=10)
        if price_res.status_code != 200:
            return None
        prices = price_res.json()
        
        # 2. Extract Business Dates (up to 100 days for better 6M view)
        biz_dates = [p["localTradedAt"].replace("-", "") for p in prices[:100]]
        
        # 3. Parallel Fetching for Trend Data
        trend_data = {}
        def fetch_trend(bdate):
            t_url = f"https://m.stock.naver.com/api/index/KOSPI/trend?bizdate={bdate}"
            try:
                res = requests.get(t_url, headers=headers, timeout=5)
                return bdate, res.json() if res.status_code == 200 else None
            except:
                return bdate, None

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_date = {executor.submit(fetch_trend, d): d for d in biz_dates}
            for future in concurrent.futures.as_completed(future_to_date):
                bdate, result = future.result()
                if result:
                    trend_data[bdate] = result
                
        return {
            "prices": prices,
            "trends": trend_data,
            "source": f"Naver API Pipeline ({window_key})",
            "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        print(f"Pipeline Error: {e}")
        return None

# Hide Streamlit UI elements for a cleaner embedded look
st.markdown("""
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header[data-testid="stHeader"] {visibility: hidden; display: none;}
    .block-container {
        padding-top: 0rem;
        padding-bottom: 0rem;
        padding-left: 0rem;
        padding-right: 0rem;
    }
    .stApp {
        background-color: #030712; /* Match the dashboard's gray-950 background */
    }
    /* Remove any top margin that might cut off the React header */
    iframe {
        border: none;
    }
    </style>
""", unsafe_allow_html=True)

project_root = Path(__file__).parent
dist_html = project_root / "dist" / "index.html"
static_html = project_root / "streamlit_static" / "index.html"

if dist_html.exists():
    static_html.parent.mkdir(parents=True, exist_ok=True)
    static_is_stale = (not static_html.exists()) or (dist_html.stat().st_mtime > static_html.stat().st_mtime)
    if static_is_stale:
        static_html.write_text(dist_html.read_text(encoding="utf-8"), encoding="utf-8")

if static_html.exists():
    html_file = static_html
elif dist_html.exists():
    html_file = dist_html
else:
    st.error("Missing frontend bundle. Run `npm run build:streamlit` first.")
    st.stop()

html = html_file.read_text(encoding="utf-8")

# Fetch data via pipeline and inject
window_key = get_current_window()
data = fetch_naver_data(window_key)
if data:
    injection_script = f"<script>window.BACKEND_DATA = {json.dumps(data)};</script>"
    html = html.replace("<head>", f"<head>{injection_script}")

components.html(html, height=2200, scrolling=True)
