# Vercel Deployment Steps

## ✅ Step 1: Code Deployed
Your code has been pushed to GitHub. Vercel will auto-deploy if connected.

## 🗄️ Step 2: Database Migration (CRITICAL)

### Open Supabase SQL Editor:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `pucmcfiqxfvvndomykgn`
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

### Run This SQL:
```sql
-- Add interview columns to applications_table
ALTER TABLE applications_table
ADD COLUMN IF NOT EXISTS interview_score INTEGER CHECK (interview_score >= 0 AND interview_score <= 100),
ADD COLUMN IF NOT EXISTS ai_insights TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Applied',
ADD COLUMN IF NOT EXISTS interviewed_at TIMESTAMP WITH TIME ZONE;

-- Update existing applications
UPDATE applications_table
SET status = 'Applied'
WHERE status IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications_table(status);
CREATE INDEX IF NOT EXISTS idx_applications_interview_score ON applications_table(interview_score DESC);

-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'applications_table'
AND column_name IN ('interview_score', 'ai_insights', 'status');
```

### Expected Output:
```
column_name      | data_type
interview_score  | integer
ai_insights      | text
status           | character varying
```

## 🔑 Step 3: Add OpenAI API Key to Vercel

### Option A: Via Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `jobtify-dashboard`
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Name**: `VITE_OPENAI_API_KEY`
   - **Value**: `sk-proj-your_actual_key_here`
   - **Environment**: Check all (Production, Preview, Development)
6. Click **Save**
7. Go to **Deployments** tab
8. Click **Redeploy** on the latest deployment

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Add environment variable
vercel env add VITE_OPENAI_API_KEY

# When prompted:
# - Enter your OpenAI API key
# - Select: Production, Preview, Development (all)
# - Confirm

# Redeploy
vercel --prod
```

### Get OpenAI API Key:
1. Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Name it: "Jobtify Production"
4. Copy the key (starts with `sk-proj-`)
5. Add to Vercel as shown above

## 🚀 Step 4: Verify Deployment

### Check Deployment Status:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Your latest deployment should show: **Ready**
3. Click the deployment URL to open your app

### Test the AI Interview:
1. Open your deployed app
2. Login as candidate: `candidate@test.com` / `demo123`
3. Navigate to a job listing
4. Apply for the job
5. Go to interview page
6. You should see personalized greeting with job title
7. Answer the AI's questions
8. After 5 questions, see your score!

### Verify Environment Variable:
```bash
# Check if variable is set (in browser console on your Vercel site)
console.log(import.meta.env.VITE_OPENAI_API_KEY ? 'API Key Configured ✓' : 'API Key Missing ✗');
```

## 🐛 Troubleshooting

### Issue: Still seeing demo mode after adding API key
**Solution**: Redeploy after adding environment variable
1. Vercel Dashboard → Deployments → Click "..." → Redeploy
2. Wait for deployment to complete
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: Database errors when saving scores
**Solution**: Run database migrations
1. Double-check SQL ran successfully in Supabase
2. Verify columns exist with verification query
3. Check Supabase logs for errors

### Issue: Interview won't load
**Solution**: Check browser console for errors
1. F12 → Console tab
2. Look for "Missing application_id" or similar
3. Ensure URL has `?application_id=<uuid>`

### Issue: Generic AI responses
**Solution**: Ensure jobs have required_skills
```sql
-- Update job with skills array
UPDATE jobs_table
SET required_skills = ARRAY['React', 'TypeScript', 'Node.js']
WHERE id = 'your-job-id';
```

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel auto-deployed (check dashboard)
- [ ] Database migrations ran in Supabase
- [ ] Verified new columns exist
- [ ] OpenAI API key added to Vercel
- [ ] Environment variable visible in Vercel settings
- [ ] Redeployed after adding API key
- [ ] Tested interview on production URL
- [ ] AI asks personalized questions
- [ ] Score saves to database
- [ ] No errors in browser console

## 📊 Monitor Your Deployment

### Check Logs:
```bash
# Vercel logs
vercel logs

# Or in dashboard:
# Vercel → Your Project → Logs
```

### Check Supabase:
1. Supabase Dashboard → Logs
2. Filter: "applications_table"
3. Look for INSERT/UPDATE operations

### Check OpenAI Usage:
1. [platform.openai.com/usage](https://platform.openai.com/usage)
2. Monitor daily costs (~$0.001 per interview)
3. Set usage limits if needed

## 🎉 Success!

Your AI Interview System is now live on Vercel!

**Production URL**: Check your Vercel dashboard for the URL

**Test Account**:
- Email: `candidate@test.com`
- Password: `demo123`

---

**Need Help?**
- Check [AI_INTERVIEW_SETUP.md](./AI_INTERVIEW_SETUP.md)
- Review [QUICKSTART.md](./QUICKSTART.md)
- See browser console for errors
