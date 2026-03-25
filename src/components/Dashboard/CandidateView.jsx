import React from 'react';
import ResumeUpload from '../Candidate/ResumeUpload';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';

const CandidateView = () => {
    // For demo purposes, we check local storage to see if resume is uploaded
    const isResumeUploaded = localStorage.getItem('jobtify_resume_uploaded') === 'true' || localStorage.getItem('jobtify_resume_data');

    const handleUploadSuccess = () => {
        localStorage.setItem('jobtify_resume_uploaded', 'true');
        // Simple reload to refresh the state in this demo component
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 pt-24 md:pt-32">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Candidate Portal</h1>
                    <p className="text-slate-500">Fast-track your application with AI screening</p>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
                    {!isResumeUploaded ? (
                        <>
                            <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Step 1: Upload Your Resume</h2>
                            <ResumeUpload onSuccess={handleUploadSuccess} />
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Resume Processed!</h2>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">Your resume has been successfully parsed. You are now ready to take the AI Interview.</p>
                            
                            <Link
                                to="/interview"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                            >
                                Start AI Interview
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CandidateView;
