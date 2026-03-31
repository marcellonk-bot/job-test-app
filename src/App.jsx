import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import InterviewView from './views/InterviewView';
import DashboardView from './views/DashboardView';
import HomeView from './views/HomeView';
import AuthView from './views/AuthView';
import CandidateProgressDashboard from './components/Dashboard/CandidateProgressDashboard';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="min-h-screen bg-slate-50">
      {!isAuthPage && <Navbar />}
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route 
          path="/interview" 
          element={
            <ProtectedRoute>
              <InterviewView />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-slate-50 p-6 pt-24 md:pt-32">
                <div className="max-w-7xl mx-auto">
                  <CandidateProgressDashboard />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<AuthView />} />
        <Route path="/signup" element={<AuthView />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
