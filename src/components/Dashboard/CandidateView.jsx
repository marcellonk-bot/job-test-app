import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, Bookmark, X, SlidersHorizontal, Info, CheckCircle2, ArrowRight } from 'lucide-react';
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

const CLASSIFICATION_OPTIONS = [
    'Any classification',
    'Information & Communication Technology',
    'Sales',
    'Marketing',
    'Engineering',
    'Accounting',
    'Administration & Office Support',
    'Healthcare & Medical',
    'Education & Training',
    'Hospitality & Tourism',
    'Design & Architecture',
    'Human Resources & Recruitment',
];

const CandidateView = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [savedJobs, setSavedJobs] = useState([]);
    const [hiddenJobs, setHiddenJobs] = useState([]);

    // Search state
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchClassification, setSearchClassification] = useState('Any classification');
    const [searchLocation, setSearchLocation] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [dbJobs, setDbJobs] = useState([]);

    // Application Modal State
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [profile, setProfile] = useState(null);

    // Track applied jobs with their application IDs
    const [appliedJobs, setAppliedJobs] = useState({});

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchAppliedJobs();
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

    const fetchAppliedJobs = async () => {
        try {
            const { data, error } = await supabase
                .from('applications_table')
                .select('id, job_id')
                .eq('candidate_id', user.id);

            if (data) {
                // Create a map of job_id -> application_id
                const appliedMap = {};
                data.forEach(app => {
                    appliedMap[app.job_id] = app.id;
                });
                setAppliedJobs(appliedMap);
            }
        } catch (err) {
            console.error('Error fetching applied jobs:', err);
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
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationData.job_id);

            if (isUUID) {
                const { data, error } = await supabase
                    .from('applications_table')
                    .insert([{
                        job_id: applicationData.job_id,
                        candidate_id: user.id,
                        status: 'Applied'
                    }])
                    .select()
                    .single();

                if (error) throw error;

                // Update applied jobs state with the new application
                if (data) {
                    setAppliedJobs(prev => ({
                        ...prev,
                        [data.job_id]: data.id
                    }));
                }
            } else {
                // Simulate for mock jobs
                console.log("Simulating application submission for mock job:", applicationData.job_id);
                await new Promise(resolve => setTimeout(resolve, 800));
                // Add to applied jobs with mock ID
                setAppliedJobs(prev => ({
                    ...prev,
                    [applicationData.job_id]: `mock-app-${applicationData.job_id}`
                }));
            }
        } catch (error) {
            console.error("Error submitting application:", error);
            alert("Failed to submit application. Please make sure the job exists in the database.");
        }
    };

    const startInterview = (jobId) => {
        const applicationId = appliedJobs[jobId];
        if (applicationId) {
            // Store application_id in localStorage as fallback
            localStorage.setItem('current_application_id', applicationId);
            // Navigate to interview with application_id
            navigate(`/interview?application_id=${applicationId}`);
        }
    };

    const handleSearch = async (e) => {
        e?.preventDefault();
        setIsSearching(true);
        setHasSearched(true);

        try {
            // Build Supabase query
            let query = supabase
                .from('jobs_table')
                .select('*')
                .order('created_at', { ascending: false });

            if (searchKeyword.trim()) {
                query = query.or(`job_title.ilike.%${searchKeyword.trim()}%,job_description.ilike.%${searchKeyword.trim()}%`);
            }
            if (searchClassification !== 'Any classification') {
                query = query.ilike('classification', `%${searchClassification}%`);
            }
            if (searchLocation.trim()) {
                query = query.ilike('location', `%${searchLocation.trim()}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Search error:', error);
                setDbJobs([]);
            } else {
                // Normalize DB jobs to match mock job shape
                const normalized = (data || []).map(job => ({
                    id: job.id,
                    title: job.job_title,
                    company: job.company_name || 'Unknown Company',
                    isNew: job.created_at && (Date.now() - new Date(job.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000,
                    type: job.job_type || 'Full time',
                    location: job.location || '',
                    classification: job.classification || '',
                    postedTime: job.created_at ? getRelativeTime(job.created_at) : '',
                    logo: job.company_name ? `https://logo.clearbit.com/${job.company_name.toLowerCase().replace(/\s+/g, '')}.com` : '',
                    fallbackLogoLabel: (job.company_name || 'UK').substring(0, 2).toUpperCase(),
                    description: job.job_description,
                }));
                setDbJobs(normalized);
            }
        } catch (err) {
            console.error('Search failed:', err);
            setDbJobs([]);
        } finally {
            setIsSearching(false);
        }
    };

    const getRelativeTime = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return '1d ago';
        if (days < 7) return `${days}d ago`;
        if (days < 30) return `${Math.floor(days / 7)}w ago`;
        return `${Math.floor(days / 30)}mo ago`;
    };

    // Filter mock jobs by search criteria (client-side)
    const filterMockJobs = (jobs) => {
        if (!hasSearched) return jobs;
        return jobs.filter(job => {
            const kw = searchKeyword.trim().toLowerCase();
            const loc = searchLocation.trim().toLowerCase();
            const matchesKeyword = !kw || job.title.toLowerCase().includes(kw) || job.company.toLowerCase().includes(kw);
            const matchesLocation = !loc || job.location.toLowerCase().includes(loc);
            return matchesKeyword && matchesLocation;
        });
    };

    // Combine filtered mock jobs with DB search results
    const allJobs = hasSearched
        ? [...filterMockJobs(mockJobs), ...dbJobs]
        : mockJobs;

    const visibleJobs = allJobs.filter(job => !hiddenJobs.includes(job.id));

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
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-4 items-end">
                        {/* What */}
                        <div className="md:col-span-4 flex flex-col gap-1.5">
                            <label className="text-white text-sm font-semibold ml-1">What</label>
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder="Enter keywords"
                                className="w-full px-4 py-3.5 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60278]"
                            />
                        </div>

                        {/* Classification */}
                        <div className="md:col-span-3 flex flex-col gap-1.5">
                            <label className="text-transparent text-sm font-semibold select-none hidden md:block">.</label>
                            <div className="relative">
                                <select
                                    value={searchClassification}
                                    onChange={(e) => setSearchClassification(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-white text-slate-600 appearance-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60278] cursor-pointer"
                                >
                                    {CLASSIFICATION_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Where */}
                        <div className="md:col-span-4 flex flex-col gap-1.5">
                            <label className="text-white text-sm font-semibold ml-1">Where</label>
                            <input
                                type="text"
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                                placeholder="Enter suburb, city, or region"
                                className="w-full px-4 py-3.5 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e60278]"
                            />
                        </div>

                        {/* SEEK Button */}
                        <div className="md:col-span-1">
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="w-full bg-[#1865cc] md:bg-[#e60278] text-white font-bold py-3.5 px-4 rounded-lg hover:bg-opacity-90 transition-all flex justify-center mt-4 md:mt-0 disabled:opacity-60"
                            >
                                {isSearching ? '...' : 'SEEK'}
                            </button>
                        </div>
                    </form>
                    
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
                                    <div className="flex items-center gap-3">
                                        {appliedJobs[job.id] ? (
                                            <>
                                                <button
                                                    disabled
                                                    className="px-5 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 cursor-not-allowed flex items-center gap-2"
                                                >
                                                    <CheckCircle2 size={18} />
                                                    Applied
                                                </button>
                                                <button
                                                    onClick={() => startInterview(job.id)}
                                                    className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 group"
                                                >
                                                    Start Interview
                                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => openApplicationModal(job)}
                                                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                                            >
                                                Apply Now
                                            </button>
                                        )}
                                    </div>

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
