import { Request, Response } from 'express';
import Appointment, { IAppointment } from '../models/Appointment';
import { AuthRequest } from '../types/express';
import { isValidObjectId } from 'mongoose';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import notificationService from '../services/NotificationService';

class AppointmentController {
  /**
   * Récupère tous les rendez-vous du praticien
   */
  public static async getAll(req: AuthRequest, res: Response) {
    try {
      const practitionerId = req.user?._id;
      const appointments = await Appointment.find({ practitionerId })
        .sort({ startDate: -1 })
        .populate('clientId', 'firstName lastName');
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Récupère l'historique des rendez-vous (rendez-vous passés)
   */
  public static async getHistory(req: AuthRequest, res: Response) {
    try {
      // console.log("user in getHistory : ")
      const practitionerId = req.user?._id;
      const now = new Date();
      
      const appointments = await Appointment.find({
        practitionerId,
        date: { $lte: now }
        // date: { $gte: now }
      })
      // .sort({ startDate: -1 })
      .sort({ date: 'desc' })
      .populate('clientId', 'firstName lastName');
      
      // console.log(appointments)
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }


  /**
   * Récupère un rendez-vous par son ID
   */
  public static async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const practitionerId = req.user?._id;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'ID de rendez-vous invalide' });
      }

      const appointment = await Appointment.findOne({ _id: id, practitionerId })
        .populate('clientId', 'firstName lastName');

      if (!appointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
      }

