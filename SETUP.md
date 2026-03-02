# FleetPulse Setup Guide

This guide will walk you through setting up FleetPulse from scratch.

## Step-by-Step Setup

### 1. Install Node.js

Ensure you have Node.js 18 or higher installed:
```bash
node --version
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **New Project**
4. Fill in:
   - **Name**: FleetPulse (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
5. Click **Create new project**
6. Wait 2-3 minutes for project to initialize

### 4. Set Up Database Schema

1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `supabase/schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

### 5. Create Storage Bucket

1. In Supabase dashboard, click **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Enter bucket name: `vehicle-documents`
4. Toggle **Public bucket** to ON (or configure policies manually)
5. Click **Create bucket**

### 6. Get Supabase Credentials

1. In Supabase dashboard, click **Settings** (gear icon)
2. Click **API** in the settings menu
3. Copy:
   - **Project URL** (under Project Settings)
   - **anon public** key (under Project API keys)

### 7. Configure Environment Variables

1. Create `.env.local` file in the project root:
   ```bash
   # Windows PowerShell
   New-Item .env.local

   # Mac/Linux
   touch .env.local
   ```

2. Add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   Replace with your actual values from Step 6.

### 8. Start Development Server

```bash
npm run dev
```

### 9. Create Your First Account

1. Open [http://localhost:3000](http://localhost:3000)
2. You'll be redirected to `/login`
3. Click **Don't have an account? Sign up**
4. Enter your email and password
5. Click **Sign up**
6. You'll be logged in and redirected to the dashboard

### 10. Add Your First Vehicle

1. Click **Add Vehicle** button on the dashboard
2. Fill in at minimum:
   - Vehicle Code (e.g., `z611`)
   - Current Mileage
   - Oil Change Due Mileage
3. Click **Create Vehicle**

## Verification Checklist

- [ ] Dependencies installed (`npm install` completed)
- [ ] Supabase project created
- [ ] Database schema applied (no errors in SQL Editor)
- [ ] Storage bucket `vehicle-documents` created
- [ ] Environment variables set in `.env.local`
- [ ] Development server running (`npm run dev`)
- [ ] Can access login page
- [ ] Can create account
- [ ] Can log in
- [ ] Can add a vehicle
- [ ] Can view vehicle details
- [ ] Can upload a document

## Common Issues

### "Invalid API key" error
- Double-check your `.env.local` file
- Ensure no extra spaces or quotes around values
- Restart the dev server after changing `.env.local`

### "relation does not exist" error
- Make sure you ran the entire `schema.sql` script
- Check that all tables were created in the Database → Tables section

### "Bucket not found" error
- Ensure bucket is named exactly `vehicle-documents`
- Check bucket exists in Storage section

### Authentication not working
- Verify email authentication is enabled in Supabase:
  - Settings → Authentication → Providers → Email
  - Should be enabled by default

## Next Steps

Once setup is complete:
1. Import your vehicles via CSV (see README.md for format)
2. Add service records for each vehicle
3. Upload important documents
4. Start tracking issues

## Need Help?

- Check the main README.md for detailed documentation
- Review Supabase logs in the dashboard
- Check browser console for client-side errors
- Review terminal output for server-side errors
