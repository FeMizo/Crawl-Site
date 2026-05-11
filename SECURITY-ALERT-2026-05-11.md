# 🚨 CRITICAL SECURITY ALERT — Exposed Secrets in Git

**Date:** May 11, 2026  
**Severity:** 🔴 CRITICAL  
**Status:** ⚠️ REQUIRES IMMEDIATE MANUAL ACTION

---

## Summary

Your `.env` and `.env.local` files are committed to the Git repository with **real production credentials**. These secrets grant full access to critical services.

**File locations:**

- `.env` (committed, visible in git history)
- `.env.local` (committed, visible in git history)

---

## Exposed Secrets

### 🔑 Database (Neon PostgreSQL)

```
dashboard_DATABASE_URL=postgresql://neondb_owner:npg_RlWjM2Ze9kzp@...[REDACTED]
dashboard_PGPASSWORD=npg_RlWjM2Ze9kzp...[REDACTED]
```

- **Risk:** Full database access, data exfiltration, deletion
- **Action:** Revoke password in Neon console immediately

### 💳 Stripe (Live)

```
STRIPE_SECRET_KEY=sk_live_51TK9GS...[REDACTED - SEE .env FILE LOCALLY]
STRIPE_WEBHOOK_SECRET=whsec_pT3loD2G...[REDACTED - SEE .env FILE LOCALLY]
```

- **Risk:** Charge/refund customers, access payment data, webhook hijacking
- **Action:** Revoke keys in Stripe Dashboard → Settings → API Keys

### 🔎 Google Cloud (PageSpeed API)

```
PAGESPEED_API_KEY=AIzaSyDlSHEXYr1GikkgCoGMDlZ8X6cYOTC2QAQ...[REDACTED]
```

- **Risk:** Exhaust quota, perform API calls, incur charges
- **Action:** Revoke in Google Cloud Console → APIs & Services → Credentials

### 🔐 Vercel OIDC Token

```
VERCEL_OIDC_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIs...
```

- **Risk:** Deploy code, access Vercel project
- **Action:** Monitor Vercel Activity Log for unauthorized deployments

---

## Immediate Actions (Do This Now)

### Step 1: Revoke Neon Database Password

1. Go to https://console.neon.tech
2. Select your project → **Users**
3. Select `neondb_owner` → **Change password**
4. Generate a strong new password
5. Update environment variables in production (Vercel, deployment)

### Step 2: Revoke Stripe Keys

1. Go to https://dashboard.stripe.com
2. Navigate to **Settings** → **Developers** → **API Keys**
3. Click **Revoke** on `sk_live_51TK9GS...`
4. Click **Revoke** on webhook secret `whsec_pT3loD2G...`
5. Create new keys
6. Update production environment variables

### Step 3: Revoke Google Cloud API Key

1. Go to https://console.cloud.google.com
2. Navigate to **APIs & Services** → **Credentials**
3. Find and **Delete** the key `AIzaSyDlSHEXYr1GikkgCoGMDlZ8X6cYOTC2QAQ`
4. Create a new key
5. Update production environment variables

### Step 4: Check Vercel Activity Log

1. Go to https://vercel.com/[your-team]/[project]
2. Check **Settings** → **Activity** for unauthorized deployments
3. Review **Deployments** for suspicious builds

---

## Prevent Future Exposure

### 1. Remove .env from Git History (⚠️ DESTRUCTIVE)

If this repo is private and not widely distributed:

```powershell
# Remove .env and .env.local from history
git filter-branch --force --index-filter 'git rm -r --cached --ignore-unmatch .env .env.local' --prune-empty --tag-name-filter cat -- --all

# Force push to reset history
git push origin --force --all
git push origin --force --tags
```

⚠️ **Only do this if you control all forks/clones.**

### 2. Add .env to .gitignore

Verify `.gitignore` has:

```
.env
.env.local
.env*.local
```

### 3. Use Environment-Specific Secrets Management

**Option A: Vercel Secrets (Recommended)**

```bash
vercel env add dashboard_DATABASE_URL
vercel env add STRIPE_SECRET_KEY
vercel env add PAGESPEED_API_KEY
```

**Option B: GitHub Secrets (if using Actions)**

```bash
# No secrets in git, use GitHub encrypted secrets instead
```

### 4. Pre-Commit Hook (Prevent Future Commits)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
if git diff --cached | grep -E "(sk_live_|npg_|whsec_|AIzaSy)" > /dev/null 2>&1; then
  echo "❌ ERROR: Secrets detected in commit"
  exit 1
fi
```

---

## Checklist

- [ ] **Neon:** Revoked database password, updated production ENV
- [ ] **Stripe:** Revoked live keys, created new keys, updated production ENV
- [ ] **Google Cloud:** Revoked API key, created new key, updated production ENV
- [ ] **Vercel:** Reviewed activity log for suspicious activity
- [ ] **Git:** Removed .env files from history (if applicable)
- [ ] **Team:** Notified team members of key rotation
- [ ] **Monitoring:** Enabled alerts in Neon, Stripe, and Google Cloud for unusual activity

---

## Additional Resources

- [Stripe: Rotate API Keys](https://stripe.com/docs/keys#rotate-keys)
- [Neon: Reset Password](https://neon.tech/docs/manage/users#reset-password)
- [Google Cloud: Manage API Keys](https://cloud.google.com/docs/authentication/api-keys)
- [Git: Remove Data from History](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History#_removing_a_file_from_every_commit)

---

**Status:** This alert must be resolved before production launch.
