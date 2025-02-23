import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { NotificationModel } from '../models/Notification';

/**
 * Contrôleur pour gérer les fonctionnalités du tableau de bord
 */
export class DashboardController {
  /**
   * Récupère toutes les statistiques pour le tableau de bord
   */
  public static async getDashboardStats(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Récupère les rendez-vous du jour
      const todayAppointments = await Appointment.find({
        practitionerId: userId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).populate('clientId');

      // Récupère les prochains rendez-vous
      const upcomingAppointments = await Appointment.find({
        practitionerId: userId,
        date: { $gt: today }
      })
        .sort({ date: 1 })
        .limit(5)
        .populate('clientId');

      // Récupère les nouveaux clients (7 derniers jours)
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const newClients = await Client.find({
        practitionerId: userId,
        createdAt: { $gte: lastWeek }
      }).limit(5);

      // Calcule les statistiques générales
      const totalClients = await Client.countDocuments({ practitionerId: userId });
      const totalAppointments = await Appointment.countDocuments({ practitionerId: userId });
      const totalAppointmentsToday = todayAppointments.length;

      // Récupère les notifications non lues
      const unreadNotifications = await NotificationModel.countDocuments({
        userId,
        read: false
      });

      // Calcule le taux de remplissage du jour
      const workingHours = 8; // 8 heures de travail par jour
      const appointmentDuration = 30; // 30 minutes par rendez-vous
      const maxAppointments = (workingHours * 60) / appointmentDuration;
      const occupancyRate = (totalAppointmentsToday / maxAppointments) * 100;

      // Récupère les rendez-vous annulés récemment
      const recentCancellations = await Appointment.find({
        practitionerId: userId,
        status: 'cancelled',
        updatedAt: { $gte: lastWeek }
      }).countDocuments();

      return res.status(200).json({
        todayAppointments,
        upcomingAppointments,
        newClients,
        stats: {
          totalClients,
          totalAppointments,
          totalAppointmentsToday,
          unreadNotifications,
          occupancyRate,
          recentCancellations
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return res.status(500).json({
        message: 'Erreur lors de la récupération des statistiques du tableau de bord'
      });
    }
  }

  /**
   * Récupère les données pour le graphique d'activité
   */
  public static async getActivityChart(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const today = new Date();
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Récupère les rendez-vous des 30 derniers jours
      const appointments = await Appointment.aggregate([
        {
          $match: {
            practitionerId: userId,
            date: { $gte: lastMonth, $lte: today }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      return res.status(200).json(appointments);
    } catch (error) {
      console.error('Erreur lors de la récupération des données du graphique:', error);
      return res.status(500).json({
        message: 'Erreur lors de la récupération des données du graphique d\'activité'
      });
    }
  }
}
