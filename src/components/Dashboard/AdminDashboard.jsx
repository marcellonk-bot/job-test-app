import React from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, ShieldAlert, Server, AlertCircle, CheckCircle2 } from 'lucide-react';

const AdminDashboard = () => {
    // TODO: Insert Supabase JWT role verification here
    // Example: supabase.auth.getSession().then(({ data }) => checkRole(data.session.user.app_metadata.role === 'admin'))
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full space-y-8"
        >
            <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 text-premium">Super Admin Console</h1>
                    <p className="text-slate-500">System overview, metrics, and global settings</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold tracking-wide flex items-center gap-1 shadow-inner shadow-emerald-200/50">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        System Online
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Total Users", icon: <Users size={20} className="text-blue-600"/>, value: "12,450", change: "+14.5%", bg: "bg-blue-50" },
                    { title: "Active AI Sessions", icon: <Activity size={20} className="text-indigo-600"/>, value: "1,203", change: "+5.2%", bg: "bg-indigo-50" },
                    { title: "System Alerts", icon: <ShieldAlert size={20} className="text-amber-600"/>, value: "4", change: "-2.1%", bg: "bg-amber-50" },
                    { title: "Server Load", icon: <Server size={20} className="text-rose-600"/>, value: "42%", change: "+1.2%", bg: "bg-rose-50" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                {stat.icon}
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                        <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Recent System Logs</h3>
                    <div className="space-y-4">
                        {[
                            { time: "10:24 AM", event: "New employer account created", user: "Acme Corp", type: "info" },
                            { time: "09:12 AM", event: "API Rate limit approaching", user: "System", type: "warning" },
                            { time: "08:45 AM", event: "Batch candidate processing complete", user: "Worker Node 4", type: "success" },
                            { time: "08:30 AM", event: "Database backup finished", user: "System", type: "success" },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                                <span className="text-xs font-medium text-slate-400 w-16">{log.time}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-800">{log.event}</p>
                                    <p className="text-xs text-slate-500">{log.user}</p>
                                </div>
                                <div>
                                    {log.type === 'info' && <div className="w-2 h-2 rounded-full bg-blue-400"></div>}
                                    {log.type === 'warning' && <AlertCircle size={16} className="text-amber-500"/>}
                                    {log.type === 'success' && <CheckCircle2 size={16} className="text-emerald-500"/>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full blur-2xl z-0 pointer-events-none"></div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Security Status</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-700">JWT Token Validation</span>
                                    <span className="text-emerald-600 font-bold">100%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-emerald-500 h-2 rounded-full w-full"></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-700">Failed Login Attempts</span>
                                    <span className="text-amber-600 font-bold">12/hr</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-amber-500 h-2 rounded-full w-[15%]"></div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-md">
                                    View Full Audit Log
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
