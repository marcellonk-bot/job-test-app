import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Brain, Clock, CheckCircle, User, Edit3, FileText, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResumeUpload from '../Candidate/ResumeUpload';
import EditProfileModal from '../Candidate/EditProfileModal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const CandidateDashboard = () => {
    const { user } = useAuth();
    const [isResumeUploaded, setIsResumeUploaded] = useState(false);
    const [profile, setProfile] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        const savedState = localStorage.getItem('jobtify_resume_uploaded');
        if (savedState === 'true') {
            setIsResumeUploaded(true);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoadingProfile(true);
            const { data, error } = await supabase
                .from('profiles_table')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching profile:", error);
            }
            if (data) {
                setProfile(data);
                if (data.resume_url) {
                    setIsResumeUploaded(true);
                    localStorage.setItem('jobtify_resume_uploaded', 'true');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleSaveProfile = async (formData) => {
        try {
            const profilePayload = {
                user_id: user.id,
                ...formData
            };

            const { data: existingData } = await supabase
                .from('profiles_table')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (existingData) {
                // Update
                const { error } = await supabase
                    .from('profiles_table')
                    .update(profilePayload)
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('profiles_table')
                    .insert([profilePayload]);
                if (error) throw error;
            }

            // Also update candidates table if we wanted to sync, but we'll stick to profiles_table for now
            await fetchProfile();
        } catch (err) {
            console.error("Error saving profile:", err);
            alert("Failed to save profile.");
        }
    };

    const handleUploadSuccess = async () => {
        setIsResumeUploaded(true);
        localStorage.setItem('jobtify_resume_uploaded', 'true');
        
        // If profile doesn't have resume_url yet, update it with a mock one
        if (profile && !profile.resume_url) {
            await handleSaveProfile({
                ...profile,
                resume_url: `https://jobtify-mock-resume-${Math.floor(Math.random() * 1000)}.pdf`
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-5xl mx-auto space-y-8"
        >
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 text-premium">Candidate Portal</h1>
                    <p className="text-slate-500">Manage your profile and track applications</p>
                </div>
                <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <Edit3 size={16} /> Edit Profile
                </button>
            </header>

            {/* Profile Section */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 border border-slate-200 overflow-hidden shadow-inner">
                        {profile?.profile_pic_url ? (
                            <img src={profile.profile_pic_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-slate-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            {profile?.full_name || 'Anonymous Candidate'}
                        </h2>
                        
                        {profile?.bio ? (
                            <p className="text-slate-600 mb-6 leading-relaxed max-w-3xl">
                                {profile.bio}
                            </p>
                        ) : (
                            <p className="text-slate-400 italic mb-6">No professional bio added yet.</p>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                    <Brain size={16} className="text-blue-500" /> Top Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile?.skills && profile.skills.length > 0 ? (
                                        profile.skills.map((skill, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded border border-blue-100">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-400">No skills added.</span>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                    <FileText size={16} className="text-emerald-500" /> Resume / CV
                                </h3>
                                {profile?.resume_url ? (
                                    <div className="inline-flex items-center justify-center px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold gap-2">
                                        File Attached <CheckCircle size={16} />
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-400">No resume uploaded.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-start h-full">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                        <Briefcase className="text-blue-600" size={24} />
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
                {!profile?.resume_url && (
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
                )}
            </div>
            
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
                <Clock className="min-w-6 text-blue-500 mt-1" size={24} />
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Next Steps</h3>
                    <p className="text-slate-600 text-sm mt-1">Once you complete the simulation, your score will be instantly visible to potential employers via the Hiring Manager portal.</p>
                </div>
            </div>

            <EditProfileModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                profileData={profile || { user_id: user?.id }}
                onSave={handleSaveProfile}
            />
        </motion.div>
    );
};

export default CandidateDashboard;
