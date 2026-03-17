import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const WEBHOOK_URL = 'https://n8n.ibrandiumtech.com/webhook/submit-application';

export const useInterview = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AI interviewer today. Are you ready to start the simulation interview?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEnded, setIsEnded] = useState(false);

    const sendMessage = useCallback(async (content) => {
        if (!content.trim() || isEnded) return;

        const userMessage = { role: 'user', content };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await axios.post(WEBHOOK_URL, {
                message: content,
                timestamp: new Date().toISOString(),
            });

            const aiMessage = {
                role: 'assistant',
                content: response.data.output || response.data.message || "I've received your message. Let's continue."
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: "I'm sorry, I'm having trouble connecting. Could you please try again?" }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [isEnded]);

    const endInterview = () => {
        setIsEnded(true);
        setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Thank you for participating in this simulation interview! We have recorded your responses and will get back to you soon. Wishing you the best of luck!' }
        ]);
    };

    return {
        messages,
        sendMessage,
        isLoading,
        isEnded,
        endInterview,
    };
};
