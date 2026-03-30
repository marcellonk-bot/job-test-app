# Debug: AI Interview Technical Difficulties

## Error Message Shown:
```
"I apologize, I'm experiencing technical difficulties. Could you please try again?"
```

## This Error Appears When:
The `sendMessage` function in `useInterview.js` catches an exception during the AI API call.

---

## Troubleshooting Steps (In Order):

### Step 1: Check Environment Variable (Most Likely Issue)

**On Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Look for: `VITE_OPENAI_API_KEY`

**Expected:**
- ✅ Variable exists with value starting with `sk-proj-` or `sk-`
- ✅ Enabled for Production, Preview, Development

**If Missing:**
```bash
# Add the variable:
1. Click "Add New"
2. Name: VITE_OPENAI_API_KEY
3. Value: sk-proj-your_actual_key_here
4. Select all environments
5. Save
6. Go to Deployments → Redeploy latest
```

### Step 2: Test API Key Validity

**Get a New Key:**
1. Visit https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name: "Jobtify Production"
4. Copy the key (starts with `sk-proj-`)
5. Update in Vercel
6. Redeploy

**Test the Key:**
```bash
# In terminal (with your key):
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-proj-YOUR_KEY"

# Should return list of models
# If error: Key is invalid
```

### Step 3: Check OpenAI Account Status

**Usage & Billing:**
1. Go to https://platform.openai.com/usage
2. Check if you have credits
3. Look for "Quota exceeded" errors
4. Add billing method if needed: https://platform.openai.com/settings/billing

**Common Issues:**
- ❌ Free trial expired ($5 credit used)
- ❌ No payment method on file
- ❌ Rate limit exceeded
- ❌ API key disabled

### Step 4: Check Browser Console

**Open Developer Tools:**
```
Press F12 → Console tab
```

**Look for Specific Errors:**
```javascript
// Error patterns to look for:

// 1. Missing API Key
"OpenAI API key not configured"
→ Add VITE_OPENAI_API_KEY to Vercel

// 2. API Error
"Failed to get AI response"
→ Check OpenAI account status

// 3. Network Error
"Failed to fetch" or "Network request failed"
→ Temporary issue, retry later

// 4. CORS Error
"CORS policy blocked"
→ Rare, contact support

// 5. Context Error
"interviewContext is null"
→ Check URL has ?application_id=
```

### Step 5: Verify Interview Context

**Check URL:**
```
Should be: /interview?application_id=<uuid>
Not just: /interview
```

**Check Database:**
```sql
-- Verify application exists
SELECT id, job_id, candidate_id
FROM applications_table
WHERE id = '<your-application-id>';

-- Verify job has required data
SELECT job_title, job_description, required_skills
FROM jobs_table
WHERE id = '<job-id>';
```

### Step 6: Check Deployment

**Verify Latest Code Deployed:**
```bash
# Check deployment status
git log --oneline -5

# Should show:
# 239d6f3 feat: Add 'Applied' status and 'Start Interview' button
# d36daad feat: Add AI Interview Simulation system
```

**On Vercel:**
1. Go to Deployments tab
2. Check latest deployment is "Ready"
3. Click to view logs
4. Look for build errors

---

## Common Error Scenarios:

### Scenario A: "API Key Not Configured"
**Symptom:** Error immediately on first question
**Cause:** `VITE_OPENAI_API_KEY` not in Vercel
**Fix:** Add environment variable and redeploy

### Scenario B: "401 Unauthorized"
**Symptom:** Error after typing first response
**Cause:** Invalid API key
**Fix:** Create new key on OpenAI platform

### Scenario C: "429 Rate Limit"
**Symptom:** Works initially, then errors
**Cause:** Too many requests or quota exceeded
**Fix:** Wait or add billing to OpenAI account

### Scenario D: "500 Server Error"
**Symptom:** Intermittent errors
**Cause:** OpenAI API temporary issue
**Fix:** Retry later

---

## Testing in Demo Mode:

If you want to test WITHOUT an API key:

1. **Remove or leave blank** `VITE_OPENAI_API_KEY`
2. **Redeploy**
3. **System will use demo mode**:
   - Generic responses (not personalized)
   - No actual AI calls
   - Mock scoring
   - All features still work

**Demo Mode Indicator:**
You'll see a yellow banner:
```
⚠️ Demo Mode: Add VITE_OPENAI_API_KEY to enable AI-powered interviews
```

---

## Quick Fix Checklist:

- [ ] Added `VITE_OPENAI_API_KEY` to Vercel
- [ ] API key starts with `sk-proj-` or `sk-`
- [ ] Selected all environments (Prod, Preview, Dev)
- [ ] Clicked "Redeploy" after adding variable
- [ ] Waited 1-2 minutes for deployment
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Checked OpenAI usage dashboard
- [ ] Verified billing method added (if needed)
- [ ] Tested with new API key
- [ ] Checked browser console for errors

---

## Still Not Working?

### Get Detailed Error Info:

**Add Debug Logging:**
```javascript
// Temporarily add to useInterview.js line 40:
console.log('Interview Context:', interviewContext);
console.log('Has API Key:', hasOpenAIConfig);
console.log('API Key (first 10 chars):', import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 10));
```

**Check Network Tab:**
1. F12 → Network tab
2. Try sending a message
3. Look for request to `api.openai.com`
4. Check status code:
   - 401: Invalid key
   - 429: Rate limit
   - 500: OpenAI server error

### Contact Support:

If still failing, gather:
1. Browser console errors
2. Network tab screenshot
3. Vercel deployment logs
4. OpenAI usage dashboard screenshot

---

## Prevention:

**After Fixing, Verify:**
```bash
# Test the interview flow:
1. Login as candidate
2. Apply for a job
3. Click "Start Interview"
4. Type first response: "Yes, I'm ready"
5. Should get AI response within 2-3 seconds
6. Complete all 5 questions
7. See final score
```

**Set Usage Alerts:**
1. OpenAI Dashboard → Settings → Billing
2. Set email alerts for:
   - 80% quota used
   - 100% quota reached
3. Set monthly budget limit

---

## Most Common Fix (95% of cases):

```bash
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: VITE_OPENAI_API_KEY = sk-proj-[your-key]
3. Deployments → Latest → "..." → Redeploy
4. Wait 1-2 minutes
5. Hard refresh browser (Ctrl+Shift+R)
6. Test interview again
```

**Done!** ✅
