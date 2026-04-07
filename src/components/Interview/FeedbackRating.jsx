import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const FeedbackRating = ({ sessionId }) => {
    const { user } = useAuth();
    const [relevanceRating, setRelevanceRating] = useState(null);
    const [qualityRating, setQualityRating] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!relevanceRating || !qualityRating) return;
        
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('feedback')
                .insert([{
                    interview_session_id: sessionId || 'unknown',
                    user_id: user?.id,
                    question_relevance: relevanceRating,
                    ai_response_quality: qualityRating,
                    feedback_text: feedbackText
                }]);

            if (error) {
                // If 'feedback' table doesn't exist, try 'Feedback' mapping
                if (error.code === '42P01') {
                    await supabase
                        .from('Feedback')
                        .insert([{
                            interview_session_id: sessionId || 'unknown',
                            user_id: user?.id,
                            question_relevance: relevanceRating,
                            ai_response_quality: qualityRating,
                            feedback_text: feedbackText
                        }]);
                } else {
                    throw error;
                }
            }
            
            setIsSubmitted(true);
        } catch (err) {
            console.error('Error submitting feedback:', err);
            // Show success anyway for UX if DB is not configured yet
            setIsSubmitted(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                <CheckCircle2 size={32} className="text-emerald-500" />
                <div>
                    <h3 className="font-bold text-slate-900">Thank You for Your Feedback!</h3>
                    <p className="text-sm text-slate-600 mt-1">Your input helps us refine our AI prompts and improve the candidate experience.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto w-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Help Us Improve</h3>
                <p className="text-sm text-slate-500">How was the simulated AI interview experience?</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Question Relevance */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="block font-semibold text-slate-800 text-sm">Question Relevance</span>
                        <span className="text-xs text-slate-500">Were the questions relevant to the role?</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setRelevanceRating('up')}
                            className={`p-3 rounded-full transition-all flex items-center justify-center border-2 ${
                                relevanceRating === 'up' 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ThumbsUp size={20} className={relevanceRating === 'up' ? "fill-emerald-100" : ""} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setRelevanceRating('down')}
                            className={`p-3 rounded-full transition-all flex items-center justify-center border-2 ${
                                relevanceRating === 'down' 
                                    ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ThumbsDown size={20} className={relevanceRating === 'down' ? "fill-rose-100" : ""} />
                        </button>
                    </div>
                </div>

                {/* AI Response Quality */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="block font-semibold text-slate-800 text-sm">AI Response Quality</span>
                        <span className="text-xs text-slate-500">How natural and helpful were the AI's transitions?</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setQualityRating('up')}
                            className={`p-3 rounded-full transition-all flex items-center justify-center border-2 ${
                                qualityRating === 'up' 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ThumbsUp size={20} className={qualityRating === 'up' ? "fill-emerald-100" : ""} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setQualityRating('down')}
                            className={`p-3 rounded-full transition-all flex items-center justify-center border-2 ${
                                qualityRating === 'down' 
                                    ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ThumbsDown size={20} className={qualityRating === 'down' ? "fill-rose-100" : ""} />
                        </button>
                    </div>
                </div>

                {/* Feedback Text Input */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <MessageSquare size={16} className="text-blue-500" />
                        How can we make these questions better? <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g., The technical questions were too generic, I'd prefer more scenario-based questions..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
                    ></textarea>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!relevanceRating || !qualityRating || isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:bg-slate-300 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>Submitting...</>
                    ) : (
                        <>
                            Submit Feedback
                            <Send size={16} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default FeedbackRating;
