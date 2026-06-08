# Resume Blaster — Free Bulk Resume Email Sender

🌐 **Live app:** [https://rushabh023.github.io/resume-blaster/](https://rushabh023.github.io/resume-blaster/)

**Just open the link → Sign in with Google → Send.** No download. No Python.

---

## For users

1. Open **https://rushabh023.github.io/resume-blaster/**
2. Click **Sign in with Google**
3. Upload PDF resume → write email → paste HR emails
4. Click **🚀 Send to All**

That's it.

---

## For developer (one-time setup)

The app needs a **Google OAuth Client ID** (free). You do this **once**:

👉 **[GOOGLE_SETUP.md](GOOGLE_SETUP.md)** — step-by-step (~10 minutes)

Then paste Client ID in `docs/config.js` and push to GitHub.

---

## How it works

```
User's browser → Sign in with Google → Gmail API → HR inboxes
```

- No server stores passwords
- Resume stays in browser until sent
- PDF attached via Gmail API
- 100% free

---

## Limits

- Gmail personal: **500 emails/day**
- Use **5 second delay** between sends
- Google OAuth "Testing" mode: 100 users (publish app for unlimited)

---

## Legacy: local Python mode

Still available in repo root (`start.bat`, `server.py`) for offline use.

---

## License

Free for job seekers. Good luck! 🚀
