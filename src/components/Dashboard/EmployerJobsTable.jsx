import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Clock, MapPin, Briefcase, RefreshCw } from 'lucide-react';

const EmployerJobsTable = ({ onNewJob, onEditJob, refreshTrigger }) => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(null);

    const [jobToDelete, setJobToDelete] = useState(null);

    const fetchJobs = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('jobs_table')
                .select('*')
                .eq('company_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setJobs(data || []);
        } catch (err) {
            console.error("Error fetching jobs:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [user, refreshTrigger]);

    const confirmDelete = async (jobId) => {
        setIsDeleting(jobId);
        try {
            const { error } = await supabase
                .from('jobs_table')
                .delete()
                .eq('id', jobId);
                
            if (error) throw error;
            
            setJobs(prev => prev.filter(job => job.id !== jobId));
            setJobToDelete(null);
        } catch (err) {
            console.error("Error deleting job:", err);
            alert("Failed to delete the job. Please try again.");
        } finally {
            setIsDeleting(null);
        }
    };

    const getDaysAgo = (dateString) => {
        if (!dateString) return 0;
        const diffTime = Math.abs(new Date() - new Date(dateString));
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">My Job Postings</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage your active listings and track their status</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={fetchJobs}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent shadow-none"
                        title="Refresh Jobs"
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={onNewJob}
                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <Plus size={16} />
                        New Job Posting
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Role</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <RefreshCw className="animate-spin mb-3 text-slate-400" size={24} />
                                        <p>Loading your job postings...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : jobs.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 max-w-md mx-auto">
                                        <Briefcase className="text-slate-300 mb-3" size={32} />
                                        <p className="font-medium text-slate-900 mb-1">No jobs posted yet</p>
                                        <p className="text-sm mb-4">Create your first job posting to attract top talent.</p>
                                        <button 
                                            onClick={onNewJob}
                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm"
                                        >
                                            Create Job
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-semibold text-slate-900">{job.job_title}</div>
                                        <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                                            <Clock size={14} /> 
                                            {getDaysAgo(job.created_at) === 0 ? 'Posted Today' : `Posted ${getDaysAgo(job.created_at)} days ago`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            {job.classification && (
                                                <div className="text-sm text-slate-600 flex items-center gap-1.5">
                                                    <Briefcase size={14} className="text-slate-400" />
                                                    {job.classification}
                                                </div>
                                            )}
                                            {job.location && (
                                                <div className="text-sm text-slate-600 flex items-center gap-1.5">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    {job.location}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                            job.status === 'Active' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEditJob(job)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Job"
                                                disabled={isDeleting === job.id}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => setJobToDelete(job)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Job"
                                                disabled={isDeleting === job.id}
                                            >
                                                {isDeleting === job.id ? (
                                                    <RefreshCw size={18} className="animate-spin text-red-500" />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {jobToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <div className="flex items-center gap-3 mb-2 text-red-600">
                            <div className="p-2 bg-red-50 rounded-full">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Delete Job Posting</h3>
                        </div>
                        <p className="text-slate-500 mb-6 text-sm">
                            Are you sure you want to delete <span className="font-semibold text-slate-800">"{jobToDelete.job_title}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setJobToDelete(null)} 
                                disabled={isDeleting === jobToDelete.id}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => confirmDelete(jobToDelete.id)} 
                                disabled={isDeleting === jobToDelete.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 text-sm font-semibold transition-colors disabled:opacity-50 min-w-[110px] justify-center"
                            >
                                {isDeleting === jobToDelete.id ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={16}/>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16}/>
                                        Delete Job
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployerJobsTable;
