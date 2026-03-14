# FleetPulse Deployment Guide - Budget-Friendly Setup

## Total Cost Breakdown

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Domain (FleetPulseHQ.com) | 1 year | $6/year | One-time purchase, renews annually |
| Hosting (Vercel) | Free Tier | $0/month | Perfect for Next.js, includes SSL |
| Database/Auth/Storage (Supabase) | Free Tier | $0/month | 500MB database, 1GB storage, 50K MAU |
| **TOTAL** | | **$6/year** | Less than $0.50/month! |

## Step-by-Step Deployment Guide

### Step 1: Purchase Domain

1. Go to your domain registrar (Namecheap, GoDaddy, Google Domains, etc.)
2. Search for `FleetPulseHQ.com`
3. Purchase for 1 year ($6)
4. Complete checkout and verify ownership

**Note:** Keep your domain registrar account credentials safe!

---

### Step 2: Use Your Existing Supabase Project

**Good news!** You can use your **existing Supabase project** for production. No need to create a new one!

1. Go to [supabase.com](https://supabase.com) and log in
2. Open your **existing FleetPulse project**
3. Go to **Settings** → **API**
4. Copy these values (you'll need them for Vercel):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep secret!)

**Note:** Your database schema and storage bucket are already set up from local development, so you're good to go!

---

### Step 3: Update Supabase Redirect URLs (Important!)

Before deploying, update your Supabase auth settings to allow your production domain:

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Update **Site URL** to: `https://FleetPulseHQ.com`
3. Add to **Redirect URLs** (add all of these):
   - `https://FleetPulseHQ.com/auth/callback`
   - `https://www.FleetPulseHQ.com/auth/callback`
   - `http://localhost:3000/auth/callback` (keep this for local dev)
4. Click **"Save"**

**Why?** Supabase needs to know which URLs are allowed for authentication redirects. This prevents unauthorized redirects.

---

### Step 5: Create Vercel Account & Deploy

1. Go to [vercel.com](https://vercel.com)
2. Sign up with **GitHub** (recommended - connects to your repo)
3. Click **"Add New Project"**
4. Import your GitHub repository:
   - Select `prushscripts/FleetPulse`
   - Click **"Import"**
5. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
6. **Environment Variables** - Add these (click "Add" for each):
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_SITE_URL=https://FleetPulseHQ.com
   ```
   
   **Important:** 
   - Use the **same Supabase values** from your existing project (from Step 2)
   - These are the same values you use in your `.env.local` file
   - Copy them from Supabase Dashboard → Settings → API

7. Click **"Deploy"**
8. Wait 2-3 minutes for build to complete
9. You'll get a URL like: `fleetpulse-xxxxx.vercel.app`

---

### Step 6: Configure Custom Domain

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Domains**
3. Enter: `FleetPulseHQ.com`
4. Click **"Add"**
5. Vercel will show DNS records you need to add

---

### Step 7: Configure DNS Records

1. Go to your domain registrar's DNS management page
2. Add these DNS records:

   **Record Type: A**
   - **Name:** @ (or leave blank)
   - **Value:** `76.76.21.21`
   - **TTL:** 3600

   **Record Type: CNAME**
   - **Name:** www
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 3600

   **OR** (if Vercel provides specific records, use those instead)

3. Save changes
4. Wait 5-60 minutes for DNS propagation
5. Vercel will automatically issue SSL certificate (free!)

---

### Step 8: Update Supabase Auth Redirect URLs

1. Go to Supabase dashboard → **Authentication** → **URL Configuration**
2. Add to **Site URL:** `https://FleetPulseHQ.com`
3. Add to **Redirect URLs:**
   - `https://FleetPulseHQ.com/auth/callback`
   - `https://www.FleetPulseHQ.com/auth/callback`
   - `https://fleetpulse-xxxxx.vercel.app/auth/callback` (your Vercel URL)
4. Click **"Save"**

---

### Step 9: Update Environment Variables (if needed)

If you need to update environment variables later:

1. Go to Vercel dashboard → Your project → **Settings** → **Environment Variables**
2. Edit or add variables
3. Click **"Save"**
4. Go to **Deployments** → Click **"Redeploy"** on latest deployment

---

## Code Changes Needed

### 1. Update `app/layout.tsx` metadata

Update the metadata to use your domain:

```typescript
export const metadata: Metadata = {
  title: 'FleetPulse - Fleet Management System',
  description: 'Modern fleet management platform for vehicle tracking and maintenance',
  metadataBase: new URL('https://FleetPulseHQ.com'),
  openGraph: {
    title: 'FleetPulse - Fleet Management System',
    description: 'Modern fleet management platform',
    url: 'https://FleetPulseHQ.com',
    siteName: 'FleetPulse',
  },
  icons: {
    icon: '/fpfavicon.png',
    apple: '/fpfavicon.png',
  },
}
```

### 2. Create `vercel.json` (optional, for redirects)

Create `vercel.json` in project root:

```json
{
  "rewrites": [
    {
      "source": "/auth/callback",
      "destination": "/auth/callback"
    }
  ]
}
```

### 3. Update Signup/Login redirects (if needed)

The existing code should work, but verify:
- `app/login/page.tsx` redirects to `/dashboard` after login
- `app/signup/page.tsx` redirects appropriately

---

## Post-Deployment Checklist

- [ ] Domain purchased and DNS configured
- [ ] Supabase production project created
- [ ] Database schema imported
- [ ] Storage bucket created
- [ ] Vercel project deployed
- [ ] Custom domain connected
- [ ] SSL certificate active (automatic)
- [ ] Supabase redirect URLs updated
- [ ] Test signup/login flow
- [ ] Test file uploads
- [ ] Test all major features

---

## Ongoing Costs

**Year 1:** $6 (domain only)
**Year 2+:** $6/year (domain renewal)

**Free tiers included:**
- ✅ Vercel: Unlimited bandwidth, 100GB bandwidth/month
- ✅ Supabase: 500MB database, 1GB storage, 50K monthly active users
- ✅ SSL certificates: Free and automatic

**When you might need to upgrade:**
- Supabase: If you exceed 500MB database or 1GB storage → $25/month
- Vercel: If you exceed 100GB bandwidth/month → $20/month
- Domain: Always $6/year

---

## Troubleshooting

### DNS not working?
- Wait up to 24 hours for full propagation
- Use [whatsmydns.net](https://www.whatsmydns.net) to check propagation
- Clear browser cache

### SSL certificate issues?
- Vercel handles this automatically
- Wait 5-10 minutes after DNS propagation
- Check Vercel dashboard for certificate status

### Build errors?
- Check Vercel build logs
- Verify all environment variables are set
- Ensure `package.json` has correct dependencies

### Database connection issues?
- Verify Supabase URL and keys are correct (should match your `.env.local`)
- Check Supabase project is active
- Verify RLS policies allow authenticated access
- Make sure you're using the same Supabase project for both dev and production

---

## Support Resources

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Next.js Deployment:** [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

## Security Notes

1. **Never commit** `.env.local` to Git
2. **Never share** your `SUPABASE_SERVICE_ROLE_KEY` publicly
3. Use environment variables for all secrets
4. Keep your Supabase service role key secure
5. Regularly update dependencies: `npm audit fix`

---

**Total Setup Time:** ~30-45 minutes
**Total Cost:** $6/year (less than $0.50/month!)

Good luck with your deployment! 🚀