      res.json(appointment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Récupère tous les rendez-vous d'un client spécifique
   */
  public static async getByClientId(req: AuthRequest, res: Response) {
    try {
      const { clientId } = req.params;
      const practitionerId = req.user?._id;

      if (!isValidObjectId(clientId)) {
        return res.status(400).json({ message: 'ID de client invalide' });
      }

      const appointments = await Appointment.find({
        clientId,
        practitionerId
      })
        .sort({ startDate: -1 })
        .populate('clientId', 'firstName lastName');

      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Crée un nouveau rendez-vous
   */
  public static async create(req: AuthRequest, res: Response) {
    try {
      console.log("ajout du rendez-vous")
      console.log(req.body)
      const practitionerId = req.user?._id;
      const appointmentData = {
        ...req.body,
        practitionerId
      };

      const appointment = new Appointment(appointmentData);
      await appointment.save();

      const populatedAppointment = await appointment.populate('clientId', 'firstName lastName');

      // Envoyer une notification de création de rendez-vous au client
      await notificationService.createAppointmentReminder(populatedAppointment);
      
      // Envoyer une notification de création de rendez-vous au praticien également
      // Gérer proprement les noms du client
      let clientName = 'Client';
      try {
        if (typeof populatedAppointment.clientId === 'object' && populatedAppointment.clientId !== null) {
          const clientData = populatedAppointment.clientId as any;
          if (clientData.firstName && clientData.lastName) {
            clientName = `${clientData.firstName} ${clientData.lastName}`;
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'accès aux données client:', error);
      }
      
      const practitionerNotification = {
        userId: practitionerId.toString(),
        type: 'APPOINTMENT_REMINDER' as const,
        title: 'Nouveau rendez-vous créé',
        message: `Un nouveau rendez-vous a été créé avec ${clientName}`,
        data: { 
          appointmentId: populatedAppointment._id.toString(),
          date: populatedAppointment.date,
          type: populatedAppointment.type,
          clientId: typeof populatedAppointment.clientId === 'object' && populatedAppointment.clientId ? populatedAppointment.clientId._id.toString() : String(populatedAppointment.clientId)
        },
        severity: 'success' as const
      };
      await notificationService.createAndSend(practitionerNotification);

      res.status(201).json(populatedAppointment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * Met à jour un rendez-vous existant
   */
  public static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const practitionerId = req.user?._id;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'ID de rendez-vous invalide' });
      }

      const oldAppointment = await Appointment.findOne({ _id: id, practitionerId });
      if (!oldAppointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
      }

      const appointment = await Appointment.findOneAndUpdate(
        { _id: id, practitionerId },
        req.body,
        { new: true }
      ).populate('clientId', 'firstName lastName');

      if (!appointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
      }
      
      // Détecter les changements importants et envoyer les notifications appropriées
      const hasChanges = [];
      let hasSignificantChanges = false;
      
      // Vérifier le changement de date
      if (oldAppointment.date.getTime() !== new Date(req.body.date).getTime()) {
        hasChanges.push('date');
        hasSignificantChanges = true;
        await notificationService.createAppointmentModification(appointment, oldAppointment.date);
      }
      
      // Vérifier le changement de durée
      if (oldAppointment.duration !== req.body.duration) {
        hasChanges.push('durée');
        hasSignificantChanges = true;
      }
      
      // Vérifier le changement de type
      if (oldAppointment.type !== req.body.type) {
        hasChanges.push('type');
        hasSignificantChanges = true;
      }
      
      // Vérifier le changement de notes 
      if (oldAppointment.notes !== req.body.notes) {
        hasChanges.push('notes');
      }
      
      // Vérifier le changement de titre (qui peut contenir le lieu)
      if (oldAppointment.title !== req.body.title) {
        hasChanges.push('informations');
        hasSignificantChanges = true;
      }
      
      // Si des changements importants (autre que la date) ont été détectés, envoyer une notification
      if (hasSignificantChanges && hasChanges.length > 0 && !hasChanges.includes('date')) {
        // Notification au client - on s'assure de convertir l'ID en string
        const clientNotification = {
          userId: appointment.clientId?._id.toString(),
          type: 'APPOINTMENT_MODIFICATION' as const,
          title: 'Modification de rendez-vous',
          message: `Votre rendez-vous du ${format(new Date(appointment.date), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })} a été modifié (${hasChanges.join(', ')})`,
          data: { 
            appointmentId: appointment._id.toString(),
            date: appointment.date,
            type: appointment.type,
            changes: hasChanges
          },
          severity: 'info' as const
        };
        await notificationService.createAndSend(clientNotification);
        
        // Notification au praticien - on gère proprement les noms du client
        let clientName = 'Client';
        try {
          // Vérifier si le client a été correctement peuplé
          if (typeof appointment.clientId === 'object' && appointment.clientId !== null) {
            const clientData = appointment.clientId as any;
            if (clientData.firstName && clientData.lastName) {
              clientName = `${clientData.firstName} ${clientData.lastName}`;
            }
          }
        } catch (error) {
          console.error('Erreur lors de l\'accès aux données client:', error);
        }
        
        const practitionerNotification = {
          userId: practitionerId.toString(),
          type: 'APPOINTMENT_MODIFICATION' as const,
          title: 'Rendez-vous modifié',
          message: `Le rendez-vous avec ${clientName} a été modifié (${hasChanges.join(', ')})`,
          data: { 
            appointmentId: appointment._id.toString(),
            clientId: appointment.clientId._id.toString(),
            date: appointment.date,
            type: appointment.type,
            changes: hasChanges
          },
          severity: 'info' as const
        };
        await notificationService.createAndSend(practitionerNotification);
      }

      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * Supprime un rendez-vous
   */
  public static async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const practitionerId = req.user?._id;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'ID de rendez-vous invalide' });
      }

      const appointment = await Appointment.findOne({ _id: id, practitionerId }).populate('clientId', 'firstName lastName');

      if (!appointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
      }

      // Notification d'annulation au client
      await notificationService.createAppointmentCancellation(appointment, req.body.reason);
      
      // Gérer proprement les noms du client pour la notification au praticien
      let clientName = 'Client';
      try {
        if (typeof appointment.clientId === 'object' && appointment.clientId !== null) {
          const clientData = appointment.clientId as any;
          if (clientData.firstName && clientData.lastName) {
            clientName = `${clientData.firstName} ${clientData.lastName}`;
          }
        }
      } catch (err) {
        console.error('Erreur lors de l\'accès aux données client:', err);
      }
      
      // Notification au praticien pour la suppression
      const practitionerNotification = {
        userId: practitionerId.toString(),
        type: 'APPOINTMENT_CANCELLATION' as const,
        title: 'Rendez-vous supprimé',
        message: `Le rendez-vous avec ${clientName} a été supprimé`,
        data: { 
          date: appointment.date,
          type: appointment.type,
          reason: req.body.reason
        },
        severity: 'warning' as const
      };
      await notificationService.createAndSend(practitionerNotification);

      await Appointment.findByIdAndDelete(id);

      res.json({ message: 'Rendez-vous supprimé avec succès' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Met à jour le statut d'un rendez-vous
   */
  public static async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const practitionerId = req.user?._id;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'ID de rendez-vous invalide' });
      }

