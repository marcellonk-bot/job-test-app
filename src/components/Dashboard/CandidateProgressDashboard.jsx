import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, ChevronDown, ChevronRight, Clock, MessageSquare,
    Sparkles, TrendingUp, User, Bot, ArrowLeft,
    CheckCircle2, Lightbulb, Briefcase,
    CircleDot, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ── Status Badge Component ──────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const statusConfig = {
        Accepted: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        Pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: CircleDot },
        Rejected: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
    };
    const config = statusConfig[status] || statusConfig.Pending;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
            <Icon size={12} />
            {status}
        </span>
    );
};

// ── Collapsible AI Insight Box ──────────────────────────────────────────────
const AIInsightBox = ({ insight }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mt-3 border border-indigo-100 rounded-xl overflow-hidden bg-indigo-50/30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Sparkles size={15} />
                    AI Insight
                </span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} />
                </motion.span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3">
                            {insight.good && (
                                <div className="flex items-start gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-0.5">What was good</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{insight.good}</p>
                                    </div>
                                </div>
                            )}
                            {insight.improve && (
                                <div className="flex items-start gap-2.5">
                                    <Lightbulb size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-0.5">Could improve</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{insight.improve}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// ── Parse transcript into Q&A pairs with AI insights ────────────────────────
const parseTranscript = (transcript) => {
    if (!transcript || !Array.isArray(transcript) || transcript.length < 2) return [];

    const pairs = [];
    let questionNum = 0;

    for (let i = 0; i < transcript.length; i++) {
        const msg = transcript[i];
        // Find assistant messages that contain a question (skip greeting/closing)
        if (msg.role === 'assistant' && i + 1 < transcript.length && transcript[i + 1].role === 'user') {
            questionNum++;
            const question = msg.content;
            const answer = transcript[i + 1].content;

            // Generate contextual insights based on answer quality signals
            const answerLength = answer.split(' ').length;
            const hasExamples = /for example|for instance|such as|like when|in my experience/i.test(answer);
            const hasTechnical = /algorithm|framework|architecture|database|api|deploy|test|code|system/i.test(answer);
            const hasStructure = /first|second|additionally|moreover|finally|in conclusion/i.test(answer);

            let good = '';
            let improve = '';

            if (answerLength > 40 && hasExamples) {
                good = 'Provided detailed response with concrete examples that demonstrate real experience.';
            } else if (answerLength > 40) {
                good = 'Gave a thorough and detailed response showing depth of thought.';
            } else if (hasExamples) {
                good = 'Used specific examples to illustrate points effectively.';
            } else if (hasTechnical) {
                good = 'Demonstrated relevant technical knowledge in the response.';
            } else {
                good = 'Addressed the question directly and stayed on topic.';
            }

            if (answerLength < 20) {
                improve = 'Consider providing more detail and specific examples to strengthen the response.';
            } else if (!hasExamples) {
                improve = 'Adding concrete examples from past experience would make the answer more compelling.';
            } else if (!hasStructure) {
                improve = 'Structuring the response with clear points (e.g., "First... Second...") would improve clarity.';
            } else if (!hasTechnical) {
                improve = 'Incorporating more technical specifics relevant to the role could demonstrate deeper expertise.';
            } else {
                improve = 'Could further differentiate by connecting the answer to specific outcomes or measurable results.';
            }

            pairs.push({
                questionNum,
                question,
                answer,
                insight: { good, improve }
            });
        }
    }

    return pairs;
};


// ── Demo sessions for when no DB data exists ────────────────────────────────
const getDemoSessions = () => [
    {
        id: 'demo-1',
        job_title: 'Senior Frontend Developer',
        ai_insights: 'Strong React fundamentals with excellent component architecture skills. Communicated complex concepts clearly.',
        interviewed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'Accepted',
        transcript: [
            { role: 'assistant', content: "Hello! I'm your AI interviewer for the Senior Frontend Developer position. Let's begin. Can you describe your experience with React and how you've used it in production applications?" },
            { role: 'user', content: "I've been working with React for over 4 years now. In my last role, I built a large-scale SaaS dashboard using React with TypeScript. We used Redux Toolkit for state management and implemented code-splitting with React.lazy for performance. For example, we reduced our initial bundle size by 40% through dynamic imports." },
            { role: 'assistant', content: "Excellent, that's a solid background. How do you approach performance optimization in a React application? Can you walk me through your process?" },
            { role: 'user', content: "I start with measurement using React DevTools Profiler and Lighthouse. The most common issues I find are unnecessary re-renders, which I address with React.memo, useMemo, and useCallback. I also look at bundle size with webpack-bundle-analyzer. In my experience, virtualizing long lists with react-window has been one of the biggest wins." },
            { role: 'assistant', content: "Great approach. Now, tell me about a challenging bug you encountered in a frontend application and how you resolved it." },
            { role: 'user', content: "We had a memory leak in production caused by WebSocket subscriptions not being cleaned up in useEffect. It took time to track down because it only manifested after extended use. I used Chrome's Memory panel to identify detached DOM nodes, traced it back to the subscription handler, and implemented proper cleanup functions. I then added an ESLint rule to catch missing cleanup in effects." },
            { role: 'assistant', content: "That shows great debugging methodology. How do you handle state management in complex applications, and when would you choose different solutions?" },
            { role: 'user', content: "It depends on the complexity. For local UI state, I use useState/useReducer. For shared state across a feature, React Context works well. For large apps with complex data flows, I prefer Redux Toolkit or Zustand. I've also used React Query for server state, which eliminates a lot of manual caching logic. The key is picking the right tool — not everything needs a global store." },
            { role: 'assistant', content: "Final question: How do you ensure code quality and maintainability in a frontend codebase that multiple developers work on?" },
            { role: 'user', content: "First, strong TypeScript usage with strict mode. Second, comprehensive testing — unit tests with Jest and React Testing Library, plus Cypress for E2E. I also enforce consistent patterns through ESLint and Prettier configs. Code reviews are critical, and I like to document component APIs with Storybook. Finally, we maintain an internal component library to ensure consistency across the app." },
        ]
    },
    {
        id: 'demo-2',
        job_title: 'Full Stack Engineer',
        ai_insights: 'Solid understanding of backend concepts but could strengthen system design explanations. Good communication overall.',
        interviewed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        status: 'Pending',
        transcript: [
            { role: 'assistant', content: "Welcome! I'll be interviewing you for the Full Stack Engineer position. Let's start — can you describe a full-stack project you've built from scratch?" },
            { role: 'user', content: "I built a task management app with a Node.js backend using Express and PostgreSQL, and a React frontend. It had user authentication with JWT and real-time updates using Socket.io." },
            { role: 'assistant', content: "Nice. How did you design the database schema for that project, and what considerations did you make?" },
            { role: 'user', content: "I had tables for users, projects, and tasks. Tasks had foreign keys to projects and users. I added indexes on frequently queried columns like status and due_date to improve performance." },
            { role: 'assistant', content: "Good. Can you explain how you would handle scaling a Node.js application that's receiving increasing traffic?" },
            { role: 'user', content: "I would use load balancing with something like Nginx, add caching with Redis, and make sure the database queries are optimized. Horizontal scaling with containers would help too." },
            { role: 'assistant', content: "How do you approach testing in a full-stack application?" },
            { role: 'user', content: "I write unit tests for backend logic and API endpoints using Jest. For the frontend I use React Testing Library. I also do manual testing but want to add more integration tests." },
            { role: 'assistant', content: "Last question: Tell me about a time you had to learn a new technology quickly for a project." },
            { role: 'user', content: "When my team decided to adopt GraphQL, I spent a weekend going through the documentation and built a small prototype. Within a week I was able to implement our first GraphQL endpoint and help others on the team get started too." },
        ]
    }
];

// ═══════════════════════════════════════════════════════════════════════════
// ── Main Component ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const CandidateProgressDashboard = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch interview sessions
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setLoading(true);

                // Try fetching from applications_table joined with jobs
                const { data, error } = await supabase
                    .from('applications_table')
                    .select(`
                        id,
                        ai_insights,
                        status,
                        interviewed_at,
                        interview_transcript,
                        jobs_table (
                            job_title
                        )
                    `)
                    .eq('user_id', user?.id)
                    .in('status', ['Accepted', 'Pending', 'Rejected', 'Interviewed'])
                    .order('interviewed_at', { ascending: false });

                if (error || !data || data.length === 0) {
                    const demo = getDemoSessions();
                    setSessions(demo);
                    setSelectedSession(demo[0]);
                } else {
                    const mapped = data.map((app) => ({
                        id: app.id,
                        job_title: app.jobs_table?.job_title || 'Interview Session',
                        ai_insights: app.ai_insights || 'Interview completed.',
                        interviewed_at: app.interviewed_at,
                        status: app.status === 'Interviewed' ? 'Pending' : app.status,
                        transcript: app.interview_transcript || null,
                    }));
                    setSessions(mapped);
                    setSelectedSession(mapped[0]);
                }
            } catch (err) {
                console.error('Error fetching sessions:', err);
                const demo = getDemoSessions();
                setSessions(demo);
                setSelectedSession(demo[0]);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, [user]);

    const handleSelectSession = (session) => {
        setSelectedSession(session);
    };

    const qaPairs = selectedSession ? parseTranscript(selectedSession.transcript) : [];

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-7xl mx-auto"
        >
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                <div>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-2"
                    >
                        <ArrowLeft size={14} />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 text-premium">Progress Dashboard</h1>
                    <p className="text-slate-500">Review your interview history and performance insights</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <BarChart3 size={16} className="text-blue-500" />
                    <span>{sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded</span>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* ── Sidebar: Session List ────────────────────────────── */}
                <div className="lg:w-80 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <Briefcase size={14} className="text-blue-500" />
                                Interview Sessions
                            </h2>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[calc(100vh-280px)] overflow-y-auto">
                            {sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => handleSelectSession(session)}
                                    className={`w-full text-left p-4 transition-all hover:bg-blue-50/50 ${
                                        selectedSession?.id === session.id
                                            ? 'bg-blue-50 border-l-4 border-l-blue-600'
                                            : 'border-l-4 border-l-transparent'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-semibold truncate ${
                                                selectedSession?.id === session.id ? 'text-blue-900' : 'text-slate-800'
                                            }`}>
                                                {session.job_title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Clock size={12} className="text-slate-400" />
                                                <span className="text-xs text-slate-500">
                                                    {session.interviewed_at
                                                        ? new Date(session.interviewed_at).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric', year: 'numeric'
                                                        })
                                                        : 'Recently'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <StatusBadge status={session.status} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Main Content ─────────────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-6">
                    {selectedSession ? (
                        <>
                            {/* ── Section 1: Performance Overview ──────────── */}
                            <motion.div
                                key={selectedSession.id + '-overview'}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                            >
                                {/* Status Header */}
                                <div className={`p-6 md:p-8 text-white ${
                                    selectedSession.status === 'Accepted' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' :
                                    selectedSession.status === 'Rejected' ? 'bg-gradient-to-br from-rose-600 to-red-700' :
                                    'bg-gradient-to-br from-blue-600 to-indigo-700'
                                }`}>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold">{selectedSession.job_title}</h2>
                                            <p className="text-white/70 text-sm mt-1">
                                                Applied {selectedSession.interviewed_at
                                                    ? new Date(selectedSession.interviewed_at).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })
                                                    : 'Recently'
                                                }
                                            </p>
                                        </div>
                                        <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/20 backdrop-blur-sm ${
                                            selectedSession.status === 'Accepted' ? 'bg-emerald-500/20' :
                                            selectedSession.status === 'Rejected' ? 'bg-rose-500/20' :
                                            'bg-white/10'
                                        }`}>
                                            {selectedSession.status === 'Accepted' && <CheckCircle2 size={22} />}
                                            {selectedSession.status === 'Pending' && <CircleDot size={22} />}
                                            {selectedSession.status === 'Rejected' && <XCircle size={22} />}
                                            <span className="text-xl font-bold">{selectedSession.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 space-y-6">
                                    {/* AI Summary */}
                                    <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100/60">
                                        <p className="text-sm text-slate-700 leading-relaxed italic">
                                            "{selectedSession.ai_insights}"
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* ── Section 2: Detailed Q&A History ──────────── */}
                            <motion.div
                                key={selectedSession.id + '-history'}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                            >
                                <div className="p-6 md:p-8 border-b border-slate-100">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <MessageSquare size={18} className="text-blue-500" />
                                        Interview Timeline
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Question-by-question breakdown with AI-powered feedback
                                    </p>
                                </div>

                                <div className="p-6 md:p-8">
                                    {qaPairs.length > 0 ? (
                                        <div className="relative">
                                            {/* Vertical timeline line */}
                                            <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-200" />

                                            <div className="space-y-8">
                                                {qaPairs.map((pair, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ duration: 0.3, delay: idx * 0.08 }}
                                                        className="relative pl-14"
                                                    >
                                                        {/* Timeline dot */}
                                                        <div className="absolute left-3 top-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold z-10 shadow-sm shadow-blue-200">
                                                            {pair.questionNum}
                                                        </div>

                                                        {/* Question */}
                                                        <div className="mb-3">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <Bot size={14} className="text-slate-500" />
                                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                                    Question {pair.questionNum}
                                                                </span>
                                                            </div>
                                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-800 leading-relaxed">
                                                                {pair.question}
                                                            </div>
                                                        </div>

                                                        {/* Answer */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <User size={14} className="text-blue-500" />
                                                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                                                    Your Answer
                                                                </span>
                                                            </div>
                                                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/60 text-sm text-slate-700 leading-relaxed">
                                                                {pair.answer}
                                                            </div>
                                                        </div>

                                                        {/* AI Insight (Collapsible) */}
                                                        <AIInsightBox insight={pair.insight} />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <MessageSquare size={40} className="text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500 font-medium">No transcript available for this session</p>
                                            <p className="text-slate-400 text-sm mt-1">
                                                Interview transcripts are saved automatically for new sessions
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center h-full flex flex-col justify-center items-center min-h-[400px]">
                            <div className="flex justify-center mb-8 relative">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-3 border-b-2 border-dashed border-slate-200"></div>
                                <div className="relative z-10 w-28 h-28 bg-slate-50 rounded-full border-8 border-white shadow-sm flex items-center justify-center">
                                    <User size={48} className="text-slate-400" />
                                </div>
                                <div className="absolute top-2 -right-4 w-12 h-12 bg-blue-50 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-20">
                                    <Flag size={20} className="text-blue-500" />
                                </div>
                                <div className="absolute bottom-4 -left-4 w-10 h-10 bg-emerald-50 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-20">
                                    <Sparkles size={16} className="text-emerald-500" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">No Interviews Yet</h2>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                                You haven't had any interviews yet. Complete your first AI interview to get detailed feedback and track your progress.
                            </p>
                            <Link
                                to="/interview"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200/50 hover:shadow-blue-300 hover:-translate-y-0.5"
                            >
                                Start Your First Interview
                                <ChevronRight size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default CandidateProgressDashboard;
