import React from 'react';
import { Users, ShieldAlert, Activity, Database, Server, Fingerprint } from 'lucide-react';

const AdminView = () => {
    // TODO: Verify Supabase JWT custom claims for Admin access here
    // Example: const { data } = await supabase.auth.getUser(); 
    // if (data.user.user_metadata.role !== 'admin') throw new Error('Unauthorized');

    return (
        <div className="min-h-screen bg-slate-50 p-6 pt-24 md:pt-32">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Super Admin Console</h1>
                    <p className="text-slate-500">System overview, security status, and user management.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Stat Card 1 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
                            <h3 className="text-2xl font-bold text-slate-900">1,204</h3>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Sessions</p>
                            <h3 className="text-2xl font-bold text-slate-900">342</h3>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                            <Database size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Storage Used</p>
                            <h3 className="text-2xl font-bold text-slate-900">45 GB</h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* System Logs */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <Server size={18} className="text-slate-400" />
                            <h2 className="font-bold text-slate-900">Recent System Logs</h2>
                        </div>
                        <div className="p-0">
                            {[
                                { time: '10:42 AM', event: 'Database Backup Completed', type: 'info' },
                                { time: '09:15 AM', event: 'High CPU Usage on Worker Node 3', type: 'warning' },
                                { time: '08:00 AM', event: 'New Deployment Successful', type: 'success' },
                            ].map((log, i) => (
                                <div key={i} className="px-6 py-4 flex items-center gap-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <span className="text-xs font-mono text-slate-400 w-16">{log.time}</span>
                                    <span className={`w-2 h-2 rounded-full ${
                                        log.type === 'warning' ? 'bg-amber-400' :
                                        log.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'
                                    }`} />
                                    <span className="text-sm font-medium text-slate-700">{log.event}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Status */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <ShieldAlert size={18} className="text-slate-400" />
                            <h2 className="font-bold text-slate-900">Security Status</h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                <ShieldAlert size={28} className="text-emerald-600" />
                                <div>
                                    <h3 className="font-bold text-emerald-800">All Systems Secure</h3>
                                    <p className="text-sm text-emerald-600">No active threats detected in the last 24 hours.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pointer-events-none">
                                    <div className="flex items-center gap-3">
                                        <Fingerprint size={16} className="text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700">MFA Enrolled Users</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">86%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 w-[86%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminView;
