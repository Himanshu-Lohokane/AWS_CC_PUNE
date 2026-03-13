#!/usr/bin/env python3
"""
AWS Cloud Club Certificate Generator & Sender
Generates personalized certificates from PPTX template and emails them
"""

import csv
import smtplib
import os
import sys
import time
import shutil
import subprocess
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
import zipfile

# Configuration
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
FROM_EMAIL = 'awsadypsoe@gmail.com'
BATCH_SIZE = 7  # Send 10 certificates, then wait
BATCH_DELAY = 100  # Wait 100 seconds between batches

# File paths
SCRIPT_DIR = Path(__file__).parent
TEMPLATE_PPTX = SCRIPT_DIR / "Participating certificate.pptx"
CSV_FILE = SCRIPT_DIR / "mmmmmmmmmmm (Responses) - Form Responses 1.csv"
HTML_TEMPLATE = SCRIPT_DIR / "aws-cloud-club-certificate.html"
OUTPUT_DIR = SCRIPT_DIR / "generated_certificates"
TEMP_DIR = SCRIPT_DIR / "temp"

def load_env():
    """Load environment variables from .env file"""
    env_file = SCRIPT_DIR.parent / '.env'
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

def replace_in_pptx(template_path, output_path, replacements):
    """
    Replace text in PPTX by editing XML carefully
    Preserves ALL original file compression and structure
    """
    try:
        # Read original PPTX
        with zipfile.ZipFile(template_path, 'r') as zip_in:
            with zipfile.ZipFile(output_path, 'w') as zip_out:
                # Copy each file preserving original compression
                for item in zip_in.infolist():
                    data = zip_in.read(item.filename)
                    
                    # Only modify XML files in slides
                    if item.filename.startswith('ppt/slides/slide') and item.filename.endswith('.xml'):
                        # Decode, replace text, encode back
                        text = data.decode('utf-8')
                        for old, new in replacements.items():
                            text = text.replace(old, new)
                        data = text.encode('utf-8')
                    
                    # Write with SAME compression as original
                    zip_out.writestr(item, data, compress_type=item.compress_type)
        
        return True
    except Exception as e:
        print(f"❌ Error editing PPTX: {e}")
        return False

