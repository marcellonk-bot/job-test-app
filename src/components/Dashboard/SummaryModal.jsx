import React, { useState } from 'react';
import { X, Brain, CheckCircle2, TrendingUp, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SummaryModal = ({ isOpen, onClose, candidate, onViewInsights }) => {
    const [activeTab, setActiveTab] = useState('resume');

    if (!candidate) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="relative p-6 md:p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-bold border border-white/20">
                                        {candidate.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{candidate.name}</h2>
                                        <div className="flex items-center gap-2 mt-1 text-blue-100">
                                            <Brain size={16} />
                                            <span className="text-sm">AI-Generated Analysis</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                                {/* Stats Breakdown */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Resume Fit</div>
                                        <div className="text-2xl font-bold text-slate-900">{candidate.resume_score}%</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Interview Performance</div>
                                        <div className="text-2xl font-bold text-slate-900">{candidate.interview_score}%</div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex space-x-6 border-b border-slate-200">
                                    <button 
                                        className={`pb-3 text-sm font-semibold transition-colors ${activeTab === 'resume' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setActiveTab('resume')}
                                    >
                                        Resume Analysis
                                    </button>
                                    <button 
                                        className={`pb-3 text-sm font-semibold transition-colors ${activeTab === 'interview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setActiveTab('interview')}
                                    >
                                        Interview Feedback
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="pt-2">
                                    {activeTab === 'resume' ? (
                                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <FileText size={16} className="text-blue-500" />
                                                    Expert Analysis
                                                </h3>
                                                <div className="text-slate-600 leading-relaxed bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50 italic">
                                                    "{candidate.summary}"
                                                </div>
                                            </div>
                                            
                                            {/* Key Strengths */}
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-4">Key Observations</h3>
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                                                        <CheckCircle2 className="text-emerald-500 mt-0.5" size={18} />
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-900">Technical Proficiency</div>
                                                            <div className="text-xs text-slate-500">Demonstrated advanced understanding of the required tech stack.</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                                                        <TrendingUp className="text-blue-500 mt-0.5" size={18} />
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-900">Growth Potential</div>
                                                            <div className="text-xs text-slate-500">Quickly adapted to challenging questions based on resume.</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    ) : (
                                        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Brain size={16} className="text-emerald-500" />
                                                    AI Score Reasoning
                                                </h3>
                                                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 space-y-4 text-slate-700">
                                                    <p>
                                                        <strong className="text-emerald-900 block mb-1">Justification:</strong>
                                                        {candidate.interview_reasoning || "The candidate provided clear, structured answers to technical questions. Showed strong problem-solving logic but hesitated slightly on system design edge cases."}
                                                    </p>
                                                    <div className="h-px w-full bg-emerald-200/50 my-2"></div>
                                                    <p>
                                                        <strong className="text-emerald-900 block mb-1">Strengths Demonstrated:</strong>
                                                        {candidate.interview_strengths || "Communication, Debugging, React Fundamentals"}
                                                    </p>
                                                    <p>
                                                        <strong className="text-emerald-900 block mb-1">Areas to Improve:</strong>
                                                        {candidate.interview_weaknesses || "Backend Architecture, Scalability Patterns"}
                                                    </p>
                                                </div>
                                            </div>

                                            {onViewInsights && (
                                                <button
                                                    onClick={() => {
                                                        onClose();
                                                        onViewInsights(candidate);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Sparkles size={16} />
                                                    View Full Interview Insights
                                                </button>
                                            )}
                                        </section>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 md:px-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <AlertCircle size={14} />
                                    <span>Confident matched (94%)</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all"
                                >
                                    Close Analysis
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


export default SummaryModal;
