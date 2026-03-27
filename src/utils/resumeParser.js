export const parseResumeToProfile = async (file) => {
    // 1. Load pdf.js dynamically from CDN
    const pdfjs = await loadPdfJs();
    if (!pdfjs) return null;

    try {
        // 2. Extract text from PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) { // Parse up to 3 pages
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            // Reconstruct text with approximate spacing
            let lastY = -1;
            let pageText = '';
            
            for (const item of content.items) {
                if (lastY !== item.transform[5] && lastY !== -1) {
                    pageText += '\n'; // New line if Y coordinate changes
                }
                pageText += item.str + ' ';
                lastY = item.transform[5];
            }
            fullText += pageText + '\n\n';
        }

        // 3. Simple Extraction Logic
        return extractProfileData(fullText, file.name);
        
    } catch (e) {
        console.error("Error parsing PDF locally:", e);
        return null;
    }
};

const loadPdfJs = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
            resolve(window.pdfjsLib);
        };
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
    });
};

const extractProfileData = (text, filename) => {
    const data = {
        full_name: '',
        bio: '',
        skills: ''
    };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // 1. Extract Name (often the first line with letters, less than 40 chars)
    for (const line of lines) {
        if (/^[a-zA-Z\s\.\-]{3,40}$/.test(line) && !line.toLowerCase().includes('resume') && !line.toLowerCase().includes('cv')) {
            data.full_name = toTitleCase(line);
            break;
        }
    }
    
    // Fallback: use filename if we couldn't find a decent name
    if (!data.full_name) {
        const cleanName = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
        // Get first two words
        data.full_name = cleanName.split(' ').slice(0, 2).map(toTitleCase).join(' ');
    }

    // 2. Extract Skills (Keyword matching)
    const commonSkills = [
        'Javascript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'TypeScript',
        'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel',
        'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Linux',
        'Machine Learning', 'Data Analysis', 'AI', 'TensorFlow', 'PyTorch',
        'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication', 'Marketing', 'SEO', 'Sales', 'Design', 'Figma', 'UI/UX'
    ];
    
    const foundSkills = [];
    const textLower = text.toLowerCase();
    
    for (const skill of commonSkills) {
        // Regex to find whole word matches
        const regex = new RegExp(`\\b${skill.toLowerCase().replace('+', '\\+')}\\b`, 'i');
        if (regex.test(textLower)) {
            foundSkills.push(skill);
        }
    }
    
    // Take top 8 skills or join them
    data.skills = foundSkills.slice(0, 8).join(', ');

    // 3. Generate a bio based on skills or extract an objective/summary
    // Look for "Summary", "Profile", "Objective"
    let bioFound = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if ((line === 'summary' || line === 'profile' || line === 'objective' || line === 'professional summary') && i + 1 < lines.length) {
            // Take the next several lines until a short line (heading) appears
            let bioText = '';
            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                if (lines[j].length < 25 && lines[j].split(' ').length <= 4) break; // Next heading
                bioText += lines[j] + ' ';
            }
            if (bioText.trim().length > 30) {
                data.bio = bioText.trim();
                bioFound = true;
                break;
            }
        }
    }

    // Fallback Bio
    if (!bioFound) {
        if (foundSkills.length > 0) {
            data.bio = `Experienced professional skilled in ${foundSkills.slice(0, 3).join(', ')}. Seeking to leverage background to contribute to high-impact projects.`;
        } else {
            data.bio = `Results-driven professional with a strong track record of success. Dedicated to continuous learning and delivering value.`;
        }
    }

    return data;
};

const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};
