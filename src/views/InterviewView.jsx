import React, { useEffect } from 'react';
import ChatInterface from '../components/Interview/ChatInterface';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const InterviewView = () => {
    const { user } = useAuth();

    useEffect(() => {
        const createCandidateRecord = async () => {
            if (!user) return;
            
            const savedData = localStorage.getItem('jobtify_resume_data');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    
                    const { error } = await supabase
                        .from('candidates')
                        .insert([
                            {
                                user_id: user.id,
                                full_name: user?.user_metadata?.full_name || parsedData.fileName.split('.')[0] || 'Candidate',
                                resume_score: parsedData.score,
                                summary: parsedData.summary,
                                interview_score: 0
                            }
                        ]);
                        
                    if (error) {
                        console.error('Error inserting candidate record:', error);
                    } else {
                        localStorage.removeItem('jobtify_resume_data');
                    }
                } catch (err) {
                    console.error('Error parsing resume data:', err);
                }
            }
        };

        createCandidateRecord();
    }, [user]);

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 md:p-6">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Jobtify.my</h1>
                    <p className="text-slate-500 text-sm">AI Simulation Interview</p>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Live Session
                </div>
            </header>

            <main className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <ChatInterface />
            </main>
        </div>
    );
};

export default InterviewView;
