import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, LayoutDashboard, MessageSquare, Home, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Navbar = () => {
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user } = useAuth();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Interview', path: '/interview', icon: MessageSquare },
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ];

    const isActive = (path) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
            }`}>
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-200 shadow-lg group-hover:scale-110 transition-transform">
                            <Brain className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">Jobtify.my</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive(link.path)
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <button onClick={handleSignOut} className="px-5 py-2.5 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95">
                                Sign Out
                            </button>
                        ) : (
                            <Link to="/login" className="px-5 py-2.5 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95">
                                Log In
                            </Link>
                        )}
                        <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-md active:scale-95">
                            Contact Us
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-xl p-4 animate-in slide-in-from-top duration-300">
                    <div className="space-y-2">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${isActive(link.path)
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {link.name}
                                </Link>
                            );
                        })}
                        <div className="pt-4 space-y-3">
                            {user ? (
                                <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="flex items-center justify-center w-full py-3 bg-red-50 text-red-700 hover:bg-red-100 transition-colors rounded-xl font-semibold shadow-sm border border-red-100">
                                    Sign Out
                                </button>
                            ) : (
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center w-full py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors rounded-xl font-semibold shadow-sm border border-blue-100">
                                    Log In
                                </Link>
                            )}
                            <button className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 transition-colors rounded-xl font-semibold shadow-lg">
                                Contact Us
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
