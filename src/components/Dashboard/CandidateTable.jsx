import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Eye, FileText, BadgeCheck, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SummaryModal from './SummaryModal';

const CandidateTable = () => {
    const [candidates, setCandidates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .order('overall_rank', { ascending: true });

            if (error) throw error;

            // Fallback data for demonstration if table is empty
            if (!data || data.length === 0) {
                setCandidates([
                    { id: 1, name: 'Alex Johnson', resume_score: 92, interview_score: 88, overall_rank: 1, summary: 'Highly skilled senior developer with strong problem-solving abilities. Showed excellent communication during the interview.' },
                    { id: 2, name: 'Sarah Chen', resume_score: 85, interview_score: 94, overall_rank: 2, summary: 'Exceptional interview performance. Strong technical foundation, though slightly less experience than rank #1.' },
                    { id: 3, name: 'Michael Smith', resume_score: 89, interview_score: 82, overall_rank: 3, summary: 'Solid all-around candidate. Good technical skills, but could improve on system design depth.' },
                    { id: 4, name: 'Emily Davis', resume_score: 78, interview_score: 85, overall_rank: 4, summary: 'High potential. Excellent soft skills and eager to learn, despite lower resume score.' },
                ]);
            } else {
                setCandidates(data);
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);
            // Fallback for demo
            setCandidates([
                { id: 1, name: 'Alex Johnson', resume_score: 92, interview_score: 88, overall_rank: 1, summary: 'Highly skilled senior developer with strong problem-solving abilities. Showed excellent communication during the interview.' },
                { id: 2, name: 'Sarah Chen', resume_score: 85, interview_score: 94, overall_rank: 2, summary: 'Exceptional interview performance. Strong technical foundation, though slightly less experience than rank #1.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const openSummary = (candidate) => {
        setSelectedCandidate(candidate);
        setIsModalOpen(true);
    };

    const handleExportCSV = () => {
        if (!candidates.length) return;

        const headers = ['Name', 'Resume Score', 'Interview Score', 'Overall Rank'];
        const csvRows = [
            headers.join(','),
            ...candidates.map(candidate => [
                `"${candidate.name}"`,
                candidate.resume_score,
                candidate.interview_score,
                candidate.overall_rank
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'jobtify_candidate_rankings.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search candidates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                        <Filter size={16} />
                        Filters
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Resume Score</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Interview Score</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Overall Rank</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Loading candidates...</td>
                            </tr>
                        ) : filteredCandidates.map((candidate) => (
                            <tr key={candidate.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                            {candidate.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{candidate.name}</div>
                                            <div className="text-xs text-slate-500">Applied 2 days ago</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">
                                        {candidate.resume_score}%
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
                                        {candidate.interview_score}%
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${candidate.overall_rank === 1 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                        candidate.overall_rank === 2 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                            'bg-slate-50 text-slate-500'
                                        }`}>
                                        Rank #{candidate.overall_rank}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => openSummary(candidate)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="View AI Summary"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <SummaryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                candidate={selectedCandidate}
            />
        </div>
    );
};

export default CandidateTable;
