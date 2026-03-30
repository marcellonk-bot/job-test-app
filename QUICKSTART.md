# AI Interview System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Database Setup (2 minutes)
```bash
# Open Supabase SQL Editor
# Copy and paste contents of database_migrations.sql
# Click "Run" to execute migrations
```

**Verify**:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'applications_table'
AND column_name IN ('interview_score', 'ai_insights', 'status');
```

### Step 2: Environment Configuration (1 minute)
```bash
# Edit .env.local file
VITE_OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

**Get API Key**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Step 3: Restart Dev Server (30 seconds)
```bash
# Stop current server (Ctrl+C)
npm run dev
# Server restarts with new environment variables
```

### Step 4: Test the System (1.5 minutes)

**Create Test Data**:
```sql
-- 1. Create a test job
INSERT INTO jobs_table (company_id, job_title, job_description, required_skills, status)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'employer@test.com'),
    'Software Engineer',
    'Build amazing web applications using modern technologies.',
    ARRAY['React', 'TypeScript', 'Node.js'],
    'Active'
)
RETURNING id; -- Save this ID
```

**Test the Interview**:
1. Login as candidate: `candidate@test.com` / `demo123`
2. Navigate to a job listing
3. Click "Apply Now"
4. Go to `/interview?application_id=<your_application_id>`
5. Answer 5 questions from AI
6. See your score and insights!

### Step 5: Verify Results (30 seconds)
```sql
-- Check saved interview data
SELECT
    job_id,
    candidate_id,
    interview_score,
    ai_insights,
    status
FROM applications_table
WHERE interview_score IS NOT NULL;
```

---

## ✅ Success Checklist

- [ ] Database columns added (`interview_score`, `ai_insights`, `status`)
- [ ] OpenAI API key configured in `.env.local`
- [ ] Dev server restarted
- [ ] Test job created with `required_skills` array
- [ ] Interview completed (answered 5 questions)
- [ ] Score displayed (1-100)
- [ ] AI insights shown
- [ ] "Results sent" confirmation visible
- [ ] Data saved in database (check SQL query)
- [ ] Employer can see score in dashboard

---

## 🎯 What You Built

### System Flow:
```
Candidate Applies → Interview URL Generated → System Fetches Context
     ↓                                                ↓
Context = Job + Candidate Data           AI Personalizes Interview
     ↓                                                ↓
AI Asks 5 Questions ← ← ← ← ← ← ← ← ← Questions Based on Context
     ↓
Candidate Answers (5 responses)
     ↓
AI Evaluates Transcript
     ↓
Generates: Score (1-100) + Summary
     ↓
Saves to Database: applications_table
     ↓
UI Shows: Score Card + Confirmation
     ↓
Status Updated: "Interviewed"
     ↓
Employer Sees: Score + Insights in Dashboard
```

### Key Features:
1. **Context Injection**: Fetches job requirements + candidate profile
2. **Personalized AI**: Interview tailored to specific job and candidate
3. **Automated Evaluation**: AI scores and summarizes performance
4. **Database Integration**: Results saved automatically
5. **Real-time UI**: Shows progress and final results

---

## 🐛 Troubleshooting

### Issue: "Missing OpenAI API Key"
```bash
# Check .env.local has:
VITE_OPENAI_API_KEY=sk-proj-...

# Restart server:
npm run dev
```

### Issue: No interview context loaded
```bash
# Ensure URL has application_id:
/interview?application_id=<uuid>

# Or system will use demo context
```

### Issue: Score not saving
```sql
-- Verify columns exist:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'applications_table'
AND column_name IN ('interview_score', 'ai_insights');

-- If missing, run:
\i database_migrations.sql
```

### Issue: Generic AI responses
```sql
-- Ensure job has required_skills:
UPDATE jobs_table
SET required_skills = ARRAY['React', 'Node.js', 'TypeScript']
WHERE id = 'your-job-id';
```

---

## 📱 Testing Different Scenarios

### Scenario 1: Software Engineer Interview
```sql
INSERT INTO jobs_table (company_id, job_title, required_skills)
VALUES (..., 'Software Engineer', ARRAY['React', 'TypeScript', 'Git']);
```
**Expected Questions**: Technical skills, React experience, TypeScript usage

### Scenario 2: Marketing Manager Interview
```sql
INSERT INTO jobs_table (company_id, job_title, required_skills)
VALUES (..., 'Marketing Manager', ARRAY['SEO', 'Content Strategy', 'Analytics']);
```
**Expected Questions**: Marketing campaigns, strategy development, metrics

### Scenario 3: Customer Support Interview
```sql
INSERT INTO jobs_table (company_id, job_title, required_skills)
VALUES (..., 'Support Specialist', ARRAY['Communication', 'Problem Solving', 'Patience']);
```
**Expected Questions**: Customer scenarios, conflict resolution, soft skills

---

## 💰 Cost Tracking

### Monitor Usage:
1. Visit [platform.openai.com/usage](https://platform.openai.com/usage)
2. Check daily/monthly API calls
3. View costs per interview (~$0.001)

### Expected Costs:
- **10 interviews/day**: ~$0.01/day = $0.30/month
- **100 interviews/day**: ~$0.10/day = $3.00/month
- **1000 interviews/day**: ~$1.00/day = $30.00/month

**Set Limits**:
```javascript
// In OpenAI Dashboard:
Settings → Usage Limits → Set monthly limit ($10)
```

---

## 🎓 Learn More

- **Full Documentation**: [AI_INTERVIEW_SETUP.md](./AI_INTERVIEW_SETUP.md)
- **Implementation Details**: [AI_INTERVIEW_IMPLEMENTATION_SUMMARY.md](./AI_INTERVIEW_IMPLEMENTATION_SUMMARY.md)
- **Database Schema**: [database_migrations.sql](./database_migrations.sql)

---

## 🔥 Demo Mode (No API Key)

Don't have an API key? No problem!

**System automatically falls back to demo mode**:
- ✅ All features work
- ✅ Generic responses (not personalized)
- ✅ Mock evaluation (score: 70-80)
- ✅ Database saves work
- ✅ UI fully functional

**Warning banner shows**: "Demo Mode: Add VITE_OPENAI_API_KEY to enable AI"

---

## 🎉 You're Done!

The AI Interview System is now:
- ✅ **Installed** (database + code)
- ✅ **Configured** (API key set)
- ✅ **Tested** (sample interview completed)
- ✅ **Working** (scores saving to database)
- ✅ **Production-ready** (error handling + fallbacks)

**Next Steps**:
1. Customize interview questions (edit `aiService.js`)
2. Adjust scoring criteria (edit evaluation prompt)
3. Add more jobs with different skills
4. Test with real candidates
5. Monitor costs and usage
6. Review employer dashboard
7. Gather feedback and iterate

**Questions?** Check the docs or console logs for debugging!

---

**Time to Complete**: ~5 minutes ⏱️
**Difficulty**: Easy 🟢
**Status**: Ready to Use ✓
