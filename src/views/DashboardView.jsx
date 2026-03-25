import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';
import EmployerDashboard from '../components/Dashboard/EmployerDashboard';
import CandidateDashboard from '../components/Dashboard/CandidateDashboard';
import AdminDashboard from '../components/Dashboard/AdminDashboard';

const DashboardView = () => {
    const { selectedRole } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 p-6 pt-24 md:pt-32">
            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {selectedRole === 'candidate' && <CandidateDashboard key="candidate" />}
                    {selectedRole === 'employer' && <EmployerDashboard key="employer" />}
                    {selectedRole === 'admin' && <AdminDashboard key="admin" />}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DashboardView;
