# AI Interview Simulation - Setup Guide

## Overview
The AI Interview Simulation feature provides personalized, context-aware interviews for candidates based on their profile and the specific job they applied for.

## Features Implemented

### 1. Context Injection ✓
- Fetches job requirements from `jobs_table`
- Fetches candidate profile from `profiles_table`
- Passes context to AI for personalized questions

### 2. AI Personality and Instructions ✓
- Dynamic system prompt based on:
  - Candidate name and skills
  - Job title and description
  - Required skills for the position
- Conducts exactly 5 questions per interview
- Asks technical and behavioral questions

### 3. Interview Workflow ✓
- Real-time conversation with AI
- Stores full transcript in memory during interview
- Professional UI with typing indicators

### 4. Post-Interview Evaluation ✓
- Analyzes complete transcript after interview ends
- Generates:
  - **Interview Score**: 1-100 based on performance
  - **AI Insights**: One-sentence summary of strengths
- Saves results to database

### 5. UI Updates ✓
- Shows evaluation progress
- Displays final score and insights
- Confirms results sent to hiring manager

## Database Schema Requirements

### applications_table
Add these columns if they don't exist:

```sql
ALTER TABLE applications_table
ADD COLUMN IF NOT EXISTS interview_score INTEGER,
ADD COLUMN IF NOT EXISTS ai_insights TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Applied';
```

### Tables Used
- **jobs_table**: `job_title`, `job_description`, `required_skills`
- **profiles_table**: `full_name`, `skills`, `bio`
- **applications_table**: `job_id`, `candidate_id`, `interview_score`, `ai_insights`, `status`
- **candidates**: `user_id`, `full_name`, `interview_score`

## Environment Setup

### Required Environment Variable

Add to your `.env.local` file:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**Get your API key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy and paste it into `.env.local`

### Demo Mode
If `VITE_OPENAI_API_KEY` is not provided, the system runs in demo mode with:
- Generic responses
- Basic evaluation
- All features still functional

## Usage Flow

### For Candidates:
1. Apply for a job (creates application record)
2. Navigate to Interview page with `?application_id={id}` in URL
3. Interview loads with job-specific context
4. AI asks 5 personalized questions
5. After completion, see score and feedback
6. Results automatically saved to database

### For Employers:
- View candidate interview scores in dashboard
- See AI-generated insights about each candidate
- Filter/sort by interview performance

## File Structure

```
src/
├── services/
│   └── aiService.js          # OpenAI API integration
├── hooks/
│   └── useInterview.js       # Interview logic hook
├── components/
│   └── Interview/
│       └── ChatInterface.jsx # Interview UI
└── views/
    └── InterviewView.jsx     # Interview page
```

## API Calls

### Interview Questions
- **Model**: `gpt-4o-mini`
- **Temperature**: 0.7
- **Max Tokens**: 300
- **Cost**: ~$0.0001 per interview

### Evaluation
- **Model**: `gpt-4o-mini`
- **Temperature**: 0.3
- **Max Tokens**: 200
- **Cost**: ~$0.00005 per evaluation

**Total Cost per Interview**: ~$0.00015 (less than $0.01)

## Customization Options

### Modify Interview Length
In `aiService.js`, change the system prompt:
```javascript
Interview Guidelines:
- Keep the interview to EXACTLY 10 questions total  // Change from 5 to 10
```

### Adjust Scoring Criteria
In `aiService.js`, modify the evaluation prompt scoring factors:
```javascript
2. An interview score from 1-100 based on:
   - Technical competency (40%)
   - Communication skills (30%)
   - Problem-solving ability (20%)
   - Cultural fit and enthusiasm (10%)
```

### Change AI Model
In `aiService.js`:
```javascript
model: 'gpt-4',  // Use GPT-4 for better quality (higher cost)
```

## Troubleshooting

### Issue: "OpenAI API key not configured"
**Solution**: Add `VITE_OPENAI_API_KEY` to `.env.local` and restart dev server

### Issue: Interview doesn't fetch job data
**Solution**: Ensure `application_id` is passed via URL:
```javascript
navigate(`/interview?application_id=${applicationId}`)
```

### Issue: Evaluation not saving
**Solution**: Check that `applications_table` has `interview_score` and `ai_insights` columns

### Issue: AI gives generic responses
**Solution**: Verify job has `job_description` and `required_skills` populated

## Future Enhancements

### Planned Features:
- [ ] Video interview option
- [ ] Multiple interview rounds
- [ ] Custom question bank per job
- [ ] Interview replay for employers
- [ ] Candidate feedback form
- [ ] Multi-language support
- [ ] Voice-to-text interview mode

### Advanced Customizations:
- Industry-specific interview templates
- Technical coding challenges
- Personality assessment integration
- Team fit analysis
- Automated scheduling

## Testing

### Test the Interview Flow:
1. Create a test job with skills: `['React', 'Node.js', 'SQL']`
2. Create a test candidate profile with matching skills
3. Submit application
4. Start interview with `?application_id={id}`
5. Answer 5 questions
6. Verify score saved to database
7. Check employer dashboard shows score

### Expected Behavior:
- ✓ Greeting mentions candidate name and job title
- ✓ Questions relate to required skills
- ✓ Interview ends after 5 questions
- ✓ Score between 1-100 displayed
- ✓ AI insights saved to database
- ✓ Status updated to "Interviewed"

## Support

For issues or questions:
- Check console for error messages
- Verify environment variables are set
- Ensure database tables have required columns
- Test with demo mode first (no API key)

---

**Built with**: React + OpenAI GPT-4o-mini + Supabase
**Status**: Production Ready ✓
