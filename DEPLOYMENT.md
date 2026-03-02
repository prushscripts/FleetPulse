# FleetPulse Deployment Guide

This guide covers deploying FleetPulse to Vercel.

## Prerequisites

- [ ] FleetPulse is working locally
- [ ] Code is pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- [ ] Supabase project is set up and configured
- [ ] You have a Vercel account (free tier works)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your code is committed and pushed:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub/GitLab/Bitbucket (recommended) or email
3. Verify your email if needed

### 3. Import Project to Vercel

1. Click **Add New Project** in Vercel dashboard
2. Import your Git repository:
   - If using GitHub/GitLab/Bitbucket, select your repository
   - If using email, you'll need to connect your Git provider first
3. Vercel will auto-detect Next.js
4. Click **Import**

### 4. Configure Build Settings

Vercel should auto-detect:
- **Framework Preset**: Next.js
- **Build Command**: `next build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

If not, verify these settings match.

### 5. Add Environment Variables

**Critical**: Add these before deploying!

1. In the project settings, scroll to **Environment Variables**
2. Add each variable:

   **Variable 1:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase project URL (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **Environment**: Production, Preview, Development (select all)

   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon key
   - **Environment**: Production, Preview, Development (select all)

3. Click **Save** after each variable

### 6. Deploy

1. Click **Deploy** button
2. Wait for build to complete (usually 1-3 minutes)
3. You'll see build logs in real-time
4. Once complete, you'll get a deployment URL like:
   `https://fleetpulse-xxxxx.vercel.app`

### 7. Verify Deployment

1. Visit your deployment URL
2. Test the following:
   - [ ] Site loads without errors
   - [ ] Can navigate to login page
   - [ ] Can create an account
   - [ ] Can log in
   - [ ] Dashboard loads
   - [ ] Can add a vehicle
   - [ ] Can upload a document

## Post-Deployment Configuration

### Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### Environment Variables for Different Environments

You can set different values for:
- **Production**: Your live site
- **Preview**: Pull request previews
- **Development**: Local development (usually not needed)

To set environment-specific values:
1. Go to **Settings** → **Environment Variables**
2. Click on a variable
3. Select specific environments
4. Set different values if needed

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every pull request

To disable auto-deployment:
1. Go to **Settings** → **Git**
2. Configure deployment settings

## Monitoring

### View Logs

1. Go to your project in Vercel
2. Click on a deployment
3. Click **Functions** tab to see server logs
4. Click **Logs** tab for build logs

### Analytics

Vercel Analytics (optional):
1. Go to **Analytics** tab
2. Enable if desired (may require upgrade)

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`
- Check that `npm install` completes successfully locally

**Error: "Environment variable not found"**
- Verify environment variables are set in Vercel
- Ensure variable names match exactly (case-sensitive)
- Restart deployment after adding variables

**Error: "Build timeout"**
- Check build logs for specific errors
- Ensure no infinite loops in code
- Consider upgrading Vercel plan if builds are consistently slow

### Runtime Errors

**"Invalid API key"**
- Double-check environment variables in Vercel
- Ensure values match your `.env.local` exactly
- Redeploy after fixing variables

**"Cannot connect to Supabase"**
- Verify Supabase project is active
- Check Supabase dashboard for service status
- Ensure RLS policies allow access

**"Storage bucket not found"**
- Verify bucket exists in Supabase
- Check bucket name matches exactly: `vehicle-documents`
- Ensure bucket permissions are correct

### Performance Issues

**Slow page loads**
- Check Vercel Analytics for bottlenecks
- Optimize images and assets
- Consider enabling Vercel Edge Functions
- Review Supabase query performance

## Updating Your Deployment

### Automatic Updates

Every push to `main` triggers a new deployment automatically.

### Manual Redeploy

1. Go to **Deployments** tab
2. Find the deployment you want to redeploy
3. Click the three dots menu
4. Click **Redeploy**

### Rollback

1. Go to **Deployments** tab
2. Find a previous successful deployment
3. Click the three dots menu
4. Click **Promote to Production**

## Security Checklist

- [ ] Environment variables are set (never commit `.env.local`)
- [ ] Supabase RLS policies are configured
- [ ] Storage bucket has proper permissions
- [ ] Authentication is working correctly
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] No sensitive data in client-side code

## Cost Considerations

### Vercel Free Tier Includes:
- Unlimited deployments
- 100GB bandwidth/month
- Serverless functions
- Automatic SSL

### Supabase Free Tier Includes:
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- 2GB bandwidth

For production with 19 vehicles, the free tiers should be sufficient.

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

## Quick Reference

**Deployment URL Format:**
```
https://your-project-name.vercel.app
```

**Environment Variables Needed:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Build Command:**
```bash
next build
```

**Deploy Command:**
```bash
vercel --prod
```
(If using Vercel CLI)
