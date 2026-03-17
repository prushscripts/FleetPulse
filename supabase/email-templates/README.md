# FleetPulse Email Templates

To apply these templates:
1. Go to supabase.com ? your project ? Authentication
2. Click "Email Templates" in the left sidebar
3. Click "Confirm signup"
4. Paste the HTML from confirm-signup.html
5. Change subject to: "Confirm your FleetPulse account"
6. Save

To fix spam issues (emails landing in spam folder):
1. Go to Authentication ? SMTP Settings
2. Sign up at resend.com (free, 3000 emails/month)
3. Add your domain (fleetpulsehq.com) in Resend
4. Copy the SMTP credentials into Supabase
5. Emails will now send from noreply@fleetpulsehq.com
