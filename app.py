import streamlit as st
import streamlit.components.v1 as components
from pathlib import Path

st.set_page_config(
    page_title="Sukrit's Portfolio — Generative AI & Software Engineer",
    page_icon="✨",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Eliminate Streamlit padding, header, footer for true full-bleed 3D viewport
st.markdown(
    """
    <style>
    #MainMenu {visibility: hidden !important; display: none !important;}
    header {visibility: hidden !important; display: none !important;}
    footer {visibility: hidden !important; display: none !important;}
    div[data-testid="stDecoration"] {display: none !important;}
    div[data-testid="stStatusWidget"] {display: none !important;}
    div[data-testid="stToolbar"] {visibility: hidden !important; display: none !important;}
    section[data-testid="stSidebar"] {display: none !important;}
    .block-container {
        padding: 0rem !important;
        margin: 0rem !important;
        max-width: 100vw !important;
        height: 100vh !important;
        overflow: hidden !important;
    }
    .main {
        padding: 0rem !important;
        margin: 0rem !important;
    }
    iframe {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: 999999 !important;
    }
    </style>
    """,
    unsafe_allow_html=True
)

# Load the self-contained portfolio HTML
bundle_path = Path(__file__).parent / "static" / "bundle.html"
if not bundle_path.exists():
    import bundle
    bundle.create_bundle()

html_content = bundle_path.read_text(encoding="utf-8")

# Render directly with Streamlit's official HTML component
components.html(html_content, height=1000, scrolling=True)
