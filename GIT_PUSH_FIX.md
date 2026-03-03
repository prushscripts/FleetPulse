# Fix GitHub Push Authentication

## Quick Fix Options:

### Option 1: Use GitHub Token in URL (Quickest)

Replace `YOUR_TOKEN` with your GitHub Personal Access Token:

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/prushscripts/FleetPulse.git
git push origin main
```

**Then immediately remove the token from the URL for security:**
```bash
git remote set-url origin https://github.com/prushscripts/FleetPulse.git
```

### Option 2: Update Windows Credential Manager

1. Open **Windows Credential Manager**
   - Press `Win + R`
   - Type: `control /name Microsoft.CredentialManager`
   - Press Enter

2. Go to **Windows Credentials**

3. Find `git:https://github.com` entry

4. Click **Edit** or **Remove**

5. Try pushing again - Windows will prompt for new credentials
   - Username: `prushscripts` (or your GitHub username)
   - Password: Your GitHub Personal Access Token (NOT your GitHub password)

### Option 3: Generate New GitHub Token

If you don't have your token anymore:

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name it: "FleetPulse Git Push"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again!)
7. Use it in Option 1 above

### Option 4: Use GitHub CLI (Alternative)

```bash
# Install GitHub CLI if not installed
# Then authenticate
gh auth login
```

---

## After Fixing:

Once you can push, Vercel will automatically detect the new commit and redeploy!
