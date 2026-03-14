# Deploy FleetPulse to Production - Quick Guide

## Step 1: Commit and Push Your Changes

```powershell
# Make sure you're in the project directory
cd C:\Users\James\Desktop\FleetPulse

# Check what files have changed
git status

# Add all changes
git add .

# Commit with a message
git commit -m "Update landing page: improved gradients, 7-day trial, fixed cursor styles"

# Push to GitHub
git push origin main
```

**Note:** If you haven't set up Git yet:
```powershell
git init
git remote add origin https://github.com/prushscripts/FleetPulse.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## Step 2: Vercel Will Auto-Deploy

If you've already connected your GitHub repo to Vercel, it will automatically:
1. Detect the push
2. Start a new build
3. Deploy the changes

**Check Vercel Dashboard:**
- Go to [vercel.com](https://vercel.com)
- Click on your FleetPulse project
- Go to **Deployments** tab
- You should see a new deployment starting

**Wait 2-3 minutes** for the build to complete.

---

## Step 3: Fix Login Issue - Update Supabase Settings

The login refresh issue is likely because Supabase redirect URLs aren't configured for your production domain.

### Fix Supabase Redirect URLs:

1. Go to [supabase.com](https://supabase.com) and log in
2. Open your **FleetPulse project**
3. Go to **Authentication** → **URL Configuration**
4. Update these settings:

   **Site URL:**
   ```
   https://fleetpulsehq.com
   ```

   **Redirect URLs** (add ALL of these, one per line):
   ```
   https://fleetpulsehq.com/auth/callback
   https://www.fleetpulsehq.com/auth/callback
   https://fleet-pulse-git-main-prushscripts-projects.vercel.app/auth/callback
   https://fleet-pulse-In3okixkr-prushscripts-projects.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

   **Important:** Add ALL Vercel preview URLs you see in your deployment. Each deployment gets a unique preview URL that needs to be in the redirect list.

5. Click **"Save"**

---

## Step 4: Verify Environment Variables in Vercel

1. Go to Vercel dashboard → Your project → **Settings** → **Environment Variables**
2. Make sure these are set correctly:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=https://fleetpulsehq.com
   ```

3. If you changed any, click **"Save"** and **Redeploy** the latest deployment

---

## Step 5: Fix Cookie Domain Issue (If Login Still Doesn't Work)

The login might fail because cookies aren't being set with the correct domain. Let's update the Supabase client configuration:

### Update `lib/supabase/client.ts`:

Make sure cookies are set with the correct domain. The current code should work, but if login still fails, we may need to add explicit cookie options.

---

## Step 6: Test Login Flow

1. Go to `https://FleetPulseHQ.com`
2. Click **"Sign In"** or use the floating login card
3. Enter your credentials
4. After login, you should be redirected to `/dashboard`

**If login still refreshes:**
- Check browser console for errors (F12 → Console)
- Check Network tab to see if cookies are being set
- Verify Supabase redirect URLs are correct
- Clear browser cache and cookies, then try again

---

## Troubleshooting Login Issue

### Issue: Login page just refreshes

**Possible causes:**
1. **Supabase redirect URLs not configured** - Most common!
   - Fix: Follow Step 3 above

2. **Cookies not being set** - Domain mismatch
   - Fix: Check `NEXT_PUBLIC_SITE_URL` matches your domain exactly
   - Fix: Make sure Supabase Site URL matches your domain

3. **Middleware redirecting back** - User not detected
   - Fix: Check browser cookies - are they being set?
   - Fix: Check Supabase auth logs in dashboard

4. **CORS/SSL issues**
   - Fix: Make sure domain has SSL (Vercel handles this automatically)
   - Fix: Check Supabase allows your domain

### Debug Steps:

1. **Check browser console** (F12 → Console):
   - Look for any errors
   - Check if `Login successful:` appears

2. **Check Network tab** (F12 → Network):
   - Look for `/auth/callback` request
   - Check if cookies are being set in response headers

3. **Check Supabase Dashboard**:
   - Go to **Authentication** → **Users**
   - See if login attempts are being logged
   - Check for any error messages

4. **Test with Vercel preview URL**:
   - Try logging in on `https://fleetpulse-xxxxx.vercel.app`
   - If it works there but not on custom domain, it's a domain/cookie issue

---

## Quick Checklist

- [ ] Changes committed and pushed to GitHub
- [ ] Vercel deployment completed successfully
- [ ] Supabase redirect URLs updated with production domain
- [ ] `NEXT_PUBLIC_SITE_URL` set correctly in Vercel
- [ ] Tested login flow on production domain
- [ ] Login redirects to dashboard successfully

---

## Need Help?

If login still doesn't work after following these steps:
1. Check Vercel build logs for errors
2. Check Supabase auth logs
3. Check browser console for errors
4. Verify all environment variables match your local `.env.local` file
