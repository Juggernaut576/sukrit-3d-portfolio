/**
 * DOM Renderer
 * Populates and updates all HTML portfolio sections reactively from resume data.
 */

export function renderPortfolio(data) {
  renderHero(data.personal);
  renderExperience(data.experience);
  renderProjects(data.projects);
  renderSkills(data.skills);
  renderEducation(data.education);
  renderCertifications(data.certifications);
  renderContact(data.personal);
  setup3DCardTilt();
}

function renderHero(personal) {
  const nameElem = document.getElementById('hero-name');
  const titleElem = document.getElementById('hero-title');
  const summaryElem = document.getElementById('hero-summary');

  if (nameElem) nameElem.textContent = "Sukrit's Portfolio";
  if (titleElem) titleElem.textContent = personal.title || 'Generative AI & Software Engineer';
  if (summaryElem) summaryElem.textContent = personal.summary || '';
}

function renderExperience(experienceList) {
  const container = document.getElementById('experience-timeline');
  if (!container) return;

  if (!experienceList || experienceList.length === 0) {
    container.innerHTML = `<div class="empty-state">No experience records detected.</div>`;
    return;
  }

  container.innerHTML = experienceList.map((exp) => `
    <div class="timeline-card glassmorphism">
      <div class="timeline-header">
        <div class="company-badge-wrap">
          <div class="timeline-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 21v-4h6v4"/></svg>
          </div>
          <div>
            <h3 class="timeline-company">${escapeHtml(exp.company)}</h3>
            <div class="timeline-role">${escapeHtml(exp.role || 'Software Engineer')}</div>
          </div>
        </div>
        <div class="timeline-period-badge">
          <span class="period-dot"></span>
          ${escapeHtml(exp.period || 'Present')}
        </div>
      </div>

      <div class="sub-roles-container">
        ${(exp.subRoles && exp.subRoles.length > 0) ? exp.subRoles.map(sub => `
          <div class="sub-role-item">
            <div class="sub-role-title-row">
              <h4 class="sub-role-title">${escapeHtml(sub.title)}</h4>
              ${sub.period ? `<span class="sub-role-period">${escapeHtml(sub.period)}</span>` : ''}
            </div>
            <ul class="sub-role-bullets">
              ${sub.highlights.map(hl => `
                <li>
                  <span class="bullet-arrow">›</span>
                  <span>${escapeHtml(hl)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('') : `
          <div class="sub-role-item">
            <p class="timeline-desc">${escapeHtml(exp.description || '')}</p>
          </div>
        `}
      </div>
    </div>
  `).join('');
}

function renderProjects(projectsList) {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  // Defensively filter out empty, phantom, or link-only cards
  const validProjects = (projectsList || []).filter(proj => {
    if (!proj || typeof proj !== 'object') return false;
    const cleanTitle = (proj.title || '').trim();
    if (!cleanTitle || cleanTitle.length < 4 || /^(link|– link|- link)$/i.test(cleanTitle)) return false;
    if (!proj.description || proj.description.trim().length < 10) return false;
    return true;
  });

  if (validProjects.length === 0) {
    container.innerHTML = `<div class="empty-state">No projects detected.</div>`;
    return;
  }

  container.innerHTML = validProjects.map((proj, idx) => {
    const cleanDesc = (proj.description || '').replace(/(\s*[-–—]\s*Link\b|\s*Link\b)$/i, '').trim();
    const cleanTech = (proj.tech || []).filter(t => t && t.trim().length > 1 && !/^(link|– link|- link)$/i.test(t.trim()));
    const badge = (proj.badge && !/^(link|– link)$/i.test(proj.badge)) ? proj.badge : (cleanTech[0] || 'AI Innovation');

    return `
      <div class="project-card glassmorphism tilt-target" id="${proj.id || 'proj-' + idx}">
        <div class="card-glare"></div>
        <div class="project-header">
          <span class="project-badge">${escapeHtml(badge)}</span>
          <a href="${proj.link || '#'}" target="_blank" rel="noopener noreferrer" class="project-link-btn" title="View Project Link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
          </a>
        </div>
        
        <h3 class="project-title">${escapeHtml(proj.title)}</h3>
        <p class="project-desc">${escapeHtml(cleanDesc)}</p>

        <div class="project-tech-tags">
          ${cleanTech.map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderSkills(skillsObj) {
  const container = document.getElementById('skills-matrix');
  if (!container) return;

  const categories = Object.keys(skillsObj || {});
  if (categories.length === 0) {
    container.innerHTML = `<div class="empty-state">No skills detected.</div>`;
    return;
  }

  const categoryIcons = {
    'GenAI': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    'AI Models': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/></svg>',
    'Backend': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
    'Cloud': '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>'
  };

  container.innerHTML = categories.map(cat => {
    const iconKey = Object.keys(categoryIcons).find(k => cat.toLowerCase().includes(k.toLowerCase())) || 'Backend';
    const iconSvg = categoryIcons[iconKey] || categoryIcons['Backend'];
    const skillsList = skillsObj[cat] || [];

    return `
      <div class="skill-category-card glassmorphism">
        <div class="skill-cat-header">
          <div class="skill-icon-bubble">${iconSvg}</div>
          <h3 class="skill-cat-title">${escapeHtml(cat)}</h3>
        </div>
        <div class="skills-pill-group">
          ${skillsList.map(s => `
            <span class="skill-chip">
              <span class="chip-spark">✦</span>
              ${escapeHtml(s)}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderEducation(educationList) {
  const container = document.getElementById('education-cards');
  if (!container) return;

  if (!educationList || educationList.length === 0) {
    container.innerHTML = `<div class="empty-state">No education records detected.</div>`;
    return;
  }

  container.innerHTML = educationList.map(edu => `
    <div class="education-card glassmorphism">
      <div class="edu-top">
        <div class="edu-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5"/></svg>
        </div>
        <div class="edu-period">${escapeHtml(edu.period || '')}</div>
      </div>
      <h3 class="edu-institution">${escapeHtml(edu.institution)}</h3>
      <div class="edu-degree">${escapeHtml(edu.degree || '')}</div>
      ${edu.grade ? `<div class="edu-grade">${escapeHtml(edu.grade)}</div>` : ''}
    </div>
  `).join('');
}

function renderCertifications(certsList) {
  const container = document.getElementById('certifications-grid');
  if (!container) return;

  if (!certsList || certsList.length === 0) {
    container.innerHTML = `<div class="empty-state">No certifications detected.</div>`;
    return;
  }

  container.innerHTML = certsList.map(cert => {
    const hasValidLink = cert.link && cert.link !== '#' && cert.link.startsWith('http');

    return `
      <div class="cert-card glassmorphism ${hasValidLink ? 'clickable-cert' : ''}">
        <div class="cert-header">
          <span class="cert-badge-tag">${escapeHtml(cert.badge || 'Verified')}</span>
          ${hasValidLink ? `
            <a href="${escapeHtml(cert.link)}" target="_blank" rel="noopener noreferrer" class="cert-link-btn" title="Open Verified Certificate in new tab">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
            </a>
          ` : ''}
        </div>
        <h4 class="cert-name">${escapeHtml(cert.name)}</h4>
        ${cert.detail ? `<p class="cert-detail">${escapeHtml(cert.detail)}</p>` : ''}
        ${hasValidLink ? `
          <a href="${escapeHtml(cert.link)}" target="_blank" rel="noopener noreferrer" class="cert-action-link">
            <span>Verify Credential</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17l9.2-9.2M17 17V8H8"/></svg>
          </a>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderContact(personal) {
  const emailBox = document.getElementById('contact-email');
  const phoneBox = document.getElementById('contact-phone');
  const locationBox = document.getElementById('contact-location');
  const linkedinBox = document.getElementById('contact-linkedin');

  if (emailBox && personal.email) emailBox.textContent = personal.email;
  if (phoneBox && personal.phone) phoneBox.textContent = personal.phone;
  if (locationBox && personal.location) locationBox.textContent = personal.location;
  if (linkedinBox && personal.linkedin) {
    linkedinBox.href = personal.linkedin;
    linkedinBox.textContent = personal.linkedin.replace(/^https?:\/\//, '');
  }
}

function setup3DCardTilt() {
  const cards = document.querySelectorAll('.tilt-target');
  cards.forEach(card => {
    const glare = card.querySelector('.card-glare');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      if (glare) {
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.75), transparent 55%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
