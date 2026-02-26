from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="Risk_KOSPI", layout="wide")

st.title("Risk_KOSPI")
st.caption("KOSPI Financial Investment Flow Risk Dashboard")

html_file = Path(__file__).parent / "streamlit_static" / "index.html"

if not html_file.exists():
    st.error("Missing streamlit_static/index.html. Build and copy frontend bundle first.")
    st.stop()

html = html_file.read_text(encoding="utf-8")
components.html(html, height=2200, scrolling=True)
