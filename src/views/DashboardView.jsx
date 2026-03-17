import React from 'react';
import CandidateTable from '../components/Dashboard/CandidateTable';

const DashboardView = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-6 pt-24 md:pt-32">
            <div className="max-w-7xl mx-auto">
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
            </div>
        </div>
    );
};

export default DashboardView;
