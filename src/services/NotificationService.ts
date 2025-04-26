import { BaseService } from './BaseService';
import Notification, { INotification } from '../models/Notification';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { io } from '../server';

export class NotificationService extends BaseService<INotification> {
  constructor() {
    super(Notification);
  }

  // Créer et envoyer une notification
  async createAndSend(notification: Omit<Partial<INotification>, 'type'> & { type: INotification['type'] }): Promise<INotification> {
    // Créer la notification en base de données
    const newNotification = await this.create({
      ...notification,
      createdAt: new Date(),
      read: false
    });
    
    // Envoyer la notification en temps réel via WebSocket
    if (notification.userId) {
      try {
        const userId = notification.userId.toString();
        console.log(`Envoi de notification WebSocket à l'utilisateur ${userId}`, {
          type: notification.type,
          title: notification.title
        });
        
        // Utiliser l'instance exportée de Socket.IO pour émettre à l'utilisateur dans sa room spécifique
        io.to(userId).emit('notification', newNotification);
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification via WebSocket:', error);
      }
    }
    
    return newNotification;
  }

  // Récupérer les notifications non lues d'un utilisateur
  async getUnreadByUserId(userId: string): Promise<INotification[]> {
    return this.model.find({
      userId,
      read: false
    }).sort({ createdAt: -1 });
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<INotification | null> {
    return this.model.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
  }

  // Marquer toutes les notifications d'un utilisateur comme lues
  async markAllAsRead(userId: string): Promise<void> {
    await this.model.updateMany(
      { userId, read: false },
      { read: true }
    );
  }

  // Supprimer les anciennes notifications (plus de 30 jours)
  async deleteOldNotifications(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.model.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
  }

  // Créer une notification de rappel de rendez-vous
  async createAppointmentReminder(appointment: any): Promise<INotification> {
    const formattedDate = format(
      new Date(appointment.date),
      'EEEE dd MMMM yyyy à HH:mm',
      { locale: fr }
    );

    const notification = {
      userId: appointment.clientId._id,
      type: 'APPOINTMENT_REMINDER' as const,
      title: 'Rappel de rendez-vous',
      message: `Vous avez un rendez-vous ${appointment.type} prévu le ${formattedDate}`,
      data: { 
        appointmentId: appointment._id,
        date: appointment.date,
        type: appointment.type
      }
    };

    return this.createAndSend(notification);
  }

  // Vérifier si un rappel a déjà été envoyé pour un rendez-vous
  async hasReminderForAppointment(appointmentId: string): Promise<boolean> {
    const reminder = await this.model.findOne({
      'data.appointmentId': appointmentId,
      type: 'APPOINTMENT_REMINDER',
      createdAt: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
      }
    });

    return !!reminder;
  }

  // Créer une notification d'annulation de rendez-vous
  async createAppointmentCancellation(appointment: any, reason?: string): Promise<INotification> {
    const formattedDate = format(
      new Date(appointment.date),
      'EEEE dd MMMM yyyy à HH:mm',
      { locale: fr }
    );

    const notification = {
      userId: appointment.clientId._id,
      type: 'APPOINTMENT_CANCELLATION' as const,
      title: 'Annulation de rendez-vous',
      message: `Votre rendez-vous ${appointment.type} du ${formattedDate} a été annulé${reason ? ` : ${reason}` : ''}`,
      data: { 
        appointmentId: appointment._id,
        date: appointment.date,
        type: appointment.type,
        reason
      }
    };

    return this.createAndSend(notification);
  }

  // Créer une notification de modification de rendez-vous
  async createAppointmentModification(appointment: any, oldDate: Date): Promise<INotification> {
    const newFormattedDate = format(
      new Date(appointment.date),
      'EEEE dd MMMM yyyy à HH:mm',
      { locale: fr }
    );

    const oldFormattedDate = format(
      new Date(oldDate),
      'EEEE dd MMMM yyyy à HH:mm',
      { locale: fr }
    );

    const notification = {
      userId: appointment.clientId._id,
      type: 'APPOINTMENT_MODIFICATION' as const,
      title: 'Modification de rendez-vous',
      message: `Votre rendez-vous ${appointment.type} a été déplacé du ${oldFormattedDate} au ${newFormattedDate}`,
      data: { 
        appointmentId: appointment._id,
        oldDate,
        newDate: appointment.date,
        type: appointment.type
      }
    };

    return this.createAndSend(notification);
  }

  // Créer une notification de nouveau document
  async createDocumentNotification(document: any): Promise<INotification> {
    const notification = {
      userId: document.clientId,
      type: 'NEW_DOCUMENT' as const,
      title: 'Nouveau document disponible',
      message: `Un nouveau document "${document.originalName}" a été ajouté à votre dossier`,
      data: { 
        documentId: document._id,
        type: document.type,
        fileName: document.originalName
      }
    };

    return this.createAndSend(notification);
  }

  // Créer une notification de nouvelle facture
  async createInvoiceNotification(invoice: any): Promise<INotification> {
    const notification = {
      userId: typeof invoice.clientId === 'string' ? invoice.clientId : invoice.clientId._id,
      type: 'NEW_INVOICE' as const,
      title: 'Nouvelle facture',
      message: `Une nouvelle facture (${invoice.invoiceNumber}) d'un montant de ${invoice.total}€ a été générée`,
      data: { 
        invoiceId: invoice._id,
        number: invoice.invoiceNumber,
        amount: invoice.total
      }
    };

    return this.createAndSend(notification);
  }

  // Créer une notification pour la création d'un client
  async createClientNotification(client: any, practitionerId: string): Promise<INotification> {
    const notification = {
      userId: practitionerId,
      type: 'CLIENT_CREATED' as const,
      title: 'Nouveau client',
      message: `Un nouveau client ${client.firstName} ${client.lastName} a été ajouté`,
      data: { 
        clientId: client._id
      },
      severity: 'success' as const
    };

    return this.createAndSend(notification);
  }
}

export default new NotificationService();
