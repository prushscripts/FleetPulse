# FleetPulse

FleetPulse is a **multi-tenant fleet management SaaS platform** built with **Next.js 14, TypeScript, Tailwind CSS, and Supabase**. It enables companies to manage vehicles, drivers, maintenance, documents, and operational issues in a centralized dashboard while keeping each company's data securely isolated.

The platform is designed to support **any type of fleet operation**, including logistics companies, service fleets, contractors, delivery networks, and transportation providers.

---

# Product Overview

FleetPulse provides companies with a modern fleet operations dashboard where administrators can monitor vehicles, track maintenance, manage documentation, and resolve operational issues.

The platform uses a **multi-tenant architecture**, meaning each company operates within its own isolated workspace (tenant). Users can belong to one or more companies and switch between them directly in the application.

Companies can invite users using secure invite codes (`auth_key`), allowing teams such as dispatchers, drivers, and fleet managers to collaborate within the same fleet workspace.

For deeper technical documentation see:

* `AI_CONTEXT.md`
* `PROJECT_ARCHITECTURE.md`

located in the repository root.

---

# Core Features

### Fleet Dashboard

* Centralized dashboard showing all fleet vehicles
* Search and sorting capabilities
* Quick visibility into vehicle status and issues

### Vehicle Management

* Create and manage vehicles
* Update mileage and service intervals
* Track oil change requirements
* Maintain detailed vehicle records

### Maintenance & Service Records

* Add service events
* Track maintenance history
* Log service providers and notes

### Issue Tracking

* Log operational issues
* Track issue status:

  * `open`
  * `in_progress`
  * `resolved`
* Assign priority levels

### Document Management

* Upload vehicle-related documents
* Track expiration dates
* Automatic expiration warnings

### CSV Fleet Import

* Bulk import vehicles via CSV
* Quickly onboard fleets with many vehicles

### Oil Change Tracking

Automatic status detection:

* **Overdue:** `current_mileage >= oil_change_due_mileage`
* **OK:** `current_mileage < oil_change_due_mileage`

### Document Expiration Monitoring

Documents are flagged as expired when:

```
expiration_date < today
```

### Responsive UI

* Fully responsive interface
* Works across desktop, tablet, and mobile devices

### Dark Mode

* Automatic dark mode support via Tailwind

---

# Multi-Tenant Architecture

FleetPulse is designed as a **multi-tenant SaaS platform**.

Key characteristics:

* Each company operates within its **own isolated tenant**
* Data separation enforced through **Supabase Row Level Security**
* Users may belong to **multiple companies**
* Fleet managers can **invite users via invite code**
* Companies can switch tenants directly from the UI

This architecture allows FleetPulse to scale across **many organizations while keeping data securely separated**.

---

# Tech Stack

| Layer          | Technology              |
| -------------- | ----------------------- |
| Frontend       | Next.js 14 (App Router) |
| Language       | TypeScript              |
| Styling        | Tailwind CSS            |
| Backend        | Supabase (PostgreSQL)   |
| Authentication | Supabase Auth           |
| Storage        | Supabase Storage        |
| Deployment     | Vercel                  |

---

# Prerequisites

* Node.js **18+**
* Supabase account (free tier works)
* npm or yarn

---

# Setup Instructions

## 1. Clone the Repository

```
git clone <your-repo-url>
cd FleetPulse
```

---

## 2. Install Dependencies

```
npm install
```

---

## 3. Create a Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Navigate to **Settings → API**
4. Copy:

   * Project URL
   * anon/public key

---

## 4. Create Database Schema

1. Open **Supabase SQL Editor**
2. Open the file:

```
supabase/schema.sql
```

3. Copy and paste the contents into the SQL editor
4. Click **Run**

This creates:

* all tables
* indexes
* Row Level Security policies

---

## 5. Create Storage Bucket

1. Go to **Supabase → Storage**
2. Create bucket:

```
vehicle-documents
```

3. Set visibility to **Public** (or configure policies)

---

## 6. Configure Environment Variables

Copy `.env.example`:

```
cp .env.example .env.local
```

Add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 7. Run the Development Server

```
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 8. Create First User

1. Navigate to the signup page
2. Create a new account
3. You will be redirected to the dashboard

---

# Database Schema

Primary tables used by the application:

| Table           | Purpose                          |
| --------------- | -------------------------------- |
| vehicles        | Core vehicle records             |
| fuel_logs       | Fuel tracking                    |
| service_records | Maintenance history              |
| issues          | Vehicle issue tracking           |
| documents       | Document storage with expiration |

All tables include:

* Foreign key relationships
* Performance indexes
* Row Level Security policies

---

# CSV Import Format

Use the following headers when importing vehicles:

| Column                 | Required | Description            |
| ---------------------- | -------- | ---------------------- |
| code                   | Yes      | Unique vehicle code    |
| make                   | No       | Vehicle manufacturer   |
| model                  | No       | Vehicle model          |
| year                   | No       | Vehicle year           |
| current_mileage        | No       | Current mileage        |
| oil_change_due_mileage | No       | Oil change due mileage |
| license_plate          | No       | License plate          |
| vin                    | No       | Vehicle VIN            |
| notes                  | No       | Additional notes       |

Example:

```
code,make,model,year,current_mileage,oil_change_due_mileage,license_plate,vin
z611,Ford,Transit,2020,45000,50000,ABC-1234,1FTBR1CM0KKA12345
z612,Ford,Transit,2021,32000,35000,DEF-5678,1FTBR1CM0LKA67890
```

---

# Project Structure

```
FleetPulse
│
├── app/                  # Next.js App Router
├── components/           # Reusable UI components
├── context/              # React context providers
├── hooks/                # Custom React hooks
├── lib/                  # Shared utilities
├── supabase/             # Database schema and Supabase helpers
├── types/                # TypeScript definitions
├── public/               # Static assets
├── scripts/              # Development scripts
├── docs/                 # Internal documentation
│
├── middleware.ts         # Next.js middleware
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind configuration
├── package.json
└── README.md
```

---

# Deployment (Vercel)

## Push to GitHub

```
git add .
git commit -m "Initial commit"
git push origin main
```

---

## Import to Vercel

1. Go to https://vercel.com
2. Click **Add New Project**
3. Import your GitHub repository
4. Vercel automatically detects **Next.js**

---

## Add Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Deploy

Click **Deploy** and Vercel will build the application.

Your project will be available at:

```
https://your-project.vercel.app
```

---

# Post-Deployment Checklist

* Verify authentication works
* Confirm database connection
* Test vehicle creation
* Test CSV imports
* Test file uploads
* Confirm RLS policies isolate tenant data

---

# Troubleshooting

### Authentication Problems

* Ensure Supabase email authentication is enabled
* Confirm environment variables are correct
* Verify RLS policies allow authenticated access

### File Upload Problems

* Confirm `vehicle-documents` bucket exists
* Verify bucket permissions
* Ensure file sizes are within Supabase limits

### Database Issues

* Confirm schema was executed successfully
* Check Supabase logs for errors
* Verify tables and indexes exist

---

# Documentation

Additional technical documentation:

* `AI_CONTEXT.md`
* `PROJECT_ARCHITECTURE.md`

---

# License

This project is currently maintained for internal development and platform deployment.
