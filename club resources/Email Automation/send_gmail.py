#!/usr/bin/env python3
"""
Send personalized AWS Cloud Club event emails using Gmail SMTP
"""

import csv
import smtplib
import time
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load Gmail password from .env file
def load_env():
    env_vars = {}
    try:
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except FileNotFoundError:
        pass
    return env_vars

env = load_env()

# Gmail Configuration
GMAIL_ADDRESS = "awsadypsoe@gmail.com"
GMAIL_APP_PASSWORD = env.get('GMAIL_APP_PASSWORD', 'usfwbpxcdbwmlrfd')
SUBJECT = "You're Invited: AWS Expert Session on EC2 | Feb 26"
HTML_TEMPLATE_PATH = "aws-cloud-club-email-v2.html"
CSV_FILE_PATH = "recipients.csv"

# SMTP Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def load_html_template():
    """Load the HTML email template"""
    with open(HTML_TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        return f.read()

def load_recipients(csv_path):
    """Load recipients from CSV file"""
    recipients = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('name', '').strip()
            email = row.get('email', '').strip()
            if name and email:
                recipients.append({'name': name, 'email': email})
    return recipients

def personalize_html(html_template, name):
    """Replace mail merge placeholder with actual name"""
    return html_template.replace('*|Full Name|*', name)

def send_email(smtp_connection, to_email, to_name, html_content):
    """Send email via SMTP"""
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f"AWS Cloud Club ADYPSOE <{GMAIL_ADDRESS}>"
        msg['To'] = to_email
        msg['Subject'] = SUBJECT
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        smtp_connection.send_message(msg)
        return True, "Sent"
    except Exception as e:
        return False, str(e)

def main():
    # Check app password
    if not GMAIL_APP_PASSWORD:
        print("❌ Error: Gmail App Password not set!")
        print("\nTo get your Gmail App Password:")
        print("1. Go to: https://myaccount.google.com/apppasswords")
        print("2. Select 'Mail' and 'Other (Custom name)'")
        print("3. Enter 'AWS Cloud Club Mailer'")
        print("4. Copy the 16-character password")
        print("5. Paste it in this script at line 13")
        print("\nOr add it to .env file:")
        print("GMAIL_APP_PASSWORD=your_16_char_password")
        return
    
    # Load template
    print("📧 Loading email template...")
    try:
        html_template = load_html_template()
        print(f"✅ Template loaded: {len(html_template)} characters")
    except FileNotFoundError:
        print(f"❌ Error: Template file '{HTML_TEMPLATE_PATH}' not found")
        return
    
    # Load recipients
    print(f"\n👥 Loading recipients from {CSV_FILE_PATH}...")
    try:
        recipients = load_recipients(CSV_FILE_PATH)
        print(f"✅ Found {len(recipients)} recipients")
    except FileNotFoundError:
        print(f"❌ Error: CSV file '{CSV_FILE_PATH}' not found")
        return
    
    if not recipients:
        print("❌ No valid recipients found in CSV")
        return
    
    # Show preview
    print(f"\n📋 Ready to send {len(recipients)} emails")
    print(f"From: {GMAIL_ADDRESS}")
    print(f"Subject: {SUBJECT}")
    print(f"\nFirst 3 recipients:")
    for i, r in enumerate(recipients[:3], 1):
        print(f"  {i}. {r['name']} <{r['email']}>")
    if len(recipients) > 3:
        print(f"  ... and {len(recipients) - 3} more")
    
    # Confirm
    confirm = input("\n⚠️  Type 'YES' to start sending: ")
    if confirm != 'YES':
        print("❌ Cancelled")
        return
    
    # Connect to Gmail SMTP
    print(f"\n🔌 Connecting to Gmail SMTP...")
    try:
        smtp = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        smtp.ehlo()
        smtp.starttls()
        smtp.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        print("✅ Connected successfully")
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        print("\nCheck:")
        print("1. Your Gmail App Password is correct")
        print("2. You enabled 2-Step Verification on your Google account")
        print("3. You created an App Password (not your regular password)")
        return
    
    # Send emails
    print(f"\n🚀 Starting email send...\n")
    
    success_count = 0
    fail_count = 0
    failed_emails = []
    
    for i, recipient in enumerate(recipients, 1):
        name = recipient['name']
        email = recipient['email']
        
        # Personalize HTML
        personalized_html = personalize_html(html_template, name)
        
        # Send email
        print(f"[{i}/{len(recipients)}] Sending to {name} <{email}>...", end=' ')
        
        success, result = send_email(smtp, email, name, personalized_html)
        
        if success:
            print(f"✅ {result}")
            success_count += 1
        else:
            print(f"❌ Failed: {result}")
            fail_count += 1
            failed_emails.append({'name': name, 'email': email, 'error': result})
        
        # Rate limiting - be nice to Gmail
        if i < len(recipients):
            time.sleep(1)
    
    # Close connection
    smtp.quit()
    
    # Summary
    print(f"\n{'='*60}")
    print(f"📊 SUMMARY")
    print(f"{'='*60}")
    print(f"✅ Successful: {success_count}/{len(recipients)}")
    print(f"❌ Failed: {fail_count}/{len(recipients)}")
    
    if failed_emails:
        print(f"\n⚠️  Failed emails:")
        for failed in failed_emails:
            print(f"  - {failed['name']} <{failed['email']}>: {failed['error']}")
    
    print(f"\n✨ Done!")

if __name__ == "__main__":
    main()
