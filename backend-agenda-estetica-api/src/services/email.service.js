const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false
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