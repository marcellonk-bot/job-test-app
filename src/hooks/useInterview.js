import { useState, useCallback } from 'react';

const MOCK_RESPONSES = [
    "That's an interesting approach. Could you elaborate on the specific actions you took?",
    "Thank you for sharing. Can you provide a specific example to illustrate your point?",
    "How did you overcome the primary challenge in that scenario?",
    "That makes sense. If you had to do it differently, what would you change?",
    "Can you walk me through your thought process when you made that decision?",
    "What impact did this have on the overall project or team?",
    "I see. How did you ensure you effectively communicated this to stakeholders?",
    "Interesting. What was the most important lesson you learned from that experience?",
    "Could you expand a bit more on your role specifically in achieving that outcome?",
    "Excellent, thank you for those details."
];

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
            // Simulate AI typing delay (1.5 seconds)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Select a random response
            const randomResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];

            const aiMessage = {
                role: 'assistant',
                content: randomResponse
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error simulating message:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: "I'm sorry, my simulation encountered an error. Could you please try again?" }
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
