/**
 * Main Application Orchestrator
 */

import { PortfolioScene } from './scene3d.js';
import { renderPortfolio } from './renderer.js';
import { ResumeSyncManager } from './syncManager.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D WebGL Canvas
  const scene = new PortfolioScene('canvas-container');

  // 2. Initialize Resume Sync Manager (loads saved or default data)
  const syncManager = new ResumeSyncManager((updatedData) => {
    // Re-render DOM
    renderPortfolio(updatedData);
    // Update 3D scene elements dynamically
    scene.updateSceneData(updatedData);
  });

  // 3. Initial DOM render
  renderPortfolio(syncManager.currentData);

  // 4. Setup Navigation & Button Smooth Scrolling
  setupNavigation(scene);

  // 5. Setup 3D Scene Controls Dock
  setupSceneControls(scene);

  // 6. Setup Audio Ambiance Synthesizer
  setupAudioEffects();

  // 7. Setup Interactive Terminal Typing Effect
  setupTerminalEffect();
});

function setupSceneControls(scene) {
  const btnKnot = document.getElementById('btn-shape-knot');
  const btnCrystal = document.getElementById('btn-shape-crystal');
  const btnTorus = document.getElementById('btn-shape-torus');
  const btnToggleOrbit = document.getElementById('btn-toggle-orbit');
  const orbitLabel = document.getElementById('orbit-mode-label');

  const shapeBtns = [btnKnot, btnCrystal, btnTorus];

  function setActiveShape(activeBtn, shapeType) {
    shapeBtns.forEach(btn => btn && btn.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
    scene.switchGeometry(shapeType);
  }

  if (btnKnot) btnKnot.addEventListener('click', () => setActiveShape(btnKnot, 'knot'));
  if (btnCrystal) btnCrystal.addEventListener('click', () => setActiveShape(btnCrystal, 'crystal'));
  if (btnTorus) btnTorus.addEventListener('click', () => setActiveShape(btnTorus, 'torus'));

  let orbitActive = true;
  if (btnToggleOrbit) {
    btnToggleOrbit.addEventListener('click', () => {
      orbitActive = !orbitActive;
      scene.toggleOrbit(orbitActive);
      btnToggleOrbit.classList.toggle('active', orbitActive);
      if (orbitLabel) {
        orbitLabel.textContent = orbitActive ? 'Orbit: On' : 'Orbit: Off';
      }
    });
  }
}

function setupNavigation(scene) {
  // Explicit listener for "Explore Projects" button
  const btnProjects = document.getElementById('hero-btn-projects');
  if (btnProjects) {
    btnProjects.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('projects');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        scene.setSectionWaypoint('projects');
      }
    });
  }

  // Explicit listener for "Contact Me" button
  const btnContact = document.getElementById('hero-btn-contact');
  if (btnContact) {
    btnContact.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('contact');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        scene.setSectionWaypoint('contact');
      }
    });
  }

  // Global anchor links smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
          const sectionName = targetId.replace('#', '');
          scene.setSectionWaypoint(sectionName);
        }
      }
    });
  });

  // Mobile navigation hamburger toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navLinksList = document.querySelector('.nav-links');
  if (mobileToggle && navLinksList) {
    mobileToggle.addEventListener('click', () => {
      navLinksList.classList.toggle('open');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinksList.classList.remove('open');
      });
    });
  }
}

function setupTerminalEffect() {
  const codeLines = [
    "Google ADK Multi-Agent Orchestrator initialized",
    "FAISS + BM25 hybrid retrieval pipeline operational",
    "Prompt Injection Guardrails: ACTIVE (Regex & Pydantic)",
    "Enterprise OData & SAP S/4HANA connectivity verified",
    "Evaluation Accuracy: 100% across 50+ procurement test suites"
  ];

  const terminalElem = document.getElementById('terminal-live-feed');
  if (!terminalElem) return;

  let currentLineIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function type() {
    const currentLine = codeLines[currentLineIdx];
    if (isDeleting) {
      terminalElem.textContent = currentLine.substring(0, charIdx - 1);
      charIdx--;
    } else {
      terminalElem.textContent = currentLine.substring(0, charIdx + 1);
      charIdx++;
    }

    let typeSpeed = isDeleting ? 20 : 50;

    if (!isDeleting && charIdx === currentLine.length) {
      typeSpeed = 2400;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      currentLineIdx = (currentLineIdx + 1) % codeLines.length;
      typeSpeed = 400;
    }

    setTimeout(type, typeSpeed);
  }

  type();
}

function setupAudioEffects() {
  let audioCtx = null;
  let isMuted = true;
  const soundBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-icon');

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
  }

  function playCyberChirp(freq = 600, duration = 0.08) {
    if (isMuted || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      initAudio();
      isMuted = !isMuted;
      soundBtn.classList.toggle('active', !isMuted);
      if (soundIcon) {
        soundIcon.innerHTML = isMuted 
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
      }
      if (!isMuted) {
        playCyberChirp(880, 0.12);
      }
    });
  }

  document.querySelectorAll('button, .project-card, .skill-chip').forEach(elem => {
    elem.addEventListener('mouseenter', () => playCyberChirp(520, 0.03));
    elem.addEventListener('click', () => playCyberChirp(780, 0.06));
  });
}
