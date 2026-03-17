import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, LogOut } from 'lucide-react';
import { useInterview } from '../../hooks/useInterview';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInterface = () => {
    const { messages, sendMessage, isLoading, isEnded, endInterview } = useInterview();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                    <div className="py-4 text-center">
                        <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
                            Interview Completed Successfully
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;
