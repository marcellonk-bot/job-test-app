import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, TrendingUp, TrendingDown, Flag, Star, Loader2,
    AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Sparkles,
    ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert thumbs 'up'/'down' to a 1–5 star score */
const thumbsToScore = (val) => (val === 'up' ? 5 : val === 'down' ? 1 : null);

/** Render filled / empty stars for a given rating (out of 5) */
const Stars = ({ rating, size = 14 }) => {
    const full = Math.round(rating);
    return (
        <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={size}
                    className={i <= full ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                />
            ))}
        </span>
    );
};

/** Animated horizontal bar */
const HBar = ({ value, max, color = 'blue' }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const colors = {
        blue: 'bg-blue-500',
        indigo: 'bg-indigo-500',
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
    };
    return (
        <div className="w-full h-2 rounded-full bg-slate-100">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className={`h-2 rounded-full ${colors[color] || colors.blue}`}
            />
        </div>
    );
};

// ── Demo / fallback data ───────────────────────────────────────────────────

const DEMO_DATA = [
    { category: 'Information & Communication Technology', relevance: 4.3, quality: 4.5, count: 42 },
    { category: 'Engineering', relevance: 4.1, quality: 4.2, count: 38 },
    { category: 'Sales', relevance: 3.8, quality: 3.6, count: 31 },
    { category: 'Marketing', relevance: 3.5, quality: 3.4, count: 27 },
    { category: 'Healthcare & Medical', relevance: 2.9, quality: 3.1, count: 22 },
    { category: 'Accounting', relevance: 3.2, quality: 2.8, count: 18 },
    { category: 'Education & Training', relevance: 2.6, quality: 2.4, count: 15 },
    { category: 'Administration & Office Support', relevance: 2.3, quality: 2.1, count: 12 },
    { category: 'Hospitality & Tourism', relevance: 3.9, quality: 4.0, count: 20 },
    { category: 'Design & Architecture', relevance: 4.6, quality: 4.4, count: 25 },
    { category: 'Human Resources & Recruitment', relevance: 2.7, quality: 2.5, count: 14 },
];

// ── Main Component ─────────────────────────────────────────────────────────

