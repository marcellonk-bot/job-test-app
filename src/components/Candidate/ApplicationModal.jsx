import React, { useState } from 'react';
import { X, FileText, CheckCircle, Loader2, Send } from 'lucide-react';

const ApplicationModal = ({ isOpen, onClose, job, profile, onSubmit }) => {
    const [coverLetter, setCoverLetter] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen || !job) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        await onSubmit({
            job_id: job.id,
            cover_letter: coverLetter
        });
        
        setIsSubmitting(false);
        setSuccess(true);

        setTimeout(() => {
            setSuccess(false);
            setCoverLetter('');
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1">Apply for Job</h2>
                        <p className="text-sm font-medium text-blue-600">{job.title} at {job.company}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isSubmitting || success}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0 ml-4"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="py-12 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
                                <CheckCircle className="text-emerald-500 w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Application Sent!</h3>
                            <p className="text-slate-500 text-center text-sm">Your application for {job.title} has been submitted successfully.</p>
                        </div>
                    ) : (
                        <form id="application-form" onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Resume Confirmation */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                <h4 className="font-semibold text-slate-800 text-sm mb-3">Attached Resume</h4>
                                {profile?.resume_url ? (
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                            <FileText className="text-emerald-500" size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {profile.resume_url.split('/').pop() || 'My-Resume.pdf'}
                                            </p>
                                            <p className="text-xs text-emerald-600 font-medium">Ready to submit ✓</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-amber-200">
                                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                                            <FileText className="text-amber-500" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">No Resume Found</p>
                                            <p className="text-xs text-amber-600 font-medium">Please update your profile first.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cover Letter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Cover Letter <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <textarea 
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                                    rows="5"
                                    placeholder="Why are you a great fit for this role?"
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    disabled={isSubmitting}
                                ></textarea>
                            </div>
                        </form>
                    )}
                </div>

                {!success && (
                    <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                        <button 
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            form="application-form"
                            disabled={!profile?.resume_url || isSubmitting}
                            className={`px-6 py-2.5 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 min-w-[140px]
                                ${!profile?.resume_url 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                                }`}
                        >
                            {isSubmitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Sending...</>
                            ) : (
                                <><Send size={18} /> Submit Application</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationModal;
