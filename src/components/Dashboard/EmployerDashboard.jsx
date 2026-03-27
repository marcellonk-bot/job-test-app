import React, { useState } from 'react';
import CandidateTable from './CandidateTable';
import JobPostingModal from './JobPostingModal';
import EmployerJobsTable from './EmployerJobsTable';
import { motion } from 'framer-motion';

const EmployerDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editJob, setEditJob] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleNewJob = () => {
        setEditJob(null);
        setIsModalOpen(true);
    };

    const handleEditJob = (job) => {
        setEditJob(job);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
        >
            <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 text-premium">Hiring Manager Dashboard</h1>
                    <p className="text-slate-500">Manage and rank your candidates with AI insights</p>
                </div>
            </header>

            <main>
                <EmployerJobsTable 
                    onNewJob={handleNewJob} 
                    onEditJob={handleEditJob} 
                    refreshTrigger={refreshTrigger}
                />
                <div className="mt-8">
                    <CandidateTable />
                </div>
            </main>

            <JobPostingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={handleModalSuccess}
                editJob={editJob}
            />
        </motion.div>
    );
};

export default EmployerDashboard;
