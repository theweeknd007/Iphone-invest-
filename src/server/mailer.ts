import nodemailer from 'nodemailer';
import Twilio from 'twilio';

const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);

let transporter: nodemailer.Transporter | null = null;
if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

let twilioClient: Twilio.Twilio | null = null;
if (twilioConfigured) {
  twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
}

export async function sendPasswordResetEmail(toEmail: string, token: string) {
  if (!smtpConfigured || !transporter) return false;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetLink = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Recuperação de palavra-passe - Apple Invest';
  const text = `Recebemos um pedido para redefinir a sua palavra-passe. Use este link para definir uma nova palavra-passe (válido por 1 hora): ${resetLink}\n\nSe não pediu isto, ignore esta mensagem.`;
  const html = `<p>Recebemos um pedido para redefinir a sua palavra-passe. Clique no link abaixo para definir uma nova palavra-passe (válido por 1 hora):</p><p><a href="${resetLink}">${resetLink}</a></p><p>Se não pediu isto, ignore esta mensagem.</p>`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `no-reply@${process.env.SMTP_HOST || 'local'}`,
      to: toEmail,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error('[Mailer] Failed to send password reset email:', err);
    return false;
  }
}

export async function sendPasswordResetSms(toPhone: string, token: string) {
  if (!twilioConfigured || !twilioClient) return false;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetLink = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  const body = `Apple Invest: redefina a sua palavra-passe: ${resetLink} (válido 1h)`;
  try {
    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_FROM!,
      to: toPhone,
    });
    return true;
  } catch (err) {
    console.error('[Mailer] Failed to send password reset SMS:', err);
    return false;
  }
}