const AIQualityAnalytics = () => {
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usingDemo, setUsingDemo] = useState(false);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'chart'
    const [sortKey, setSortKey] = useState('overall'); // 'overall' | 'relevance' | 'quality' | 'count'
    const [sortAsc, setSortAsc] = useState(false);

    // ── Fetch & aggregate ──────────────────────────────────────────────────
    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                // 1. Fetch all feedback rows
                const { data: feedbackRows, error: fbErr } = await supabase
                    .from('feedback')
                    .select('interview_session_id, question_relevance, ai_response_quality');

                if (fbErr || !feedbackRows || feedbackRows.length === 0) {
                    // Fall back to demo
                    setCategoryData(DEMO_DATA);
                    setUsingDemo(true);
                    return;
                }

                // 2. Collect unique session IDs to look up applications → jobs
                const sessionIds = [...new Set(feedbackRows.map((r) => r.interview_session_id).filter(Boolean))];

                // 3. Fetch applications with their job classification
                const { data: appRows, error: appErr } = await supabase
                    .from('applications_table')
                    .select('id, job_id, jobs_table ( classification )')
                    .in('id', sessionIds);

                if (appErr || !appRows || appRows.length === 0) {
                    setCategoryData(DEMO_DATA);
                    setUsingDemo(true);
                    return;
                }

                // 4. Build a map: application id → classification
                const classMap = {};
                appRows.forEach((app) => {
                    const classification = app.jobs_table?.classification;
                    if (classification) classMap[app.id] = classification;
                });

                // 5. Aggregate scores per category
                const buckets = {}; // { category: { relSum, relCount, qualSum, qualCount } }
                feedbackRows.forEach((fb) => {
                    const cat = classMap[fb.interview_session_id];
                    if (!cat) return;
                    if (!buckets[cat]) buckets[cat] = { relSum: 0, relCount: 0, qualSum: 0, qualCount: 0, total: 0 };
                    const rel = thumbsToScore(fb.question_relevance);
                    const qual = thumbsToScore(fb.ai_response_quality);
                    if (rel !== null) { buckets[cat].relSum += rel; buckets[cat].relCount += 1; }
                    if (qual !== null) { buckets[cat].qualSum += qual; buckets[cat].qualCount += 1; }
                    buckets[cat].total += 1;
                });

                const aggregated = Object.entries(buckets).map(([category, b]) => ({
                    category,
                    relevance: b.relCount > 0 ? +(b.relSum / b.relCount).toFixed(1) : 0,
                    quality: b.qualCount > 0 ? +(b.qualSum / b.qualCount).toFixed(1) : 0,
                    count: b.total,
                }));

                if (aggregated.length === 0) {
                    setCategoryData(DEMO_DATA);
                    setUsingDemo(true);
                } else {
                    setCategoryData(aggregated);
                    setUsingDemo(false);
                }
            } catch (err) {
                console.error('AIQualityAnalytics fetch error:', err);
                setCategoryData(DEMO_DATA);
                setUsingDemo(true);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    // ── Derived data ───────────────────────────────────────────────────────

    const overallAvg = (row) => +((row.relevance + row.quality) / 2).toFixed(1);

    const sorted = useMemo(() => {
        const arr = [...categoryData];
        arr.sort((a, b) => {
            let va, vb;
            if (sortKey === 'relevance') { va = a.relevance; vb = b.relevance; }
            else if (sortKey === 'quality') { va = a.quality; vb = b.quality; }
            else if (sortKey === 'count') { va = a.count; vb = b.count; }
            else { va = overallAvg(a); vb = overallAvg(b); }
            return sortAsc ? va - vb : vb - va;
        });
        return arr;
    }, [categoryData, sortKey, sortAsc]);

    const top3 = useMemo(() => {
        const byOverall = [...categoryData].sort((a, b) => overallAvg(b) - overallAvg(a));
        return byOverall.slice(0, 3).map((r) => r.category);
    }, [categoryData]);

    const bottom3 = useMemo(() => {
        const byOverall = [...categoryData].sort((a, b) => overallAvg(a) - overallAvg(b));
        return byOverall.slice(0, 3).map((r) => r.category);
    }, [categoryData]);

    const flagged = useMemo(() => {
        return categoryData.filter((r) => overallAvg(r) < 3).map((r) => r.category);
    }, [categoryData]);

    const maxBar = 5; // star scale

    const globalRelevance = categoryData.length > 0
        ? +(categoryData.reduce((s, r) => s + r.relevance, 0) / categoryData.length).toFixed(1)
        : 0;
    const globalQuality = categoryData.length > 0
        ? +(categoryData.reduce((s, r) => s + r.quality, 0) / categoryData.length).toFixed(1)
        : 0;
    const totalFeedback = categoryData.reduce((s, r) => s + r.count, 0);

    // ── Sort handler ───────────────────────────────────────────────────────
    const handleSort = (key) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(false); }
    };

    const SortIcon = ({ col }) => {
        if (sortKey !== col) return <ChevronDown size={12} className="text-slate-300" />;
        return sortAsc ? <ChevronUp size={12} className="text-blue-600" /> : <ChevronDown size={12} className="text-blue-600" />;
    };

    // ── Rank badge helper ──────────────────────────────────────────────────
    const rankBadge = (category) => {
        const topIdx = top3.indexOf(category);
        const botIdx = bottom3.indexOf(category);
        if (topIdx !== -1) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ArrowUpRight size={10} /> Top {topIdx + 1}
                </span>
            );
        }
        if (botIdx !== -1) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <ArrowDownRight size={10} /> Bottom {botIdx + 1}
                </span>
            );
        }
        return null;
    };

    // ════════════════════════════════════════════════════════════════════════
    // ── Render ──────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    return (
        <div className="space-y-6">
            {/* ── Section Header ──────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-500" />
                        AI Quality Analytics
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Feedback aggregated by job category — identify where AI prompts need refinement
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {usingDemo && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200">
                            <Info size={12} /> Sample Data
                        </span>
                    )}
                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        {[
                            { key: 'table', label: 'Table' },
                            { key: 'chart', label: 'Chart' },
                        ].map((v) => (
                            <button
                                key={v.key}
                                onClick={() => setViewMode(v.key)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                    viewMode === v.key
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Summary Cards ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        title: 'Avg Question Relevance',
                        value: globalRelevance,
                        icon: <TrendingUp size={18} className="text-blue-600" />,
                        bg: 'bg-blue-50',
                        color: 'blue',
                    },
                    {
                        title: 'Avg AI Quality',
                        value: globalQuality,
                        icon: <Sparkles size={18} className="text-indigo-600" />,
                        bg: 'bg-indigo-50',
                        color: 'indigo',
                    },
                    {
                        title: 'Total Feedback',
                        value: totalFeedback,
                        icon: <BarChart3 size={18} className="text-emerald-600" />,
                        bg: 'bg-emerald-50',
                        isStar: false,
                    },
                    {
                        title: 'Flagged Categories',
                        value: flagged.length,
                        icon: <Flag size={18} className="text-rose-600" />,
                        bg: 'bg-rose-50',
                        isStar: false,
                        alert: flagged.length > 0,
                    },
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm ${card.alert ? 'ring-1 ring-rose-200' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-xl ${card.bg}`}>{card.icon}</div>
                            {card.isStar !== false && <Stars rating={card.value} size={13} />}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {card.isStar !== false ? `${card.value} / 5` : card.value}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">{card.title}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Loading State ───────────────────────────────────────────── */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                    <span className="ml-3 text-slate-500 font-medium text-sm">Aggregating feedback data...</span>
                </div>
            )}

            {/* ── Table View ──────────────────────────────────────────────── */}
            {!loading && viewMode === 'table' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    {[
                                        { key: null, label: '' },
                                        { key: null, label: 'Job Category' },
                                        { key: 'relevance', label: 'Question Relevance' },
                                        { key: 'quality', label: 'AI Quality' },
                                        { key: 'overall', label: 'Overall' },
                                        { key: 'count', label: 'Responses' },
                                        { key: null, label: 'Rank' },
                                    ].map((col, i) => (
                                        <th
                                            key={i}
                                            onClick={col.key ? () => handleSort(col.key) : undefined}
                                            className={`px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${
                                                col.key ? 'cursor-pointer hover:text-slate-700 select-none' : ''
                                            }`}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                {col.label}
                                                {col.key && <SortIcon col={col.key} />}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((row, idx) => {
                                    const avg = overallAvg(row);
                                    const isFlagged = avg < 3;
                                    return (
                                        <motion.tr
                                            key={row.category}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className={`border-b border-slate-100 last:border-0 transition-colors ${
                                                isFlagged
                                                    ? 'bg-rose-50/40 hover:bg-rose-50/70'
                                                    : 'hover:bg-slate-50/80'
                                            }`}
                                        >
                                            {/* Flag */}
                                            <td className="px-4 py-3.5 w-10">
                                                {isFlagged && (
                                                    <span title="Average below 3 — prompt refinement needed">
                                                        <Flag size={15} className="text-rose-500 fill-rose-100" />
                                                    </span>
                                                )}
                                            </td>
                                            {/* Category */}
                                            <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                                                {row.category}
                                            </td>
                                            {/* Relevance */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <Stars rating={row.relevance} size={12} />
                                                    <span className="text-slate-700 font-semibold">{row.relevance}</span>
                                                </div>
                                            </td>
                                            {/* Quality */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <Stars rating={row.quality} size={12} />
                                                    <span className="text-slate-700 font-semibold">{row.quality}</span>
                                                </div>
                                            </td>
                                            {/* Overall */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                    avg >= 4
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : avg >= 3
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}>
                                                    {avg >= 4 ? <CheckCircle2 size={11} /> : avg >= 3 ? <AlertTriangle size={11} /> : <Flag size={11} />}
                                                    {avg}
                                                </span>
                                            </td>
                                            {/* Count */}
                                            <td className="px-4 py-3.5 text-slate-600 font-medium">{row.count}</td>
                                            {/* Rank badge */}
                                            <td className="px-4 py-3.5">{rankBadge(row.category)}</td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* ── Chart View ──────────────────────────────────────────────── */}
            {!loading && viewMode === 'chart' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
                >
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-2">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
                            Question Relevance
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block"></span>
                            AI Quality
                        </span>
                        <span className="flex items-center gap-1.5 ml-auto text-rose-500">
                            <Flag size={11} className="fill-rose-100" /> Flagged (avg &lt; 3)
                        </span>
                    </div>

                    {sorted.map((row, idx) => {
                        const avg = overallAvg(row);
                        const isFlagged = avg < 3;
                        const isTop = top3.includes(row.category);
                        const isBottom = bottom3.includes(row.category);

                        return (
                            <motion.div
                                key={row.category}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className={`rounded-xl border p-4 transition-all ${
                                    isFlagged
                                        ? 'border-rose-200 bg-rose-50/30'
                                        : isTop
                                        ? 'border-emerald-200 bg-emerald-50/20'
                                        : 'border-slate-100 bg-slate-50/30'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {isFlagged && (
                                            <Flag size={14} className="text-rose-500 fill-rose-100 flex-shrink-0" />
                                        )}
                                        <span className="font-semibold text-sm text-slate-800">{row.category}</span>
                                        {rankBadge(row.category)}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span>{row.count} responses</span>
                                        <span className={`font-bold ${avg >= 4 ? 'text-emerald-600' : avg >= 3 ? 'text-amber-600' : 'text-rose-600'}`}>
                                            {avg}/5
                                        </span>
                                    </div>
                                </div>

                                {/* Relevance bar */}
                                <div className="space-y-2">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500 font-medium">Relevance</span>
                                            <span className="font-bold text-slate-700">{row.relevance}</span>
                                        </div>
                                        <HBar value={row.relevance} max={maxBar} color="blue" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500 font-medium">AI Quality</span>
                                            <span className="font-bold text-slate-700">{row.quality}</span>
                                        </div>
                                        <HBar value={row.quality} max={maxBar} color="indigo" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* ── Flagged Categories Insight ──────────────────────────────── */}
            {!loading && flagged.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl border border-rose-200 p-6"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-rose-100 rounded-xl flex-shrink-0">
                            <AlertTriangle size={18} className="text-rose-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Prompt Refinement Needed</h3>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                The following categories have an average rating below 3 stars. The AI-generated interview
                                questions for these roles may not be sufficiently relevant or high-quality. Consider
                                reviewing and refining the prompt templates for these job categories.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {flagged.map((cat) => {
                                    const row = categoryData.find((r) => r.category === cat);
                                    return (
                                        <span
                                            key={cat}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-rose-200 text-xs font-semibold text-rose-700 shadow-sm"
                                        >
                                            <Flag size={11} className="fill-rose-100" />
                                            {cat}
                                            <span className="text-rose-400 font-normal">
                                                ({overallAvg(row)}/5)
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AIQualityAnalytics;
