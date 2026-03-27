import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, CheckCircle, Shield, Zap, Star, Sparkles, Briefcase, Users, ChevronRight, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ResumeUpload from '../components/Candidate/ResumeUpload';
import { useAuth } from '../contexts/AuthContext';
import CandidateView from '../components/Dashboard/CandidateView';
import { supabase } from '../lib/supabase';

const HomeView = () => {
    const { user, selectedRole } = useAuth();
    const [isResumeUploaded, setIsResumeUploaded] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);

    useEffect(() => {
        const savedState = localStorage.getItem('jobtify_resume_uploaded');
        if (savedState === 'true') {
            setIsResumeUploaded(true);
        }

        const fetchJobs = async () => {
            setIsLoadingJobs(true);
            try {
                const { data, error } = await supabase
                    .from('jobs_table')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                setJobs(data || []);
            } catch (err) {
                console.error("Error fetching jobs:", err);
            } finally {
                setIsLoadingJobs(false);
            }
        };

        fetchJobs();
    }, []);

    const handleUploadSuccess = () => {
        setIsResumeUploaded(true);
        localStorage.setItem('jobtify_resume_uploaded', 'true');
    };

    const getDaysAgo = (dateString) => {
        if (!dateString) return 0;
        const diffTime = Math.abs(new Date() - new Date(dateString));
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    if (user && selectedRole === 'candidate') {
        return <CandidateView />;
    }

    return (
        <div className="relative overflow-hidden pt-24 md:pt-32">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] -z-10 opacity-30 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[40%] bg-indigo-500 blur-[100px] rounded-full" />
            </div>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center mb-24 md:mb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-8 border border-blue-100 shadow-sm">
                        <Star size={16} fill="currentColor" />
                        <span>Trusted by 500+ Top Recruiters</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight leading-[1.1]">
                        Next-Gen AI <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Recruitment Platform
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-12 leading-relaxed">
                        Automate your hiring process with AI-driven interview simulations and real-time candidate ranking. Find the perfect talent in minutes, not weeks.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {selectedRole === 'employer' ? (
                            <Link
                                to="/dashboard"
                                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 group active:scale-95"
                            >
                                Post a New Job
                                <Briefcase size={20} className="group-hover:scale-110 transition-transform" />
                            </Link>
                        ) : (
                            <div className="relative group w-full sm:w-auto">
                                {!isResumeUploaded && (
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                                        Please upload your resume first
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                                    </div>
                                )}
                                <Link
                                    to={isResumeUploaded ? "/interview" : "#"}
                                    className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 group active:scale-95 ${isResumeUploaded
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200'
                                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                        }`}
                                >
                                    Start AI Interview
                                    {isResumeUploaded ? (
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    ) : (
                                        <Shield size={18} className="text-slate-300" />
                                    )}
                                </Link>
                            </div>
                        )}
                        <Link
                            to="/dashboard"
                            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                            {selectedRole === 'employer' ? 'Manage Candidates' : 'Recruiter Dashboard'}
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Job Postings Section */}
            <section className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 mb-24 md:mb-32">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Active Job Openings</h2>
                    <p className="text-slate-500 max-w-xl mx-auto">Discover roles currently hiring and see real-time statistics on applicants and interview progress.</p>
                </div>
                
                <div className="grid gap-4">
                    {isLoadingJobs ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                            <Clock className="animate-spin mb-4" size={24} />
                            <p>Loading active roles...</p>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
                            No active job openings at the moment.
                        </div>
                    ) : jobs.map(job => (
                        <motion.div 
                            key={job.id} 
                            whileHover={{ y: -2 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.job_title}</h3>
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${job.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                        {job.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                    {job.classification && <span className="flex items-center gap-1.5"><Briefcase size={16} /> {job.classification}</span>}
                                    <span className="flex items-center gap-1.5"><Clock size={16} /> {getDaysAgo(job.created_at) === 0 ? 'Today' : `${getDaysAgo(job.created_at)} days ago`}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 md:gap-12">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-900">0</p>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Applied</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-900">0</p>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Interviewed</p>
                                </div>
                                <div className="hidden md:flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Resume Upload Section */}
            {selectedRole !== 'employer' && (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-4xl mx-auto mb-24 md:mb-32 px-4"
                >
                    <div className="bg-white/50 backdrop-blur-xl border border-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-blue-100/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Sparkles size={120} className="text-blue-600" />
                        </div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
                                    Ready to fast-track <br />
                                    <span className="text-blue-600">your application?</span>
                                </h2>
                                <p className="text-slate-500 mb-8 leading-relaxed">
                                    Upload your resume now. Our AI will analyze your experience and match you with the best roles and interview simulations in seconds.
                                </p>
                                <div className="space-y-4">
                                    {[
                                        "Instant parsing of PDF/DOCX",
                                        "AI-powered skills mapping",
                                        "Automated interview prep"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                <CheckCircle size={14} className="text-blue-600" />
                                            </div>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <ResumeUpload onSuccess={handleUploadSuccess} />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Features Grid */}
            <section className="bg-slate-50 py-24 border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Everything you need to hire at scale</h2>
                        <p className="text-slate-500 max-w-xl mx-auto">Powerful AI tools designed for modern recruitment teams.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Zap className="text-yellow-500" size={24} />,
                                title: "Instant Ranking",
                                description: "Our AI automatically ranks candidates based on their resume and interview performance."
                            },
                            {
                                icon: <Shield className="text-emerald-500" size={24} />,
                                title: "Verified Skills",
                                description: "Simulation interviews test real-world technical and soft skills under pressure."
                            },
                            {
                                icon: <Brain className="text-blue-500" size={24} />,
                                title: "AI Analysis",
                                description: "Get deep insights into candidate potential with LLM-generated detailed analysis."
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all"
                            >
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 text-center border-t border-slate-100 pt-12">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Brain className="text-blue-600" size={24} />
                        <span className="text-xl font-bold text-slate-900">Jobtify.my</span>
                    </div>
                    <p className="text-slate-400 text-sm">© 2026 Jobtify.my. All rights reserved. Built with Advanced AI.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomeView;
