import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, MapPin, Building, DollarSign, Target, Loader2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const JobPostingModal = ({ isOpen, onClose, onSuccess, editJob }) => {
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        job_title: '',
        classification: '',
        location: '',
        work_type: 'Full-time',
        salary_range: '',
        job_description: ''
    });
    
    const [skills, setSkills] = useState([]);
    const [currentSkill, setCurrentSkill] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editJob) {
                setFormData({
                    job_title: editJob.job_title || '',
                    classification: editJob.classification || '',
                    location: editJob.location || '',
                    work_type: editJob.work_type || 'Full-time',
                    salary_range: editJob.salary_range || '',
                    job_description: editJob.job_description || ''
                });
                setSkills(editJob.required_skills || []);
            } else {
                setFormData({
                    job_title: '',
                    classification: '',
                    location: '',
                    work_type: 'Full-time',
                    salary_range: '',
                    job_description: ''
                });
                setSkills([]);
            }
            setError(null);
            setSuccess(false);
        }
    }, [editJob, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && currentSkill.trim()) {
            e.preventDefault();
            if (!skills.includes(currentSkill.trim())) {
                setSkills(prev => [...prev, currentSkill.trim()]);
            }
            setCurrentSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setSkills(prev => prev.filter(s => s !== skillToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.job_title.trim() || !formData.job_description.trim()) {
            setError('Job Title and Job Description are required.');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                company_id: user.id,
                job_title: formData.job_title,
                classification: formData.classification,
                location: formData.location,
                work_type: formData.work_type,
                salary_range: formData.salary_range,
                job_description: formData.job_description,
                required_skills: skills,
                status: 'Active'
            };

            let dbError;
            if (editJob) {
                const { error } = await supabase
                    .from('jobs_table')
                    .update(payload)
                    .eq('id', editJob.id);
                dbError = error;
            } else {
                const { error } = await supabase
                    .from('jobs_table')
                    .insert([payload]);
                dbError = error;
            }

            if (dbError) throw dbError;

            setSuccess(true);
            
            // Notify parent and reset after brief delay to show success state
            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
                // Reset form
                setFormData({
                    job_title: '',
                    classification: '',
                    location: '',
                    work_type: 'Full-time',
                    salary_range: '',
                    job_description: ''
                });
                setSkills([]);
                setSuccess(false);
            }, 1500);
            
        } catch (err) {
            console.error('Error posting job:', err);
            setError(err.message || 'Failed to post job. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editJob ? 'Edit Job Posting' : 'New Job Posting'}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {editJob ? 'Update the details for this open role.' : 'Create a new opening to attract candidates.'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                                {error}
                            </div>
                        )}
                        
                        {success ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <Check size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    {editJob ? 'Job Successfully Updated' : 'Job Successfully Posted'}
                                </h3>
                                <p className="text-slate-500">
                                    {editJob ? 'The job details have been saved.' : 'Your new job opening is now live and accepting applicants.'}
                                </p>
                            </div>
                        ) : (
                            <form id="job-posting-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Title and Classification */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Job Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="job_title"
                                            value={formData.job_title}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Senior Frontend Developer"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Classification</label>
                                        <div className="relative">
                                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                name="classification"
                                                value={formData.classification}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Engineering, Sales"
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Location, Work Type, Salary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Remote, NY"
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Work Type</label>
                                        <select
                                            name="work_type"
                                            value={formData.work_type}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-white text-sm"
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Freelance">Freelance</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Salary Range</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                name="salary_range"
                                                value={formData.salary_range}
                                                onChange={handleInputChange}
                                                placeholder="e.g. $80k - $120k"
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Job Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="job_description"
                                        value={formData.job_description}
                                        onChange={handleInputChange}
                                        placeholder="Describe the responsibilities, requirements, and what makes this role exciting..."
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
                                    />
                                </div>

                                {/* Required Skills Tags */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Required Skills</label>
                                    <div className="w-full p-2 min-h-[52px] border border-slate-200 rounded-xl bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all flex flex-wrap gap-2">
                                        {skills.map((skill, index) => (
                                            <span 
                                                key={index} 
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg"
                                            >
                                                {skill}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill)}
                                                    className="hover:bg-blue-200 text-blue-500 hover:text-blue-800 rounded-full p-0.5 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={currentSkill}
                                            onChange={(e) => setCurrentSkill(e.target.value)}
                                            onKeyDown={handleAddSkill}
                                            placeholder={skills.length === 0 ? "Type a skill and press Enter" : ""}
                                            className="flex-1 bg-transparent border-none outline-none min-w-[150px] px-2 text-sm"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">Enter</kbd> to add a skill tag.</p>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    {!success && (
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="job-posting-form"
                                disabled={isSubmitting || !formData.job_title.trim() || !formData.job_description.trim()}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-40"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        {editJob ? 'Save Changes' : 'Confirm & Post'}
                                        <Target size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default JobPostingModal;
