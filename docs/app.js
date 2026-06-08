(function () {
  'use strict';

  const CONFIG = window.RESUME_BLASTER_CONFIG || {};
  const CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID || '';
  const SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email';
  const STORAGE_KEY = 'resumeBlasterSettings';
  const TEMPLATES_KEY = 'resumeBlasterTemplates';

  let resumeBase64 = null;
  let resumeFileName = null;
  let resumeFileSize = 0;
  let isSending = false;
  let accessToken = null;
  let userEmail = null;
  let tokenClient = null;

  const $ = (id) => document.getElementById(id);

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function interpolate(template, vars) {
    return template
      .replace(/\{name\}/gi, vars.name || 'Hiring Manager')
      .replace(/\{company\}/gi, vars.company || 'your company')
      .replace(/\{email\}/gi, vars.email || '');
  }

  function parseRecipients(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const recipients = [];
    const invalid = [];
    const seen = new Set();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let email, name = '', company = '';

      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map((p) => p.trim());
        email = parts[0];
        name = parts[1] || '';
        company = parts[2] || '';
      } else if (trimmed.includes(';')) {
        const parts = trimmed.split(';').map((p) => p.trim());
        email = parts[0];
        name = parts[1] || '';
        company = parts[2] || '';
      } else {
        email = trimmed;
      }

      if (!isValidEmail(email)) {
        invalid.push(trimmed);
        continue;
      }

      const key = email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      recipients.push({ email: email.trim(), name, company });
    }

    const allEmails = lines.flatMap((l) => {
      const e = l.split(/[,;]/)[0].trim();
      return isValidEmail(e) ? [e.toLowerCase()] : [];
    });
    const dupCount = allEmails.length - new Set(allEmails).size;

    return { recipients, invalid, dupCount };
  }

  function getRecipients() {
    return parseRecipients($('recipientsInput').value);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function base64UrlEncodeUtf8(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function chunkBase64(b64) {
    const clean = b64.replace(/\s/g, '');
    return clean.match(/.{1,76}/g)?.join('\r\n') || clean;
  }

  function buildMimeMessage(to, subject, body, filename, pdfBase64) {
    const boundary = 'resume_blaster_' + Date.now();
    return [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      body,
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${filename}"`,
      '',
      chunkBase64(pdfBase64),
      '',
      `--${boundary}--`,
    ].join('\r\n');
  }

  async function sendGmailEmail(to, subject, body) {
    const mime = buildMimeMessage(to, subject, body, resumeFileName || 'resume.pdf', resumeBase64);
    const raw = base64UrlEncodeUtf8(mime);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || res.statusText || 'Send failed');
    }
  }

  function updateAuthUI() {
    const signedIn = !!(accessToken && userEmail);
    $('signInBtn').classList.toggle('hidden', signedIn);
    $('signOutBtn').classList.toggle('hidden', !signedIn);
    $('authStatus').classList.toggle('hidden', !signedIn);
    if (signedIn) {
      $('authStatus').textContent = '🟢 Signed in as ' + userEmail;
      $('authStatus').className = 'text-xs px-2 py-1 rounded-full border border-green-700 text-green-400 bg-green-900/20';
      $('senderEmail').value = userEmail;
      $('senderEmail').readOnly = true;
    }
    $('sendAllBtn').disabled = !signedIn;
    $('testSendBtn').disabled = !signedIn;
  }

  async function fetchUserEmail() {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    if (!res.ok) throw new Error('Could not get your email');
    const data = await res.json();
    userEmail = data.email;
    updateAuthUI();
    saveSettings();
  }

  function initGoogleAuth() {
    if (!CLIENT_ID) {
      $('configBanner').classList.remove('hidden');
      $('signInBtn').disabled = true;
      return;
    }
    $('configBanner').classList.add('hidden');

    if (typeof google === 'undefined' || !google.accounts?.oauth2) {
      setTimeout(initGoogleAuth, 200);
      return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (response) => {
        if (response.error) {
          alert('Sign in failed: ' + response.error);
          return;
        }
        accessToken = response.access_token;
        try {
          await fetchUserEmail();
        } catch (e) {
          alert(e.message);
          accessToken = null;
          userEmail = null;
          updateAuthUI();
        }
      },
    });
  }

  function signIn() {
    if (!tokenClient) {
      alert('Google Client ID not configured. See GOOGLE_SETUP.md');
      return;
    }
    tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
  }

  function signOut() {
    if (accessToken && google?.accounts?.oauth2?.revoke) {
      google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = null;
    userEmail = null;
    $('senderEmail').readOnly = false;
    updateAuthUI();
  }

  function applyTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    $('themeToggle').textContent = dark ? '🌙' : '☀️';
  }

  $('themeToggle').addEventListener('click', () => {
    applyTheme(!document.documentElement.classList.contains('dark'));
    saveSettings();
  });

  $('signInBtn').addEventListener('click', signIn);
  $('signOutBtn').addEventListener('click', signOut);

  const dropZone = $('dropZone');
  const resumeInput = $('resumeInput');

  dropZone.addEventListener('click', () => resumeInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleResumeFile(e.dataTransfer.files[0]);
  });
  resumeInput.addEventListener('change', () => {
    if (resumeInput.files[0]) handleResumeFile(resumeInput.files[0]);
  });

  function handleResumeFile(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      resumeBase64 = e.target.result.split(',')[1];
      resumeFileName = file.name;
      resumeFileSize = file.size;
      $('resumeFileName').textContent = file.name;
      $('resumeFileSize').textContent = formatBytes(file.size);
      $('resumeInfo').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  $('clearResume').addEventListener('click', () => {
    resumeBase64 = null;
    resumeFileName = null;
    resumeFileSize = 0;
    resumeInput.value = '';
    $('resumeInfo').classList.add('hidden');
  });

  function updatePreview() {
    const { recipients } = getRecipients();
    const sample = recipients[0] || { email: 'hr@example.com', name: 'Jane Doe', company: 'Acme Corp' };
    const subject = interpolate($('emailSubject').value, sample);
    const body = interpolate($('emailBody').value, sample);
    $('emailPreview').innerHTML = `<strong>Subject:</strong> ${escapeHtml(subject)}<br><br>${escapeHtml(body)}`;
  }

  ['emailSubject', 'emailBody', 'recipientsInput'].forEach((id) => {
    $(id).addEventListener('input', () => { updatePreview(); updateRecipientUI(); });
  });

  function updateRecipientUI() {
    const { recipients, invalid, dupCount } = getRecipients();
    $('recipientCount').textContent = `${recipients.length} valid recipient${recipients.length !== 1 ? 's' : ''}`;

    $('duplicateCount').classList.toggle('hidden', dupCount <= 0);
    if (dupCount > 0) $('duplicateCount').textContent = `${dupCount} duplicate${dupCount !== 1 ? 's' : ''} removed`;

    $('invalidCount').classList.toggle('hidden', invalid.length === 0);
    if (invalid.length > 0) {
      $('invalidCount').textContent = `${invalid.length} invalid`;
      $('invalidList').classList.remove('hidden');
      $('invalidList').innerHTML = invalid.map((i) => `<div class="invalid-email inline-block px-2 py-0.5 rounded mr-1 mb-1">${escapeHtml(i)}</div>`).join('');
    } else {
      $('invalidList').classList.add('hidden');
    }

    const preview = $('recipientPreview');
    if (recipients.length > 0) {
      preview.classList.remove('hidden');
      preview.innerHTML = recipients.slice(0, 20).map((r) =>
        `<div class="text-xs font-mono text-slate-400">${escapeHtml(r.email)}${r.name ? ' · ' + escapeHtml(r.name) : ''}${r.company ? ' · ' + escapeHtml(r.company) : ''}</div>`
      ).join('') + (recipients.length > 20 ? `<div class="text-xs text-slate-500">…and ${recipients.length - 20} more</div>` : '');
    } else {
      preview.classList.add('hidden');
    }
  }

  function loadTemplateList() {
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
    const sel = $('templateSelect');
    sel.innerHTML = '<option value="">Load template…</option>';
    templates.forEach((t, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = t.name;
      sel.appendChild(opt);
    });
  }

  $('saveTemplate').addEventListener('click', () => {
    const name = prompt('Template name:');
    if (!name) return;
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
    templates.push({ name, subject: $('emailSubject').value, body: $('emailBody').value });
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    loadTemplateList();
  });

  $('templateSelect').addEventListener('change', () => {
    const idx = $('templateSelect').value;
    if (idx === '') return;
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
    const t = templates[parseInt(idx)];
    if (t) {
      $('emailSubject').value = t.subject;
      $('emailBody').value = t.body;
      updatePreview();
    }
    $('templateSelect').value = '';
  });

  function saveSettings() {
    if (!$('rememberMe').checked) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sendDelay: $('sendDelay').value,
      emailSubject: $('emailSubject').value,
      emailBody: $('emailBody').value,
      recipientsInput: $('recipientsInput').value,
      darkTheme: document.documentElement.classList.contains('dark'),
    }));
  }

  function loadSettings() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!data) return;
      if (data.sendDelay) $('sendDelay').value = data.sendDelay;
      if (data.emailSubject) $('emailSubject').value = data.emailSubject;
      if (data.emailBody) $('emailBody').value = data.emailBody;
      if (data.recipientsInput) $('recipientsInput').value = data.recipientsInput;
      if (data.darkTheme === false) applyTheme(false);
    } catch (_) {}
  }

  $('sendDelay').addEventListener('input', saveSettings);
  $('rememberMe').addEventListener('change', saveSettings);

  function validateBeforeSend(isTest) {
    if (!CLIENT_ID) {
      alert('App not configured yet. Developer must add Google Client ID.');
      return false;
    }
    if (!accessToken || !userEmail) {
      alert('Please Sign in with Google first.');
      return false;
    }
    if (!resumeBase64) {
      alert('Please upload your resume PDF.');
      return false;
    }
    const { recipients } = getRecipients();
    if (!isTest && recipients.length === 0) {
      alert('Please add at least one valid recipient.');
      return false;
    }
    return { recipients };
  }

  function logStatus(email, success, errorMsg) {
    const div = document.createElement('div');
    div.className = success ? 'text-green-400' : 'text-red-400';
    div.textContent = success ? `✅ ${email} — sent` : `❌ ${email} — failed: ${errorMsg || 'Unknown error'}`;
    $('sendLog').appendChild(div);
    $('sendLog').scrollTop = $('sendLog').scrollHeight;
  }

  function updateProgress(current, total) {
    const pct = total ? Math.round((current / total) * 100) : 0;
    $('progressText').textContent = `Sending ${current} of ${total}…`;
    $('progressPercent').textContent = pct + '%';
    $('progressBar').style.width = pct + '%';
  }

  async function runBulkSend(recipients, isTest) {
    if (isSending) return;
    isSending = true;
    $('sendAllBtn').disabled = true;
    $('testSendBtn').disabled = true;
    $('progressSection').classList.remove('hidden');
    $('sendLog').innerHTML = '';
    $('sendSummary').classList.add('hidden');

    const list = isTest ? [{ email: userEmail, name: 'Test', company: 'Test' }] : recipients;
    const total = list.length;
    let sent = 0, failed = 0;
    const delay = (parseInt($('sendDelay').value) || 5) * 1000;

    updateProgress(0, total);

    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      const subject = (isTest ? '[TEST] ' : '') + interpolate($('emailSubject').value, r);
      const body = interpolate($('emailBody').value, r);

      try {
        await sendGmailEmail(r.email, subject, body);
        sent++;
        logStatus(r.email, true);
      } catch (err) {
        failed++;
        const msg = err.message || String(err);
        logStatus(r.email, false, msg);
        if (msg.includes('401') || msg.toLowerCase().includes('invalid credentials')) {
          signOut();
          alert('Session expired. Please Sign in with Google again.');
          break;
        }
      }
      updateProgress(i + 1, total);
      if (i < list.length - 1) await sleep(delay);
    }

    const summary = $('sendSummary');
    summary.classList.remove('hidden');
    summary.className = `mt-4 p-4 rounded-lg border text-center font-semibold ${failed === 0 ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-yellow-900/30 border-yellow-700 text-yellow-300'}`;
    summary.textContent = isTest
      ? (sent ? '✓ Test email sent!' : '✗ Test failed — try signing in again.')
      : `${sent} sent, ${failed} failed`;

    isSending = false;
    updateAuthUI();
    saveSettings();
  }

  function handleSend(isTest) {
    const result = validateBeforeSend(isTest);
    if (!result) return;
    const { recipients } = result;
    const msg = isTest
      ? `Send test email to ${userEmail}?`
      : `Send resume to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}?`;
    if (!confirm(msg)) return;
    runBulkSend(recipients, isTest);
  }

  $('testSendBtn').addEventListener('click', () => handleSend(true));
  $('sendAllBtn').addEventListener('click', () => handleSend(false));

  loadSettings();
  loadTemplateList();
  updatePreview();
  updateRecipientUI();
  updateAuthUI();

  function boot() {
    if (typeof google === 'undefined' || !google.accounts?.oauth2) {
      setTimeout(boot, 100);
      return;
    }
    initGoogleAuth();
  }
  boot();
})();
