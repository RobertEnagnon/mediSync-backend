import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import { AuthRequest } from '../types/express';
import { isValidObjectId } from 'mongoose';
import { startOfDay, endOfDay, addDays } from 'date-fns';

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

      const appointment = await Appointment.findOneAndUpdate(
        { _id: id, practitionerId },
        req.body,
        { new: true }
      ).populate('clientId', 'firstName lastName');

      if (!appointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
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

      const appointment = await Appointment.findOneAndDelete({ _id: id, practitionerId });

      if (!appointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
      }

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

      const appointment = await Appointment.findOneAndUpdate(
        { _id: id, practitionerId },
        { status },
        { new: true }
      ).populate('clientId', 'firstName lastName');

      if (!appointment) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé' });
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
