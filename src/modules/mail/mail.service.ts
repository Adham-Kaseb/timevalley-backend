import { Injectable, Logger } from '@nestjs/common';
import * as tls from 'tls';
import * as fs from 'fs';
import * as path from 'path';

export interface NewStudentNotificationPayload {
  name: string;
  email: string;
  phone?: string;
  track?: string;
}

export interface ContactUsPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface PasswordResetPayload {
  email: string;
  name: string;
  code: string;
  token: string;
}

export interface CertificateIssuedPayload {
  name: string;
  email: string;
  certificateTitle: string;
  serialNumber: string;
  issueDate: string;
  downloadUrl?: string;
  verifyUrl: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Sends a styled HTML contact inquiry email to adhamkasebssj4@gmail.com
   */
  async sendContactUsEmail(payload: ContactUsPayload): Promise<void> {
    const { adminEmail, user, pass } = this.getDynamicEnv();

    if (!pass) {
      this.logger.warn(
        `[Mail System] Cannot dispatch Contact Us email to ${adminEmail}. SMTP_PASS is empty in .env. ` +
        `Contact message logged: [Name: ${payload.name}, Email: ${payload.email}, Message: ${payload.message}]`
      );
      return;
    }

    const contactDate = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Cairo',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Message - TimeValley</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f6f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: left;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f2f6f7; padding: 40px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 45px rgba(14, 104, 117, 0.12);">
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #EDA296 0%, #0E6875 50%, #148393 100%);"></td>
          </tr>
          <tr>
            <td style="background-color: #0E6875; background: linear-gradient(135deg, #072F35 0%, #0E6875 60%, #148393 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
              <div style="font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                TIMEVALLEY
              </div>
              <div style="font-size: 13px; color: #e6f3f5; margin-top: 6px; font-weight: 600;">
                💬 New Student & Partner Contact Inquiry
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              <span style="display: inline-block; background-color: #E6F3F5; color: #0E6875; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 50px; margin-bottom: 20px;">
                📩 Direct Contact Form Message
              </span>
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
                You received a message from ${payload.name}
              </h2>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF0E9; border-left: 5px solid #0E6875; border-radius: 16px; padding: 16px 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: #475569; width: 120px;">Sender Name:</td>
                  <td style="padding: 8px 0; font-size: 15px; font-weight: 800; color: #0E6875;">${payload.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: #475569;">Email:</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 800; color: #0E6875;">
                    <a href="mailto:${payload.email}" style="color: #0E6875; text-decoration: underline;">${payload.email}</a>
                  </td>
                </tr>
                ${payload.phone ? `<tr><td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: #475569;">Phone:</td><td style="padding: 8px 0; font-size: 14px; font-weight: 800; color: #0f172a;">${payload.phone}</td></tr>` : ''}
                ${payload.subject ? `<tr><td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: #475569;">Subject:</td><td style="padding: 8px 0; font-size: 14px; font-weight: 800; color: #0f172a;">${payload.subject}</td></tr>` : ''}
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: #475569;">Submitted On:</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #64748b;">${contactDate}</td>
                </tr>
              </table>
              
              <div style="font-size: 14px; font-weight: 700; color: #0E6875; margin-bottom: 8px;">Message Content:</div>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-wrap;">
                ${payload.message}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subjectHeader = `=?UTF-8?B?${Buffer.from(`💬 Contact Form Message from ${payload.name}`).toString('base64')}?=`;

    const rawMail = [
      `From: "TimeValley Contact Form" <${user}>`,
      `To: <${adminEmail}>`,
      `Subject: ${subjectHeader}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlContent,
    ].join('\r\n');

    try {
      this.logger.log(`Dispatching contact email from ${payload.name} (${payload.email}) to ${adminEmail}...`);
      await this.sendSmtpNative(user, pass, adminEmail, rawMail);
      this.logger.log(`[Success] Contact email successfully sent to ${adminEmail}!`);
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to send contact email to ${adminEmail}: ${errMessage}`);
    }
  }

