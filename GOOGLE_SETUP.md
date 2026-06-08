# One-Time Google Setup (Developer Only — You Do This Once)

After this, **every user** just opens your link and clicks **Sign in with Google**. No ZIP, no Python.

---

## Step 1: Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name: `Resume Blaster` → **Create**

## Step 2: Enable Gmail API

1. Menu → **APIs & Services** → **Library**
2. Search **Gmail API** → click it → **Enable**

## Step 3: OAuth Consent Screen

1. **APIs & Services** → **OAuth consent screen**
2. User Type: **External** → **Create**
3. App name: `Resume Blaster`
4. User support email: your email
5. Developer contact: your email
6. **Save and Continue**
7. **Scopes** → **Add or Remove Scopes** → add:
   - `.../auth/gmail.send`
   - `.../auth/userinfo.email`
8. **Save and Continue**
9. **Test users** → Add your Gmail + any testers (while in Testing mode)
10. **Save and Continue**

> **Testing mode** allows up to 100 users. For unlimited public use, click **Publish App** (may need Google verification).

## Step 4: Create OAuth Client ID

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `Resume Blaster Web`
4. **Authorized JavaScript origins** — add BOTH:
   ```
   https://rushabh023.github.io
   http://localhost:5500
   ```
5. Leave redirect URIs empty (not needed for this app)
6. **Create** → copy the **Client ID** (ends with `.apps.googleusercontent.com`)

## Step 5: Add Client ID to the App

1. Open `docs/config.js`
2. Paste your Client ID:
   ```javascript
   window.RESUME_BLASTER_CONFIG = {
     GOOGLE_CLIENT_ID: '123456789-xxxx.apps.googleusercontent.com'
   };
   ```
3. Commit and push to GitHub — site updates in ~2 minutes

## Step 6: Test

1. Open https://rushabh023.github.io/resume-blaster/
2. Click **Sign in with Google**
3. Allow permissions
4. Upload resume → add your email as recipient → **Test Send**

---

## Share With Everyone

Send this link — that's it:

**https://rushabh023.github.io/resume-blaster/**

Users: Sign in → Upload PDF → Add HR emails → Send. No install.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Add exact origin to OAuth client (no trailing slash) |
| `access_denied` | Add user as Test user in OAuth consent screen |
| `API has not been used` | Enable Gmail API, wait 2 minutes |
| Sign in button does nothing | Check `config.js` has valid Client ID |
