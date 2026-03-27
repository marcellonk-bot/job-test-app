import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Eye, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const EmployerInterviewSummary = () => {
    const [candidates, setCandidates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInterviewedCandidates();
    }, []);

    const fetchInterviewedCandidates = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('candidates')
                .select('*');

            if (error) throw error;

            if (!data || data.length === 0) {
                // Fallback mock data
                setCandidates([
                    { id: 1, name: 'Alex Johnson', role: 'Senior Developer', interview_score: 88, status: 'Completed', ai_notes: 'Strong problem-solving. Good communication.' },
                    { id: 2, name: 'Sarah Chen', role: 'Product Manager', interview_score: 94, status: 'Completed', ai_notes: 'Excellent product sense. Structured answers.' },
                    { id: 3, name: 'Michael Smith', role: 'UX Designer', interview_score: 0, status: 'In Progress', ai_notes: 'Interview currently ongoing.' },
                ]);
            } else {
                const processedData = data.map(item => ({
                    id: item.id,
                    name: item.full_name || 'Candidate',
                    role: 'Software Engineer', // Default mock role
                    interview_score: item.interview_score || 0,
                    status: item.interview_score > 0 ? 'Completed' : 'Pending',
                    ai_notes: item.summary || 'No insights available yet.'
                })).sort((a, b) => b.interview_score - a.interview_score);
                setCandidates(processedData);
            }
        } catch (error) {
            console.error('Error fetching interviewed candidates:', error);
            setCandidates([
                { id: 1, name: 'Alex Johnson', role: 'Senior Developer', interview_score: 88, status: 'Completed', ai_notes: 'Strong problem-solving. Good communication.' },
                { id: 2, name: 'Sarah Chen', role: 'Product Manager', interview_score: 94, status: 'Completed', ai_notes: 'Excellent product sense. Structured answers.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full flex flex-col"
        >
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">AI Interview Simulations</h1>
                <p className="text-slate-500">Review summaries and scores of candidates who completed the AI interview.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search applicants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                        <Filter size={16} />
                        Filters
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50/50">
                    <div className="grid gap-4">
                        {isLoading ? (
                            <div className="text-center py-12 text-slate-400">Loading interview summaries...</div>
                        ) : filteredCandidates.map((candidate) => (
                            <div key={candidate.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                            {candidate.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{candidate.name}</h3>
                                            <p className="text-sm text-slate-500">{candidate.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {candidate.status === 'Completed' ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-2xl font-bold text-slate-900">{candidate.interview_score}%</span>
                                                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle size={12} /> Score
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-medium border border-amber-100">
                                                <Clock size={16} /> Pending
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {candidate.status === 'Completed' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">AI Interview Insights</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            {candidate.ai_notes}
                                        </p>
                                        <div className="mt-4 flex justify-end">
                                            <button className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                                                <Eye size={16} />
                                                View Full Transcript
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default EmployerInterviewSummary;
