#!/usr/bin/env python3
"""
Resume Blaster — Mode B CLI sender (no server needed).
Uses only Python standard library.
"""

import json
import smtplib
import sys
from pathlib import Path

from email_core import run_bulk_send

CONFIG_FILE = "config.json"


def load_config(path: str) -> dict:
    config_path = Path(path)
    if not config_path.exists():
        print(f"Error: {path} not found.")
        print("Export config.json from the web UI (Mode B) and place it in this folder.")
        sys.exit(1)

    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    config_path = sys.argv[1] if len(sys.argv) > 1 else CONFIG_FILE
    config = load_config(config_path)

    sender_email = config["sender"]["email"]
    recipients = config["recipients"]
    delay = config.get("delay_seconds", 1)
    total = len(recipients)

    print(f"Resume Blaster — sending to {total} recipient(s)")
    print(f"From: {sender_email}")
    print(f"Delay: {delay}s between emails")
    print("-" * 50)

    def on_progress(data):
        entry = data["log"]
        i, t = data["current"], data["total"]
        email = entry["email"]
        print(f"[{i}/{t}] Sending to {email}...", end=" ", flush=True)
        if entry["success"]:
            print("✓ Done")
        else:
            print(f"✗ Failed: {entry['error']}")

    try:
        result = run_bulk_send(config, progress_callback=on_progress)
    except smtplib.SMTPAuthenticationError:
        print("\nAuthentication failed. Check your Gmail address and App Password.")
        print("Make sure 2-Step Verification is enabled and you're using an App Password, not your regular password.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)

    print("-" * 50)
    print(f"Summary: {result['sent']} sent, {result['failed']} failed")


if __name__ == "__main__":
    main()
