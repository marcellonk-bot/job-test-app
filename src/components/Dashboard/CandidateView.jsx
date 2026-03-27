import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ChevronDown, Bookmark, X, SlidersHorizontal, Info } from 'lucide-react';
import ApplicationModal from '../Candidate/ApplicationModal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const mockJobs = [
    {
        id: '1',
        title: 'Business Consultant',
        company: 'Intuitive Systems Sdn Bhd',
        isNew: true,
        type: 'Full time',
        location: 'Kuching, Sarawak',
        postedTime: '6d ago',
        logo: 'https://logo.clearbit.com/intuitivesystems.com',
        fallbackLogoLabel: 'IS'
    },
    {
        id: '2',
        title: 'Senior Frontline Support Specialist',
        company: 'SEEK',
        isNew: true,
        type: 'Full time',
        location: 'Kuala Lumpur',
        postedTime: '2d ago',
        logo: 'https://logo.clearbit.com/seek.com',
        fallbackLogoLabel: 'SK'
    },
    {
        id: '3',
        title: 'Software Engineer - Frontend',
        company: 'Tech Innovators',
        isNew: false,
        type: 'Contract',
        location: 'Cyberjaya, Selangor',
        postedTime: '1w ago',
        logo: 'https://logo.clearbit.com/techinnovators.com',
        fallbackLogoLabel: 'TI'
    }
];

