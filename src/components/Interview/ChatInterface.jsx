import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useInterview } from '../../hooks/useInterview';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const ChatInterface = ({ interviewContext, applicationId }) => {
    const { user } = useAuth();
    const { messages, sendMessage, isLoading, isEnded, endInterview, evaluation, isEvaluating, hasAIConfig } = useInterview(interviewContext);
    const [input, setInput] = useState('');
    const [isSavingResults, setIsSavingResults] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Save evaluation results when interview ends
    useEffect(() => {
        const saveEvaluationResults = async () => {
            if (evaluation && !isSavingResults && !saveSuccess) {
                setIsSavingResults(true);

                try {
                    if (applicationId) {
                        // Update application with interview results
                        const { error: updateError } = await supabase
                            .from('applications_table')
                            .update({
                                interview_score: evaluation.score,
                                ai_insights: evaluation.summary,
                                status: 'Interviewed'
                            })
                            .eq('id', applicationId);

                        if (updateError) {
                            console.error('Error updating application:', updateError);
                        }
                    }

                    // Also update/create candidate record
                    const { error: candidateError } = await supabase
                        .from('candidates')
                        .upsert([
                            {
                                user_id: user.id,
                                full_name: interviewContext?.candidateName || 'Candidate',
                                interview_score: evaluation.score
                            }
                        ], {
                            onConflict: 'user_id'
                        });

                    if (candidateError && candidateError.code !== '23505') {
                        console.error('Error updating candidate:', candidateError);
                    }

                    setSaveSuccess(true);
                } catch (error) {
                    console.error('Error saving evaluation:', error);
                } finally {
                    setIsSavingResults(false);
                }
            }
        };

        saveEvaluationResults();
    }, [evaluation, applicationId, user, interviewContext, isSavingResults, saveSuccess]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !isLoading && !isEnded) {
            sendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex max-w-[85%] md:max-w-[70%] group ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'ml-3 bg-blue-600' : 'mr-3 bg-slate-100 border border-slate-200'}`}>
                                    {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-slate-600" />}
                                </div>
                                <div className={`px-4 py-3 rounded-2xl text-sm md:text-base ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                                        : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-center space-x-2 text-slate-400 text-sm pl-11">
                            <Loader2 className="animate-spin" size={16} />
                            <span>AI is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white">
                {!hasAIConfig && messages.length > 0 && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-sm">
                        <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-amber-800">
                            <strong>Demo Mode:</strong> Add VITE_OPENAI_API_KEY to enable AI-powered interviews.
                        </div>
                    </div>
                )}

                {!isEnded ? (
                    <form onSubmit={handleSubmit} className="relative flex items-center space-x-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your response..."
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 transition-all shadow-sm"
                        >
                            <Send size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={endInterview}
                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="End Interview"
                        >
                            <LogOut size={20} />
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        {/* Evaluation Status */}
                        {isEvaluating && (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                                <Loader2 className="animate-spin text-blue-600" size={20} />
                                <div className="text-sm text-blue-900">
                                    <p className="font-semibold">Evaluating your responses...</p>
                                    <p className="text-blue-700">Our AI is analyzing your interview performance</p>
                                </div>
                            </div>
                        )}

                        {/* Evaluation Results */}
                        {evaluation && !isEvaluating && (
                            <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="text-emerald-600" size={24} />
                                    <h3 className="font-bold text-slate-900 text-lg">Interview Complete!</h3>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Your Score</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-blue-600">{evaluation.score}</span>
                                            <span className="text-slate-500 font-medium">/100</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Key Strengths</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{evaluation.summary}</p>
                                    </div>
                                </div>

                                {saveSuccess && (
                                    <div className="pt-3 border-t border-emerald-200/50">
                                        <div className="flex items-center gap-2 text-emerald-700">
                                            <CheckCircle2 size={16} />
                                            <span className="text-sm font-medium">Results sent to hiring manager</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Completion Status */}
                        <div className="text-center">
                            <div className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200">
                                Interview Session Ended
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;
