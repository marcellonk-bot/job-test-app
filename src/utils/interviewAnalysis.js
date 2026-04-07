// ── Confidence levels ───────────────────────────────────────────────────────
export const CONFIDENCE = {
    HIGH: { label: 'High', color: 'emerald' },
    MEDIUM: { label: 'Medium', color: 'amber' },
    LOW: { label: 'Low', color: 'rose' },
};

// ── Analyze a single answer against job context ─────────────────────────────
export const analyzeAnswer = (question, answer, requiredSkills = [], questionIndex) => {
    const words = answer.split(/\s+/);
    const wordCount = words.length;
    const lowerAnswer = answer.toLowerCase();
    const lowerQuestion = question.toLowerCase();

    const mentionedSkills = requiredSkills.filter(skill =>
        lowerAnswer.includes(skill.toLowerCase())
    );

    const hasExamples = /for example|for instance|such as|like when|in my experience|i built|i led|i implemented|we used/i.test(answer);
    const hasMetrics = /\d+%|\d+x|increased|decreased|reduced|improved|saved|million|thousand/i.test(answer);
    const hasTechnical = /algorithm|framework|architecture|database|api|deploy|test|code|system|server|pipeline|ci\/cd|docker|kubernetes|aws|cloud/i.test(answer);
    const hasStructure = /first|second|third|additionally|moreover|finally|in conclusion|my approach|step/i.test(answer);
    const isVague = wordCount < 15 || /i think|maybe|probably|i guess|not sure/i.test(answer);

    let relevance = 50;
    if (mentionedSkills.length > 0) relevance += mentionedSkills.length * 15;
    if (hasTechnical) relevance += 10;
    relevance = Math.min(100, relevance);

    let depth = 40;
    if (wordCount > 30) depth += 15;
    if (wordCount > 60) depth += 10;
    if (hasExamples) depth += 15;
    if (hasMetrics) depth += 10;
    if (hasStructure) depth += 10;
    depth = Math.min(100, depth);

    let clarity = 55;
    if (hasStructure) clarity += 15;
    if (wordCount > 15 && wordCount < 150) clarity += 10;
    if (!isVague) clarity += 15;
    if (hasExamples) clarity += 5;
    clarity = Math.min(100, clarity);

    const questionScore = Math.round((relevance + depth + clarity) / 3);

    let confidence;
    if (questionScore >= 70) confidence = CONFIDENCE.HIGH;
    else if (questionScore >= 50) confidence = CONFIDENCE.MEDIUM;
    else confidence = CONFIDENCE.LOW;

    const isCriticalSkill = requiredSkills.some(skill =>
        lowerQuestion.includes(skill.toLowerCase())
    ) || questionIndex < 2;

    const positiveWords = (lowerAnswer.match(/excellent|great|love|passionate|excited|strong|success|achieved|proud|effective/g) || []).length;
    const negativeWords = (lowerAnswer.match(/struggle|difficult|failed|weakness|challenge|problem|issue|never|don't know|unsure/g) || []).length;
    let sentiment = 'Neutral';
    if (positiveWords > negativeWords + 1) sentiment = 'Positive';
    else if (negativeWords > positiveWords) sentiment = 'Cautious';

    const strengths = [];
    const concerns = [];

    if (hasExamples) strengths.push('Backed claims with concrete examples');
    if (hasMetrics) strengths.push('Provided measurable outcomes');
    if (hasTechnical) strengths.push('Demonstrated technical vocabulary');
    if (hasStructure) strengths.push('Well-structured response');
    if (mentionedSkills.length > 0) strengths.push(`Referenced relevant skills: ${mentionedSkills.join(', ')}`);

    if (isVague) concerns.push('Response lacks specificity — may need follow-up');
    if (wordCount < 20) concerns.push('Answer is notably brief for this question type');
    if (!hasExamples) concerns.push('No concrete examples provided');
    if (isCriticalSkill && mentionedSkills.length === 0) concerns.push('Did not address the core skill area directly');
    if (negativeWords > 1) concerns.push('Language suggests uncertainty in this area');

    if (strengths.length === 0) strengths.push('Addressed the question directly');
    if (concerns.length === 0) concerns.push('No significant concerns identified');

    const evaluation = strengths[0] + (concerns[0] !== 'No significant concerns identified' ? `. However, ${concerns[0].toLowerCase()}.` : '.');

    return {
        questionScore,
        confidence,
        isCriticalSkill,
        sentiment,
        relevance,
        depth,
        clarity,
        mentionedSkills,
        evaluation,
        strengths,
        concerns,
    };
};

// ── Parse transcript into Q&A pairs ─────────────────────────────────────────
export const parseTranscriptPairs = (transcript) => {
    if (!transcript || !Array.isArray(transcript) || transcript.length < 2) return [];

    const pairs = [];
    let qNum = 0;

    for (let i = 0; i < transcript.length; i++) {
        if (
            transcript[i].role === 'assistant' &&
            i + 1 < transcript.length &&
            transcript[i + 1].role === 'user'
        ) {
            qNum++;
            pairs.push({
                questionNum: qNum,
                question: transcript[i].content,
                answer: transcript[i + 1].content,
            });
        }
    }
    return pairs;
};

// ── Demo transcript for fallback ────────────────────────────────────────────
export const getDemoTranscript = () => [
    { role: 'assistant', content: "Welcome! Let's begin your interview for the Senior Frontend Developer role. Can you describe your experience building production-scale React applications?" },
    { role: 'user', content: "I've been working with React for over 4 years. In my last role at a SaaS company, I architected a dashboard handling 50k daily active users. We used React with TypeScript, Redux Toolkit for state management, and implemented code-splitting that reduced our initial bundle by 40%." },
    { role: 'assistant', content: "Great experience. How do you approach performance optimization in React, and can you walk through a specific example?" },
    { role: 'user', content: "I start with measurement using React DevTools Profiler and Lighthouse. I look for unnecessary re-renders and address them with React.memo and useMemo. In one project, I virtualized a 10,000-row table with react-window which dropped render time from 3 seconds to under 200ms." },
    { role: 'assistant', content: "Solid methodology. Tell me about your experience with testing strategies in frontend applications." },
    { role: 'user', content: "I use a testing pyramid approach. Unit tests with Jest for utility functions, React Testing Library for component behavior, and Cypress for critical E2E flows. I aim for 80% coverage on business logic but focus on testing behavior, not implementation details." },
    { role: 'assistant', content: "How would you handle a situation where you disagree with a technical decision made by your team lead?" },
    { role: 'user', content: "I think I would probably bring it up. Maybe in a meeting or something. It depends on the situation I guess." },
    { role: 'assistant', content: "Final question: What's your approach to mentoring junior developers and sharing knowledge within a team?" },
    { role: 'user', content: "I run weekly code review sessions where we walk through PRs together as a learning exercise. I also created an internal wiki documenting our architectural decisions and patterns. For instance, I paired with a junior developer on implementing our authentication flow, which helped them ship their first major feature independently within a month." },
];
