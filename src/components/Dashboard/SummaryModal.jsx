import React, { useState } from 'react';
import { X, Brain, CheckCircle2, TrendingUp, AlertCircle, FileText, Sparkles, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../../lib/supabase';
import { analyzeAnswer, parseTranscriptPairs, getDemoTranscript } from '../../utils/interviewAnalysis';

const SummaryModal = ({ isOpen, onClose, candidate, onViewInsights }) => {
    const [activeTab, setActiveTab] = useState('resume');
    const [isExporting, setIsExporting] = useState(false);

    if (!candidate) return null;

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            // Fetch interview transcript and job data
            let transcript = null;
            let jobTitle = 'N/A';
            let requiredSkills = [];

            try {
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
                    transcript = data[0].interview_transcript;
                    jobTitle = data[0].jobs_table?.job_title || 'N/A';
                    requiredSkills = data[0].jobs_table?.required_skills || [];
                }
            } catch {
                // Fall through to demo data
            }

            if (!transcript) {
                transcript = getDemoTranscript();
                jobTitle = 'Senior Frontend Developer';
                requiredSkills = ['React', 'TypeScript', 'Node.js', 'System Design', 'Testing'];
            }

            // Analyze the transcript
            const qaPairs = parseTranscriptPairs(transcript);
            const analyzed = qaPairs.map((pair, idx) => ({
                ...pair,
                analysis: analyzeAnswer(pair.question, pair.answer, requiredSkills, idx),
            }));

            // Compute aggregated scores
            const avgRelevance = analyzed.length > 0
                ? Math.round(analyzed.reduce((s, q) => s + q.analysis.relevance, 0) / analyzed.length) : 0;
            const avgDepth = analyzed.length > 0
                ? Math.round(analyzed.reduce((s, q) => s + q.analysis.depth, 0) / analyzed.length) : 0;
            const avgClarity = analyzed.length > 0
                ? Math.round(analyzed.reduce((s, q) => s + q.analysis.clarity, 0) / analyzed.length) : 0;
            const avgOverall = analyzed.length > 0
                ? Math.round(analyzed.reduce((s, q) => s + q.analysis.questionScore, 0) / analyzed.length) : 0;

            // Sort by score descending and take top 3
            const top3 = [...analyzed].sort((a, b) => b.analysis.questionScore - a.analysis.questionScore).slice(0, 3);

            // ── Build PDF ──────────────────────────────────────────────
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 14;
            let y = 15;

            // Header bar
            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, pageWidth, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica','bold');
            doc.text('Interview Report', margin, 18);
            doc.setFontSize(11);
            doc.setFont('helvetica','normal');
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, 27);
            doc.text('Jobtify AI Assessment Platform', margin, 34);
            y = 50;

            // Candidate Info Section
            doc.setTextColor(30, 41, 59); // slate-800
            doc.setFontSize(16);
            doc.setFont('helvetica','bold');
            doc.text('Candidate Information', margin, y);
            y += 8;

            doc.setFontSize(11);
            doc.setFont('helvetica','normal');
            doc.setTextColor(71, 85, 105); // slate-500
            doc.text(`Name:`, margin, y);
            doc.setFont('helvetica','bold');
            doc.setTextColor(30, 41, 59);
            doc.text(candidate.name || candidate.full_name || 'Unknown', margin + 30, y);
            y += 7;

            doc.setFont('helvetica','normal');
            doc.setTextColor(71, 85, 105);
            doc.text(`Job Title:`, margin, y);
            doc.setFont('helvetica','bold');
            doc.setTextColor(30, 41, 59);
            doc.text(jobTitle, margin + 30, y);
            y += 7;

            doc.setFont('helvetica','normal');
            doc.setTextColor(71, 85, 105);
            doc.text(`Resume Score:`, margin, y);
            doc.setFont('helvetica','bold');
            doc.setTextColor(30, 41, 59);
            doc.text(`${candidate.resume_score}%`, margin + 38, y);
            y += 7;

            doc.setFont('helvetica','normal');
            doc.setTextColor(71, 85, 105);
            doc.text(`Interview Score:`, margin, y);
            doc.setFont('helvetica','bold');
            doc.setTextColor(30, 41, 59);
            doc.text(`${candidate.interview_score}%`, margin + 38, y);
            y += 12;

            // Divider
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y, pageWidth - margin, y);
            y += 10;

            // Aggregated AI Scores Table
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(16);
            doc.setFont('helvetica','bold');
            doc.text('Aggregated AI Scores', margin, y);
            y += 4;

            doc.autoTable({
                startY: y,
                head: [['Metric', 'Score', 'Rating']],
                body: [
                    ['Relevance', `${avgRelevance}/100`, avgRelevance >= 70 ? 'Strong' : avgRelevance >= 50 ? 'Adequate' : 'Needs Work'],
                    ['Depth', `${avgDepth}/100`, avgDepth >= 70 ? 'Strong' : avgDepth >= 50 ? 'Adequate' : 'Needs Work'],
                    ['Clarity', `${avgClarity}/100`, avgClarity >= 70 ? 'Strong' : avgClarity >= 50 ? 'Adequate' : 'Needs Work'],
                    ['Overall', `${avgOverall}/100`, avgOverall >= 70 ? 'Strong' : avgOverall >= 50 ? 'Adequate' : 'Needs Work'],
                ],
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 4 },
                headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 50 },
                    1: { halign: 'center', cellWidth: 40 },
                    2: { halign: 'center' },
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        const val = data.cell.raw;
                        if (val === 'Strong') data.cell.styles.textColor = [5, 150, 105];
                        else if (val === 'Adequate') data.cell.styles.textColor = [217, 119, 6];
                        else data.cell.styles.textColor = [225, 29, 72];
                    }
                },
            });

            y = doc.lastAutoTable.finalY + 12;

            // Per-Question Breakdown
            doc.autoTable({
                startY: y,
                head: [['Q#', 'Relevance', 'Depth', 'Clarity', 'Score', 'Confidence']],
                body: analyzed.map(item => [
                    `Q${item.questionNum}`,
                    `${item.analysis.relevance}`,
                    `${item.analysis.depth}`,
                    `${item.analysis.clarity}`,
                    `${item.analysis.questionScore}`,
                    item.analysis.confidence.label,
                ]),
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
                headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 15 } },
            });

            y = doc.lastAutoTable.finalY + 12;

            // Check if we need a new page for the top 3 section
            if (y > doc.internal.pageSize.getHeight() - 60) {
                doc.addPage();
                y = 20;
            }

            // Divider
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y, pageWidth - margin, y);
            y += 10;

            // Top 3 Questions Feedback
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(16);
            doc.setFont('helvetica','bold');
            doc.text('Top 3 Interview Responses', margin, y);
            y += 8;

            top3.forEach((item, idx) => {
                // Check page space
                if (y > doc.internal.pageSize.getHeight() - 80) {
                    doc.addPage();
                    y = 20;
                }

                const a = item.analysis;

                // Question header
                doc.setFillColor(248, 250, 252); // slate-50
                doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 10, 2, 2, 'F');
                doc.setFontSize(11);
                doc.setFont('helvetica','bold');
                doc.setTextColor(30, 41, 59);
                doc.text(`#${idx + 1}  Q${item.questionNum} — Score: ${a.questionScore}/100 (${a.confidence.label})`, margin + 3, y + 3);
                y += 12;

                // Question text
                doc.setFont('helvetica','italic');
                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139);
                const questionLines = doc.splitTextToSize(item.question, pageWidth - margin * 2 - 6);
                doc.text(questionLines, margin + 3, y);
                y += questionLines.length * 4.5 + 4;

                // Strengths
                doc.setFont('helvetica','bold');
                doc.setFontSize(9);
                doc.setTextColor(5, 150, 105);
                doc.text('Strengths:', margin + 3, y);
                doc.setFont('helvetica','normal');
                doc.setTextColor(71, 85, 105);
                const strengthText = a.strengths.join('; ');
                const strengthLines = doc.splitTextToSize(strengthText, pageWidth - margin * 2 - 35);
                doc.text(strengthLines, margin + 28, y);
                y += strengthLines.length * 4.5 + 3;

                // Concerns
                const realConcerns = a.concerns.filter(c => c !== 'No significant concerns identified');
                if (realConcerns.length > 0) {
                    doc.setFont('helvetica','bold');
                    doc.setTextColor(217, 119, 6);
                    doc.text('Concerns:', margin + 3, y);
                    doc.setFont('helvetica','normal');
                    doc.setTextColor(71, 85, 105);
                    const concernText = realConcerns.join('; ');
                    const concernLines = doc.splitTextToSize(concernText, pageWidth - margin * 2 - 35);
                    doc.text(concernLines, margin + 28, y);
                    y += concernLines.length * 4.5 + 3;
                }

                // AI Evaluation
                doc.setFont('helvetica','bold');
                doc.setFontSize(9);
                doc.setTextColor(79, 70, 229);
                doc.text('AI Summary:', margin + 3, y);
                doc.setFont('helvetica','normal');
                doc.setTextColor(71, 85, 105);
                const evalLines = doc.splitTextToSize(a.evaluation, pageWidth - margin * 2 - 35);
                doc.text(evalLines, margin + 32, y);
                y += evalLines.length * 4.5 + 10;
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `Jobtify Interview Report — ${candidate.name || candidate.full_name} — Page ${i} of ${pageCount}`,
                    pageWidth / 2, doc.internal.pageSize.getHeight() - 8,
                    { align: 'center' }
                );
            }

            // Save
            const safeName = (candidate.name || candidate.full_name || 'candidate').replace(/\s+/g, '_');
            doc.save(`Interview_Report_${safeName}.pdf`);
        } catch (err) {
            console.error('Error generating PDF report:', err);
        } finally {
            setIsExporting(false);
        }
    };

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
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleExportPDF}
                                        disabled={isExporting}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isExporting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={16} />
                                                Export as PDF
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all"
                                    >
                                        Close Analysis
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


export default SummaryModal;
