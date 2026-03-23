const nodemailer = require("nodemailer");

async function sendPasswordResetEmail({ to, resetUrl }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    to,
    subject: "Reset your password",
    text: `Use this link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`
  });

  return { delivered: true };
}

module.exports = {
  sendPasswordResetEmail
};
