import React from 'react';
import ChatInterface from '../components/Interview/ChatInterface';

const InterviewView = () => {
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
