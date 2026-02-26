from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="Risk_KOSPI", layout="wide")

st.title("Risk_KOSPI")
st.caption("KOSPI Financial Investment Flow Risk Dashboard")

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
components.html(html, height=2200, scrolling=True)
