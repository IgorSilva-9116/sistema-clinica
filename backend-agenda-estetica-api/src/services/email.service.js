const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true só para porta 465
  // MailHog (dev) não usa autenticação; Brevo/Resend/SES usam
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined
});

async function enviarEmail({ para, assunto, html }) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: para,
    subject: assunto,
    html
  });
}

module.exports = {
  enviarEmail
};