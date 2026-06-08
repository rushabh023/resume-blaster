# Make Resume Blaster Available to EVERYONE

Follow these steps to move from **Testing** (100 users max) to **Public** (anyone can sign in).

**Time:** Google review usually takes **3–7 days** (sometimes longer for `gmail.send`).

---

## Part 1 — Prepare your website (done / deploy)

These URLs must be live before you submit:

| Page | URL |
|------|-----|
| **App homepage** | https://rushabh023.github.io/resume-blaster/ |
| **Privacy policy** | https://rushabh023.github.io/resume-blaster/privacy.html |

Push latest code to GitHub if you haven't already.

---

## Part 2 — Google Cloud: Branding

1. [Google Cloud Console](https://console.cloud.google.com/) → project **Resume Blaster**
2. **Google Auth Platform** → **Branding**
3. Fill in:

| Field | Value |
|-------|--------|
| **App name** | Resume Blaster |
| **User support email** | rushabhkalal5@gmail.com |
| **App logo** | Upload a simple icon (optional but helps) |
| **Application home page** | `https://rushabh023.github.io/resume-blaster/` |
| **Privacy policy link** | `https://rushabh023.github.io/resume-blaster/privacy.html` |
| **Authorized domains** | `github.io` |

4. **Save**

---

## Part 3 — Verify domain (github.io)

1. **Branding** → **Authorized domains** → **Add domain**
2. Add: `github.io`
3. Google may ask you to verify via **Google Search Console**
   - Go to [search.google.com/search-console](https://search.google.com/search-console)
   - Add property: `https://rushabh023.github.io`
   - Verify ownership (HTML file or DNS — GitHub Pages users often use HTML tag in `docs/`)

If domain verification is difficult, Google may still accept the app if homepage and privacy policy are on the same authorized origin.

---

## Part 4 — Data Access (scopes justification)

1. **Google Auth Platform** → **Data Access**
2. Confirm scopes include:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/userinfo.email`
3. For **gmail.send**, you will need to justify:
   - **Why needed:** "Users send job application emails with resume PDF attachments to HR contacts they specify."
   - **How used:** "Only to send emails the user composes. We never read inbox or other mail."

---

## Part 5 — Publish the app

1. **Google Auth Platform** → **Audience**
2. Under **Publishing status**, click **Publish app**
3. Confirm — status changes from **Testing** to **In production**

⚠️ After publishing, **unverified** apps with sensitive scopes may show a scary warning or be limited until verification completes.

---

## Part 6 — Submit for verification

1. **Verification Center** (left menu)
2. Click **Prepare for verification** or **Submit for verification**
3. You will need:

### Required materials

| Item | What to provide |
|------|-----------------|
| **Privacy policy** | https://rushabh023.github.io/resume-blaster/privacy.html |
| **YouTube demo video** | 2–5 min screen recording showing: open app → Sign in with Google → upload PDF → send test email |
| **Scope justification** | Explain gmail.send is only for user-initiated job application emails |
| **Test account** | Provide a Google account Google reviewers can use (or steps to test) |

### Demo video script (record with OBS or phone)

1. Open https://rushabh023.github.io/resume-blaster/
2. Click Sign in with Google → allow permissions
3. Upload a sample PDF resume
4. Compose a short email
5. Add one test recipient email
6. Click Test Send
7. Show email received in Gmail with PDF attached

Upload video to **YouTube** (unlisted is fine) and paste link in verification form.

---

## Part 7 — While waiting for approval

- App may work for all users with an **"unverified app"** warning (users click Advanced → Go to app)
- Or Google may restrict until approved
- Keep **Test users** as backup during review

---

## Part 8 — After approval ✅

Share freely:

```
https://rushabh023.github.io/resume-blaster/
Free · Sign in with Google · Send resume to HR emails
```

No test user list needed. No download. No Python.

---

## Checklist

- [ ] Privacy policy live at `/privacy.html`
- [ ] Branding filled (homepage + privacy URL)
- [ ] gmail.send scope justified in Data Access
- [ ] App published (Audience → Publish)
- [ ] Demo video recorded and uploaded
- [ ] Verification submitted in Verification Center
- [ ] Wait for Google email (approve/deny)

---

## If Google rejects verification

Common fixes:
- Add clearer privacy policy
- Better demo video showing exact OAuth flow
- Narrow scope explanation
- Ensure app only sends user-requested emails

**Fallback:** Keep app in Testing mode and add users to Test users (max 100) — works immediately without verification.

---

## Contact Google

[Google OAuth Verification Support](https://support.google.com/cloud/answer/9110914)

Good luck! 🚀
