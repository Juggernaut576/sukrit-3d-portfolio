/**
 * Client-Side Resume Parser
 * Parses PDF documents (using PDF.js) and structured JSON files into the portfolio schema.
 */

export async function parsePdfResume(arrayBuffer) {
  if (typeof window.pdfjsLib === 'undefined') {
    throw new Error('PDF.js library is not loaded. Please check internet connectivity.');
  }

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
    
    // Group text items by Y coordinate to accurately reconstruct lines
    const lineMap = new Map();
    textContent.items.forEach(item => {
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y).push(item);
    });

    // Sort lines top to bottom (descending Y)
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
      name: "Sukrit's Portfolio",
      title: 'Generative AI & Software Engineer',
      location: 'India',
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

  // 1. Process Header & Contact Info
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.personal.email = emailMatch[0];

  const phoneMatch = fullText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
  if (phoneMatch) result.personal.phone = phoneMatch[0].trim();

  if (/India|United States|USA|Canada|UK|Germany|Remote/i.test(fullText)) {
    const locMatch = fullText.match(/(India|United States|USA|Canada|UK|Germany|Remote)/i);
    if (locMatch) result.personal.location = locMatch[0];
  }

  const linkedinMatch = fullText.match(/(https?:\/\/[^\s]+linkedin\.com\/[^\s]+|linkedin(?:\.com)?\/[^\s]+)/i);
  if (linkedinMatch) {
    result.personal.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  } else {
    result.personal.linkedin = 'https://linkedin.com/in/sukritdebnath';
  }

  // 2. Process Summary
  if (sectionBlocks.summary.length > 0) {
    result.personal.summary = sectionBlocks.summary.join(' ');
  } else {
    result.personal.summary = 'Generative AI & Software Engineer with experience building enterprise multi-agent systems, Retrieval-Augmented Generation (RAG) architectures, and AI-driven backend integrations.';
  }

  // 3. Process Skills
  if (sectionBlocks.skills.length > 0) {
    let currentCategory = 'Core Competencies';
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

    for (const k of Object.keys(result.skills)) {
      if (result.skills[k].length === 0) delete result.skills[k];
    }
  }

  if (Object.keys(result.skills).length === 0) {
    result.skills = {
      "GenAI & Agentic Systems": ["Multi-Agent Architecture", "Google ADK", "Tool Calling", "RAG", "FAISS + BM25", "Guardrails"],
      "AI Models & Frameworks": ["Gemini", "Llama 3.2", "PyTorch", "Vector Databases", "Cosine Similarity", "TF-IDF"],
      "Backend & Cloud": ["Python", "FastAPI", "RESTful APIs", "SAP S/4HANA", "AWS Solutions Architect", "GCP"]
    };
  }

  // 4. Process Work Experience
  if (sectionBlocks.experience.length > 0) {
    let currentExp = null;
    let currentSubRole = null;

    sectionBlocks.experience.forEach(line => {
      // Ignore standalone link lines in experience
      if (/^(–|-|—)?\s*(Link|View\s*Project|\bhttps?:\/\/)/i.test(line)) return;

      const dateMatch = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})[a-z]*\s*\d{0,4}\s*[-–—]\s*(Present|\d{4}|[A-Za-z]+\s*\d{0,4})/i);
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');

      if (!isBullet && (dateMatch || line.includes('—') || line.includes('–') || line.length < 60)) {
        if (!currentExp) {
          currentExp = {
            company: line.split(/[—–|-]/)[0].trim(),
            role: line.includes('—') ? line.split(/[—–]/)[1]?.trim() : 'Software Engineer',
            period: dateMatch ? dateMatch[0] : 'Dec 2024 – Present',
            location: 'India',
            subRoles: []
          };
          result.experience.push(currentExp);
        } else if (dateMatch && !currentSubRole) {
          currentSubRole = {
            title: line.replace(dateMatch[0], '').replace(/[—–|]/g, '').trim() || 'Role Milestone',
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
        } else if (!dateMatch && line.length < 50 && line.length > 3) {
          currentSubRole = {
            title: line,
            period: '',
            highlights: []
          };
          currentExp.subRoles.push(currentSubRole);
        }
      } else if (isBullet) {
        let cleanedBullet = line.replace(/^[•\-*]\s*/, '').replace(/(\s*[-–—]\s*Link\b|\s*Link\b)$/i, '').trim();
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
        const lastIdx = currentSubRole.highlights.length - 1;
        const addTxt = line.replace(/(\s*[-–—]\s*Link\b|\s*Link\b)$/i, '').trim();
        if (addTxt) {
          currentSubRole.highlights[lastIdx] += ' ' + addTxt;
        }
      }
    });

    // Clean up empty experience records
    result.experience.forEach(exp => {
      if (exp.subRoles) {
        exp.subRoles = exp.subRoles.filter(s => s.title && s.title.length > 3 && !/^(link|– link)$/i.test(s.title));
      }
    });
  }

  // 5. Process Projects with Precision Tech & Title Dissection
  if (sectionBlocks.projects.length > 0) {
    let currentProj = null;

    // Tech keywords pattern to accurately locate where the tech stack begins
    const techSplitRegex = /\b(Python|Java|JavaScript|TypeScript|React|PyTorch|TensorFlow|FastAPI|Google ADK|Gemini|Llama|Llama 3\.2|FAISS|BM25|TF-IDF|Cosine Similarity|Scikit-learn|AWS|GCP|C\+\+|SQL|OData|ABAP)\b/i;

    sectionBlocks.projects.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check if this line is just a link or artifact marker
      const isJustLink = /^(–|-|—)?\s*(Link|\[Link\]|GitHub|View\s*Project|\bhttps?:\/\/)/i.test(trimmed);
      if (isJustLink) {
        if (currentProj) {
          const urlMatch = trimmed.match(/https?:\/\/[^\s]+/);
          if (urlMatch) currentProj.link = urlMatch[0];
        }
        return; // Skip: Never create a new project from a link line!
      }

      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');

      // Check if this line looks like a project header (not a bullet, not too long, contains title)
      const hasTechKeywords = techSplitRegex.test(trimmed);
      const isHeaderCandidate = !isBullet && trimmed.length < 130 && (hasTechKeywords || trimmed.includes('–') || trimmed.includes(' - ') || trimmed.includes(':'));

      if (isHeaderCandidate) {
        let extractedTitle = trimmed;
        let extractedTech = [];

        // Check if tech stack is tagged in parentheses: e.g. "Title (Python, FastAPI)"
        const parenMatch = trimmed.match(/\(([^)]+)\)$/);
        if (parenMatch && techSplitRegex.test(parenMatch[1])) {
          extractedTitle = trimmed.substring(0, parenMatch.index).trim();
          extractedTech = parenMatch[1].split(/[,|/]/).map(t => t.trim()).filter(Boolean);
        } else {
          // Look for tech keyword boundary in the line
          const techMatch = trimmed.match(techSplitRegex);
          if (techMatch && techMatch.index > 5) {
            extractedTitle = trimmed.substring(0, techMatch.index).trim();
            const techString = trimmed.substring(techMatch.index).trim();
            extractedTech = techString.split(/[,|/]/).map(t => t.trim()).filter(t => t.length > 0 && t.length < 35 && !/^link$/i.test(t));
          } else if (trimmed.includes('–') || trimmed.includes(' - ')) {
            const parts = trimmed.split(/[-–—]/);
            if (parts.length > 2) {
              // e.g. "Deal Architect – AI Multi-Agent Procurement System – Python, Google ADK"
              extractedTitle = parts.slice(0, 2).join(' – ').trim();
              extractedTech = parts.slice(2).join(' ').split(/[,/]/).map(t => t.trim()).filter(Boolean);
            } else {
              extractedTitle = parts[0].trim();
              extractedTech = parts[1].split(/[,/]/).map(t => t.trim()).filter(Boolean);
            }
          }
        }

        // Clean trailing punctuation from title
        extractedTitle = extractedTitle.replace(/[-–—:|]+$/, '').trim();

        // Assign a smart domain badge
        let smartBadge = 'AI Engineering';
        const titleAndTech = `${extractedTitle} ${extractedTech.join(' ')}`.toLowerCase();
        if (titleAndTech.includes('multi-agent') || titleAndTech.includes('adk') || titleAndTech.includes('procurement')) {
          smartBadge = 'Enterprise Multi-Agent';
        } else if (titleAndTech.includes('rag') || titleAndTech.includes('document') || titleAndTech.includes('bm25') || titleAndTech.includes('faiss')) {
          smartBadge = 'Hybrid RAG Pipeline';
        } else if (titleAndTech.includes('pytorch') || titleAndTech.includes('deep learning') || titleAndTech.includes('detection')) {
          smartBadge = 'Computer Vision & Deep Learning';
        } else if (titleAndTech.includes('recommender') || titleAndTech.includes('cosine') || titleAndTech.includes('similarity')) {
          smartBadge = 'Machine Learning System';
        } else if (extractedTech.length > 0) {
          smartBadge = extractedTech[0];
        }

        // Only start project if title is legitimate
        if (extractedTitle.length > 5 && !/^(link|– link)$/i.test(extractedTitle)) {
          currentProj = {
            id: `proj-${result.projects.length + 1}`,
            title: extractedTitle,
            tech: extractedTech.length > 0 ? extractedTech : ['Python', 'AI Systems'],
            description: '',
            badge: smartBadge,
            link: '#'
          };
          result.projects.push(currentProj);
          return;
        }
      }

      // If we are inside an active project, collect description
      if (currentProj) {
        let cleanText = trimmed.replace(/^[•\-*]\s*/, '').replace(/(\s*[-–—]\s*Link\b|\s*Link\b)$/i, '').trim();
        if (cleanText) {
          if (currentProj.description) {
            currentProj.description += ' ' + cleanText;
          } else {
            currentProj.description = cleanText;
          }
        }
      }
    });

    // Strip trailing "- Link" artifacts from all descriptions and remove invalid empty projects
    result.projects = result.projects.filter(p => {
      if (!p.title || p.title.length < 4 || /^(link|– link)$/i.test(p.title.trim())) return false;
      if (!p.description || p.description.trim().length < 10) return false;
      p.description = p.description.replace(/(\s*[-–—]\s*Link\b|\s*Link\b)$/i, '').trim();
      p.tech = p.tech.filter(t => !/^(link|– link)$/i.test(t.trim()));
      return true;
    });
  }

  // 6. Process Education
  if (sectionBlocks.education.length > 0) {
    let currentEdu = null;
    sectionBlocks.education.forEach(line => {
      const yearMatch = line.match(/\b(20\d\d)\b/);
      if (line.includes('Technology') || line.includes('University') || line.includes('Institute') || line.includes('School') || line.includes('College') || line.includes('VIT')) {
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

    result.education = result.education.filter(e => e.institution && e.institution.length > 4);
  }

  // 7. Process Certifications
  if (sectionBlocks.certifications.length > 0) {
    sectionBlocks.certifications.forEach(line => {
      const clean = line.replace(/^[•\-*]\s*/, '').replace(/—\s*Link|\s*-\s*Link/gi, '').trim();
      if (clean.length > 6 && !/^(link|– link)$/i.test(clean)) {
        let badge = 'Verified Credential';
        if (clean.includes('Winner') || clean.includes('Award') || clean.includes('1st')) {
          badge = 'Honors & Award';
        } else if (clean.includes('Google') || clean.includes('Gemini')) {
          badge = 'Google Cloud / Gemini';
        } else if (clean.includes('AWS')) {
          badge = 'Amazon Web Services';
        }

        result.certifications.push({
          name: clean,
          badge: badge,
          link: '#'
        });
      }
    });
  }

  return result;
}