  /**
   * Sends a styled HTML Password Reset verification email containing a 6-digit OTP code and direct reset link.
   */
  async sendPasswordResetEmail(payload: PasswordResetPayload): Promise<void> {
    const { user, pass } = this.getDynamicEnv();

    this.logger.log(
      `[PASSWORD RESET CODE] Generated OTP for ${payload.email}: Code [ ${payload.code} ]`
    );

    if (!pass) {
      this.logger.warn(
        `[Mail System] SMTP_PASS is empty in .env. Password reset email logged to console above.`
      );
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request - TimeValley</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f6f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: left;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f2f6f7; padding: 40px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 45px rgba(14, 104, 117, 0.12);">
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #EDA296 0%, #0E6875 50%, #148393 100%);"></td>
          </tr>
          <tr>
            <td style="background-color: #0E6875; background: linear-gradient(135deg, #072F35 0%, #0E6875 60%, #148393 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
              <div style="font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                TIMEVALLEY
              </div>
              <div style="font-size: 13px; color: #e6f3f5; margin-top: 6px; font-weight: 600;">
                🔑 Password Reset & Account Recovery
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              <span style="display: inline-block; background-color: #E6F3F5; color: #0E6875; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 50px; margin-bottom: 20px;">
                🔒 Security Verification
              </span>
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a;">
                Hello ${payload.name || 'Student'},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                We received a request to reset your password for your TimeValley account (<strong style="color: #0E6875;">${payload.email}</strong>). Use the 6-digit verification code below to restore your password on the platform:
              </p>

              <!-- 6-Digit OTP Code Display Box -->
              <div style="background-color: #FAF0E9; border: 2px dashed #0E6875; border-radius: 20px; padding: 24px; text-align: center; margin-bottom: 28px;">
                <div style="font-size: 12px; font-weight: 800; color: #0E6875; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  Your 6-Digit Security OTP Code
                </div>
                <div style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #0E6875; font-family: monospace;">
                  ${payload.code}
                </div>
                <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 8px;">
                  Expires in 100 seconds • Do not share this code with anyone
                </div>
              </div>

              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subjectHeader = `=?UTF-8?B?${Buffer.from(`🔑 Reset Your TimeValley Password (Code: ${payload.code})`).toString('base64')}?=`;

    const rawMail = [
      `From: "TimeValley Security" <${user}>`,
      `To: <${payload.email}>`,
      `Subject: ${subjectHeader}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlContent,
    ].join('\r\n');

    try {
      this.logger.log(`Dispatching password reset email to ${payload.email}...`);
      await this.sendSmtpNative(user, pass, payload.email, rawMail);
      this.logger.log(`[Success] Password reset email sent to ${payload.email}!`);
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to send password reset email to ${payload.email}: ${errMessage}`);
    }
  }

