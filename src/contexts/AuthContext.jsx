import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('employer');

  const loginAsDemo = (role = 'employer') => {
    const demoUser = {
      id: `demo-${role}-123`,
      email: `${role}@demo.com`,
      user_metadata: { full_name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}` }
    };
    setUser(demoUser);
    setSession({ access_token: `mock-${role}-token`, user: demoUser });
    setSelectedRole(role);
  };

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Configuration Error</h2>
          <p className="text-slate-600 mb-6">
            The application is missing required environment variables to connect to Supabase.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 text-left border border-slate-200">
            <p className="text-sm font-semibold text-slate-800 mb-2">Required Variables:</p>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li><code className="bg-slate-200 px-1 rounded text-red-600">VITE_SUPABASE_URL</code></li>
              <li><code className="bg-slate-200 px-1 rounded text-red-600">VITE_SUPABASE_ANON_KEY</code></li>
            </ul>
          </div>
          <p className="text-sm text-slate-500 mt-6">
            If you are deploying on Vercel, please add these in your Project Settings under Environment Variables, and redeploy.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      const role = session?.user?.user_metadata?.role || 'employer';
      if (session?.user) setSelectedRole(role);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        const role = session?.user?.user_metadata?.role || 'employer';
        if (session?.user) setSelectedRole(role);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    loading,
    selectedRole,
    setSelectedRole,
    loginAsDemo
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