def convert_pptx_to_pdf(pptx_path, pdf_path):
    """Convert PPTX directly to PDF using LibreOffice - preserves vector text"""
    try:
        # LibreOffice headless conversion DIRECTLY to PDF
        output_dir = pdf_path.parent
        result = subprocess.run([
            'libreoffice',
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', str(output_dir),
            str(pptx_path)
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            # LibreOffice creates filename.pdf in output_dir
            generated_pdf = output_dir / f"{pptx_path.stem}.pdf"
            if generated_pdf.exists() and generated_pdf != pdf_path:
                generated_pdf.rename(pdf_path)
            return True
        else:
            print(f"❌ LibreOffice error: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ PDF conversion timeout")
        return False
    except Exception as e:
        print(f"❌ PDF conversion error: {e}")
        return False

def load_html_template():
    """Load HTML email template"""
    with open(HTML_TEMPLATE, 'r', encoding='utf-8') as f:
        return f.read()

def send_certificate_email(name, email, pdf_path, smtp_server):
    """Send certificate email with PDF attachment"""
    try:
        # Load and personalize HTML
        html_content = load_html_template()
        html_content = html_content.replace('{{name}}', name)
        
        # Create email
        msg = MIMEMultipart('mixed')
        msg['From'] = f'AWS CLOUD CLUB <{FROM_EMAIL}>'
        msg['To'] = email
        msg['Subject'] = 'Your AWS Cloud Club Certificate of Participation'
        
        # Attach HTML body
        msg.attach(MIMEText(html_content, 'html'))
        
        # Attach PDF
        with open(pdf_path, 'rb') as f:
            pdf_attachment = MIMEBase('application', 'pdf')
            pdf_attachment.set_payload(f.read())
            encoders.encode_base64(pdf_attachment)
            pdf_attachment.add_header(
                'Content-Disposition',
                f'attachment; filename="{name}_AWS_Certificate.pdf"'
            )
            msg.attach(pdf_attachment)
        
        # Send
        smtp_server.send_message(msg)
        return True
    except Exception as e:
        print(f"❌ Email error: {e}")
        return False

def load_recipients():
    """Load recipients from CSV who need certificates"""
    recipients = []
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            # Skip None or empty rows
            if not row or row.get('Email Address') is None:
                continue
                
            email = row.get('Email Address', '').strip()
            name = row.get('Full Name (to be printed on the certificate)', '').strip()
            status = row.get('_Mail_Status_', '').strip()
            
            # Skip empty rows or rows with no email/name
            if not email or not name:
                continue
            
            # Skip rows that already successfully received certificate
            # Check for both '_Mail_Sent_' (from Smart Certificates) and 'SENT' (from our script)
            if status in ('_Mail_Sent_', 'SENT'):
                continue
                
            recipients.append({
                'name': name,
                'email': email,
                'status': status,
                'row_index': idx  # Track original row position
            })
    
    return recipients

def update_csv_status(email, status):
    """Update CSV file to mark email as sent"""
    try:
        # Read all rows
        rows = []
        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            
            # Ensure _Mail_Status_ column exists
            if '_Mail_Status_' not in fieldnames:
                fieldnames = list(fieldnames) + ['_Mail_Status_']
            
            for row in reader:
                if row.get('Email Address', '').strip() == email:
                    row['_Mail_Status_'] = status
                rows.append(row)
        
        # Write back
        with open(CSV_FILE, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        
        return True
    except Exception as e:
        print(f"❌ CSV update error: {e}")
        return False

def main():
    print("🎓 AWS Cloud Club Certificate Generator")
    print("=" * 60)
    
    # Load environment
    load_env()
    app_password = os.getenv('GMAIL_APP_PASSWORD')
    if not app_password:
        print("❌ GMAIL_APP_PASSWORD not found in .env")
        return
    
    # Check template exists
    if not TEMPLATE_PPTX.exists():
        print(f"❌ Template not found: {TEMPLATE_PPTX}")
        return
    
    if not HTML_TEMPLATE.exists():
        print(f"❌ HTML template not found: {HTML_TEMPLATE}")
        return
    
    # Create output directories
    OUTPUT_DIR.mkdir(exist_ok=True)
    TEMP_DIR.mkdir(exist_ok=True)
    
    # Load recipients
    print("\n📧 Loading recipients...")
    recipients = load_recipients()
    print(f"✅ Found {len(recipients)} recipients")
    
    if len(recipients) == 0:
        print("❌ No recipients to process")
        return
    
    # Show first few
    print("\nFirst 5 recipients:")
    for i, r in enumerate(recipients[:5], 1):
        print(f"  {i}. {r['name']} <{r['email']}>")
    if len(recipients) > 5:
        print(f"  ... and {len(recipients) - 5} more")
    
    # Confirmation
    print(f"\n⚠️  This will:")
    print(f"   1. Generate {len(recipients)} personalized certificates")
    print(f"   2. Convert PPTX directly to PDF (preserves quality + selectable text)")
    print(f"   3. Email with PDF attachment")
    print(f"   4. Update CSV with 'SENT' status for each successful email")
    print(f"   5. Process in batches of {BATCH_SIZE} with {BATCH_DELAY}s delays")
    print(f"\n⏱️  Estimated time: ~{(len(recipients) // BATCH_SIZE) * (BATCH_DELAY // 60)} minutes")
    
    confirm = input("\nType 'YES' to start: ").strip()
    if confirm != 'YES':
        print("❌ Cancelled")
        return
    
    # Connect to Gmail
    print("\n🔌 Connecting to Gmail SMTP...")
    try:
        smtp_server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        smtp_server.starttls()
        smtp_server.login(FROM_EMAIL, app_password)
        print("✅ Connected successfully")
    except Exception as e:
        print(f"❌ SMTP connection failed: {e}")
        return
    
    # Process recipients
    print(f"\n🚀 Starting certificate generation...\n")
    
    success_count = 0
    failed_count = 0
    
    for i, recipient in enumerate(recipients, 1):
        name = recipient['name']
        email = recipient['email']
        
        print(f"[{i}/{len(recipients)}] Processing {name}...", end=' ')
        
        try:
            # Generate filenames
            safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_name = safe_name.replace(' ', '_')
            
            pptx_path = OUTPUT_DIR / f"{safe_name}.pptx"
            pdf_path = OUTPUT_DIR / f"{safe_name}.pdf"
            
            # Step 1: Edit PPTX
            if not replace_in_pptx(TEMPLATE_PPTX, pptx_path, {'{{name}}': name}):
                print("❌ PPTX generation failed")
                failed_count += 1
                continue
            
            # Step 2: Convert PPTX directly to PDF (keeps text selectable!)
            if not convert_pptx_to_pdf(pptx_path, pdf_path):
                print("❌ PDF conversion failed")
                failed_count += 1
                continue
            
            # Step 3: Send email
            if not send_certificate_email(name, email, pdf_path, smtp_server):
                print("❌ Email failed")
                failed_count += 1
                continue
            
            # Step 4: Update CSV status
            update_csv_status(email, '_Mail_Sent_')
            
            print("✅ Sent")
            success_count += 1
            
            # Cleanup temp files (keep PDF)
            if pptx_path.exists():
                pptx_path.unlink()
            
            # Batch delay
            if i % BATCH_SIZE == 0 and i < len(recipients):
                print(f"\n⏸️  Batch complete. Waiting {BATCH_DELAY}s to avoid rate limits...")
                time.sleep(BATCH_DELAY)
                print("▶️  Resuming...\n")
            else:
                time.sleep(1)  # Small delay between emails
        
        except KeyboardInterrupt:
            print("\n\n⚠️  Interrupted by user")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            failed_count += 1
    
    # Cleanup
    smtp_server.quit()
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"✅ Successful: {success_count}/{len(recipients)}")
    print(f"❌ Failed: {failed_count}/{len(recipients)}")
    print(f"\n📁 PDFs saved in: {OUTPUT_DIR}")
    print(f"📋 CSV updated with 'SENT' status: {CSV_FILE}")
    print("✨ Done!")

if __name__ == '__main__':
    main()
