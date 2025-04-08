import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Client from '../models/Client';
import Appointment from '../models/Appointment';
import { AuthRequest } from '../types/express';
import clientService from '../services/ClientService';
import { startOfMonth, endOfMonth } from 'date-fns';

export class ClientController {
  /**
   * Récupère tous les clients du praticien
   */
  public static async getAll(req: AuthRequest, res: Response) {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      const practitionerId = new Types.ObjectId(req.user._id);
      const clients = await Client.find({ practitionerId }).sort({ lastName: 1, firstName: 1 });
     return res.json(clients);
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      return  res.status(500).json({ message: 'Erreur lors de la récupération des clients' });
    }
  }

  /**
   * Récupère un client par son ID
   */
  public static async getById(req: AuthRequest, res: Response) {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      const practitionerId = new Types.ObjectId(req.user._id);
      const client = await Client.findOne({
        _id: req.params.id,
        practitionerId
      });

      if (!client) {
        return res.status(404).json({ message: 'Client non trouvé' });
      }

     return res.json(client);
    } catch (error) {
      console.error('Erreur lors de la récupération du client:', error);
     return res.status(500).json({ message: 'Erreur lors de la récupération du client' });
    }
  }

  /**
   * Crée un nouveau client
   */
  public static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      const practitionerId = new Types.ObjectId(req.user._id);
      // console.log("create: ", practitionerId);
      const clientData = { ...req.body, practitionerId };
      // const client = new Client(clientData);
      // await client.save();
      const client = clientService.create(clientData)
      return res.status(201).json(client);
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      return res.status(500).json({ message: 'Erreur lors de la création du client' });
    }
  }

  /**
   * Met à jour un client
   */
  public static async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      const practitionerId = new Types.ObjectId(req.user._id);
      const client = await Client.findOneAndUpdate(
        { _id: req.params.id, practitionerId },
        req.body,
        { new: true }
      );

      if (!client) {
        return res.status(404).json({ message: 'Client non trouvé' });
      }

      return res.json(client);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
     return  res.status(500).json({ message: 'Erreur lors de la mise à jour du client' });
    }
  }

  /**
   * Supprime un client
   */
  public static async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      const practitionerId = new Types.ObjectId(req.user._id);
      const client = await clientService.deleteClient(req.user?._id,practitionerId);

      if (!client) {
        return res.status(404).json({ message: 'Client non trouvé' });
      }

     return res.json({ message: 'Client supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
     return res.status(500).json({ message: 'Erreur lors de la suppression du client' });
    }
  }

  /**
   * Recherche des clients
   */
  public static async search(req: AuthRequest, res: Response) {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      const practitionerId = new Types.ObjectId(req.user._id);
      const query = req.query.q as string;

      if (!query) {
        return res.status(400).json({ message: 'Requête de recherche manquante' });
      }

      // const clients = await Client.find({
      //   practitionerId,
      //   $or: [
      //     { firstName: { $regex: query, $options: 'i' } },
      //     { lastName: { $regex: query, $options: 'i' } },
      //     { email: { $regex: query, $options: 'i' } },
      //     { phone: { $regex: query, $options: 'i' } }
      //   ]
      // }).sort({ lastName: 1, firstName: 1 });
      const clients = await clientService.search(query,practitionerId);

     return res.json(clients);
    } catch (error) {
      console.error('Erreur lors de la recherche des clients:', error);
     return res.status(500).json({ message: 'Erreur lors de la recherche des clients' });
    }
  }

  /**
   * Archive un client
   */
  public static async archive(req: AuthRequest, res: Response) {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      const practitionerId = new Types.ObjectId(req.user._id);
      const client = await Client.findOneAndUpdate(
        { _id: req.params.id, practitionerId },
        { isArchived: true, archivedAt: new Date() },
        { new: true }
      );

      if (!client) {
        return res.status(404).json({ message: 'Client non trouvé' });
      }

     return res.json(client);
    } catch (error) {
      console.error('Erreur lors de l\'archivage du client:', error);
     return res.status(500).json({ message: 'Erreur lors de l\'archivage du client' });
    }
  }

  /**
   * Désarchive un client
   */
  public static async unarchive(req: AuthRequest, res: Response) {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      const practitionerId = new Types.ObjectId(req.user._id);
      const client = await Client.findOneAndUpdate(
        { _id: req.params.id, practitionerId },
        { isArchived: false, archivedAt: null },
        { new: true }
      );

      if (!client) {
        return res.status(404).json({ message: 'Client non trouvé' });
      }

     return  res.json(client);
    } catch (error) {
      console.error('Erreur lors de la désarchivage du client:', error);
      return res.status(500).json({ message: 'Erreur lors de la désarchivage du client' });
    }
  }

  /**
 * Récupère les anniversaires à venir dans les X prochains jours
 */
  public static async getUpcomingBirthdays(req: AuthRequest, res: Response) {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
      }

      const daysInAdvance = parseInt(req.query.daysInAdvance as string) || 7;
      const practitionerId = new Types.ObjectId(req.user._id);

      // Calculer la date d'aujourd'hui et la date limite
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + daysInAdvance);

      // Créer une expression pour comparer les mois et les jours
      const clients = await Client.aggregate([
        {
          $match: {
            practitionerId,
            birthDate: { $exists: true },
          }
        },
        {
          $addFields: {
            birthMonth: { $month: "$birthDate" },
            birthDay: { $dayOfMonth: "$birthDate" },
            currentMonth: { $month: today },
            currentDay: { $dayOfMonth: today },
          }
        },
        {
          $match: {
            $expr: {
              $or: [
                // Même mois, jour supérieur ou égal à aujourd'hui
                {
                  $and: [
                    { $eq: ["$birthMonth", { $month: today }] },
                    { $gte: ["$birthDay", { $dayOfMonth: today }] }
                  ]
                },
                // Mois suivant, jusqu'à la date limite
                {
                  $and: [
                    { $eq: ["$birthMonth", { $month: endDate }] },
                    { $lte: ["$birthDay", { $dayOfMonth: endDate }] }
                  ]
                }
              ]
            }
          }
        },
        {
          $sort: {
            birthMonth: 1,
            birthDay: 1
          }
        }
      ]);

      return res.json(clients);
    } catch (error) {
      console.error('Erreur lors de la récupération des anniversaires:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des anniversaires' });
    }
  }

  /**
   * Récupère les statistiques des clients
   */
  public static async getStatistics(req: AuthRequest, res: Response) {
    try {
      const practitionerId = req.user?._id;

      // Total des clients
      const total = await Client.countDocuments({ practitionerId });

      // Nouveaux clients ce mois-ci
      const now = new Date();
      const startOfThisMonth = startOfMonth(now);
      const endOfThisMonth = endOfMonth(now);
      const newThisMonth = await Client.countDocuments({
        practitionerId,
        createdAt: {
          $gte: startOfThisMonth,
          $lte: endOfThisMonth
        }
      });

      // Anniversaires ce mois
      const currentMonth = now.getMonth() + 1;
      const birthdays = await Client.countDocuments({
        practitionerId,
        $expr: {
          $eq: [{ $month: '$birthDate' }, currentMonth]
        }
      });

      // Rendez-vous
      const appointments = {
        upcoming: await Appointment.countDocuments({
          practitionerId,
          startDate: { $gte: now },
          status: { $ne: 'cancelled' }
        }),
        total: await Appointment.countDocuments({
          practitionerId
        })
      };

      res.json({
        total,
        newThisMonth,
        birthdays,
        appointments
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

}

export default ClientController;
