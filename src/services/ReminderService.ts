import { CronJob } from 'cron';
import { startOfDay, addDays, format, isBefore, isAfter, addHours, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import AppointmentService from './AppointmentService';
import NotificationService from './NotificationService';
import ClientService from './ClientService';
import { sendEmail } from '../utils/emailService';
import { config } from '../config/reminder.config';

export class ReminderService {
  private static instance: ReminderService;
  private jobs: CronJob[];
  private isInitialized: boolean;
  private appointmentService: AppointmentService;
  private clientService: ClientService;
  private notificationService: NotificationService;

  private constructor() {
    this.jobs = [];
    this.isInitialized = false;
    this.appointmentService = new AppointmentService();
    this.clientService = new ClientService();
    this.notificationService = new NotificationService();
  }

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  public initializeJobs(): void {
    if (this.isInitialized) {
      return;
    }

    // Vérification des rendez-vous à venir
    this.jobs.push(
      new CronJob(config.appointmentReminder.checkInterval, () => {
        this.checkAndSendReminders();
      }, null, true)
    );

    // Envoi des rappels quotidiens
    this.jobs.push(
      new CronJob(`0 ${config.appointmentReminder.dailyTime.split(':')[1]} ${config.appointmentReminder.dailyTime.split(':')[0]} * * *`, () => {
        this.sendDailyReminders();
      }, null, true)
    );

    // Vérification des anniversaires
    this.jobs.push(
      new CronJob(`0 ${config.birthdayReminder.checkTime.split(':')[1]} ${config.birthdayReminder.checkTime.split(':')[0]} * * *`, () => {
        this.checkBirthdays();
      }, null, true)
    );

    // Vérification des clients inactifs
    this.jobs.push(
      new CronJob(`0 ${config.inactivityAlert.checkTime.split(':')[1]} ${config.inactivityAlert.checkTime.split(':')[0]} * * 1`, () => {
        this.checkInactiveClients();
      }, null, true)
    );

    // Nettoyage des anciennes notifications
    this.jobs.push(
      new CronJob(`0 ${config.cleanup.time.split(':')[1]} ${config.cleanup.time.split(':')[0]} * * *`, () => {
        this.cleanupOldNotifications();
      }, null, true)
    );

    this.isInitialized = true;
  }

  public stopAllJobs(): void {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isInitialized = false;
  }

  private async checkAndSendReminders(): Promise<void> {
    try {
      const now = new Date();
      const futureDate = addHours(now, config.appointmentReminder.beforeHours);

      const appointments = await this.appointmentService.findUpcoming(now, futureDate);

      for (const appointment of appointments) {
        const hasReminder = await this.notificationService.hasReminderForAppointment(appointment._id);
        if (!hasReminder) {
          await Promise.all([
            this.notificationService.createAppointmentReminder(appointment),
            this.sendEmailReminder(appointment)
          ]);
        }
      }
    } catch (error) {
      console.error('Error in checkAndSendReminders:', error);
    }
  }

  private async sendDailyReminders(): Promise<void> {
    try {
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      
      const appointments = await this.appointmentService.findByDateRange(today, tomorrow);
      
      for (const appointment of appointments) {
        await Promise.all([
          this.notificationService.createAppointmentReminder(appointment),
          this.sendEmailReminder(appointment)
        ]);
      }
    } catch (error) {
      console.error('Error in sendDailyReminders:', error);
    }
  }

  private async checkBirthdays(): Promise<void> {
    try {
      const clients = await this.clientService.findUpcomingBirthdays(config.birthdayReminder.daysInAdvance);
      
      for (const client of clients) {
        const birthdayDate = new Date(client.birthDate);
        const age = new Date().getFullYear() - birthdayDate.getFullYear();
        
        await this.sendBirthdayReminder(client, age);
      }
    } catch (error) {
      console.error('Error in checkBirthdays:', error);
    }
  }

  private async checkInactiveClients(): Promise<void> {
    try {
      const inactiveDate = subDays(new Date(), config.inactivityAlert.inactiveDays);
      const inactiveClients = await this.clientService.findInactiveClients(inactiveDate);

      for (const client of inactiveClients) {
        await this.sendInactivityAlert(client);
      }
    } catch (error) {
      console.error('Error in checkInactiveClients:', error);
    }
  }

  private async cleanupOldNotifications(): Promise<void> {
    try {
      await this.notificationService.deleteOldNotifications();
    } catch (error) {
      console.error('Error in cleanupOldNotifications:', error);
    }
  }

  private async sendEmailReminder(appointment: any): Promise<void> {
    const formattedDate = format(
      new Date(appointment.date),
      'EEEE dd MMMM yyyy à HH:mm',
      { locale: fr }
    );

    await sendEmail({
      to: appointment.clientId.email,
      subject: 'Rappel de rendez-vous',
      template: 'appointment-reminder',
      context: {
        clientName: `${appointment.clientId.firstName} ${appointment.clientId.lastName}`,
        appointmentType: appointment.type,
        appointmentDate: formattedDate,
        appointmentLocation: appointment.location || 'Cabinet'
      }
    });
  }

  private async sendBirthdayReminder(client: any, age: number): Promise<void> {
    await sendEmail({
      to: client.email,
      subject: 'Joyeux Anniversaire !',
      template: 'birthday-reminder',
      context: {
        clientName: `${client.firstName} ${client.lastName}`,
        age: age
      }
    });
  }

  private async sendInactivityAlert(client: any): Promise<void> {
    await sendEmail({
      to: client.email,
      subject: 'Prenez soin de votre santé',
      template: 'inactivity-alert',
      context: {
        clientName: `${client.firstName} ${client.lastName}`,
        inactiveDays: config.inactivityAlert.inactiveDays
      }
    });
  }
}

export default ReminderService.getInstance();
