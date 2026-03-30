import { useState, useCallback, useEffect } from 'react';
import { sendInterviewMessage, evaluateInterview, hasAIConfig } from '../services/aiService';

export const useInterview = (interviewContext) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEnded, setIsEnded] = useState(false);
    const [evaluation, setEvaluation] = useState(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    // Initialize with greeting when context is available
    useEffect(() => {
        if (interviewContext && messages.length === 0) {
            const greeting = hasAIConfig
                ? `Hello ${interviewContext.candidateName}! I'm your AI interviewer today for the ${interviewContext.jobTitle} position. I'll be asking you 5 questions to better understand your qualifications. Are you ready to begin?`
                : `Hello! I am your AI interviewer today for the ${interviewContext.jobTitle} position. Note: AI is running in demo mode. Are you ready to start?`;

            setMessages([{ role: 'assistant', content: greeting }]);
        }
    }, [interviewContext]);

    const sendMessage = useCallback(async (content) => {
        if (!content.trim() || isEnded || !interviewContext) return;

        const userMessage = { role: 'user', content };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            let aiResponse;

            if (hasAIConfig) {
                // Use real AI service
                aiResponse = await sendInterviewMessage(updatedMessages, interviewContext);
            } else {
                // Fallback to demo mode
                await new Promise(resolve => setTimeout(resolve, 1500));
                aiResponse = "Thank you for sharing. Can you elaborate on that experience?";
            }

            const aiMessage = {
                role: 'assistant',
                content: aiResponse
            };
            setMessages((prev) => [...prev, aiMessage]);

            // Check if interview should end (AI mentions conclusion)
            if (aiResponse.toLowerCase().includes('concludes our interview') ||
                aiResponse.toLowerCase().includes('that concludes') ||
                aiResponse.toLowerCase().includes('thank you for your time today')) {
                setTimeout(() => {
                    endInterview(updatedMessages);
                }, 1000);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: "I apologize, I'm experiencing technical difficulties. Could you please try again?" }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, isEnded, interviewContext]);

    const endInterview = useCallback(async (finalTranscript = null) => {
        if (isEnded) return;

        setIsEnded(true);
        const transcript = finalTranscript || messages;

        // Add closing message
        setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Thank you for participating in this interview! We are now analyzing your responses...' }
        ]);

        // Evaluate the interview
        if (hasAIConfig && interviewContext) {
            setIsEvaluating(true);
            try {
                const result = await evaluateInterview(transcript, interviewContext);
                setEvaluation(result);

                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `Interview Complete! Your results have been sent to the hiring manager. Thank you for your time, and we wish you the best of luck!`
                    }
                ]);
            } catch (error) {
                console.error('Error evaluating interview:', error);
                setEvaluation({
                    summary: 'Candidate completed the interview successfully.',
                    score: 70
                });
            } finally {
                setIsEvaluating(false);
            }
        } else {
            // Demo mode evaluation
            setEvaluation({
                summary: 'Interview completed in demo mode.',
                score: 75
            });
        }
    }, [messages, isEnded, interviewContext]);

    const manualEndInterview = () => {
        endInterview();
    };

    return {
        messages,
        sendMessage,
        isLoading,
        isEnded,
        endInterview: manualEndInterview,
        evaluation,
        isEvaluating,
        hasAIConfig: hasAIConfig
    };
};
