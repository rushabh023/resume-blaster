"""
Shared email sending logic for Resume Blaster (CLI + local server).
Uses only Python standard library.
"""

import base64
import smtplib
import time
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def interpolate(template: str, recipient: dict) -> str:
    name = recipient.get("name") or "Hiring Manager"
    company = recipient.get("company") or "your company"
    email = recipient.get("email") or ""
    return (
        template.replace("{name}", name)
        .replace("{Name}", name)
        .replace("{company}", company)
        .replace("{Company}", company)
        .replace("{email}", email)
        .replace("{Email}", email)
    )


def send_email(smtp, sender_email: str, recipient: dict, subject: str, body: str, resume: dict) -> None:
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = recipient["email"]
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain", "utf-8"))

    filename = resume.get("filename", "resume.pdf")
    pdf_data = base64.b64decode(resume["base64"])
    attachment = MIMEApplication(pdf_data, _subtype="pdf")
    attachment.add_header("Content-Disposition", "attachment", filename=filename)
    msg.attach(attachment)

    smtp.sendmail(sender_email, [recipient["email"]], msg.as_string())


def run_bulk_send(config: dict, progress_callback=None, is_test: bool = False) -> dict:
    sender = config["sender"]
    sender_email = sender["email"]
    app_password = sender["app_password"].replace(" ", "")
    subject_template = config["subject"]
    body_template = config["body"]
    resume = config["resume"]
    recipients = list(config["recipients"])
    delay = config.get("delay_seconds", 1)

    if is_test:
        recipients = [{"email": sender_email, "name": "Test", "company": "Test Co"}]

    total = len(recipients)
    if total == 0:
        raise ValueError("No recipients to send to.")

    sent = 0
    failed = 0
    prefix = "[TEST] " if is_test else ""

    def report(current, log_entry):
        if progress_callback:
            progress_callback({"current": current, "total": total, "log": log_entry})

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(sender_email, app_password)

        for i, recipient in enumerate(recipients, start=1):
            email = recipient["email"]
            subject = prefix + interpolate(subject_template, recipient)
            body = interpolate(body_template, recipient)

            try:
                send_email(smtp, sender_email, recipient, subject, body, resume)
                sent += 1
                report(i, {"email": email, "success": True, "error": None})
            except Exception as e:
                failed += 1
                report(i, {"email": email, "success": False, "error": str(e)})

            if i < total:
                time.sleep(delay)

    return {"sent": sent, "failed": failed, "total": total, "is_test": is_test}
