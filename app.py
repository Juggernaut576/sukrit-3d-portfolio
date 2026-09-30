import streamlit as st
import os

st.set_page_config(
    page_title="Sukrit's Portfolio — Generative AI & Software Engineer",
    page_icon="✨",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide Streamlit default UI chrome for seamless full-viewport 3D spatial experience
st.markdown(
    """
    <style>
    #MainMenu {visibility: hidden; display: none !important;}
    header {visibility: hidden; display: none !important;}
    footer {visibility: hidden; display: none !important;}
    div[data-testid="stDecoration"] {display: none !important;}
    div[data-testid="stStatusWidget"] {display: none !important;}
    div[data-testid="stToolbar"] {visibility: hidden; display: none !important;}
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
    iframe.portfolio-frame {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: 99999 !important;
    }
    </style>
    """,
    unsafe_allow_html=True
)

# Serve the compiled 3D interactive portfolio from Streamlit's static directory
st.markdown(
    '<iframe class="portfolio-frame" src="/app/static/index.html" allow="fullscreen; autoplay; clipboard-write"></iframe>',
    unsafe_allow_html=True
)
