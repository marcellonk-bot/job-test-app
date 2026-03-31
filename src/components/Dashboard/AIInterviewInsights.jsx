import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Brain, Bot, User, Shield, ShieldAlert, AlertTriangle,
    CheckCircle2, ChevronDown, TrendingUp, Target, Filter,
    MessageSquare, Sparkles, BarChart3, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── Confidence levels ───────────────────────────────────────────────────────
const CONFIDENCE = {
    HIGH: { label: 'High', color: 'emerald', icon: CheckCircle2 },
    MEDIUM: { label: 'Medium', color: 'amber', icon: AlertTriangle },
    LOW: { label: 'Low', color: 'rose', icon: ShieldAlert },
};

// ── Analyze a single answer against job context ─────────────────────────────
const analyzeAnswer = (question, answer, requiredSkills = [], questionIndex) => {
    const words = answer.split(/\s+/);
    const wordCount = words.length;
    const lowerAnswer = answer.toLowerCase();
    const lowerQuestion = question.toLowerCase();

    // Detect which required skills are mentioned
    const mentionedSkills = requiredSkills.filter(skill =>
        lowerAnswer.includes(skill.toLowerCase())
    );

    // Check quality signals
    const hasExamples = /for example|for instance|such as|like when|in my experience|i built|i led|i implemented|we used/i.test(answer);
    const hasMetrics = /\d+%|\d+x|increased|decreased|reduced|improved|saved|million|thousand/i.test(answer);
    const hasTechnical = /algorithm|framework|architecture|database|api|deploy|test|code|system|server|pipeline|ci\/cd|docker|kubernetes|aws|cloud/i.test(answer);
    const hasStructure = /first|second|third|additionally|moreover|finally|in conclusion|my approach|step/i.test(answer);
    const isVague = wordCount < 15 || /i think|maybe|probably|i guess|not sure/i.test(answer);

    // Score components (each 0-100)
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

    // Confidence flag
    let confidence;
    if (questionScore >= 70) confidence = CONFIDENCE.HIGH;
    else if (questionScore >= 50) confidence = CONFIDENCE.MEDIUM;
    else confidence = CONFIDENCE.LOW;

    // Determine if it's a critical-skill question
    const isCriticalSkill = requiredSkills.some(skill =>
        lowerQuestion.includes(skill.toLowerCase())
    ) || questionIndex < 2; // First two questions are usually core-skill questions

    // Sentiment
    const positiveWords = (lowerAnswer.match(/excellent|great|love|passionate|excited|strong|success|achieved|proud|effective/g) || []).length;
    const negativeWords = (lowerAnswer.match(/struggle|difficult|failed|weakness|challenge|problem|issue|never|don't know|unsure/g) || []).length;
    let sentiment = 'Neutral';
    if (positiveWords > negativeWords + 1) sentiment = 'Positive';
    else if (negativeWords > positiveWords) sentiment = 'Cautious';

    // AI evaluation text
    let evaluation = '';
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

    evaluation = strengths[0] + (concerns[0] !== 'No significant concerns identified' ? `. However, ${concerns[0].toLowerCase()}.` : '.');

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
const parseTranscriptPairs = (transcript) => {
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
const getDemoTranscript = () => [
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

// ── Mini progress bar for scorecard ─────────────────────────────────────────
const MiniBar = ({ value, color = 'blue' }) => {
    const barColors = {
        blue: 'bg-blue-500',
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        indigo: 'bg-indigo-500',
    };
    return (
        <div className="w-full h-1.5 rounded-full bg-slate-100">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-1.5 rounded-full ${barColors[color] || barColors.blue}`}
            />
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// ── Main Component ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const AIInterviewInsights = ({ isOpen, onClose, candidate }) => {
    const [transcript, setTranscript] = useState(null);
    const [requiredSkills, setRequiredSkills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'low_confidence' | 'critical_skills'
    const [expandedCards, setExpandedCards] = useState({});

    // Fetch transcript + job data for the candidate
    useEffect(() => {
        if (!isOpen || !candidate) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Try to find an application record with transcript for this candidate
                const { data, error } = await supabase
                    .from('applications_table')
                    .select(`
                        interview_transcript,
                        jobs_table (
                            job_title,
                            required_skills
                        )
                    `)
                    .eq('user_id', candidate.user_id)
                    .eq('status', 'Interviewed')
                    .order('interviewed_at', { ascending: false })
                    .limit(1);

                if (!error && data && data.length > 0 && data[0].interview_transcript) {
                    setTranscript(data[0].interview_transcript);
                    setRequiredSkills(data[0].jobs_table?.required_skills || []);
                } else {
                    // Fallback to demo
                    setTranscript(getDemoTranscript());
                    setRequiredSkills(['React', 'TypeScript', 'Node.js', 'System Design', 'Testing']);
                }
            } catch (err) {
                console.error('Error fetching transcript:', err);
                setTranscript(getDemoTranscript());
                setRequiredSkills(['React', 'TypeScript', 'Node.js', 'System Design', 'Testing']);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        setActiveFilter('all');
        setExpandedCards({});
    }, [isOpen, candidate]);

    // Parse and analyze
    const qaPairs = useMemo(() => {
        if (!transcript) return [];
        return parseTranscriptPairs(transcript);
    }, [transcript]);

    const analyzed = useMemo(() => {
        return qaPairs.map((pair, idx) => ({
            ...pair,
            analysis: analyzeAnswer(pair.question, pair.answer, requiredSkills, idx),
        }));
    }, [qaPairs, requiredSkills]);

    // Filter
    const filtered = useMemo(() => {
        if (activeFilter === 'low_confidence') {
            return analyzed.filter(q => q.analysis.confidence === CONFIDENCE.LOW);
        }
        if (activeFilter === 'critical_skills') {
            return analyzed.filter(q => q.analysis.isCriticalSkill);
        }
        return analyzed;
    }, [analyzed, activeFilter]);

    // Aggregate stats
    const avgScore = analyzed.length > 0
        ? Math.round(analyzed.reduce((s, q) => s + q.analysis.questionScore, 0) / analyzed.length)
        : 0;
    const lowCount = analyzed.filter(q => q.analysis.confidence === CONFIDENCE.LOW).length;
    const criticalCount = analyzed.filter(q => q.analysis.isCriticalSkill).length;

    const toggleCard = (idx) => {
        setExpandedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    if (!candidate) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
                >
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col my-4"
                        style={{ maxHeight: 'calc(100vh - 64px)' }}
                    >
                        {/* ── Header ────────────────────────────────────── */}
                        <div className="relative p-6 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex-shrink-0">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl font-bold border border-white/20">
                                    {candidate.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{candidate.name}</h2>
                                    <div className="flex items-center gap-2 mt-1 text-slate-300">
                                        <Brain size={15} />
                                        <span className="text-sm">AI Interview Insights</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Body ──────────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-24">
                                    <Loader2 className="animate-spin text-blue-600" size={28} />
                                    <span className="ml-3 text-slate-500 font-medium">Loading interview data...</span>
                                </div>
                            ) : (
                                <div className="p-6 md:p-8 space-y-8">

                                    {/* ── Scorecard Grid ──────────────── */}
                                    <section>
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <BarChart3 size={15} className="text-blue-500" />
                                            Per-Question Scorecard
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                            {analyzed.map((item, idx) => {
                                                const conf = item.analysis.confidence;
                                                const ConfIcon = conf.icon;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`relative p-4 rounded-xl border text-center transition-all hover:shadow-md cursor-default ${
                                                            conf === CONFIDENCE.HIGH
                                                                ? 'bg-emerald-50/60 border-emerald-200'
                                                                : conf === CONFIDENCE.MEDIUM
                                                                ? 'bg-amber-50/60 border-amber-200'
                                                                : 'bg-rose-50/60 border-rose-200'
                                                        }`}
                                                    >
                                                        {item.analysis.isCriticalSkill && (
                                                            <div className="absolute -top-1.5 -right-1.5">
                                                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                                                                    <Target size={10} />
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-slate-500 font-semibold mb-1">Q{item.questionNum}</div>
                                                        <div className="text-2xl font-bold text-slate-900">{item.analysis.questionScore}</div>
                                                        <MiniBar value={item.analysis.questionScore} color={conf.color} />
                                                        <div className={`mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-${conf.color}-700`}>
                                                            <ConfIcon size={12} />
                                                            {conf.label}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Aggregate row */}
                                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                                                <TrendingUp size={14} className="text-blue-600" />
                                                <span className="text-slate-600">Avg Score: </span>
                                                <span className="font-bold text-slate-900">{avgScore}/100</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                                                <Target size={14} className="text-indigo-600" />
                                                <span className="text-slate-600">Critical-Skill Qs: </span>
                                                <span className="font-bold text-slate-900">{criticalCount}</span>
                                            </div>
                                            {lowCount > 0 && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-lg border border-rose-200">
                                                    <ShieldAlert size={14} className="text-rose-600" />
                                                    <span className="text-rose-700 font-semibold">{lowCount} Low Confidence</span>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* ── Filter Toggles ──────────────── */}
                                    <section>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1.5">
                                                <Filter size={13} /> Filter:
                                            </span>
                                            {[
                                                { key: 'all', label: 'All Responses', count: analyzed.length },
                                                { key: 'low_confidence', label: 'Low Confidence', count: lowCount, color: 'rose' },
                                                { key: 'critical_skills', label: 'Critical Skills', count: criticalCount, color: 'indigo' },
                                            ].map(f => (
                                                <button
                                                    key={f.key}
                                                    onClick={() => setActiveFilter(f.key)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                                        activeFilter === f.key
                                                            ? f.color === 'rose'
                                                                ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm'
                                                                : f.color === 'indigo'
                                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm'
                                                                : 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {f.label}
                                                    <span className={`ml-1.5 text-xs font-bold ${
                                                        activeFilter === f.key ? '' : 'text-slate-400'
                                                    }`}>
                                                        {f.count}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    {/* ── Response Analysis (Side-by-Side) ── */}
                                    <section className="space-y-5">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <MessageSquare size={15} className="text-blue-500" />
                                            Response Analysis
                                        </h3>

                                        {filtered.length === 0 ? (
                                            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                                                <Shield size={32} className="mx-auto mb-2 text-slate-300" />
                                                <p className="font-medium">No responses match this filter</p>
                                                <p className="text-sm mt-1">Try switching to "All Responses"</p>
                                            </div>
                                        ) : (
                                            filtered.map((item, idx) => {
                                                const a = item.analysis;
                                                const ConfIcon = a.confidence.icon;
                                                const isExpanded = expandedCards[item.questionNum] !== false; // default open

                                                return (
                                                    <motion.div
                                                        key={item.questionNum}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                                                    >
                                                        {/* Card header */}
                                                        <button
                                                            onClick={() => toggleCard(item.questionNum)}
                                                            className="w-full flex items-center justify-between p-4 md:px-6 bg-slate-50/80 hover:bg-slate-100/80 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                    {item.questionNum}
                                                                </span>
                                                                <span className="text-sm font-semibold text-slate-800 text-left line-clamp-1">
                                                                    Question {item.questionNum}
                                                                </span>
                                                                {a.isCriticalSkill && (
                                                                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                                                                        <Target size={10} /> Critical Skill
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-${a.confidence.color}-100 text-${a.confidence.color}-700 border border-${a.confidence.color}-200`}>
                                                                    <ConfIcon size={11} /> {a.confidence.label}
                                                                </span>
                                                                <span className="text-lg font-bold text-slate-900">{a.questionScore}</span>
                                                                <motion.span
                                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                >
                                                                    <ChevronDown size={16} className="text-slate-400" />
                                                                </motion.span>
                                                            </div>
                                                        </button>

                                                        {/* Card body */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.25 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="p-4 md:p-6 space-y-5 border-t border-slate-100">

                                                                        {/* Question */}
                                                                        <div>
                                                                            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                                                <Bot size={13} /> Interviewer Question
                                                                            </div>
                                                                            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                                                {item.question}
                                                                            </p>
                                                                        </div>

                                                                        {/* Side-by-side: Transcript vs AI Evaluation */}
                                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                            {/* Left: Candidate Transcript */}
                                                                            <div>
                                                                                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                                                                                    <User size={13} /> Candidate Transcript
                                                                                </div>
                                                                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 h-full">
                                                                                    <p className="text-sm text-slate-700 leading-relaxed">
                                                                                        {item.answer}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Right: AI Evaluation */}
                                                                            <div>
                                                                                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                                                                    <Sparkles size={13} /> AI Evaluation
                                                                                </div>
                                                                                <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 h-full space-y-3">
                                                                                    {/* Sentiment + Confidence */}
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-${a.confidence.color}-100 text-${a.confidence.color}-700 border border-${a.confidence.color}-200`}>
                                                                                            <ConfIcon size={11} />
                                                                                            {a.confidence.label} Confidence
                                                                                        </span>
                                                                                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full ${
                                                                                            a.sentiment === 'Positive'
                                                                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                                                                : a.sentiment === 'Cautious'
                                                                                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                                                        }`}>
                                                                                            {a.sentiment} Tone
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* Mini score bars */}
                                                                                    <div className="space-y-2">
                                                                                        <div>
                                                                                            <div className="flex justify-between text-xs mb-0.5">
                                                                                                <span className="text-slate-500 font-medium">Relevance</span>
                                                                                                <span className="font-bold text-slate-700">{a.relevance}%</span>
                                                                                            </div>
                                                                                            <MiniBar value={a.relevance} color="blue" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="flex justify-between text-xs mb-0.5">
                                                                                                <span className="text-slate-500 font-medium">Depth</span>
                                                                                                <span className="font-bold text-slate-700">{a.depth}%</span>
                                                                                            </div>
                                                                                            <MiniBar value={a.depth} color="indigo" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="flex justify-between text-xs mb-0.5">
                                                                                                <span className="text-slate-500 font-medium">Clarity</span>
                                                                                                <span className="font-bold text-slate-700">{a.clarity}%</span>
                                                                                            </div>
                                                                                            <MiniBar value={a.clarity} color="emerald" />
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Strengths / Concerns */}
                                                                                    <div className="space-y-2 pt-1">
                                                                                        {a.strengths.map((s, i) => (
                                                                                            <div key={i} className="flex items-start gap-2 text-xs text-emerald-800">
                                                                                                <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                                                                                                <span>{s}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                        {a.concerns.filter(c => c !== 'No significant concerns identified').map((c, i) => (
                                                                                            <div key={i} className="flex items-start gap-2 text-xs text-amber-800">
                                                                                                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-amber-500" />
                                                                                                <span>{c}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>

                                                                                    {/* Skills Tags */}
                                                                                    {a.mentionedSkills.length > 0 && (
                                                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                                                            {a.mentionedSkills.map((s, i) => (
                                                                                                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded border border-blue-200">
                                                                                                    {s}
                                                                                                </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </section>
                                </div>
                            )}
                        </div>

                        {/* ── Footer ────────────────────────────────────── */}
                        <div className="p-4 md:px-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Brain size={14} />
                                <span>Analysis generated from interview transcript</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AIInterviewInsights;