  private getDynamicEnv(): { adminEmail: string; user: string; pass: string } {
    let adminEmail = process.env.ADMIN_EMAIL || 'adhamkasebssj4@gmail.com';
    let user = process.env.SMTP_USER || 'adhamkasebssj4@gmail.com';
    let pass = process.env.SMTP_PASS || '';

    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const passMatch = content.match(/SMTP_PASS=["']?([^"'\r\n]+)["']?/);
        const userMatch = content.match(/SMTP_USER=["']?([^"'\r\n]+)["']?/);
        const adminMatch = content.match(/ADMIN_EMAIL=["']?([^"'\r\n]+)["']?/);

        if (passMatch && passMatch[1]) pass = passMatch[1].trim();
        if (userMatch && userMatch[1]) user = userMatch[1].trim();
        if (adminMatch && adminMatch[1]) adminEmail = adminMatch[1].trim();
      }
    } catch {
      // fallback to process.env
    }

    return { adminEmail, user, pass };
  }

  /**
   * Sends a styled RTL Arabic HTML notification email to the platform admin when a new student registers.
   * This method executes safely and catches errors silently without throwing exceptions.
   */
  async sendNewStudentNotification(payload: NewStudentNotificationPayload): Promise<void> {
    const { adminEmail, user, pass } = this.getDynamicEnv();

    if (!pass) {
      this.logger.warn(
        `[Mail System] Cannot dispatch email to ${adminEmail}. SMTP_PASS is empty in .env. ` +
        `Please set SMTP_USER and SMTP_PASS (Gmail App Password) in timevally-backend/.env.`
      );
      return;
    }
    const senderEmail = process.env.SMTP_USER || 'no-reply@timevalley.io';
    const registrationDate = new Date().toLocaleString('ar-EG', {
      timeZone: 'Africa/Cairo',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تسجيل طالب جديد - TimeValley</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f6f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f2f6f7; padding: 40px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 45px rgba(14, 104, 117, 0.12);">
          
          <!-- Top Accent Line -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #EDA296 0%, #0E6875 50%, #148393 100%);"></td>
          </tr>

          <!-- Premium Gradient Header Banner -->
          <tr>
            <td style="background-color: #0E6875; background: linear-gradient(135deg, #072F35 0%, #0E6875 60%, #148393 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <!-- Brand Icon Emblem -->
                    <div style="width: 58px; height: 58px; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 20px; text-align: center; line-height: 54px; font-size: 26px; color: #ffffff; margin-bottom: 14px; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
                      ⚡
                    </div>
                    <div style="font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; font-family: Arial, sans-serif;">
                      TIMEVALLEY
                    </div>
                    <div style="font-size: 13px; color: #e6f3f5; margin-top: 6px; font-weight: 600; letter-spacing: 0.5px;">
                      نظام الإشعارات الفورية • لوحة تحكم الإدارة
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Section -->
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              
              <!-- Multi Badge Row -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding-left: 8px;">
                    <span style="display: inline-block; background-color: #E6F3F5; color: #0E6875; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 50px; border: 1px solid rgba(14, 104, 117, 0.25);">
                      🎓 طالب جديد انضم للمنصة
                    </span>
                  </td>
                  <td>
                    <span style="display: inline-block; background-color: #FAF0E9; color: #C86B5D; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 50px; border: 1px solid rgba(237, 162, 150, 0.3);">
                      إشعار فوري
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Greeting Heading -->
              <h2 style="margin: 0 0 12px 0; font-size: 21px; font-weight: 800; color: #0f172a; line-height: 1.4;">
                مرحباً أدمن منصة TimeValley 👋
              </h2>
              <p style="margin: 0 0 28px 0; font-size: 14px; color: #475569; line-height: 1.7;">
                تم تسجيل حساب طالب جديد بنجاح في قاعدة البيانات. وفيما يلي بطاقة البيانات الكاملة للطالب:
              </p>

              <!-- Main Student Details Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF0E9; border-right: 5px solid #0E6875; border-radius: 20px; padding: 8px 20px; border-collapse: separate;">
                
                <!-- Row 1: Student Name -->
                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px dashed rgba(14, 104, 117, 0.15); font-size: 14px; font-weight: 700; color: #475569; width: 140px;">
                    👤 اسم الطالب:
                  </td>
                  <td style="padding: 14px 0; border-bottom: 1px dashed rgba(14, 104, 117, 0.15); font-size: 16px; font-weight: 900; color: #0E6875;">
                    ${payload.name}
                  </td>
                </tr>

                <!-- Row 2: Student Email -->
                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px dashed rgba(14, 104, 117, 0.15); font-size: 14px; font-weight: 700; color: #475569;">
                    ✉️ البريد الإلكتروني:
                  </td>
                  <td style="padding: 14px 0; border-bottom: 1px dashed rgba(14, 104, 117, 0.15); font-size: 14px; font-weight: 800; color: #0E6875;">
                    <a href="mailto:${payload.email}" style="color: #0E6875; text-decoration: none; border-bottom: 1px dotted #0E6875;">${payload.email}</a>
                  </td>
                </tr>

                <!-- Row 3: Phone Number -->
                ${
                  payload.phone
                    ? `<tr>
                        <td style="padding: 14px 0; border-bottom: 1px dashed rgba(14, 104, 117, 0.15); font-size: 14px; font-weight: 700; color: #475569;">
                          📱 رقم الهاتف:
                        </td>
                        <td style="padding: 14px 0; border-bottom: 1px dashed rgba(14, 104, 117, 0.15); font-size: 14px; font-weight: 800; color: #0f172a; direction: ltr; text-align: right;">
                          ${payload.phone}
                        </td>
                      </tr>`
                    : ''
                }

                <!-- Row 4: Track -->
                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px dashed rgba(14, 104, 117, 0.15); font-size: 14px; font-weight: 700; color: #475569;">
                    🎯 المسار التعليمي:
                  </td>
                  <td style="padding: 14px 0; border-bottom: 1px dashed rgba(14, 104, 117, 0.15); font-size: 14px; font-weight: 800; color: #0E6875;">
                    ${payload.track || 'Registered Student (Unenrolled)'}
                  </td>
                </tr>

                <!-- Row 5: Registration Date -->
                <tr>
                  <td style="padding: 14px 0; font-size: 14px; font-weight: 700; color: #475569;">
                    🕒 تاريخ التسجيل:
                  </td>
                  <td style="padding: 14px 0; font-size: 13px; font-weight: 700; color: #64748b;">
                    ${registrationDate}
                  </td>
                </tr>

              </table>

              <!-- Main CTA Action Container -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="http://localhost:3000/workspace" target="_blank" style="display: block; background-color: #0E6875; background: linear-gradient(135deg, #0E6875 0%, #148393 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 16px 36px; border-radius: 16px; text-align: center; box-shadow: 0 10px 24px rgba(14, 104, 117, 0.3); border: 1px solid rgba(255,255,255,0.2);">
                      الانتقال إلى لوحة إدارة الحسابات في المنصة ←
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Banner -->
          <tr>
            <td style="background-color: #f8fafc; padding: 28px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; line-height: 1.7;">
              <strong style="color: #64748b;">منصة TimeValley للحلول التعليمية والريادية</strong><br>
              الدعم الفني: <a href="mailto:contact@timevalley.com" style="color: #0E6875; text-decoration: none;">contact@timevalley.com</a><br>
              جميع الحقوق محفوظة © ${new Date().getFullYear()} TimeValley Inc.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subjectHeader = `=?UTF-8?B?${Buffer.from(`🎓 طالب جديد انضم للمنصة: ${payload.name}`).toString('base64')}?=`;

    const rawMail = [
      `From: "TimeValley System" <${user}>`,
      `To: <${adminEmail}>`,
      `Subject: ${subjectHeader}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlContent,
    ].join('\r\n');

    try {
      this.logger.log(`Dispatching email notification to ${adminEmail} via native TLS...`);
      await this.sendSmtpNative(user, pass, adminEmail, rawMail);
      this.logger.log(`[Success] Email notification successfully sent to ${adminEmail}!`);
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to send email notification to admin (${adminEmail}): ${errMessage}.`);
    }
  }

  /**
   * Dispatches a celebratory Certificate Email to the student upon completing course/diploma
   */
  async sendCertificateIssuedEmail(payload: CertificateIssuedPayload): Promise<void> {
    const { user, pass } = this.getDynamicEnv();

    if (!pass) {
      this.logger.warn(
        `[Mail System] Cannot dispatch Certificate email to ${payload.email}. SMTP_PASS is empty in .env. ` +
        `Certificate Code: [${payload.serialNumber}] for ${payload.name}`
      );
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations on your Certificate - TimeValley</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f6f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: left;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f2f6f7; padding: 40px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 45px rgba(14, 104, 117, 0.12);">
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #EDA296 0%, #0E6875 50%, #D97706 100%);"></td>
          </tr>
          <tr>
            <td style="background-color: #0E6875; background: linear-gradient(135deg, #072F35 0%, #0E6875 60%, #148393 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
              <div style="font-size: 36px; margin-bottom: 10px;">🎓</div>
              <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                TIMEVALLEY INSTITUTE
              </div>
              <div style="font-size: 14px; color: #e6f3f5; margin-top: 6px; font-weight: 600;">
                Official Certificate of Accomplishment
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              <span style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 50px; margin-bottom: 20px; border: 1px solid #FDE68A;">
                🏆 Verified Credential Issued
              </span>
              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #0f172a;">
                Congratulations, ${payload.name}!
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                You have successfully fulfilled all graduation requirements and demonstrated excellence in <strong>${payload.certificateTitle}</strong>.
              </p>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF0E9; border-left: 5px solid #0E6875; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #64748b; width: 140px;">Recipient Name:</td>
                  <td style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #0E6875;">${payload.name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #64748b;">Serial Code:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 800; color: #0f172a; font-family: monospace;">${payload.serialNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #64748b;">Issue Date:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #334155;">${payload.issueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #64748b;">Verification Portal:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700;">
                    <a href="${payload.verifyUrl}" style="color: #0E6875; text-decoration: underline;">Verify Credential Online</a>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
                <a href="${payload.verifyUrl}" style="display: inline-block; background-color: #0E6875; color: #ffffff; font-size: 14px; font-weight: 800; padding: 14px 32px; border-radius: 14px; text-decoration: none; box-shadow: 0 10px 20px rgba(14, 104, 117, 0.25);">
                  📜 View & Download Certificate
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; line-height: 1.7;">
              <strong style="color: #64748b;">TimeValley Venture Builder & Educational Hub</strong><br>
              Direct Verification Link: <a href="${payload.verifyUrl}" style="color: #0E6875;">${payload.verifyUrl}</a><br>
              جميع الحقوق محفوظة © ${new Date().getFullYear()} TimeValley Inc.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subjectHeader = `=?UTF-8?B?${Buffer.from(`🎓 تهانينا! تمت إتاحة شهادتك المعتمدة: ${payload.certificateTitle}`).toString('base64')}?=`;

    const rawMail = [
      `From: "TimeValley Credentials" <${user}>`,
      `To: <${payload.email}>`,
      `Subject: ${subjectHeader}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlContent,
    ].join('\r\n');

    try {
      this.logger.log(`Dispatching Certificate Email to ${payload.email} for [${payload.serialNumber}]...`);
      await this.sendSmtpNative(user, pass, payload.email, rawMail);
      this.logger.log(`[Success] Certificate email successfully sent to ${payload.email}!`);
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to send Certificate email to ${payload.email}: ${errMessage}.`);
    }
  }

  private sendSmtpNative(user: string, pass: string, to: string, rawMail: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = tls.connect(
        {
          host: 'smtp.gmail.com',
          port: 465,
          servername: 'smtp.gmail.com',
          rejectUnauthorized: false,
        },
        () => {
          // SSL connection established
        }
      );

      let step = 0;
      let errorOccurred = false;

      // Strip spaces from App Password if any
      const cleanPass = pass.replace(/\s+/g, '');
      const userB64 = Buffer.from(user).toString('base64');
      const passB64 = Buffer.from(cleanPass).toString('base64');

      socket.on('data', (data) => {
        const response = data.toString();
        const code = parseInt(response.substring(0, 3), 10);

        if (code >= 400) {
          errorOccurred = true;
          socket.end();
          return reject(new Error(`SMTP Error (${code}): ${response.trim()}`));
        }

        if (step === 0) {
          step = 1;
          socket.write('EHLO timevalley.io\r\n');
        } else if (step === 1) {
          step = 2;
          socket.write('AUTH LOGIN\r\n');
        } else if (step === 2) {
          step = 3;
          socket.write(userB64 + '\r\n');
        } else if (step === 3) {
          step = 4;
          socket.write(passB64 + '\r\n');
        } else if (step === 4) {
          step = 5;
          socket.write(`MAIL FROM:<${user}>\r\n`);
        } else if (step === 5) {
          step = 6;
          socket.write(`RCPT TO:<${to}>\r\n`);
        } else if (step === 6) {
          step = 7;
          socket.write('DATA\r\n');
        } else if (step === 7) {
          step = 8;
          socket.write(rawMail + '\r\n.\r\n');
        } else if (step === 8) {
          step = 9;
          socket.write('QUIT\r\n');
          socket.end();
          resolve();
        }
      });

      socket.on('error', (err) => {
        if (!errorOccurred) {
          errorOccurred = true;
          reject(err);
        }
      });

      socket.setTimeout(15000, () => {
        if (!errorOccurred) {
          errorOccurred = true;
          socket.destroy();
          reject(new Error('SMTP Connection timeout (15s)'));
        }
      });
    });
  }
}