const CandidateView = () => {
    const { user } = useAuth();
    const [savedJobs, setSavedJobs] = useState([]);
    const [hiddenJobs, setHiddenJobs] = useState([]);
    
    // Application Modal State
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles_table')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (data) {
                setProfile(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSave = (id) => {
        if (savedJobs.includes(id)) {
            setSavedJobs(savedJobs.filter(jobId => jobId !== id));
        } else {
            setSavedJobs([...savedJobs, id]);
        }
    };

    const hideJob = (id) => {
        setHiddenJobs([...hiddenJobs, id]);
    };

    const openApplicationModal = (job) => {
        setSelectedJob(job);
        setIsAppModalOpen(true);
    };

    const handleApplySubmit = async (applicationData) => {
        try {
            // Note: Since mockJobs use fake text IDs like '1', '2', but Supabase requires UUID for job_id, 
            // In a real database we would fetch real jobs and pass job.id.
            // For this UI to function with mock jobs without failing the DB insert due to invalid UUID, 
            // we will simulate the submit if the job ID is not a UUID.
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationData.job_id);
            
            if (isUUID) {
                const { error } = await supabase
                    .from('applications_table')
                    .insert([{
                        job_id: applicationData.job_id,
                        candidate_id: user.id,
                        status: 'Applied'
                    }]);
                
                if (error) throw error;
            } else {
                console.log("Simulating application submission for mock job:", applicationData.job_id);
                // In production, you would remove mock jobs and fetch real jobs from jobs_table.
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        } catch (error) {
            console.error("Error submitting application:", error);
            alert("Failed to submit application. Please make sure the job exists in the database.");
        }
    };

    const visibleJobs = mockJobs.filter(job => !hiddenJobs.includes(job.id));

    return (
        <div className="min-h-screen bg-white pt-20 md:pt-24">
            {/* Hero Search Section - Resembling Jobstreet Dark Blue Banner */}
            <div className="bg-[#0b1f48] py-12 px-4 relative overflow-hidden">
                {/* Decorative circles to match screenshot */}
                <div className="absolute top-10 left-[-5%] w-64 h-64 bg-[#e60278] rounded-full opacity-90 blur-sm mix-blend-screen scale-[1.5] translate-y-20"></div>
                <div className="absolute top-4 left-[5%] w-24 h-24 bg-[#e60278] rounded-full opacity-90 blur-sm mix-blend-screen"></div>
                <div className="absolute right-0 bottom-[-20%] w-96 h-96 bg-[#1a4a9c] rounded-full opacity-50 blur-xl"></div>
                
                <div className="max-w-6xl mx-auto relative z-10 w-full">
                    {/* Search Form Area */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-4 items-end">
                        {/* What */}
                        <div className="md:col-span-4 flex flex-col gap-1.5">
                            <label className="text-white text-sm font-semibold ml-1">What</label>
                            <input 
                                type="text"
                                placeholder="Enter keywords"
                                className="w-full px-4 py-3.5 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60278]"
                            />
                        </div>
                        
                        {/* Classification */}
                        <div className="md:col-span-3 flex flex-col gap-1.5">
                            <label className="text-transparent text-sm font-semibold select-none hidden md:block">.</label>
                            <div className="relative">
                                <select className="w-full px-4 py-3.5 bg-white text-slate-600 appearance-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60278] cursor-pointer">
                                    <option>Any classification</option>
                                    <option>Information & Communication Tele...</option>
                                    <option>Sales</option>
                                    <option>Marketing</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Where */}
                        <div className="md:col-span-4 flex flex-col gap-1.5">
                            <label className="text-white text-sm font-semibold ml-1">Where</label>
                            <input 
                                type="text"
                                placeholder="Enter suburb, city, or region"
                                className="w-full px-4 py-3.5 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60278]"
                            />
                        </div>

                        {/* SEEK Button */}
                        <div className="md:col-span-1">
                            <button className="w-full bg-[#1865cc] md:bg-[#e60278] text-white font-bold py-3.5 px-4 rounded-lg hover:bg-opacity-90 transition-all flex justify-center mt-4 md:mt-0">
                                SEEK
                            </button>
                        </div>
                    </div>
                    
                    {/* More options link */}
                    <div className="flex justify-start md:justify-end mt-4">
                        <button className="text-white text-sm font-semibold flex items-center gap-1.5 hover:underline">
                            More options 
                            <SlidersHorizontal size={14} className="rotate-90" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-[#f2f5f8] min-h-[500px] py-10">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Job Listings */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Recommended</h2>
                            <Info size={18} className="text-slate-500 cursor-pointer" />
                        </div>

                        {visibleJobs.length === 0 && (
                            <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                                <p className="text-slate-500 font-medium">No more recommended jobs for now.</p>
                            </div>
                        )}

                        {visibleJobs.map((job) => (
                            <div key={job.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-grow pr-16 md:pr-0">
                                        <Link to={`/candidate`} className="text-lg font-bold text-slate-900 hover:underline decoration-[#1865cc] mb-1 inline-block">
                                            {job.title}
                                        </Link>
                                        <p className="text-[15px] text-slate-700 mb-3">{job.company}</p>
                                        
                                        {job.isNew && (
                                            <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded mb-3 border border-emerald-100">
                                                New to you
                                            </span>
                                        )}
                                        
                                        <p className="text-sm text-slate-600 mb-1">{job.type}</p>
                                        <p className="text-sm text-slate-600 mb-3">{job.location}</p>
                                        <p className="text-xs text-slate-400 font-medium">{job.postedTime}</p>
                                    </div>

                                    {/* Company Logo */}
                                    <div className="w-16 h-16 bg-slate-50 rounded border border-slate-100 flex items-center justify-center flex-shrink-0 absolute top-5 right-5 md:relative md:top-0 md:right-0 overflow-hidden">
                                        <img 
                                            src={job.logo} 
                                            alt={job.company} 
                                            className="w-full h-full object-contain p-2"
                                            onError={(e) => {
                                                e.target.onerror = null; 
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div className="hidden w-full h-full items-center justify-center font-bold text-slate-400 bg-slate-100 text-xl">
                                            {job.fallbackLogoLabel}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                    <button 
                                        onClick={() => openApplicationModal(job)}
                                        className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                                    >
                                        Apply Now
                                    </button>
                                    
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => toggleSave(job.id)}
                                            className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                                            title={savedJobs.includes(job.id) ? "Saved" : "Save job"}
                                        >
                                            <Bookmark size={20} fill={savedJobs.includes(job.id) ? "currentColor" : "none"} className={savedJobs.includes(job.id) ? "text-[#1865cc]" : ""} />
                                        </button>
                                        <button 
                                            onClick={() => hideJob(job.id)}
                                            className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors flex items-center gap-1 text-sm font-medium"
                                            title="Hide job"
                                        >
                                            <X size={20} />
                                            <span className="hidden md:inline">Hide</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Column: Saved Areas */}
                    <div className="space-y-6 pt-10">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-4">Saved searches</h2>
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative text-sm text-slate-600 leading-relaxed cursor-pointer hover:shadow-md transition-shadow">
                                Use the Save search button below the search results to save your search and receive every new job.
                                {/* Decorative corner styling resembling the screenshot's outline */}
                                <div className="absolute top-0 right-0 w-8 h-8 rounded-tr-xl border-t border-r border-[#1865cc]/20"></div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-4">Saved jobs</h2>
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative text-sm text-slate-600 leading-relaxed cursor-pointer hover:shadow-md transition-shadow">
                                Use the Save button on each job listing to save it for later. You can then access them on all your devices.
                                <div className="absolute top-0 right-0 w-8 h-8 rounded-tr-xl border-t border-r border-[#1865cc]/20"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ApplicationModal 
                isOpen={isAppModalOpen}
                onClose={() => setIsAppModalOpen(false)}
                job={selectedJob}
                profile={profile}
                onSubmit={handleApplySubmit}
            />
        </div>
    );
};

export default CandidateView;
