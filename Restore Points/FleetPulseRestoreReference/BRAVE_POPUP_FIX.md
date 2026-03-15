# Fix Pop-up Blocker in Brave Browser for Voyager

## Quick Fix - Allow Pop-ups for Voyager Site:

### Method 1: Disable Shields for Voyager (Easiest)

1. **Look at the address bar** - you should see a **Brave Shields icon** (lion icon) on the right side
2. **Click the Brave Shields icon**
3. **Toggle "Shields" to OFF** (or slide it to the left)
4. This will disable all shields (including pop-up blocking) for `voyager.usbank.com`
5. **Refresh the page** (F5 or Ctrl+R)
6. Try clicking whatever was triggering the pop-up again

### Method 2: Allow Pop-ups Specifically

1. **Click the Brave Shields icon** in the address bar
2. Look for **"Pop-ups and redirects"** setting
3. Change it from **"Block"** to **"Allow"**
4. Refresh the page

### Method 3: Site Settings (More Permanent)

1. **Click the lock icon** (or site info icon) in the address bar (left of the URL)
2. Click **"Site settings"**
3. Scroll down to **"Pop-ups and redirects"**
4. Change from **"Block"** to **"Allow"**
5. Refresh the page

### Method 4: Global Settings (If Needed)

1. Click the **three horizontal lines** (menu) in top right
2. Go to **Settings**
3. Click **"Shields"** in the left sidebar
4. Under **"Pop-ups and redirects"**, you can change the default
5. Or add `voyager.usbank.com` to exceptions

## After Disabling:

1. **Refresh the Voyager page** (F5)
2. Try clicking:
   - "Preview Report" button
   - "View Entire Report" button
   - Any links that might open API documentation
   - Export/Download options

## If Still Not Working:

1. **Check if Brave Shields is actually off:**
   - Look at the address bar - the lion icon should be grayed out or show "Shields: Down"

2. **Try a different browser temporarily:**
   - Chrome or Edge to see if it's a Brave-specific issue

3. **Check Windows Defender/Windows Security:**
   - Sometimes Windows can block pop-ups too
   - Go to Windows Security → App & browser control → Check pop-up settings

## For the Report Page Specifically:

Since you're on the "View/Edit a Transaction Detail Report" page, the pop-ups are likely needed for:
- Previewing reports
- Viewing full reports
- Exporting data
- Possibly accessing API documentation

Make sure Shields are OFF for `voyager.usbank.com` and try again!
