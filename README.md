# FleetPulse

A production-ready internal fleet management web application built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Authentication**: Email + password authentication via Supabase
- **Dashboard**: View all vehicles in a clean grid layout with search and sorting
- **Vehicle Management**: 
  - Edit vehicle information
  - Update current mileage and oil change due mileage
  - View mileage history
  - Add service records
  - Track issues (open, in_progress, resolved)
  - Upload and manage documents with expiration tracking
- **CSV Import**: Bulk import vehicles from CSV files
- **Oil Change Tracking**: Automatic overdue detection based on mileage
- **Document Expiration**: Visual warnings for expired documents
- **Issue Tracking**: Track vehicle issues with priority levels
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Automatic dark mode support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- npm or yarn package manager

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd FleetPulse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once your project is ready, go to **Settings** → **API**
3. Copy your **Project URL** and **anon/public key**

### 4. Create Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Copy and paste the entire SQL script into the SQL Editor
4. Click **Run** to execute the script
5. This will create all necessary tables, indexes, and Row Level Security policies

### 5. Create Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name it: `vehicle-documents`
4. Make it **Public** (or configure policies as needed)
5. Click **Create bucket**

### 6. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Create Your First User

1. Navigate to the signup page
2. Create an account with your email and password
3. You'll be automatically logged in and redirected to the dashboard

## Database Schema

The application uses the following tables:

- **vehicles**: Core vehicle information
- **fuel_logs**: Fuel consumption tracking
- **service_records**: Maintenance and service history
- **issues**: Vehicle issue tracking
- **documents**: Document storage with expiration dates

All tables include proper foreign key relationships, indexes for performance, and Row Level Security (RLS) policies for data protection.

## CSV Import Format

When importing vehicles via CSV, use the following column headers:

- `code` (required): Vehicle code (e.g., z611)
- `make`: Vehicle make
- `model`: Vehicle model
- `year`: Vehicle year
- `current_mileage`: Current mileage (default: 0)
- `oil_change_due_mileage`: Oil change due mileage (default: 0)
- `license_plate`: License plate number
- `vin`: Vehicle identification number
- `notes`: Additional notes

Example CSV:
```csv
code,make,model,year,current_mileage,oil_change_due_mileage,license_plate,vin
z611,Ford,Transit,2020,45000,50000,ABC-1234,1FTBR1CM0KKA12345
z612,Ford,Transit,2021,32000,35000,DEF-5678,1FTBR1CM0LKA67890
```

## Business Logic

### Oil Change Status
- **Overdue**: `current_mileage >= oil_change_due_mileage`
- **OK**: `current_mileage < oil_change_due_mileage`

### Document Expiration
- Documents are considered expired if `expiration_date < today`

### Issue Status
- **open**: Newly reported issue
- **in_progress**: Issue is being worked on
- **resolved**: Issue has been resolved

## Project Structure

```
FleetPulse/
├── app/
│   ├── dashboard/
│   │   ├── DashboardClient.tsx    # Dashboard page component
│   │   ├── page.tsx                # Dashboard page
│   │   └── vehicles/
│   │       ├── [id]/
│   │       │   ├── VehicleDetailClient.tsx  # Vehicle detail component
│   │       │   └── page.tsx
│   │       └── new/
│   │           ├── NewVehicleClient.tsx     # New vehicle form
│   │           └── page.tsx
│   ├── login/
│   │   └── page.tsx                # Login page
│   ├── signup/
│   │   └── page.tsx               # Signup page
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page (redirects to dashboard)
├── components/
│   └── Navbar.tsx                 # Navigation component
├── lib/
│   └── supabase/
│       ├── client.ts              # Browser Supabase client
│       ├── server.ts               # Server Supabase client
│       └── middleware.ts           # Auth middleware
├── supabase/
│   └── schema.sql                 # Database schema
├── middleware.ts                  # Next.js middleware
└── package.json
```

## Deployment to Vercel

### Prerequisites
- A Vercel account (free tier works)
- Your Supabase project configured
- Environment variables ready

### Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click **Add New Project**
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   - In the Vercel project settings, go to **Environment Variables**
   - Add the following:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

4. **Deploy**
   - Click **Deploy**
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test authentication (signup/login)
- [ ] Verify database connection
- [ ] Test file uploads (documents)
- [ ] Verify RLS policies are working
- [ ] Test CSV import functionality

## Troubleshooting

### Authentication Issues
- Ensure your Supabase project has email authentication enabled
- Check that RLS policies are correctly set up
- Verify environment variables are correct

### File Upload Issues
- Ensure the `vehicle-documents` bucket exists in Supabase Storage
- Check bucket permissions (should be public or have proper policies)
- Verify file size limits (default is 50MB in Supabase)

### Database Connection Issues
- Verify your Supabase project URL and anon key
- Check that the schema has been applied correctly
- Ensure RLS policies allow authenticated users to access data

## Support

For issues or questions, please check:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

This project is for internal use only.
