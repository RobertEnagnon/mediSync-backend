import { Types } from 'mongoose';
import Appointment from '../models/Appointment';
import Client from '../models/Client';
import Document from '../models/Document';
import Notification from '../models/Notification';

class StatisticsService {
  async getDashboardStatistics(userId: string) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    try {
      // Statistiques des rendez-vous
      const [totalAppointments, upcomingAppointments, averageSessionDuration] = await Promise.all([
        Appointment.countDocuments({ userId }),
        Appointment.countDocuments({
          userId,
          date: { $gte: startOfDay }
        }),
        Appointment.aggregate([
          { $match: { userId: new Types.ObjectId(userId) } },
          { $group: {
            _id: null,
            averageDuration: { $avg: { $subtract: ["$endTime", "$startTime"] } }
          }}
        ])
      ]);

      // Statistiques des clients
      const [totalClients, activeClients, previousMonthClients] = await Promise.all([
        Client.countDocuments({ userId }),
        Client.countDocuments({
          userId,
          lastVisit: { $gte: thirtyDaysAgo }
        }),
        Client.countDocuments({
          userId,
          createdAt: {
            $gte: new Date(thirtyDaysAgo.getTime() - (30 * 24 * 60 * 60 * 1000)),
            $lt: thirtyDaysAgo
          }
        })
      ]);

      // Statistiques des documents
      const [totalDocuments, recentDocuments] = await Promise.all([
        Document.countDocuments({ userId }),
        Document.countDocuments({
          userId,
          createdAt: { $gte: thirtyDaysAgo }
        })
      ]);

      // Statistiques des notifications
      const [totalNotifications, unreadNotifications] = await Promise.all([
        Notification.countDocuments({ userId }),
        Notification.countDocuments({
          userId,
          read: false
        })
      ]);

      // Calcul du taux de croissance des clients
      const currentMonthClients = await Client.countDocuments({
        userId,
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      const clientGrowthRate = previousMonthClients === 0 
        ? 100 
        : Math.round(((currentMonthClients - previousMonthClients) / previousMonthClients) * 100);

      // Calcul de la durée moyenne des consultations en minutes
      const avgSessionDuration = averageSessionDuration[0]
        ? Math.round(averageSessionDuration[0].averageDuration / (1000 * 60))
        : 0;

      return {
        totalAppointments,
        upcomingAppointments,
        totalClients,
        activeClients,
        totalDocuments,
        recentDocuments,
        totalNotifications,
        unreadNotifications,
        averageSessionDuration: avgSessionDuration,
        clientGrowthRate
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new Error('Impossible de récupérer les statistiques');
    }
  }

  async getAppointmentStatistics(userId: string, startDate: Date, endDate: Date) {
    try {
      const stats = await Appointment.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            count: { $sum: 1 },
            completedCount: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
            },
            cancelledCount: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
            },
            totalDuration: {
              $sum: { $subtract: ["$endTime", "$startTime"] }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return stats.map(stat => ({
        date: stat._id,
        total: stat.count,
        completed: stat.completedCount,
        cancelled: stat.cancelledCount,
        averageDuration: Math.round(stat.totalDuration / (stat.count * 1000 * 60)) // en minutes
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de rendez-vous:', error);
      throw new Error('Impossible de récupérer les statistiques de rendez-vous');
    }
  }

  async getClientStatistics(userId: string, period: 'day' | 'week' | 'month' | 'year') {
    try {
      const today = new Date();
      let startDate: Date;

      switch (period) {
        case 'day':
          startDate = new Date(today.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(today.setDate(today.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(today.setMonth(today.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(today.setFullYear(today.getFullYear() - 1));
          break;
        default:
          throw new Error('Période invalide');
      }

      const stats = await Client.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: period === 'day' ? "%Y-%m-%d-%H" : "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            newClients: { $sum: 1 },
            activeClients: {
              $sum: {
                $cond: [
                  { $gte: ["$lastVisit", startDate] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return stats;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques clients:', error);
      throw new Error('Impossible de récupérer les statistiques clients');
    }
  }
}

export default new StatisticsService();