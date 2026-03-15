# Finding Voyager API Information - Quick Guide

## Where to Look in Voyager Dashboard

Based on your Voyager dashboard, here are the places to check for API information:

### 1. **Organization Settings** (Most Likely!)
This is probably your best bet:
- Click **"Organization settings"** in the left sidebar
- Look for tabs/sections like:
  - **API Settings**
  - **Integrations**
  - **Developer Access**
  - **API Keys**
  - **Third-Party Integrations**
  - **Data Export / API Access**

### 2. **Reports Section**
- Click **"Organization settings"** in the left sidebar
- Look for tabs like:
  - **API Settings**
  - **Integrations**
  - **Developer Access**
  - **API Keys**

### 3. **Support Menu** (Currently Open)
In the Support dropdown menu, check:
- **User guide** - May have API documentation
- **Contact us** - Can ask directly about API access
- **Help** - May have developer/integration resources

### 3. **Reports Section**
Sometimes API access is under Reports:
- Click **"Reports"** in the left sidebar
- Look for:
  - **API Access**
  - **Data Export**
  - **Integration Reports**
  - **Data Integration**

### 4. **Account Settings / Profile**
- Look for a settings/gear icon (usually top right)
- Check for:
  - **API Configuration**
  - **Developer Settings**
  - **Third-Party Integrations**

## What Information You Need to Collect

Once you find the API section, you'll need:

1. **API Key / API Token**
   - Usually a long string like: `sk_live_xxxxxxxxxxxxx` or `api_key_xxxxxxxx`
   - May be called "API Key", "Access Token", "Bearer Token", or "Client Secret"

2. **API Endpoint / Base URL**
   - Usually something like:
     - `https://api.voyager.usbank.com`
     - `https://api.voyager.com`
     - `https://voyager-api.usbank.com`
   - Or they might provide a specific endpoint for transactions/mileage

3. **Account ID / Organization ID**
   - Your Voyager account number (you can see "869495606" in your dashboard)
   - May be called "Account ID", "Organization ID", "Client ID"

4. **API Documentation**
   - Endpoints for:
     - Getting transactions
     - Getting mileage data
     - Webhook setup (if they support webhooks)
   - Request/response formats
   - Authentication method (API key in header, OAuth, etc.)

5. **Webhook Configuration** (If Available)
   - Webhook URL to receive real-time updates
   - Webhook secret for verification
   - Events they can send (transaction.created, mileage.updated, etc.)

## Common API Features to Look For

### Option A: Webhook-Based (Best for Real-Time)
- Voyager sends data to your server when transactions happen
- Real-time updates
- Requires a public endpoint (we can set this up in FleetPulse)

### Option B: Polling-Based (More Common)
- FleetPulse periodically checks Voyager API for new transactions
- Less real-time but easier to set up
- Usually every 5-15 minutes

### Option C: Transaction Export API
- Download transactions in batches
- May include mileage data
- Usually CSV or JSON format

## What to Ask Support If You Can't Find It

If you can't find API information in the dashboard:

1. **Contact Support** (via the Support menu):
   - "I need API access to integrate Voyager with our fleet management system"
   - "Do you have a developer API or integration API?"
   - "I need to pull transaction data including mileage information programmatically"

2. **Ask Specifically For:**
   - API documentation
   - API key/credentials
   - Developer portal access
   - Integration guide
   - Webhook capabilities

## Once You Have the Information

After you get the API details:

1. **Go to FleetPulse Admin Panel:**
   - Log into FleetPulse
   - Click "Admin" in the navbar
   - Go to "API Configuration" tab
   - Enter the API key, endpoint, and account ID

2. **We'll Need to Build:**
   - API integration service
   - Webhook endpoint (if Voyager supports webhooks)
   - Or polling service (if they only support polling)
   - Mileage update logic

## Quick Checklist

- [ ] Check Organization Settings → API/Integrations (START HERE!)
- [ ] Check Reports → API Access or Data Export
- [ ] Check Support → User Guide for API docs
- [ ] Contact Support if needed
- [ ] Collect: API Key, Endpoint URL, Account ID
- [ ] Get API documentation
- [ ] Note if they support webhooks or only polling
- [ ] Enter info into FleetPulse Admin Panel once received

## Next Steps After Getting API Info

1. Save the API credentials securely
2. Enter them into FleetPulse Admin Panel
3. We'll build the integration to:
   - Pull transaction data from Voyager
   - Extract mileage from transactions
   - Match card numbers to vehicles
   - Update vehicle mileage automatically
   - Log all updates for audit trail

Let me know what you find!
