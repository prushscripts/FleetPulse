# Getting Started with FleetPulse

Follow these steps in order to get your FleetPulse application running!

## Step 0: (Optional) Create GitHub Repository

**Note:** This step is optional for local development, but **required if you want to deploy to Vercel later**.

1. Go to [github.com](https://github.com) and sign in (or create an account)
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in:
   - **Repository name**: `FleetPulse` (or any name you like)
   - **Description**: "Fleet management web application" (optional)
   - **Visibility**: Choose Public or Private
   - **DO NOT** check "Initialize with README" (we already have files)
4. Click **"Create repository"**
5. Copy the repository URL (you'll need it in a moment)
6. In your terminal, run these commands (replace with YOUR repo URL):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/FleetPulse.git
git push -u origin main
```

**If you skip this step**, you can still run the app locally, but you'll need to do this later if you want to deploy to Vercel.

---

## Step 1: Install Dependencies

Open your terminal in the FleetPulse folder and run:

```bash
npm install
```

This will install all the required packages. Wait for it to complete (may take 1-2 minutes).

---

## Step 2: Create a Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign up"**
3. Sign up with GitHub (easiest) or email
4. Once logged in, click **"New Project"**
5. Fill in:
   - **Name**: FleetPulse (or any name you like)
   - **Database Password**: Create a strong password (SAVE THIS SOMEWHERE!)
   - **Region**: Choose the closest to you (e.g., US East)
6. Click **"Create new project"**
7. Wait 2-3 minutes for your project to be ready

---

## Step 3: Set Up the Database

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button
3. Open the file `supabase/schema.sql` from your FleetPulse project
4. Copy **ALL** the contents of that file
5. Paste it into the SQL Editor in Supabase
6. Click **"Run"** button (or press Ctrl+Enter)
7. You should see: **"Success. No rows returned"** ✅

---

## Step 4: Create Storage Bucket

1. In Supabase dashboard, click **"Storage"** in the left sidebar
2. Click **"Create a new bucket"** button
3. Enter bucket name: `vehicle-documents` (must be exactly this name)
4. Toggle **"Public bucket"** to **ON** (green)
5. Click **"Create bucket"**

---

## Step 5: Get Your Supabase Credentials

1. In Supabase dashboard, click the **gear icon** (Settings) in the left sidebar
2. Click **"API"** in the settings menu
3. You'll see two things you need:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

**Keep this tab open** - you'll need these in the next step!

---

## Step 6: Create Environment File

1. In your FleetPulse project folder, create a new file called `.env.local`
   - Windows: Right-click → New → Text Document → rename to `.env.local`
   - Or use your code editor to create it

2. Open `.env.local` and add these two lines (replace with YOUR values from Step 5):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example_key_here
```

**Important:** 
- No spaces around the `=` sign
- No quotes needed
- Make sure there are no extra spaces

---

## Step 7: Start the Development Server

In your terminal, run:

```bash
npm run dev
```

You should see:
```
✓ Ready in 2.3s
○ Local: http://localhost:3000
```

---

## Step 8: Open the App & Create Your Account

1. Open your browser and go to: [http://localhost:3000](http://localhost:3000)
2. You'll be redirected to the login page
3. Click **"Don't have an account? Sign up"**
4. Enter:
   - Your email address
   - A password (at least 6 characters)
5. Click **"Sign up"**
6. You'll be automatically logged in and see the dashboard! 🎉

---

## Step 9: Add Your First Vehicle

1. On the dashboard, click **"Add Vehicle"** button
2. Fill in at minimum:
   - **Vehicle Code**: e.g., `z611`
   - **Current Mileage**: e.g., `45000`
   - **Oil Change Due Mileage**: e.g., `50000`
3. Click **"Create Vehicle"**
4. You'll see your vehicle card on the dashboard!

---

## ✅ You're Done!

Your FleetPulse app is now running! You can:
- Add more vehicles
- Click on a vehicle to see details
- Add service records
- Upload documents
- Track issues
- Import vehicles via CSV

---

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file
- Make sure no extra spaces or quotes
- Restart the dev server after changing `.env.local`

### "relation does not exist" error
- Make sure you ran the entire `schema.sql` script in Step 3
- Check Supabase → Database → Tables to see if tables were created

### "Bucket not found" error
- Make sure bucket is named exactly `vehicle-documents`
- Check Supabase → Storage to verify it exists

### Can't access localhost:3000
- Make sure `npm run dev` is still running
- Check the terminal for any error messages

---

## Need Help?

Check these files for more details:
- `SETUP.md` - Detailed setup guide
- `README.md` - Full documentation
- `DEPLOYMENT.md` - How to deploy to Vercel

Happy fleet managing! 🚗
