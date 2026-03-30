// AI Service for Interview Simulation
// Uses OpenAI API to conduct personalized interviews

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate system prompt for AI interviewer
 * @param {Object} context - Interview context
 * @param {string} context.candidateName - Name of the candidate
 * @param {string} context.jobTitle - Job title
 * @param {Array} context.skills - Candidate's skills
 * @param {Array} context.requiredSkills - Job's required skills
 * @param {string} context.jobDescription - Job description
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
 * Send message to AI interviewer
 * @param {Array} messages - Conversation history
 * @param {Object} context - Interview context
 * @returns {Promise<string>} AI response
 */
export const sendInterviewMessage = async (messages, context) => {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment.');
    }

    try {
        const systemPrompt = generateSystemPrompt(context);

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get AI response');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};

/**
 * Evaluate interview transcript and generate score
 * @param {Array} transcript - Full interview transcript
 * @param {Object} context - Interview context
 * @returns {Promise<Object>} Evaluation result with summary and score
 */
export const evaluateInterview = async (transcript, context) => {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
    }

    try {
        const evaluationPrompt = generateEvaluationPrompt(transcript, context);

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert HR analyst evaluating job interview performance.' },
                    { role: 'user', content: evaluationPrompt }
                ],
                temperature: 0.3,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to evaluate interview');
        }

        const data = await response.json();
        const evaluation = data.choices[0].message.content;

        // Parse the response
        const summaryMatch = evaluation.match(/SUMMARY:\s*(.+?)(?=\nSCORE:|$)/s);
        const scoreMatch = evaluation.match(/SCORE:\s*(\d+)/);

        return {
            summary: summaryMatch ? summaryMatch[1].trim() : 'Candidate completed the interview.',
            score: scoreMatch ? parseInt(scoreMatch[1]) : 50
        };
    } catch (error) {
        console.error('Evaluation Error:', error);
        throw error;
    }
};

export const hasOpenAIConfig = !!OPENAI_API_KEY;
