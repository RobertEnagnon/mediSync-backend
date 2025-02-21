import nodemailer from 'nodemailer';
import { config } from '../config/email.config';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Créer un transporteur SMTP réutilisable
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.password
  }
});

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Échec de l\'envoi de l\'email');
  }
};

export const sendAppointmentReminder = async (
  email: string,
  name: string,
  appointmentDate: Date,
  appointmentType: string
): Promise<void> => {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(appointmentDate);

  const html = `
    <h2>Rappel de rendez-vous</h2>
    <p>Bonjour ${name},</p>
    <p>Nous vous rappelons votre rendez-vous prévu pour :</p>
    <p><strong>Date :</strong> ${formattedDate}</p>
    <p><strong>Type :</strong> ${appointmentType}</p>
    <p>Si vous devez modifier ou annuler votre rendez-vous, merci de nous contacter dès que possible.</p>
    <p>À bientôt !</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Rappel de votre rendez-vous',
    html
  });
};

export const sendCancellationNotification = async (
  email: string,
  name: string,
  appointmentDate: Date,
  reason?: string
): Promise<void> => {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(appointmentDate);

  const html = `
    <h2>Annulation de rendez-vous</h2>
    <p>Bonjour ${name},</p>
    <p>Votre rendez-vous prévu pour le ${formattedDate} a été annulé.</p>
    ${reason ? `<p><strong>Raison :</strong> ${reason}</p>` : ''}
    <p>Pour planifier un nouveau rendez-vous, n'hésitez pas à nous contacter.</p>
    <p>Cordialement,</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Annulation de rendez-vous',
    html
  });
};

export const sendConfirmationEmail = async (
  email: string,
  name: string,
  appointmentDate: Date,
  appointmentType: string
): Promise<void> => {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(appointmentDate);

  const html = `
    <h2>Confirmation de rendez-vous</h2>
    <p>Bonjour ${name},</p>
    <p>Votre rendez-vous a été confirmé pour :</p>
    <p><strong>Date :</strong> ${formattedDate}</p>
    <p><strong>Type :</strong> ${appointmentType}</p>
    <p>Un rappel vous sera envoyé 24 heures avant votre rendez-vous.</p>
    <p>Si vous devez modifier ou annuler votre rendez-vous, merci de nous contacter au moins 24 heures à l'avance.</p>
    <p>À bientôt !</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Confirmation de votre rendez-vous',
    html
  });
};
