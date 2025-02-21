import ReminderService from '../services/ReminderService';

interface ReminderConfig {
  appointmentReminder: {
    beforeHours: number;
    dailyTime: string;
    checkInterval: string;
  };
  birthdayReminder: {
    checkTime: string;
    daysInAdvance: number;
  };
  inactivityAlert: {
    checkTime: string;
    inactiveDays: number;
  };
  cleanup: {
    time: string;
    olderThanDays: number;
  };
}

export const config: ReminderConfig = {
  appointmentReminder: {
    beforeHours: 24, // Rappel 24h avant le rendez-vous
    dailyTime: '08:00', // Heure d'envoi des rappels quotidiens
    checkInterval: '0 * * * *' // Vérification toutes les heures
  },
  birthdayReminder: {
    checkTime: '09:00', // Heure de vérification des anniversaires
    daysInAdvance: 7 // Nombre de jours avant l'anniversaire pour envoyer le rappel
  },
  inactivityAlert: {
    checkTime: '10:00', // Heure de vérification des clients inactifs
    inactiveDays: 90 // Nombre de jours d'inactivité avant alerte
  },
  cleanup: {
    time: '00:00', // Heure de nettoyage
    olderThanDays: 30 // Supprimer les notifications de plus de 30 jours
  }
};

// Configuration des tâches planifiées
export const setupReminders = () => {
  const reminderService = ReminderService;

  // Vérification horaire des rappels de rendez-vous
  reminderService.initializeJobs();

  // Arrêt propre des tâches planifiées
  process.on('SIGTERM', () => {
    reminderService.stopAllJobs();
  });

  process.on('SIGINT', () => {
    reminderService.stopAllJobs();
  });
};