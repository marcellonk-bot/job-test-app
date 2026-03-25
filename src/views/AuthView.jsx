import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const AuthView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';

  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    if (error) setErrorMsg(error.message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // Intercept Manual Demo Login using Environment Variables with fallbacks
        const demoEmployerEmail = import.meta.env.VITE_DEMO_EMPLOYER_EMAIL || 'employer@test.com';
        const demoEmployerPassword = import.meta.env.VITE_DEMO_EMPLOYER_PASSWORD || 'demo123';
        const demoCandidateEmail = import.meta.env.VITE_DEMO_CANDIDATE_EMAIL || 'candidate@test.com';
        const demoCandidatePassword = import.meta.env.VITE_DEMO_CANDIDATE_PASSWORD || 'demo123';
        const demoAdminEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@jobtify.my';
        const demoAdminPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'demo123';

        const isEmployerDemo = email.toLowerCase() === demoEmployerEmail.toLowerCase() && password === demoEmployerPassword;
        const isCandidateDemo = email.toLowerCase() === demoCandidateEmail.toLowerCase() && password === demoCandidatePassword;
        const isAdminDemo = email.toLowerCase() === demoAdminEmail.toLowerCase() && password === demoAdminPassword;

        if (isEmployerDemo || isCandidateDemo || isAdminDemo) {
           let role = 'candidate';
           if (isEmployerDemo) role = 'employer';
           if (isAdminDemo) role = 'admin';
           
           // We can mock it or actually log in if these accounts exist in Supabase.
           // Defaulting to mock for smooth demo if they don't exist in Supabase yet.
           loginAsDemo(role);
           navigate('/dashboard');
           return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        
        if (data?.session) {
          navigate('/');
        } else {
          setSuccessMsg('Registration successful! Please check your email for a confirmation link.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const { loginAsDemo } = useAuth();

  // Variants for smooth slide & fade animation
  const formVariants = {
    hidden: (isLoginConfig) => ({
      opacity: 0,
      x: isLoginConfig ? -30 : 30,
    }),
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: (isLoginConfig) => ({
      opacity: 0,
      x: isLoginConfig ? 30 : -30,
      transition: { duration: 0.2, ease: 'easeIn' }
    })
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        layout
        className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 ${isLogin ? 'bg-slate-900 shadow-slate-300' : 'bg-blue-600 shadow-blue-200'}`}>
              <Brain className="text-white" size={28} />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Jobtify.my</span>
          </Link>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'header-login' : 'header-signup'}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="text-slate-500 font-medium h-6">
                {isLogin ? 'Please enter your details to sign in.' : 'Join us and start exploring opportunities.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative overflow-hidden w-full">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50/50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-in fade-in">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50/50 border border-green-200 text-green-700 rounded-xl text-sm font-medium animate-in fade-in">
              {successMsg}
            </div>
          )}
          <AnimatePresence mode="wait" custom={isLogin}>
            <motion.form 
              key={isLogin ? 'form-login' : 'form-signup'}
              custom={isLogin}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 accent-blue-600" />
                    <span className="text-sm font-medium text-slate-600 select-none">Remember for 30 days</span>
                  </label>
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    Forgot password?
                  </a>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 ${isLogin ? 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800 focus:ring-slate-900/50' : 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700 focus:ring-blue-600/50'} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Sign in' : 'Sign up'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">Or continue with</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 active:bg-slate-100 transition-all"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Google
              </button>

              {isLogin && (
                <div className="mt-4 p-4 bg-indigo-50/70 rounded-xl border border-indigo-100">
                  <p className="text-sm font-bold text-indigo-900 mb-2">Instant Demo Access:</p>
                  <p className="text-xs text-indigo-700 mb-3">Click an email below to autofill, then click Sign in.</p>
                  <ul className="text-sm text-indigo-800 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold">🏢</span>
                      <span className="font-semibold cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => {setEmail('employer@test.com'); setPassword('demo123');}}>employer@test.com</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-emerald-200 text-emerald-700 flex items-center justify-center text-[10px] font-bold">🤖</span>
                      <span className="font-semibold cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => {setEmail('candidate@test.com'); setPassword('demo123');}}>candidate@test.com</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-rose-200 text-rose-700 flex items-center justify-center text-[10px] font-bold">🛡️</span>
                      <span className="font-semibold cursor-pointer hover:text-rose-600 transition-colors" onClick={() => {setEmail('admin@jobtify.my'); setPassword('demo123');}}>admin@jobtify.my</span>
                    </li>
                  </ul>
                  <p className="text-xs text-indigo-600/80 mt-3 font-medium border-t border-indigo-200/50 pt-2">Password for all: <strong>demo123</strong></p>
                </div>
              )}

            </motion.form>
          </AnimatePresence>
        </div>

        <motion.div layout className="mt-6 text-center">
          <p className="text-sm font-medium text-slate-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link 
              to={isLogin ? "/signup" : "/login"} 
              className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </Link>
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default AuthView;
