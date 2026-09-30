/**
 * Sync Manager
 * Manages automated resume ingestion, PDF.js parsing, state persistence,
 * and live portfolio synchronization.
 */

import { parsePdfResume, parseResumeText } from './pdfParser.js';
import { defaultResume } from './defaultResume.js';

const STORAGE_KEY = 'sukrit_portfolio_resume_data_v1';

export class ResumeSyncManager {
  constructor(onUpdateCallback) {
    this.onUpdateCallback = onUpdateCallback;
    this.currentData = this.loadData();
    this.initUI();
  }

  loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(defaultResume));
  }

  saveData(newData) {
    this.currentData = newData;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.currentData);
    }
  }

  resetToDefault() {
    this.currentData = JSON.parse(JSON.stringify(defaultResume));
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.currentData);
    }
    this.showToast('Portfolio restored to initial Sukrit Debnath resume!');
  }

  initUI() {
    const uploadBtn = document.getElementById('btn-open-sync-modal');
    const modal = document.getElementById('sync-modal');
    const closeBtn = document.getElementById('btn-close-modal');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('resume-file-input');
    const resetBtn = document.getElementById('btn-reset-resume');
    const exportBtn = document.getElementById('btn-export-json');
    const jsonEditor = document.getElementById('raw-json-editor');
    const saveJsonBtn = document.getElementById('btn-save-json');
    const tabUpload = document.getElementById('tab-upload');
    const tabJson = document.getElementById('tab-json');
    const viewUpload = document.getElementById('view-upload');
    const viewJson = document.getElementById('view-json');

    // Open Modal
    if (uploadBtn && modal) {
      uploadBtn.addEventListener('click', () => {
        modal.classList.add('active');
        if (jsonEditor) {
          jsonEditor.value = JSON.stringify(this.currentData, null, 2);
        }
      });
    }

    // Close Modal
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    // Modal background click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    // Switch Tabs
    if (tabUpload && tabJson) {
      tabUpload.addEventListener('click', () => {
        tabUpload.classList.add('active');
        tabJson.classList.remove('active');
        viewUpload.style.display = 'block';
        viewJson.style.display = 'none';
      });

      tabJson.addEventListener('click', () => {
        tabJson.classList.add('active');
        tabUpload.classList.remove('active');
        viewUpload.style.display = 'none';
        viewJson.style.display = 'block';
        if (jsonEditor) {
          jsonEditor.value = JSON.stringify(this.currentData, null, 2);
        }
      });
    }

    // Save JSON Edit
    if (saveJsonBtn && jsonEditor) {
      saveJsonBtn.addEventListener('click', () => {
        try {
          const parsed = JSON.parse(jsonEditor.value);
          this.saveData(parsed);
          this.showToast('Portfolio successfully updated from JSON!');
          modal.classList.remove('active');
        } catch (err) {
          alert('Invalid JSON formatting: ' + err.message);
        }
      });
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset portfolio to the original Sukrit Debnath resume data?')) {
          this.resetToDefault();
          if (jsonEditor) {
            jsonEditor.value = JSON.stringify(this.currentData, null, 2);
          }
          if (modal) modal.classList.remove('active');
        }
      });
    }

    // Export button
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.currentData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `sukrit_resume_data_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        this.showToast('Downloaded current resume data schema!');
      });
    }

    // Drag and Drop & File Upload
    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());

      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('drag-active');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('drag-active');
        });
      });

      dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
          this.handleIncomingFile(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleIncomingFile(e.target.files[0]);
        }
      });
    }
  }

  async handleIncomingFile(file) {
    const statusBox = document.getElementById('sync-status-box');
    const statusText = document.getElementById('sync-status-text');
    const modal = document.getElementById('sync-modal');

    const updateStatus = (msg) => {
      if (statusBox) statusBox.style.display = 'flex';
      if (statusText) statusText.textContent = msg;
    };

    try {
      updateStatus(`Reading ${file.name}...`);

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        updateStatus('Scanning PDF vectors & extracting text layers...');
        const arrayBuffer = await file.arrayBuffer();

        updateStatus('Running neural heuristic parser (Skills, Projects, Experience)...');
        const parsedData = await parsePdfResume(arrayBuffer);

        updateStatus('Synchronizing 3D Constellation & Glassmorphic HUD...');
        await new Promise(r => setTimeout(r, 600));

        this.saveData(parsedData);
        this.showToast(`Successfully extracted & updated portfolio from ${file.name}!`);

        if (statusBox) statusBox.style.display = 'none';
        if (modal) modal.classList.remove('active');
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        updateStatus('Parsing JSON resume schema...');
        const text = await file.text();
        const json = JSON.parse(text);

        this.saveData(json);
        this.showToast(`Portfolio synced from ${file.name}!`);

        if (statusBox) statusBox.style.display = 'none';
        if (modal) modal.classList.remove('active');
      } else {
        alert('Please upload a PDF (.pdf) or JSON (.json) resume document.');
        if (statusBox) statusBox.style.display = 'none';
      }
    } catch (err) {
      console.error('Error parsing uploaded resume:', err);
      alert('Error parsing uploaded resume: ' + err.message);
      if (statusBox) statusBox.style.display = 'none';
    }
  }

  showToast(message) {
    let toast = document.getElementById('portfolio-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'portfolio-toast';
      toast.className = 'portfolio-toast glassmorphism';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 4000);
  }
}
