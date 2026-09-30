/**
 * Client-Side Resume Parser
 * Parses PDF documents (using PDF.js) and structured JSON files into the portfolio schema.
 */

export async function parsePdfResume(arrayBuffer) {
  if (typeof window.pdfjsLib === 'undefined') {
    throw new Error('PDF.js library is not loaded. Please check internet connectivity.');
  }

  // Set worker source if not set
  if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  const lines = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by roughly their Y coordinate to reconstruct true lines
    const lineMap = new Map();
    textContent.items.forEach(item => {
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y).push(item);
    });

    // Sort lines descending by Y (top to bottom)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    for (const y of sortedY) {
      const lineItems = lineMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
      const lineStr = lineItems.map(i => i.str).join(' ').trim();
      if (lineStr) {
        lines.push(lineStr);
        fullText += lineStr + '\n';
      }
    }
    fullText += '\n---PAGE_BREAK---\n';
  }

  return parseResumeText(lines, fullText);
}

/**
 * Intelligent section parsing from lines of text
 */
export function parseResumeText(lines, fullText) {
  const result = {
    personal: {
      name: '',
      title: 'AI & Software Engineer',
      location: '',
      phone: '',
      email: '',
      linkedin: '',
      github: '',
      summary: ''
    },
    skills: {},
    experience: [],
    projects: [],
    education: [],
    certifications: []
  };

  // Section markers regex
  const sectionKeywords = {
    summary: /^(PROFILE\s+SUMMARY|PROFESSIONAL\s+SUMMARY|SUMMARY|ABOUT\s+ME|OBJECTIVE)/i,
    skills: /^(TECHNICAL\s+SKILLS|SKILLS|CORE\s+COMPETENCIES|TECHNOLOGIES)/i,
    experience: /^(WORK\s+EXPERIENCE|EXPERIENCE|EMPLOYMENT\s+HISTORY|PROFESSIONAL\s+EXPERIENCE)/i,
    projects: /^(PROJECTS|PERSONAL\s+PROJECTS|ACADEMIC\s+PROJECTS|KEY\s+PROJECTS)/i,
    education: /^(EDUCATION|ACADEMIC\s+BACKGROUND|QUALIFICATIONS)/i,
    certifications: /^(CERTIFICATIONS(\s+(&|AND)\s+ACHIEVEMENTS)?|ACHIEVEMENTS|HONORS|LICENSES)/i
  };

  let currentSection = 'header';
  const sectionBlocks = {
    header: [],
    summary: [],
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: []
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    let matchedSection = null;
    for (const [secKey, regex] of Object.entries(sectionKeywords)) {
      if (regex.test(trimmed) && trimmed.length < 50) {
        matchedSection = secKey;
        break;
      }
    }

    if (matchedSection) {
      currentSection = matchedSection;
      continue;
    }

    sectionBlocks[currentSection].push(trimmed);
  }

  // 1. Process Header
  const headerLines = sectionBlocks.header;
  if (headerLines.length > 0) {
    result.personal.name = headerLines[0].replace(/[^a-zA-Z\s]/g, '').trim();
    if (headerLines.length > 1 && !headerLines[1].includes('@') && !headerLines[1].includes('+')) {
      result.personal.title = headerLines[1];
    }
  }

  // Find email, phone, location from full text or header
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.personal.email = emailMatch[0];

  const phoneMatch = fullText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
  if (phoneMatch) result.personal.phone = phoneMatch[0].trim();

  if (/India|United States|USA|Canada|UK|Remote/i.test(fullText)) {
    const locMatch = fullText.match(/(India|United States|USA|Canada|UK|Germany|Remote)/i);
    if (locMatch) result.personal.location = locMatch[0];
  }

  const linkedinMatch = fullText.match(/(https?:\/\/[^\s]+linkedin\.com\/[^\s]+|linkedin(?:\.com)?\/[^\s]+)/i);
  if (linkedinMatch) {
    result.personal.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  } else {
    result.personal.linkedin = 'https://linkedin.com';
  }

  // 2. Process Summary
  if (sectionBlocks.summary.length > 0) {
    result.personal.summary = sectionBlocks.summary.join(' ');
  } else {
    result.personal.summary = 'Software engineer with expertise in cutting-edge AI, modern frameworks, and scalable cloud solutions.';
  }

  // 3. Process Skills
  if (sectionBlocks.skills.length > 0) {
    let currentCategory = 'Core Skills';
    result.skills[currentCategory] = [];

    sectionBlocks.skills.forEach(line => {
      if (line.includes(':')) {
        const parts = line.split(':');
        currentCategory = parts[0].trim();
        const skillList = parts.slice(1).join(':').split(/[,•|/]/).map(s => s.trim()).filter(Boolean);
        result.skills[currentCategory] = skillList;
      } else {
        const items = line.split(/[,•|]/).map(s => s.trim()).filter(Boolean);
        if (!result.skills[currentCategory]) result.skills[currentCategory] = [];
        result.skills[currentCategory].push(...items);
      }
    });

    // Remove empty categories
    for (const k of Object.keys(result.skills)) {
      if (result.skills[k].length === 0) delete result.skills[k];
    }
  }

  // Default fallback if skills was empty
  if (Object.keys(result.skills).length === 0) {
    result.skills = {
      "AI & GenAI": ["Agent Orchestration", "RAG", "LLM Fine-Tuning", "Vector Search"],
      "Software Engineering": ["Python", "JavaScript", "TypeScript", "RESTful APIs", "FastAPI"]
    };
  }

  // 4. Process Work Experience
  if (sectionBlocks.experience.length > 0) {
    let currentExp = null;
    let currentSubRole = null;

    sectionBlocks.experience.forEach(line => {
      // Check for date pattern like "Dec 2024 – Present" or "2023 - 2024"
      const dateMatch = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})[a-z]*\s*\d{0,4}\s*[-–—]\s*(Present|\d{4}|[A-Za-z]+\s*\d{0,4})/i);
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');

      if (!isBullet && (dateMatch || line.includes('—') || line.includes('–') || line.length < 60)) {
        if (!currentExp) {
          currentExp = {
            company: line.split(/[—–|-]/)[0].trim(),
            role: line.includes('—') ? line.split(/[—–]/)[1]?.trim() : 'Software Engineer',
            period: dateMatch ? dateMatch[0] : 'Recent',
            location: 'Enterprise',
            subRoles: []
          };
          result.experience.push(currentExp);
        } else if (dateMatch && !currentSubRole) {
          currentSubRole = {
            title: line.replace(dateMatch[0], '').replace(/[—–|]/g, '').trim() || 'Key Initiative',
            period: dateMatch[0],
            highlights: []
          };
          currentExp.subRoles.push(currentSubRole);
        } else if (dateMatch && currentSubRole) {
          currentSubRole = {
            title: line.replace(dateMatch[0], '').replace(/[—–|]/g, '').trim() || 'Role Milestone',
            period: dateMatch[0],
            highlights: []
          };
          currentExp.subRoles.push(currentSubRole);
        } else if (!dateMatch && line.length < 50) {
          // Might be a sub-role or milestone title
          if (!currentSubRole) {
            currentSubRole = {
              title: line,
              period: '',
              highlights: []
            };
            currentExp.subRoles.push(currentSubRole);
          } else {
            currentSubRole = {
              title: line,
              period: '',
              highlights: []
            };
            currentExp.subRoles.push(currentSubRole);
          }
        }
      } else if (isBullet) {
        const cleanedBullet = line.replace(/^[•\-*]\s*/, '').trim();
        if (currentSubRole) {
          currentSubRole.highlights.push(cleanedBullet);
        } else if (currentExp) {
          if (!currentExp.subRoles.length) {
            currentExp.subRoles.push({
              title: currentExp.role,
              period: currentExp.period,
              highlights: []
            });
          }
          currentExp.subRoles[0].highlights.push(cleanedBullet);
        }
      } else if (currentSubRole && currentSubRole.highlights.length > 0) {
        // Appending multiline bullet
        const lastIdx = currentSubRole.highlights.length - 1;
        currentSubRole.highlights[lastIdx] += ' ' + line;
      }
    });
  }

  // 5. Process Projects
  if (sectionBlocks.projects.length > 0) {
    let currentProj = null;

    sectionBlocks.projects.forEach(line => {
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
      const hasTechInLine = /Python|Java|React|Gemini|PyTorch|FastAPI|AWS|ADK|C\+\+|SQL|FAISS/i.test(line);

      if (!isBullet && (line.includes('–') || line.includes('-') || line.includes(':') || hasTechInLine) && line.length < 90) {
        const titleParts = line.split(/[–\-:]/);
        const title = titleParts[0].trim();
        let tech = [];
        if (titleParts.length > 1) {
          tech = titleParts.slice(1).join(' ').split(/[,/]/).map(t => t.trim()).filter(t => t.length > 1 && t.length < 30);
        }

        currentProj = {
          id: `proj-${result.projects.length + 1}`,
          title: title,
          tech: tech.length > 0 ? tech : ['Python', 'AI Systems'],
          description: '',
          badge: tech[0] || 'AI Innovation',
          link: '#'
        };
        result.projects.push(currentProj);
      } else if (currentProj) {
        const cleanText = line.replace(/^[•\-*]\s*/, '').trim();
        if (currentProj.description) {
          currentProj.description += ' ' + cleanText;
        } else {
          currentProj.description = cleanText;
        }
      }
    });
  }

  // 6. Process Education
  if (sectionBlocks.education.length > 0) {
    let currentEdu = null;
    sectionBlocks.education.forEach(line => {
      const yearMatch = line.match(/\b(20\d\d)\b/);
      if (line.includes('Technology') || line.includes('University') || line.includes('Institute') || line.includes('School') || line.includes('College')) {
        currentEdu = {
          institution: line,
          degree: 'Degree Program',
          period: yearMatch ? yearMatch[0] : '2020 – 2024',
          grade: ''
        };
        result.education.push(currentEdu);
      } else if (currentEdu) {
        if (/B\.Tech|Bachelor|Master|M\.S|B\.S|Class\s+10|Class\s+12/i.test(line)) {
          currentEdu.degree = line;
        } else if (/CGPA|GPA|Percentage|%/i.test(line)) {
          currentEdu.grade = line;
        }
      }
    });
  }

  // 7. Process Certifications
  if (sectionBlocks.certifications.length > 0) {
    sectionBlocks.certifications.forEach(line => {
      const clean = line.replace(/^[•\-*]\s*/, '').replace(/—\s*Link|\s*-\s*Link/gi, '').trim();
      if (clean.length > 5) {
        result.certifications.push({
          name: clean,
          badge: clean.includes('Winner') ? 'Honors & Award' : 'Verified Credential',
          link: '#'
        });
      }
    });
  }

  return result;
}
