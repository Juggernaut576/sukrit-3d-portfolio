# 🌐 3D Interactive Portfolio — Sukrit Debnath
> **Generative AI & Software Engineer** • Multi-Agent Architecture • Google ADK • Gemini Enterprise • RAG • AWS Solutions Architect

An ultra-modern, high-performance **Three.js 3D Portfolio** featuring a dynamic multi-agent neural constellation, holographic HUD interfaces, cinematic 60 FPS camera waypoints, and an **Automated In-Browser Resume Ingestion Engine** that updates all sections and 3D visual topology in real-time when a new resume is uploaded.

---

## ✨ Key Features

### 1. 🌌 Interactive Three.js 3D Visual World
- **Neural Agent Constellation**: Orbiting 3D nodes representing specialized agents (Google ADK, Gemini Enterprise, Llama 3.2, FAISS + BM25, SAP Joule AI) interconnected with pulsating data synapses.
- **Cinematic GSAP Camera Waypoints**: Smooth camera fly-through transitions that glide to custom 3D perspectives when navigating between *Hero*, *Experience*, *Projects*, *Skills*, *Education*, *Certifications*, and *Contact*.
- **Mouse Parallax & Raycasting**: Interactive 3D hover detection with a floating holographic HUD tooltip displaying node telemetry.
- **3D Card Tilt Effects**: Interactive perspective tilt and dynamic lighting highlights on project cards.
- **Atmospheric Depth**: Procedural particle starfield (1,400+ stars), animated cyber grid matrix, and ACES Filmic tone mapping.

### 2. ⚡ Automated Resume Sync & Ingestion Engine
- **Direct PDF & JSON Ingestion**: Drag & drop or select any updated resume (`.pdf` or `.json`).
- **Client-Side PDF Parsing (PDF.js)**: Runs zero-server client-side text layer and vector extraction directly in the browser.
- **Intelligent Heuristic Parser**: Automatically identifies:
  - Header & Contact (Name, Email, Phone, Location, LinkedIn, GitHub)
  - Profile Summary & Bio
  - Technical Skills (Categorized by domain with glowing skill chips)
  - Work Experience (Company, roles, dates, and bullet highlights)
  - Featured Projects (Titles, technology tags, descriptions, badges)
  - Education & Certifications
- **Real-Time 3D Topology Updates**: When a new resume is parsed, an energetic 3D particle shockwave is triggered, and new project and skill nodes are dynamically woven into the 3D constellation.
- **Persistent State & Controls**:
  - Automatically saved to `localStorage` so changes persist across browser sessions.
  - **Schema Inspector / Live Editor**: View and fine-tune parsed JSON directly.
  - **Export Schema**: Download the current portfolio structure as a formatted `.json` file.
  - **Reset to Default**: Restore Sukrit's original resume at any time with one click.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)

### Installation & Local Run
```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Open in your browser
# http://localhost:5173/
```

### Production Build
```bash
npm run build
```

### 🎈 Streamlit Deployment (Streamlit Cloud & Local)
This portfolio is fully configured for one-click deployment on **Streamlit Community Cloud** (`share.streamlit.io`):
```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Launch Streamlit server
streamlit run app.py
```
**Deploying on Streamlit Cloud:**
1. Connect your GitHub repository: `https://github.com/Juggernaut576/sukrit-3d-portfolio`.
2. Select `app.py` (or `streamlit_app.py`) as the entrypoint.
3. Click **Deploy**! Streamlit will automatically read `.streamlit/config.toml` and host the full-screen 3D interactive portfolio.

---

## 📂 Project Architecture

```
Portfolio/
├── index.html              # Main semantic HTML5 shell & glassmorphism layout
├── package.json            # Vite configuration & dev scripts
├── css/
│   └── style.css           # Obsidian dark mode, cyber neons, glassmorphism, animations
├── js/
│   ├── main.js             # Application bootstrap & event listeners
│   ├── scene3d.js          # Three.js 3D engine, constellation, lighting, camera waypoints
│   ├── renderer.js         # Reactive DOM renderer & 3D card tilt physics
│   ├── syncManager.js      # Resume uploader, modal management, persistence & export
│   ├── pdfParser.js        # PDF.js integration and intelligent resume parsing heuristics
│   └── defaultResume.js    # Pre-seeded high-fidelity resume data for Sukrit Debnath
└── dist/                   # Production-ready build bundle
```

---

## 🛠️ Technologies
- **3D Engine**: [Three.js](https://threejs.org/) (r128)
- **Animations**: [GSAP](https://greensock.com/gsap/) (GreenSock 3.12.5)
- **PDF Extraction**: [PDF.js](https://mozilla.github.io/pdf.js/) (v3.11.174)
- **Styling**: Vanilla CSS3 (Custom properties, Glassmorphism, 3D CSS transforms)
- **Typography**: Google Fonts (*Inter* & *JetBrains Mono*)
- **Tooling**: Vite 5
