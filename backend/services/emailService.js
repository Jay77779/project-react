const nodemailer = require("nodemailer");

const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";

function isEmailConfigured() {
  return Boolean(EMAIL_USER && EMAIL_PASS);
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

// Welcome email template
const sendWelcomeEmail = async (studentEmail, studentName, studentPassword) => {
  if (!isEmailConfigured()) {
    console.warn("⚠️ Email not configured. Set EMAIL_USER and EMAIL_PASS in .env (use Gmail App Password).");
    return { success: false, message: "Email not configured" };
  }
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: EMAIL_USER,
      to: studentEmail,
      subject: "Welcome to Student Corner – Login Details",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
              color: #333;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #333;
            }
            .credentials-box {
              background-color: #f9f9f9;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .credentials-box label {
              display: block;
              font-weight: bold;
              color: #667eea;
              margin-top: 10px;
              margin-bottom: 5px;
              font-size: 12px;
              text-transform: uppercase;
            }
            .credentials-box p {
              margin: 0;
              font-size: 16px;
              color: #333;
              word-break: break-all;
            }
            .instructions {
              background-color: #e8f4f8;
              border-left: 4px solid #17a2b8;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
              color: #333;
              line-height: 1.6;
            }
            .footer {
              background-color: #f5f5f5;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
            }
            .emoji {
              font-size: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span class="emoji">🎓</span> Welcome to Student Corner</h1>
            </div>
            
            <div class="content">
              <p class="greeting">Hello <strong>${studentName}</strong>,</p>
              
              <p>Your account has been created by the Admin/Teacher. You now have access to the Student Corner platform!</p>
              
              <div class="credentials-box">
                <label>Login Email</label>
                <p>${studentEmail}</p>
                
                <label>Temporary Password</label>
                <p>${studentPassword}</p>
              </div>
              
              <div class="instructions">
                <strong>⚠️ Important:</strong><br>
                Please login to your dashboard and <strong>change your password</strong> after your first login for security purposes.
              </div>
              
              <p>If you have any issues logging in or need further assistance, please contact your teacher or administrator.</p>
              
              <p><strong>Best regards,</strong><br>
              <strong>Student Corner Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2026 Student Corner. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${studentEmail}`);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error(`❌ Error sending email to ${studentEmail}:`, error.message);
    return { success: false, message: error.message };
  }
};

// Password reset email template
const sendPasswordResetEmail = async (studentEmail, studentName, resetLink) => {
  if (!isEmailConfigured()) {
    console.warn("⚠️ Email not configured. Set EMAIL_USER and EMAIL_PASS in .env.");
    return { success: false, message: "Email not configured" };
  }
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: EMAIL_USER,
      to: studentEmail,
      subject: "Reset Your Password - Student Corner",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 30px;">
            <h2 style="color: #667eea;">Password Reset Request</h2>
            <p>Hello <strong>${studentName}</strong>,</p>
            <p>We received a request to reset your password. Click the link below to set a new password:</p>
            <p><a href="${resetLink}" style="background-color: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br><strong>Student Corner Team</strong></p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${studentEmail}`);
    return { success: true, message: "Reset email sent successfully" };
  } catch (error) {
    console.error(`❌ Error sending reset email to ${studentEmail}:`, error.message);
    return { success: false, message: error.message };
  }
};

// OTP email for password change – same look as Welcome email (only OTP, then password change)
const sendOtpEmail = async (studentEmail, studentName, otp) => {
  if (!isEmailConfigured()) {
    console.warn("⚠️ Email not configured. Set EMAIL_USER and EMAIL_PASS in .env (use Gmail App Password).");
    return { success: false, message: "Email not configured" };
  }
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: EMAIL_USER,
      to: studentEmail,
      subject: "Change Password – Student Corner",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
              color: #333;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #333;
            }
            .credentials-box {
              background-color: #f9f9f9;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .credentials-box label {
              display: block;
              font-weight: bold;
              color: #667eea;
              margin-top: 10px;
              margin-bottom: 5px;
              font-size: 12px;
              text-transform: uppercase;
            }
            .credentials-box label:first-child { margin-top: 0; }
            .credentials-box p {
              margin: 0;
              font-size: 16px;
              color: #333;
              word-break: break-all;
            }
            .otp-code {
              font-size: 28px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #667eea;
            }
            .instructions {
              background-color: #e8f4f8;
              border-left: 4px solid #17a2b8;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
              color: #333;
              line-height: 1.6;
            }
            .footer {
              background-color: #f5f5f5;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
            }
            .emoji { font-size: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span class="emoji">🎓</span> Student Corner</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello <strong>${studentName}</strong>,</p>
              <p>You requested to change your password. Use the one-time code below in the Change Password dialog to set your new password.</p>
              <div class="credentials-box">
                <label>OTP (One-Time Password)</label>
                <p class="otp-code">${otp}</p>
              </div>
              <div class="instructions">
                <strong>⚠️ Important:</strong><br>
                Enter this OTP in the <strong>Change Password</strong> dialog along with your new password. This code is valid for <strong>10 minutes</strong>.
              </div>
              <p>If you did not request a password change, please ignore this email and keep your password unchanged.</p>
              <p><strong>Best regards,</strong><br>
              <strong>Student Corner Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Student Corner. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${studentEmail}`);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error(`❌ Error sending OTP email to ${studentEmail}:`, error.message);
    const msg = error.message || "";
    const isAuthError = /invalid login|authentication failed|username and password|credentials|application-specific password/i.test(msg);
    const hint = isAuthError
      ? " For Gmail, use an App Password (Google Account → Security → App passwords), not your normal password."
      : "";
    return { success: false, message: msg + hint };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOtpEmail,
  isEmailConfigured,
};