      if (!['pending', 'scheduled', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Statut invalide' });
      }

      const oldAppointment = await Appointment.findOne({ _id: id, practitionerId });
      if (!oldAppointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
      }
      
      const oldStatus = oldAppointment.status;

      const appointment = await Appointment.findOneAndUpdate(
        { _id: id, practitionerId },
        { status },
        { new: true }
      ).populate('clientId', 'firstName lastName');

      if (!appointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
      }

      // Gérer proprement les noms du client
      let clientName = 'Client';
      try {
        if (typeof appointment.clientId === 'object' && appointment.clientId !== null) {
          const clientData = appointment.clientId as any;
          if (clientData.firstName && clientData.lastName) {
            clientName = `${clientData.firstName} ${clientData.lastName}`;
          }
        }
      } catch (err) {
        console.error('Erreur lors de l\'accès aux données client:', err);
      }

      // Traiter correctement l'ID du client
      const clientId = typeof appointment.clientId === 'object' && appointment.clientId !== null 
        ? appointment.clientId._id.toString() 
        : String(appointment.clientId);
      
      // Notifications basées sur le nouveau statut
      if (status === 'cancelled') {
        // Notification d'annulation au client
        await notificationService.createAppointmentCancellation(appointment, req.body.reason);
        
        // Notification d'annulation au praticien
        const practitionerNotification = {
          userId: practitionerId.toString(),
          type: 'APPOINTMENT_CANCELLATION' as const,
          title: 'Rendez-vous annulé',
          message: `Le rendez-vous avec ${clientName} a été annulé`,
          data: { 
            appointmentId: appointment._id.toString(),
            date: appointment.date,
            type: appointment.type,
            clientId,
            reason: req.body.reason
          },
          severity: 'warning' as const
        };
        await notificationService.createAndSend(practitionerNotification);
      } else if (status === 'confirmed' && oldStatus !== 'confirmed') {
        // Notification de confirmation au client
        const clientNotification = {
          userId: clientId,
          type: 'APPOINTMENT_MODIFICATION' as const,
          title: 'Rendez-vous confirmé',
          message: `Votre rendez-vous du ${format(new Date(appointment.date), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })} a été confirmé`,
          data: { 
            appointmentId: appointment._id.toString(),
            date: appointment.date,
            type: appointment.type
          },
          severity: 'info' as const
        };
        await notificationService.createAndSend(clientNotification);
      } else if (status === 'completed' && oldStatus !== 'completed') {
        // Notification de finalisation au client
        const clientNotification = {
          userId: clientId,
          type: 'APPOINTMENT_MODIFICATION' as const,
          title: 'Rendez-vous terminé',
          message: `Votre rendez-vous du ${format(new Date(appointment.date), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })} a été marqué comme terminé`,
          data: { 
            appointmentId: appointment._id.toString(),
            date: appointment.date,
            type: appointment.type
          },
          severity: 'success' as const
        };
        await notificationService.createAndSend(clientNotification);
      }

      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * Recherche des rendez-vous
   */
  public static async search(req: AuthRequest, res: Response) {
    try {
      const practitionerId = req.user?._id;
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ message: 'Paramètre de recherche requis' });
      }

      const appointments = await Appointment.find({
        practitionerId,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      })
        .sort({ startDate: -1 })
        .populate('clientId', 'firstName lastName');

      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Filtre les rendez-vous
   */
  public static async filter(req: AuthRequest, res: Response) {
    try {
      const practitionerId = req.user?._id;
      const { startDate, endDate, status, type } = req.query;

      const query: any = { practitionerId };

      if (startDate && endDate) {
        query.startDate = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      const appointments = await Appointment.find(query)
        .sort({ startDate: -1 })
        .populate('clientId', 'firstName lastName');

      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Récupère les rendez-vous à venir pour les 7 prochains jours
   */
  public static async getUpcoming(req: AuthRequest, res: Response) {
    try {
      const practitionerId = req.user?._id;
      const { days = '7' } = req.query;
      const numberOfDays = parseInt(days as string, 10);

      const startDate = startOfDay(new Date());
      const endDate = endOfDay(addDays(new Date(), numberOfDays));

      const appointments = await Appointment.find({
        practitionerId,
        date: { $gte: startDate, $lte: endDate },
        status: { $nin: ['completed', 'cancelled'] }
      })
        .sort({ startDate: 1 })
        .populate('clientId', 'firstName lastName');

      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default AppointmentController;
