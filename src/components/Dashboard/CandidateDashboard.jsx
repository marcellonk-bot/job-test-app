import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Brain, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResumeUpload from '../Candidate/ResumeUpload';

const CandidateDashboard = () => {
    const [isResumeUploaded, setIsResumeUploaded] = useState(false);

    useEffect(() => {
        const savedState = localStorage.getItem('jobtify_resume_uploaded');
        if (savedState === 'true') {
            setIsResumeUploaded(true);
        }
    }, []);

    const handleUploadSuccess = () => {
        setIsResumeUploaded(true);
        localStorage.setItem('jobtify_resume_uploaded', 'true');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-5xl mx-auto space-y-8"
        >
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 text-premium">Candidate Portal</h1>
                <p className="text-slate-500">Track your application and complete required steps</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-start h-full">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                        <Brain className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">AI Interview Status</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed flex-1">
                        {isResumeUploaded 
                            ? "Resume successfully uploaded! You are ready to start the AI Interview simulation." 
                            : "Please upload your resume first to activate the AI Interview simulation."}
                    </p>
                    
                    <div className="w-full">
                        <div className="flex mb-2 items-center justify-between text-sm font-medium">
                            <span className={isResumeUploaded ? "text-emerald-600" : "text-amber-600"}>
                                {isResumeUploaded ? "Ready" : "Pending Resume"}
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
                            <div 
                                className={`h-2 rounded-full transition-all duration-1000 ${isResumeUploaded ? 'bg-emerald-500 w-full' : 'bg-amber-500 w-1/3'}`} 
                            />
                        </div>
                        
                        <div className="relative group w-full">
                            {!isResumeUploaded && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                    Upload resume first
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                </div>
                            )}
                            <Link
                                to={isResumeUploaded ? "/interview" : "#"}
                                className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isResumeUploaded
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200/50 active:scale-[0.98]'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                    }`}
                            >
                                Start Interview
                                {isResumeUploaded ? (
                                    <ArrowRight size={18} />
                                ) : (
                                    <Shield size={16} />
                                )}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Upload Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Resume Upload</h2>
                    <p className="text-xs text-slate-500 mb-6">Upload PDF/DOCX format</p>
                    <div className="w-full">
                        {isResumeUploaded ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 flex flex-col items-center justify-center">
                                <CheckCircle className="text-emerald-500 w-12 h-12 mb-3" />
                                <span className="font-semibold text-emerald-800">Resume Validated</span>
                            </div>
                        ) : (
                            <div className="scale-95 origin-top transform-gpu">
                                <ResumeUpload onSuccess={handleUploadSuccess} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
                <Clock className="min-w-6 text-blue-500 mt-1" size={24} />
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Next Steps</h3>
                    <p className="text-slate-600 text-sm mt-1">Once you complete the simulation, your score will be instantly visible to potential employers via the Hiring Manager portal.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default CandidateDashboard;
