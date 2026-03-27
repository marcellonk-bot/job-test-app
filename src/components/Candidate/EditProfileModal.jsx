import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, User, FileText, Loader2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EditProfileModal = ({ isOpen, onClose, profileData, onSave }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        profile_pic_url: '',
        resume_url: '',
        skills: ''
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [picUploading, setPicUploading] = useState(false);
    const [resumeUploading, setResumeUploading] = useState(false);
    
    const picInputRef = useRef(null);
    const resumeInputRef = useRef(null);

    useEffect(() => {
        if (profileData && isOpen) {
            setFormData({
                full_name: profileData.full_name || '',
                bio: profileData.bio || '',
                profile_pic_url: profileData.profile_pic_url || '',
                resume_url: profileData.resume_url || '',
                skills: profileData.skills ? profileData.skills.join(', ') : ''
            });
        }
    }, [profileData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'pic') setPicUploading(true);
        else setResumeUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            // Prefix the file name with the user ID to satisfy the storage RLS policy
            const userId = profileData?.user_id || 'unauthenticated';
            const fileName = `${userId}/${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
            const bucket = type === 'pic' ? 'generated_media' : 'resumes';

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            const fileUrl = data.publicUrl;

            // Update local state first
            const updatedFormData = { ...formData };
            if (type === 'pic') {
                updatedFormData.profile_pic_url = fileUrl;
                setFormData(prev => ({ ...prev, profile_pic_url: fileUrl }));
            } else {
                updatedFormData.resume_url = fileUrl;
                
                // --- MOCK RESUME PARSING ---
                // Try genuine local PDF parsing first
                let parsedData = null;
                if (file.type === 'application/pdf') {
                    const { parseResumeToProfile } = await import('../../utils/resumeParser.js');
                    parsedData = await parseResumeToProfile(file);
                }

                if (parsedData) {
                    updatedFormData.full_name = updatedFormData.full_name || parsedData.full_name;
                    updatedFormData.bio = updatedFormData.bio || parsedData.bio;
                    updatedFormData.skills = updatedFormData.skills || parsedData.skills;
                }
                
                // Fallbacks if really empty
                if (!updatedFormData.full_name) {
                    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
                    updatedFormData.full_name = cleanName.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()).join(' ');
                }
                
                if (!updatedFormData.profile_pic_url) {
                    // Seed it with their name instead of random to be consistent
                    const seed = updatedFormData.full_name.replace(/\s+/g, '') || Math.random().toString(36).substring(7);
                    updatedFormData.profile_pic_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                }
                
                setFormData(updatedFormData);
            }

            // Convert skills to array safely for the final save payload
            const skillsArray = updatedFormData.skills
                .split(',')
                .map(s => s.trim())
                .filter(s => s !== '');

            const finalData = {
                ...updatedFormData,
                skills: skillsArray
            };

            // Instantly save the entire profile to the DB without closing the modal
            await onSave(finalData);
        } catch (error) {
            console.error('Error uploading file:', error.message);
            alert('Failed to upload file. ' + error.message);
        } finally {
            if (type === 'pic') setPicUploading(false);
            else setResumeUploading(false);
            e.target.value = null; // reset input
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Convert skills back to array
        const skillsArray = formData.skills
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '');

        const finalData = {
            ...formData,
            skills: skillsArray
        };

        await onSave(finalData);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit Profile</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Profile Picture Upload */}
                        <div className="flex flex-col items-center sm:flex-row gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0 border border-slate-200">
                                {formData.profile_pic_url ? (
                                    <img src={formData.profile_pic_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={32} className="text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-semibold text-slate-800 text-sm mb-1">Profile Picture</h3>
                                <p className="text-xs text-slate-500 mb-3">Upload a professional photo to stand out.</p>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    ref={picInputRef} 
                                    onChange={(e) => handleFileUpload(e, 'pic')} 
                                />
                                <button 
                                    type="button"
                                    onClick={() => picInputRef.current?.click()}
                                    disabled={picUploading}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 mx-auto sm:mx-0 w-full sm:w-auto"
                                >
                                    {picUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    {picUploading ? 'Uploading...' : 'Upload Photo'}
                                </button>
                            </div>
                        </div>

                        {/* Resume Upload */}
                        <div className="flex flex-col items-center sm:flex-row gap-6 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 border border-blue-200">
                                <FileText size={28} className={formData.resume_url ? "text-emerald-500" : "text-blue-500"} />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-semibold text-slate-800 text-sm mb-1">Resume / CV</h3>
                                <p className="text-xs text-slate-500 mb-3">
                                    {formData.resume_url ? `Current: ${formData.resume_url.split('/').pop().substring(0, 20)}...` : 'No resume uploaded yet.'}
                                </p>
                                <input 
                                    type="file" 
                                    accept=".pdf,.doc,.docx" 
                                    className="hidden" 
                                    ref={resumeInputRef} 
                                    onChange={(e) => handleFileUpload(e, 'resume')} 
                                />
                                <button 
                                    type="button"
                                    onClick={() => resumeInputRef.current?.click()}
                                    disabled={resumeUploading}
                                    className={`px-4 py-2 border text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto sm:mx-0 w-full sm:w-auto ${
                                        formData.resume_url 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                                        : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                                    }`}
                                >
                                    {resumeUploading ? <Loader2 size={16} className="animate-spin" /> : (formData.resume_url ? <Check size={16} /> : <Upload size={16} />)}
                                    {resumeUploading ? 'Uploading...' : (formData.resume_url ? 'Update Resume' : 'Upload Resume')}
                                </button>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                                <input 
                                    type="text" 
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    placeholder="e.g. Jane Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Professional Bio</label>
                                <textarea 
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                                    placeholder="Write a short bio highlighting your experience and goals..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Skills (comma separated)</label>
                                <input 
                                    type="text" 
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    placeholder="e.g. React, Node.js, Project Management"
                                />
                            </div>
                        </div>

                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        form="profile-form"
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 min-w-[120px]"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Save Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
