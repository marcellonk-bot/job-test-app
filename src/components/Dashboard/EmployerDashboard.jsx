import React from 'react';
import CandidateTable from './CandidateTable';
import { motion } from 'framer-motion';

const EmployerDashboard = () => {
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
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                        New Job Posting
                    </button>
                </div>
            </header>

            <main>
                <CandidateTable />
            </main>
        </motion.div>
    );
};

export default EmployerDashboard;
