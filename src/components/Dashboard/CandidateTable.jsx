import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Eye, FileText, BadgeCheck, Download, FileOutput, Brain, Users, Sparkles, ClipboardCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../../lib/supabase';
import SummaryModal from './SummaryModal';
import AIInterviewInsights from './AIInterviewInsights';
import FinalReviewModal, { BADGE_STYLES } from './FinalReviewModal';

const CandidateTable = () => {
    const [candidates, setCandidates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [insightsCandidate, setInsightsCandidate] = useState(null);
    const [isInsightsOpen, setIsInsightsOpen] = useState(false);
    const [reviewCandidate, setReviewCandidate] = useState(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [minResumeScore, setMinResumeScore] = useState(0);

    useEffect(() => {
        const processAndFetch = async () => {
            setIsLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;
                if (user) {
                    const savedData = localStorage.getItem('jobtify_resume_data');
                    if (savedData) {
                        const parsedData = JSON.parse(savedData);
                        const { error } = await supabase
                            .from('candidates')
                            .insert([{
                                user_id: user.id,
                                full_name: user?.user_metadata?.full_name || parsedData.fileName.split('.')[0] || 'Candidate',
                                resume_score: parsedData.score,
                                summary: parsedData.summary,
                                interview_score: 0
                            }]);
                            
                        if (!error) {
                            localStorage.removeItem('jobtify_resume_data');
                        }
                    }
                }
            } catch (e) {
                console.error('Error processing pending resume:', e);
            } finally {
                fetchCandidates();
            }
        };

        processAndFetch();
    }, []);

    const fetchCandidates = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('candidates')
                .select('*');

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
                const rankedData = data.map(item => ({
                    ...item,
                    name: item.full_name || 'Candidate',
                    total_score: (Number(item.resume_score) || 0) + (Number(item.interview_score) || 0)
                })).sort((a, b) => b.total_score - a.total_score).map((item, index) => ({
                    ...item,
                    overall_rank: index + 1
                }));
                setCandidates(rankedData);
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

    const openInsights = (candidate) => {
        setInsightsCandidate(candidate);
        setIsInsightsOpen(true);
    };

    const openReview = (candidate) => {
        setReviewCandidate(candidate);
        setIsReviewOpen(true);
    };

    const handleReviewSaved = (updatedCandidate) => {
        setCandidates(prev =>
            prev.map(c =>
                c.id === updatedCandidate.id
                    ? { ...c, recommendation: updatedCandidate.recommendation, employer_notes: updatedCandidate.employer_notes }
                    : c
            )
        );
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

    const handleExportPDF = () => {
        if (!candidates.length) return;

        const doc = new jsPDF();
        
        // Add styling and title
        doc.setFontSize(18);
        doc.text('Jobtify Candidate Rankings', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

        // Prepare data
        const tableColumn = ["Rank", "Name", "Resume Score", "Interview Score", "Total"];
        const tableRows = candidates.map(c => [
            `#${c.overall_rank}`,
            c.name,
            `${c.resume_score}%`,
            `${c.interview_score}%`,
            c.total_score
        ]);

        // Generate Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [37, 99, 235] } // Blue-600
        });

        // Download document
        doc.save('jobtify_candidate_rankings.pdf');
    };

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (Number(c.resume_score) || 0) >= minResumeScore
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
                <div className="flex items-center gap-2 relative">
                    <button 
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${showFilterMenu || minResumeScore > 0 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-600 hover:bg-slate-50 border-slate-100'}`}>
                        <Filter size={16} />
                        Filters
                    </button>
                    {showFilterMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Min Resume Score
                            </div>
                            {[
                                { label: 'All Scores', value: 0 },
                                { label: '> 70%', value: 70 },
                                { label: '> 80%', value: 80 },
                                { label: '> 90%', value: 90 }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setMinResumeScore(option.value);
                                        setShowFilterMenu(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${minResumeScore === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
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
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">Loading candidates...</td>
                            </tr>
                        ) : filteredCandidates.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                        <div className="flex justify-center mb-6 relative">
                                            <div className="absolute inset-x-0 bottom-0 h-2 bg-slate-100 rounded-full blur-sm"></div>
                                            <div className="relative z-10 w-24 h-24 bg-slate-50 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                                                <Users size={40} className="text-slate-400" />
                                            </div>
                                            <div className="absolute top-0 -right-2 w-10 h-10 bg-indigo-50 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-20">
                                                <Brain size={16} className="text-indigo-500" />
                                            </div>
                                            <div className="absolute bottom-2 -left-2 w-8 h-8 bg-emerald-50 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-20">
                                                <Sparkles size={14} className="text-emerald-500" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Awaiting Talent</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Once candidates complete their AI interviews, their scores will appear here.
                                        </p>
                                    </div>
                                </td>
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
                                <td className="px-6 py-4 text-center">
                                    {candidate.recommendation ? (
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${BADGE_STYLES[candidate.recommendation] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {candidate.recommendation}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400">Pending</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <button
                                            onClick={() => openSummary(candidate)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View AI Summary"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => openInsights(candidate)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="AI Interview Insights"
                                        >
                                            <Brain size={18} />
                                        </button>
                                        <button
                                            onClick={() => openReview(candidate)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-900 rounded-lg transition-all border border-slate-200 hover:border-slate-900"
                                            title="Review Candidate"
                                        >
                                            <ClipboardCheck size={14} />
                                            <span className="hidden lg:inline">Review</span>
                                        </button>
                                    </div>
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
                onViewInsights={(c) => {
                    setIsModalOpen(false);
                    openInsights(c);
                }}
            />

            <AIInterviewInsights
                isOpen={isInsightsOpen}
                onClose={() => setIsInsightsOpen(false)}
                candidate={insightsCandidate}
            />

            <FinalReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                candidate={reviewCandidate}
                onSaved={handleReviewSaved}
            />
        </div>
    );
};

export default CandidateTable;
