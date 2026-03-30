// AI Service for Interview Simulation
// Uses Puter.js AI API for chat-based interviews
// Puter is loaded via CDN in index.html

// Check if Puter is configured
let isPuterConfigured = false;

// Get Puter SDK from global window object (loaded via CDN)
const getPuter = () => {
    if (typeof window === 'undefined' || !window.puter) {
        throw new Error('Puter SDK not loaded. Make sure the CDN script is included in index.html');
    }
    return window.puter;
};

// Initialize Puter
const initializePuter = async () => {
    try {
        const puter = getPuter();

        // Initialize Puter if not already done
        if (!isPuterConfigured) {
            const username = import.meta.env.VITE_PUTER_USERNAME;
            const password = import.meta.env.VITE_PUTER_PASSWORD;

            // Only sign in if credentials are provided
            if (username && password) {
                await puter.auth.signIn({
                    username,
                    password,
                });
            }
            isPuterConfigured = true;
        }
        return true;
    } catch (error) {
        console.warn('Puter initialization skipped or failed:', error.message);
        // If no credentials, Puter works in guest mode
        isPuterConfigured = true;
        return true;
    }
};

/**
 * Generate system prompt for AI interviewer
 * @param {Object} context - Interview context
 * @returns {string} System prompt
 */
const generateSystemPrompt = (context) => {
    const { candidateName, jobTitle, skills, requiredSkills, jobDescription } = context;

    return `You are the Jobtify.my AI Interviewer. Your goal is to interview ${candidateName} for the ${jobTitle} position.

Job Description:
${jobDescription}

Required Skills: ${requiredSkills?.join(', ') || 'Not specified'}
Candidate's Listed Skills: ${skills?.join(', ') || 'Not specified'}

Interview Guidelines:
- Keep the interview to EXACTLY 5 questions total
- Ask a mix of technical and behavioral questions based on the job requirements
- Focus on the candidate's experience with the required skills
- Be professional yet conversational
- After each answer, acknowledge briefly and move to the next question
- After 5 questions, politely conclude the interview

IMPORTANT: Keep track of how many questions you've asked. After the 5th question and its answer, you MUST conclude the interview by saying: "Thank you for your time today. That concludes our interview. Your responses have been recorded and will be reviewed by our hiring team. Best of luck!"

Start the interview now.`;
};

/**
 * Generate evaluation prompt for post-interview analysis
 * @param {Array} transcript - Interview transcript (messages array)
 * @param {Object} context - Interview context
 * @returns {string} Evaluation prompt
 */
const generateEvaluationPrompt = (transcript, context) => {
    const conversationText = transcript
        .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
        .join('\n\n');

    return `Analyze this job interview and provide evaluation.

Job Title: ${context.jobTitle}
Required Skills: ${context.requiredSkills?.join(', ') || 'Not specified'}

Interview Transcript:
${conversationText}

Please provide:
1. A 1-sentence summary of the candidate's key strengths
2. An interview score from 1-100 based on:
   - Technical competency (relevance of experience)
   - Communication skills (clarity and professionalism)
   - Problem-solving ability
   - Cultural fit and enthusiasm

Format your response EXACTLY as:
SUMMARY: [one sentence summary]
SCORE: [number from 1-100]`;
};

/**
 * Send message to AI interviewer using Puter
 * @param {Array} messages - Conversation history
 * @param {Object} context - Interview context
 * @returns {Promise<string>} AI response
 */
export const sendInterviewMessage = async (messages, context) => {
    try {
        // Initialize Puter
        await initializePuter();

        // Get Puter SDK instance
        const puter = getPuter();

        const systemPrompt = generateSystemPrompt(context);

        // Format messages for Puter AI
        const formattedMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))
        ];

        // Call Puter AI chat
        const response = await puter.ai.chat(formattedMessages, {
            model: 'gpt-4o-mini', // Puter supports various models
            temperature: 0.7,
            max_tokens: 300,
            stream: false
        });

        // Extract the response text
        const aiResponse = response.message?.content || response.text || response.toString();

        return aiResponse;
    } catch (error) {
        console.error('Puter AI Service Error:', error);
        throw new Error(`AI Interview Error: ${error.message}`);
    }
};

/**
 * Evaluate interview transcript and generate score using Puter
 * @param {Array} transcript - Full interview transcript
 * @param {Object} context - Interview context
 * @returns {Promise<Object>} Evaluation result with summary and score
 */
export const evaluateInterview = async (transcript, context) => {
    try {
        // Initialize Puter
        await initializePuter();

        // Get Puter SDK instance
        const puter = getPuter();

        const evaluationPrompt = generateEvaluationPrompt(transcript, context);

        // Call Puter AI for evaluation
        const response = await puter.ai.chat([
            { role: 'system', content: 'You are an expert HR analyst evaluating job interview performance.' },
            { role: 'user', content: evaluationPrompt }
        ], {
            model: 'gpt-4o-mini',
            temperature: 0.3,
            max_tokens: 200,
            stream: false
        });

        const evaluation = response.message?.content || response.text || response.toString();

        // Parse the response
        const summaryMatch = evaluation.match(/SUMMARY:\s*(.+?)(?=\nSCORE:|$)/s);
        const scoreMatch = evaluation.match(/SCORE:\s*(\d+)/);

        return {
            summary: summaryMatch ? summaryMatch[1].trim() : 'Candidate completed the interview.',
            score: scoreMatch ? parseInt(scoreMatch[1]) : 50
        };
    } catch (error) {
        console.error('Puter Evaluation Error:', error);
        // Return default evaluation on error
        return {
            summary: 'Interview completed successfully.',
            score: 70
        };
    }
};

// Export configuration status
export const hasAIConfig = true; // Puter works without explicit config in many cases
export const aiProvider = 'Puter.js';
