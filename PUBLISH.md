# How to Publish Resume Blaster for Everyone (Free)

This guide is for **you (the developer)** and **users** who want to share or download the app.

---

## What we are sharing

- **Mode B only** — Gmail + App Password + local Python server
- **100% free** — no paid APIs, no subscriptions
- **Each user runs it on their own PC** — their password never goes to our server

---

## Part 1 — For developers (you + me): Put on GitHub

### Step 1: Clean the project

Before uploading, make sure these are **NOT** in the folder:

- `config.json` (contains your App Password!)
- Any personal recipient lists you don't want public

The `.gitignore` file already blocks `config.json`.

### Step 2: Create GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `resume-blaster` (or any name)
3. Public repository
4. Don't add README (we already have one)
5. Click **Create repository**

### Step 3: Upload files

Open PowerShell in your project folder:

```powershell
cd c:\Users\mobil\Desktop\resume_sender
git init
git add .
git commit -m "Initial release: Resume Blaster - free bulk resume sender"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/resume-blaster.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 4: Create a Release (optional but recommended)

1. On GitHub → your repo → **Releases** → **Create a new release**
2. Tag: `v1.0.0`
3. Title: `Resume Blaster v1.0.0`
4. Upload a **ZIP** of the project (without `config.json`)
5. Users can download the ZIP directly — easier than `git clone`

### Step 5: Share the link

Share with users:

```
https://github.com/YOUR_USERNAME/resume-blaster
```

Tell them to read **README.md** and open **setup-guide.html** for Gmail App Password steps with photos.

---

## Part 2 — For users: How to download and use

### Step 1: Download

- Go to the GitHub link
- Click green **Code** → **Download ZIP**
- Unzip to a folder (e.g. `Desktop\resume-blaster`)

### Step 2: Install Python (one time)

1. [python.org/downloads](https://www.python.org/downloads/)
2. Download Python 3
3. During install, check **"Add Python to PATH"**

### Step 3: Create Gmail App Password (one time)

Open **`setup-guide.html`** in the folder (or go to `http://localhost:8765/setup-guide.html` after starting the server).

Follow all 6 steps with photos:

1. Open Google Security
2. Turn on 2-Step Verification
3. Find App Passwords
4. Create App Password for Mail
5. Copy 16-character password
6. Paste in Resume Blaster Step 4

### Step 4: Run the app (every time)

1. Double-click **`start.bat`**
2. Keep the black window open
3. Browser opens → `http://localhost:8765`
4. Upload resume → write email → add recipients → **Send to All**

---

## Part 3 — Optional free landing page (GitHub Pages)

You can host a simple download page for free:

1. GitHub repo → **Settings** → **Pages**
2. Source: **Deploy from branch** → `main` → `/docs` or root
3. Your site: `https://YOUR_USERNAME.github.io/resume-blaster/`

Note: GitHub Pages can host the setup guide and README, but users still need to **download and run `start.bat`** on their PC to send emails.

---

## What NOT to do

| Don't | Why |
|-------|-----|
| Host a public server that stores everyone's passwords | Security disaster |
| Commit `config.json` to GitHub | Exposes your App Password |
| Share your App Password with others | They could send email as you |

---

## Files users need

```
resume-blaster/
├── start.bat              ← Double-click this
├── setup-guide.html       ← Gmail password guide (with photos)
├── index.html             ← The app
├── server.py
├── docs/images/           ← Setup photos
└── README.md
```

---

## Limits to tell users

- Gmail personal: **500 emails/day**
- Keep **5 second delay** between sends
- All data stays on their computer

Good luck sharing it! 🚀
