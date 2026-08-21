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
   * Helper: Common Email Wrapper Styles & Head
   */
  private getEmailHead(title: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>`;
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

    const htmlContent = `${this.getEmailHead('Congratulations on your Official Certificate - TimeValley')}
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: left;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px -15px rgba(14, 104, 117, 0.12);">
          
          <!-- Luxury Obsidian & Teal Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #072227 0%, #0E6875 60%, #144951 100%); padding: 44px 32px; text-align: center; color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <!-- Gold Laurel Emblem Badge -->
                    <div style="display: inline-block; width: 64px; height: 64px; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; line-height: 60px; font-size: 32px; text-align: center; margin-bottom: 16px; box-shadow: 0 10px 20px rgba(0,0,0,0.2);">
                      🎓
                    </div>
                    <div style="font-size: 24px; font-weight: 900; letter-spacing: 2.5px; color: #ffffff; text-transform: uppercase; margin-bottom: 4px;">
                      TIMEVALLEY INSTITUTE
                    </div>
                    <div style="font-size: 13px; color: #d1fae5; font-weight: 700; letter-spacing: 0.5px;">
                      Executive Credential & Graduation Notice
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 40px 36px; background-color: #ffffff;">
              
              <!-- Verified Status Pill -->
              <div style="margin-bottom: 24px;">
                <span style="display: inline-flex; align-items: center; background-color: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 50px; border: 1px solid #FDE68A; letter-spacing: 0.5px; text-transform: uppercase;">
                  <span style="display: inline-block; width: 6px; height: 6px; background-color: #D97706; border-radius: 50%; margin-right: 8px;"></span>
                  🏆 Verified Academic Credential Issued
                </span>
              </div>

              <!-- Greeting & Headline -->
              <h1 style="margin: 0 0 14px 0; font-size: 24px; font-weight: 900; color: #0F172A; line-height: 1.3;">
                Congratulations, ${payload.name}!
              </h1>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #475569; line-height: 1.7; font-weight: 500;">
                You have successfully fulfilled all graduation requirements and demonstrated excellence in the <strong style="color: #0E6875;">${payload.certificateTitle}</strong> curriculum.
              </p>

              <!-- REDESIGNED EXECUTIVE DATA SHEET CARD -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 20px; padding: 14px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <!-- Item 1: Recipient -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">👤</div>
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px;">Credential Recipient</div>
                          <div style="font-size: 15px; font-weight: 900; color: #0F172A; margin-top: 1px;">${payload.name}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Item 2: Serial Code -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">🔑</div>
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px;">Serial Verification Code</div>
                          <div style="margin-top: 3px;">
                            <span style="font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace; font-size: 13px; font-weight: 900; color: #0E6875; background-color: #E6F3F5; padding: 3px 8px; border-radius: 6px; letter-spacing: 1px;">${payload.serialNumber}</span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Item 3: Issue Date -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">📅</div>
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px;">Issue Date</div>
                          <div style="font-size: 14px; font-weight: 700; color: #334155; margin-top: 1px;">${payload.issueDate}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Item 4: Verification Registry -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">🔗</div>
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px;">Cryptographic Registry</div>
                          <div style="margin-top: 2px;">
                            <a href="${payload.verifyUrl}" style="font-size: 13px; font-weight: 800; color: #0E6875; text-decoration: none;">Verify Credential Online →</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main High-Impact CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${payload.verifyUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0E6875 0%, #148393 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 18px 40px; border-radius: 14px; text-align: center; box-shadow: 0 12px 28px rgba(14, 104, 117, 0.28); letter-spacing: 0.5px;">
                      📜 View & Download Certificate
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Direct Verification Note -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 14px 18px; font-size: 12px; color: #64748B; line-height: 1.6; text-align: center;">
                Employers and partners can verify this credential instantly at:<br>
                <a href="${payload.verifyUrl}" style="color: #0E6875; font-weight: 700; word-break: break-all; text-decoration: none;">${payload.verifyUrl}</a>
              </div>

            </td>
          </tr>

          <!-- Luxury Email Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 30px 36px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; line-height: 1.8;">
              <strong style="color: #475569; font-size: 13px;">TimeValley Venture Builder & Educational Hub</strong><br>
              Official accredited credentials registry. Secured with SHA256 cryptographic verification.<br>
              Support: <a href="mailto:contact@timevalley.com" style="color: #0E6875; text-decoration: none; font-weight: 600;">contact@timevalley.com</a><br>
              All Rights Reserved © ${new Date().getFullYear()} TimeValley Inc.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subjectHeader = `=?UTF-8?B?${Buffer.from(`🎓 Official Certificate Issued: ${payload.certificateTitle} - TimeValley`).toString('base64')}?=`;

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

  /**
   * Sends a styled HTML Password Reset verification email containing a 6-digit OTP code.
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

    const htmlContent = `${this.getEmailHead('Password Reset Request - TimeValley')}
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: left;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px -15px rgba(14, 104, 117, 0.12);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #072227 0%, #0E6875 60%, #144951 100%); padding: 40px 32px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; width: 56px; height: 56px; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 18px; line-height: 52px; font-size: 26px; text-align: center; margin-bottom: 14px;">
                🔒
              </div>
              <div style="font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; margin-bottom: 4px;">
                TIMEVALLEY SECURITY
              </div>
              <div style="font-size: 13px; color: #d1fae5; font-weight: 700;">
                Account Recovery & Security Verification
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 36px; background-color: #ffffff;">
              
              <!-- Security Badge -->
              <div style="margin-bottom: 22px;">
                <span style="display: inline-flex; align-items: center; background-color: #E6F3F5; color: #0E6875; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 50px; border: 1px solid rgba(14, 104, 117, 0.2); letter-spacing: 0.5px; text-transform: uppercase;">
                  <span style="display: inline-block; width: 6px; height: 6px; background-color: #0E6875; border-radius: 50%; margin-right: 8px;"></span>
                  🔑 Password Reset OTP
                </span>
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 900; color: #0F172A;">
                Hello ${payload.name || 'Student'},
              </h2>
              <p style="margin: 0 0 26px 0; font-size: 15px; color: #475569; line-height: 1.7;">
                We received a request to reset your password for your TimeValley account (<strong style="color: #0E6875;">${payload.email}</strong>). Enter the 6-digit verification code below on the reset page:
              </p>

              <!-- 6-Digit OTP Box -->
              <div style="background-color: #FAF0E9; border: 2px dashed #0E6875; border-radius: 20px; padding: 28px 20px; text-align: center; margin-bottom: 28px;">
                <div style="font-size: 11px; font-weight: 800; color: #0E6875; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
                  Your Verification OTP Code
                </div>
                <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #0E6875; font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace; line-height: 1;">
                  ${payload.code}
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #64748B; margin-top: 14px;">
                  ⏰ Code expires in 100 seconds • Single-use only
                </div>
              </div>

              <!-- Security Disclaimer -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 18px; font-size: 13px; color: #64748B; line-height: 1.6;">
                <strong>Security Alert:</strong> If you did not initiate this request, someone may have entered your email by mistake. Your account remains safe and no password changes have been made.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 26px 36px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; line-height: 1.7;">
              <strong style="color: #475569;">TimeValley Security Systems</strong><br>
              Automated account protection. Do not forward or share OTP codes.<br>
              All Rights Reserved © ${new Date().getFullYear()} TimeValley Inc.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subjectHeader = `=?UTF-8?B?${Buffer.from(`🔑 ${payload.code} is your TimeValley Verification Code`).toString('base64')}?=`;

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

  /**
   * Sends a styled RTL Arabic HTML notification email to the platform admin when a new student registers.
   */
  async sendNewStudentNotification(payload: NewStudentNotificationPayload): Promise<void> {
    const { adminEmail, user, pass } = this.getDynamicEnv();

    if (!pass) {
      this.logger.warn(
        `[Mail System] Cannot dispatch email to ${adminEmail}. SMTP_PASS is empty in .env.`
      );
      return;
    }

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
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
    body { font-family: 'Plus Jakarta Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; direction: rtl; text-align: right; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px -15px rgba(14, 104, 117, 0.12);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #072227 0%, #0E6875 60%, #144951 100%); padding: 40px 32px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; width: 56px; height: 56px; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 18px; line-height: 52px; font-size: 26px; text-align: center; margin-bottom: 14px;">
                ⚡
              </div>
              <div style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; margin-bottom: 4px;">
                TIMEVALLEY ADMIN
              </div>
              <div style="font-size: 13px; color: #d1fae5; font-weight: 700;">
                نظام الإشعارات الفورية • انضمام طالب جديد
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 36px; background-color: #ffffff;">
              
              <!-- Status Pill -->
              <div style="margin-bottom: 24px;">
                <span style="display: inline-flex; align-items: center; background-color: #ECFDF5; color: #065F46; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 50px; border: 1px solid #A7F3D0;">
                  🎓 طالب جديد مسجل في المنصة
                </span>
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 900; color: #0F172A;">
                مرحباً إدارة TimeValley 👋
              </h2>
              <p style="margin: 0 0 26px 0; font-size: 15px; color: #475569; line-height: 1.7;">
                تم تسجيل حساب طالب جديد بنجاح في قاعدة البيانات. وفيما يلي بطاقة البيانات الكاملة للطالب:
              </p>

              <!-- REDESIGNED RTL STUDENT DATA SHEET -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 20px; padding: 14px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <!-- Item 1: Name -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">👤</div>
                        </td>
                        <td style="padding-right: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">اسم الطالب</div>
                          <div style="font-size: 15px; font-weight: 900; color: #0F172A; margin-top: 1px;">${payload.name}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Item 2: Email -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">✉️</div>
                        </td>
                        <td style="padding-right: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">البريد الإلكتروني</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0E6875; margin-top: 1px; direction: ltr; text-align: right;">
                            <a href="mailto:${payload.email}" style="color: #0E6875; text-decoration: none;">${payload.email}</a>
                          </div>
                        </td>
                      </tr>
                    </table>

                    ${
                      payload.phone
                        ? `<!-- Item 3: Phone -->
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                          <tr>
                            <td style="width: 34px; vertical-align: middle;">
                              <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">📱</div>
                            </td>
                            <td style="padding-right: 12px; vertical-align: middle;">
                              <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">رقم الهاتف</div>
                              <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 1px; direction: ltr; text-align: right;">${payload.phone}</div>
                            </td>
                          </tr>
                        </table>`
                        : ''
                    }

                    <!-- Item 4: Track -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">🎯</div>
                        </td>
                        <td style="padding-right: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">المسار التعليمي</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0E6875; margin-top: 1px;">${payload.track || 'Registered Student (Unenrolled)'}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Item 5: Date -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">🕒</div>
                        </td>
                        <td style="padding-right: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">تاريخ التسجيل</div>
                          <div style="font-size: 13px; font-weight: 700; color: #475569; margin-top: 1px;">${registrationDate}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="http://localhost:3000/workspace" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0E6875 0%, #148393 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 16px 36px; border-radius: 14px; text-align: center; box-shadow: 0 10px 24px rgba(14, 104, 117, 0.25);">
                      الانتقال إلى لوحة إدارة الحسابات في المنصة ←
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 26px 36px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; line-height: 1.7;">
              <strong style="color: #475569;">منصة TimeValley للحلول التعليمية والريادية</strong><br>
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
   * Generates an Executive AI Summary & Intent Breakdown of incoming contact inquiries
   */
  private async generateInquirySummary(payload: ContactUsPayload): Promise<{
    coreIntent: string;
    keyPoints: string[];
    recommendedAction: string;
    category: string;
  }> {
    const rawMsg = (payload.message || '').trim();
    const subject = (payload.subject || '').trim();
    const fullText = `${subject} ${rawMsg}`.toLowerCase();

    // 1. Categorization based on topic & content
    let category = 'General Inquiry';
    let recommendedAction = 'Reply to the sender to address their questions or provide further assistance.';

    if (fullText.includes('co-founder') || fullText.includes('cto') || fullText.includes('match') || fullText.includes('venture architecture') || fullText.includes('day-zero')) {
      category = 'Venture & Co-Founder Matching';
      recommendedAction = 'Schedule a 15-minute venture discovery call or connect with the Advisory & Cohort matching team.';
    } else if (fullText.includes('pitch') || fullText.includes('invest') || fullText.includes('funding') || fullText.includes('deck') || fullText.includes('vc')) {
      category = 'Investment & Pitch Submission';
      recommendedAction = 'Review venture pitch details and reply with advisory evaluation or next steps.';
    } else if (fullText.includes('diploma') || fullText.includes('course') || fullText.includes('enroll') || fullText.includes('curriculum') || fullText.includes('certificate')) {
      category = 'Program & Academy Enrollment';
      recommendedAction = 'Provide curriculum brochure and assist the candidate with diploma enrollment.';
    } else if (fullText.includes('partner') || fullText.includes('sponsor') || fullText.includes('enterprise') || fullText.includes('corporate')) {
      category = 'Strategic Partnership';
      recommendedAction = 'Route to Corporate Relations lead and schedule an introductory partnership meeting.';
    } else if (fullText.includes('advisory') || fullText.includes('consult') || fullText.includes('growth') || fullText.includes('strategy')) {
      category = 'Venture Advisory & Strategy';
      recommendedAction = 'Reply to assess venture stage and provide tailored advisory solutions.';
    }

    // 2. Synthesize Core Intent (What the sender wants)
    let coreIntent = `The sender is reaching out regarding ${subject ? `"${subject}"` : category.toLowerCase()} to explore collaboration or support with TimeValley.`;
    
    if (category === 'Venture & Co-Founder Matching') {
      coreIntent = `The sender is seeking Day-Zero venture architecture, technical co-founder / CTO matching, or team equity alignment.`;
    } else if (category === 'Investment & Pitch Submission') {
      coreIntent = `The sender is presenting a venture opportunity or pitch and seeking review, advisory feedback, or investment.`;
    } else if (category === 'Program & Academy Enrollment') {
      coreIntent = `The sender is inquiring about diploma admission, curriculum requirements, or enrollment terms.`;
    } else if (category === 'Strategic Partnership') {
      coreIntent = `The sender is proposing a business partnership or institutional collaboration with TimeValley.`;
    } else if (category === 'Venture Advisory & Strategy') {
      coreIntent = `The sender is requesting strategic venture consulting, product-market guidance, or founder advisory.`;
    }

    // 3. Extract & Sanitize Key Points from Message
    const cleanRaw = rawMsg
      .replace(/[*_~`#]+/g, '') // strip markdown asterisks, underscores, backticks, hashes
      .replace(/^[0-9]+[.\-)]\s*|^[-*•]\s*/gm, ''); // strip list numbers and bullets

    const lines = cleanRaw
      .split(/\r?\n|\.\s+/)
      .map(l => l.replace(/^[0-9]+[.\-)]\s*|^[-*•]\s*/, '').trim())
      .filter(l => l.length > 15);

    const keyPoints: string[] = [];
    if (lines.length > 0) {
      lines.slice(0, 3).forEach(line => {
        const trimmed = line.length > 140 ? line.substring(0, 137) + '...' : line;
        keyPoints.push(trimmed);
      });
    }

    if (keyPoints.length === 0) {
      const fallbackClean = cleanRaw.length > 140 ? cleanRaw.substring(0, 137) + '...' : cleanRaw;
      keyPoints.push(fallbackClean);
    }

    return {
      coreIntent,
      keyPoints,
      recommendedAction,
      category,
    };
  }

  /**
   * Sends a styled HTML contact inquiry email to the platform admin
   */
  async sendContactUsEmail(payload: ContactUsPayload): Promise<void> {
    const { adminEmail, user, pass } = this.getDynamicEnv();

    if (!pass) {
      this.logger.warn(
        `[Mail System] Cannot dispatch Contact Us email to ${adminEmail}. SMTP_PASS is empty in .env.`
      );
      return;
    }

    const contactDate = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Cairo',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const summary = await this.generateInquirySummary(payload);

    const htmlContent = `${this.getEmailHead(`New Contact Inquiry - ${payload.name}`)}
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: left;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px -15px rgba(14, 104, 117, 0.12);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #072227 0%, #0E6875 60%, #144951 100%); padding: 40px 32px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; width: 56px; height: 56px; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 18px; line-height: 52px; font-size: 26px; text-align: center; margin-bottom: 14px;">
                💬
              </div>
              <div style="font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; margin-bottom: 4px;">
                TIMEVALLEY INQUIRY
              </div>
              <div style="font-size: 13px; color: #d1fae5; font-weight: 700;">
                Direct Student & Partner Communication
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 36px; background-color: #ffffff;">
              
              <!-- Badge -->
              <div style="margin-bottom: 22px;">
                <span style="display: inline-flex; align-items: center; background-color: #EFF6FF; color: #1E40AF; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 50px; border: 1px solid #BFDBFE; letter-spacing: 0.5px; text-transform: uppercase;">
                  📩 Form Submission
                </span>
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 900; color: #0F172A;">
                Message from ${payload.name}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                A new inquiry has been submitted through the TimeValley contact form.
              </p>

              <!-- REDESIGNED EXECUTIVE SENDER DATA SHEET -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 20px; padding: 14px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <!-- Item 1: Sender Name -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">👤</div>
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px;">Sender Name</div>
                          <div style="font-size: 15px; font-weight: 900; color: #0F172A; margin-top: 1px;">${payload.name}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Item 2: Email Address -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">✉️</div>
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px;">Email Address</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0E6875; margin-top: 1px;">
                            <a href="mailto:${payload.email}" style="color: #0E6875; text-decoration: none;">${payload.email}</a>
                          </div>
                        </td>
                      </tr>
                    </table>

                    ${
                      payload.phone
                        ? `<!-- Item 3: Phone -->
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                          <tr>
                            <td style="width: 34px; vertical-align: middle;">
                              <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">📱</div>
                            </td>
                            <td style="padding-left: 12px; vertical-align: middle;">
                              <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px;">Phone Number</div>
                              <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 1px;">${payload.phone}</div>
                            </td>
                          </tr>
                        </table>`
                        : ''
                    }

                    ${
                      payload.subject
                        ? `<!-- Item 4: Subject -->
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                          <tr>
                            <td style="width: 34px; vertical-align: middle;">
                              <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">📌</div>
                            </td>
                            <td style="padding-left: 12px; vertical-align: middle;">
                              <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px;">Inquiry Subject</div>
                              <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 1px;">${payload.subject}</div>
                            </td>
                          </tr>
                        </table>`
                        : ''
                    }

                    <!-- Item 5: Submitted Date -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 12px 16px;">
                      <tr>
                        <td style="width: 34px; vertical-align: middle;">
                          <div style="width: 30px; height: 30px; background-color: #E6F3F5; border-radius: 10px; text-align: center; line-height: 30px; font-size: 14px;">🕒</div>
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px;">Submitted On</div>
                          <div style="font-size: 13px; font-weight: 700; color: #64748B; margin-top: 1px;">${contactDate}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- 1. ORIGINAL RAW MESSAGE CARD -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 20px; padding: 14px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <!-- Message Header Bar -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                      <tr>
                        <td>
                          <span style="font-size: 11px; font-weight: 900; color: #0E6875; text-transform: uppercase; letter-spacing: 0.8px;">
                            💬 Inquiry Message & Statement
                          </span>
                        </td>
                        <td align="right">
                          <span style="font-size: 10px; font-weight: 800; color: #94A3B8; background-color: #FFFFFF; border: 1px solid #EEF2F6; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Original Text
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Inner Message Box -->
                    <div style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 12px; padding: 10px 14px; font-size: 14.5px; color: #1E293B; line-height: 1.7; font-weight: 500; white-space: pre-wrap; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box;">${payload.message}</div>

                    <!-- Message Micro-Footer -->
                    <div style="margin-top: 8px; font-size: 11px; color: #94A3B8; text-align: right; font-weight: 600;">
                      ✓ Verified Sender via TimeValley Public Portal
                    </div>
                  </td>
                </tr>
              </table>

              <!-- 2. UNIFIED AI EXECUTIVE SYNTHESIS PANEL -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 20px; padding: 14px; margin-bottom: 28px;">
                <tr>
                  <td>
                    <!-- Panel Header Bar -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                      <tr>
                        <td>
                          <span style="font-size: 11.5px; font-weight: 900; color: #0E6875; text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap;">
                            ⚡ AI Executive Synthesis
                          </span>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; font-size: 10px; font-weight: 800; color: #0E6875; background-color: #E6F3F5; border: 1px solid rgba(14, 104, 117, 0.2); padding: 4px 10px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                            ${summary.category}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Unified White Card -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #EEF2F6; border-radius: 14px; padding: 16px;">
                      
                      <!-- Section 1: Core Objective -->
                      <tr>
                        <td style="padding-bottom: 12px; border-bottom: 1px solid #F1F5F9;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">
                            🎯 Core Intent & Request
                          </div>
                          <div style="font-size: 14px; font-weight: 800; color: #0F172A; line-height: 1.6;">
                            ${summary.coreIntent}
                          </div>
                        </td>
                      </tr>

                      <!-- Section 2: Key Context & Details -->
                      <tr>
                        <td style="padding-top: 12px; padding-bottom: 12px; border-bottom: 1px solid #F1F5F9;">
                          <div style="font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">
                            📌 Key Context & Takeaways
                          </div>
                          <ul style="margin: 0; padding-left: 18px; font-size: 13.5px; color: #334155; line-height: 1.7; font-weight: 500;">
                            ${summary.keyPoints.map(pt => `<li style="margin-bottom: 4px;">${pt}</li>`).join('')}
                          </ul>
                        </td>
                      </tr>

                      <!-- Section 3: Recommended Action Banner -->
                      <tr>
                        <td style="padding-top: 12px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #E6F3F5; border-radius: 10px; padding: 10px 14px;">
                            <tr>
                              <td style="width: 24px; vertical-align: middle;">
                                <span style="font-size: 14px;">💡</span>
                              </td>
                              <td style="padding-left: 8px;">
                                <div style="font-size: 10px; font-weight: 800; color: #0E6875; text-transform: uppercase; letter-spacing: 0.5px;">Recommended Action</div>
                                <div style="font-size: 13px; font-weight: 700; color: #072F35; margin-top: 2px; line-height: 1.5;">${summary.recommendedAction}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                    </table>

                    <!-- Micro-Footer -->
                    <div style="margin-top: 8px; font-size: 10.5px; color: #94A3B8; text-align: right; font-weight: 600;">
                      ⚡ Synthesized by TimeValley Intelligence Engine
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Reply Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${payload.email}?subject=Re: ${encodeURIComponent(payload.subject || 'TimeValley Inquiry')}" style="display: inline-block; background: linear-gradient(135deg, #0E6875 0%, #148393 100%); color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 800; padding: 15px 34px; border-radius: 12px; text-align: center; box-shadow: 0 10px 20px rgba(14, 104, 117, 0.25);">
                      ↩ Reply Directly to ${payload.name}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 26px 36px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; line-height: 1.7;">
              <strong style="color: #475569;">TimeValley Executive Communications</strong><br>
              Direct contact form relay. All Rights Reserved © ${new Date().getFullYear()} TimeValley Inc.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subjectHeader = `=?UTF-8?B?${Buffer.from(`💬 [${summary.category}] Contact Inquiry from ${payload.name}`).toString('base64')}?=`;

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
