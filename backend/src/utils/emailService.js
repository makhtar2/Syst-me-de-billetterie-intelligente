import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

export async function sendActivationEmail(user, tempPassword) {
  const subject = 'Activation de votre compte - Système de Billetterie';
  const text = `Bonjour ${user.prenom},

Votre compte a été activé. Utilisez les identifiants suivants pour vous connecter :
- Email : ${user.email}
- Mot de passe temporaire : ${tempPassword}

Il vous sera demandé de modifier ce mot de passe lors de votre première connexion.`;

  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.log('\n--- EMAIL (mode dev, SMTP non configuré) ---');
    console.log(`À: ${user.email}`);
    console.log(`Sujet: ${subject}`);
    console.log(text);
    console.log('---\n');
    return;
  }

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject,
    text,
  });
}
