import { CronJob } from 'cron';
import { startOfDay, endOfDay, addHours } from 'date-fns';
import Appointment from '../models/Appointment';
import Invoice from '../models/Invoice';
import notificationService from './NotificationService';

export class SchedulerService {
  private static instance: SchedulerService;
  private jobs: CronJob[] = [];
  private metrics = {
    appointmentNotifications: 0,
    invoiceNotifications: 0,
    lastCheck: new Date(),
    errors: 0
  };

  private constructor() {
    this.initializeJobs();
  }

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  private initializeJobs() {
    // Vérifier les rendez-vous toutes les heures
    this.jobs.push(
      new CronJob('0 0 * * * *', () => this.checkUpcomingAppointments())
    );

    // Vérifier les factures en retard tous les jours à minuit
    this.jobs.push(
      new CronJob('0 0 0 * * *', () => this.checkOverdueInvoices())
    );

    // Démarrer tous les jobs
    this.jobs.forEach(job => job.start());
  }

  public getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  private async checkUpcomingAppointments() {
    try {
      const now = new Date();
      const tomorrow = addHours(now, 24);

      // Trouver tous les rendez-vous dans les prochaines 24h
      const appointments = await Appointment.find({
        date: {
          $gte: startOfDay(tomorrow),
          $lte: endOfDay(tomorrow)
        },
        status: { $nin: ['cancelled', 'completed'] }
      }).populate('clientId', 'firstName lastName');

      console.log(`[${new Date().toISOString()}] Vérification des rendez-vous : ${appointments.length} rendez-vous trouvés`);

      // Envoyer des notifications pour chaque rendez-vous
      for (const appointment of appointments) {
        const hasReminder = await notificationService.hasReminderForAppointment(appointment._id);
        if (!hasReminder) {
          await notificationService.createAppointmentReminder(appointment);
          this.metrics.appointmentNotifications++;
          console.log(`[${new Date().toISOString()}] Notification envoyée pour le rendez-vous ${appointment._id}`);
        }
      }

      this.metrics.lastCheck = new Date();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erreur lors de la vérification des rendez-vous à venir:`, error);
      this.metrics.errors++;
    }
  }

  private async checkOverdueInvoices() {
    try {
      const now = new Date();
      const overdueInvoices = await Invoice.find({
        dueDate: { $lt: now },
        status: { $ne: 'paid' }
      }).populate('clientId', 'firstName lastName');

      console.log(`[${new Date().toISOString()}] Vérification des factures : ${overdueInvoices.length} factures en retard trouvées`);

      // Envoyer des notifications pour chaque facture en retard
      for (const invoice of overdueInvoices) {
        await notificationService.createAndSend({
          userId: typeof invoice.clientId === 'string' ? invoice.clientId : invoice.clientId._id,
          type: 'INVOICE_OVERDUE',
          title: 'Facture en retard',
          message: `La facture ${invoice.invoiceNumber} est en retard de paiement`,
          data: {
            invoiceId: invoice._id,
            number: invoice.invoiceNumber,
            amount: invoice.total
          },
          severity: 'error'
        });
        this.metrics.invoiceNotifications++;
        console.log(`[${new Date().toISOString()}] Notification envoyée pour la facture ${invoice._id}`);
      }

      this.metrics.lastCheck = new Date();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erreur lors de la vérification des factures en retard:`, error);
      this.metrics.errors++;
    }
  }

  public stopAllJobs() {
    this.jobs.forEach(job => job.stop());
  }
}

export default SchedulerService.getInstance();
