interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

interface EmailConfig {
  smtp: SmtpConfig; 
  reminderDelay: number; // Délai en heures avant le rendez-vous pour envoyer le rappel
}

export const config: EmailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@medisync.pro'
  },
  reminderDelay: 24 // Rappel 24h avant le rendez-vous
};
