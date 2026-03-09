# Welcome emails – what they are and how to set them up

There are **two different “welcome” ideas** in FleetPulse:

---

## 1. Supabase auth emails (confirm signup, reset password, etc.)

These are the emails **Supabase sends automatically** when users sign up, reset password, or use magic link. You can customize the **subject and body** (and use your own SMTP) in the Supabase dashboard.

- **Where to set them up:**  
  **https://supabase.com/docs/guides/auth/auth-email-templates**  
  In the dashboard: **Authentication → Email Templates**.

- **What you can change:** Confirm signup, Invite user, Magic Link, Change Email, Reset Password. You can use variables like `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`, etc.

- **Important:** These templates do **not** know about your app’s “Company” or “Company Authentication ID.” So you **cannot** put the company auth key into the “Confirm signup” email automatically. For that, use the custom welcome email below.

---

## 2. Your custom welcome email (with Company Authentication ID)

When **you** create a new company in Supabase (e.g. for a new customer), **you** send them a welcome email that includes their **Company Authentication ID**. That’s the key they (and their team) enter in **Settings → Companies** or on the activation page to access that company.

- **Who sends it:** You (manually from your email, or via your own tool like Gmail, SendGrid, Resend, etc.).
- **When:** Right after you create the company in the `companies` table and have the `auth_key` value.
- **No special “setup” in the app:** FleetPulse doesn’t send this email for you. You send it yourself and paste in the auth key.

**Template you can use:**

**Subject:** Welcome to FleetPulse – Your Company Is Ready

**Body:**

Hi [Name],

Welcome to FleetPulse. Your company is set up and ready to go.

**Your Company Authentication ID:** `[AUTH_KEY]`

- **You:** After you sign up or log in at [your FleetPulse URL], go to **Settings → Companies** (or the activation page) and enter the ID above to access your company’s fleet.
- **Your team:** Share this Company Authentication ID with your team. They sign up at the same link, then enter this ID to join your company and see the same fleet data.

Keep this ID safe; you can use it anytime in Settings to re-activate or add this company to your account.

If you have any questions, reply to this email.

— FleetPulse

---

**How to get `[AUTH_KEY]`:** In Supabase, open the `companies` table and use the `auth_key` column for that company (e.g. Prush Logistics: `prushlogisticsroadmap`; Wheelz Up: `WheelzUpAPD2026`).

**Optional – custom SMTP in Supabase:**  
If you want Supabase to send auth emails (confirm signup, etc.) through your own domain and SMTP:  
**https://supabase.com/docs/guides/auth/auth-smtp**
