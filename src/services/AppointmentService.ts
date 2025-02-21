import { BaseService } from './BaseService';
import Appointment, { IAppointment, AppointmentStatus } from '../models/Appointment';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format, addHours, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ApiError } from '../middleware/errorHandler';

interface SearchQuery {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  status?: string;
  clientId?: string;
}

/**
 * Service pour la gestion des rendez-vous
 */
export class AppointmentService extends BaseService<IAppointment> {
  constructor() {
    super(Appointment);
  }

  /**
   * Créer un nouveau rendez-vous
   */
  async create(data: Partial<IAppointment>): Promise<IAppointment> {
    // Vérifier la disponibilité du créneau
    const isAvailable = await this.isSlotAvailable(new Date(data.date as Date));
    if (!isAvailable) {
      throw new ApiError(400, 'Ce créneau n\'est pas disponible');
    }

    return super.create({
      ...data,
      status: data.status || 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Récupérer tous les rendez-vous avec les informations du client
   */
  async getAll(): Promise<IAppointment[]> {
    return this.model.find()
      .populate('clientId', 'firstName lastName email phone')
      .sort({ date: 1 });
  }

  /**
   * Récupérer les rendez-vous par période
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<IAppointment[]> {
    return this.model.find({
      date: {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate)
      }
    }).populate('clientId', 'firstName lastName email phone')
      .sort({ date: 1 });
  }

  /**
   * Récupérer les rendez-vous à venir dans une plage horaire
   */
  async findUpcoming(startDate: Date, endDate: Date): Promise<IAppointment[]> {
    return this.model.find({
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'confirmed'
    }).populate('clientId', 'firstName lastName email phone')
      .sort({ date: 1 });
  }

  /**
   * Récupérer les rendez-vous à venir (prochains 30 jours)
   */
  async getUpcoming(): Promise<IAppointment[]> {
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    return this.model.find({
      date: {
        $gte: startOfDay(now),
        $lte: endOfDay(thirtyDaysFromNow)
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).populate('clientId', 'firstName lastName email phone')
      .sort({ date: 1 });
  }

  /**
   * Récupérer les rendez-vous par client
   */
  async getByClientId(clientId: string): Promise<IAppointment[]> {
    return this.model.find({ clientId })
      .populate('clientId', 'firstName lastName email phone')
      .sort({ date: -1 });
  }

  /**
   * Rechercher des rendez-vous
   */
  async search(query: SearchQuery): Promise<IAppointment[]> {
    const searchQuery: any = {};

    if (query.startDate && query.endDate) {
      searchQuery.date = {
        $gte: startOfDay(query.startDate),
        $lte: endOfDay(query.endDate)
      };
    }

    if (query.type) {
      searchQuery.type = query.type;
    }

    if (query.status) {
      searchQuery.status = query.status;
    }

    if (query.clientId) {
      searchQuery.clientId = query.clientId;
    }

    return this.model.find(searchQuery)
      .populate('clientId', 'firstName lastName email phone')
      .sort({ date: 1 });
  }

  /**
   * Obtenir les statistiques des rendez-vous
   */
  async getStatistics(period: 'day' | 'week' | 'month' | 'year'): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    upcoming: number;
    byType: Record<string, number>;
    period: {
      start: Date;
      end: Date;
    };
  }> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfDay(new Date(now.setDate(now.getDate() - 7)));
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = startOfDay(now);
    }

    const appointments = await this.model.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    const total = appointments.length;
    const completed = appointments.filter(app => app.status === 'completed').length;
    const cancelled = appointments.filter(app => app.status === 'cancelled').length;
    const upcoming = appointments.filter(app => app.status === 'confirmed').length;

    const typeStats = appointments.reduce((acc: Record<string, number>, app) => {
      acc[app.type] = (acc[app.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      completed,
      cancelled,
      upcoming,
      byType: typeStats,
      period: {
        start: startDate,
        end: endDate
      }
    };
  }

  /**
   * Obtenir les créneaux disponibles
   */
  async getAvailableSlots(date: Date): Promise<Date[]> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Récupérer tous les rendez-vous du jour
    const appointments = await this.model.find({
      date: {
        $gte: dayStart,
        $lte: dayEnd
      },
      status: { $ne: 'cancelled' }
    });

    // Définir les heures de travail (par exemple, 9h-18h)
    const workingHours = {
      start: 9,
      end: 18
    };

    // Durée d'un créneau en minutes
    const slotDuration = 30;

    const slots: Date[] = [];
    const bookedSlots = appointments.map(app => format(new Date(app.date), 'HH:mm'));

    // Générer tous les créneaux possibles
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);

        // Ne pas proposer de créneaux dans le passé
        if (slotTime < new Date()) {
          continue;
        }

        // Vérifier si le créneau n'est pas déjà réservé
        const slotTimeStr = format(slotTime, 'HH:mm');
        if (!bookedSlots.includes(slotTimeStr)) {
          slots.push(slotTime);
        }
      }
    }

    return slots;
  }

  /**
   * Vérifier la disponibilité d'un créneau
   */
  async isSlotAvailable(date: Date): Promise<boolean> {
    const appointment = await this.model.findOne({
      date: {
        $gte: startOfDay(date),
        $lte: endOfDay(date)
      },
      status: { $ne: 'cancelled' }
    });

    return !appointment;
  }

  /**
   * Annuler un rendez-vous
   */
  async cancel(id: string, reason?: string): Promise<IAppointment | null> {
    const appointment = await this.model.findById(id);
    if (!appointment) {
      throw new ApiError(404, 'Rendez-vous non trouvé');
    }

    if (appointment.status === 'cancelled') {
      throw new ApiError(400, 'Ce rendez-vous est déjà annulé');
    }

    if (appointment.status === 'completed') {
      throw new ApiError(400, 'Impossible d\'annuler un rendez-vous terminé');
    }

    return this.model.findByIdAndUpdate(
      id,
      {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('clientId', 'firstName lastName email phone');
  }

  /**
   * Confirmer un rendez-vous
   */
  async confirm(id: string): Promise<IAppointment | null> {
    const appointment = await this.model.findById(id);
    if (!appointment) {
      throw new ApiError(404, 'Rendez-vous non trouvé');
    }

    if (appointment.status === 'confirmed') {
      throw new ApiError(400, 'Ce rendez-vous est déjà confirmé');
    }

    if (appointment.status === 'cancelled') {
      throw new ApiError(400, 'Impossible de confirmer un rendez-vous annulé');
    }

    if (appointment.status === 'completed') {
      throw new ApiError(400, 'Impossible de confirmer un rendez-vous terminé');
    }

    return this.model.findByIdAndUpdate(
      id,
      {
        status: 'confirmed',
        confirmedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('clientId', 'firstName lastName email phone');
  }

  /**
   * Marquer un rendez-vous comme terminé
   */
  async complete(id: string, notes?: string): Promise<IAppointment | null> {
    const appointment = await this.model.findById(id);
    if (!appointment) {
      throw new ApiError(404, 'Rendez-vous non trouvé');
    }

    if (appointment.status === 'completed') {
      throw new ApiError(400, 'Ce rendez-vous est déjà terminé');
    }

    if (appointment.status === 'cancelled') {
      throw new ApiError(400, 'Impossible de terminer un rendez-vous annulé');
    }

    return this.model.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        completedAt: new Date(),
        notes: notes,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('clientId', 'firstName lastName email phone');
  }

  /**
   * Obtenir les statistiques des clients
   */
  async getClientStats(period: 'day' | 'week' | 'month' | 'year'): Promise<{
    total: number;
    new: number;
    returning: number;
    growth: number;
    byStatus: Record<AppointmentStatus, number>;
    period: {
      start: Date;
      end: Date;
    };
  }> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        previousStartDate = subDays(startDate, 1);
        previousEndDate = subDays(endDate, 1);
        break;
      case 'week':
        startDate = startOfDay(subDays(now, 7));
        previousStartDate = subDays(startDate, 7);
        previousEndDate = subDays(endDate, 7);
        break;
      case 'month':
        startDate = startOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = startOfDay(now);
        previousStartDate = subDays(startDate, 1);
        previousEndDate = subDays(endDate, 1);
    }

    const [currentPeriodAppointments, previousPeriodAppointments] = await Promise.all([
      this.model.find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate('clientId', 'firstName lastName email'),

      this.model.find({
        date: {
          $gte: previousStartDate,
          $lte: previousEndDate
        }
      })
    ]);

    // Calculer les statistiques
    const uniqueClients = new Set(currentPeriodAppointments.map(app => app.clientId.toString()));
    const total = uniqueClients.size;

    // Clients qui ont déjà eu des rendez-vous dans la période précédente
    const returningClients = new Set(
      currentPeriodAppointments
        .filter(app => 
          previousPeriodAppointments.some(
            prevApp => prevApp.clientId.toString() === app.clientId.toString()
          )
        )
        .map(app => app.clientId.toString())
    );

    const returning = returningClients.size;
    const newClients = total - returning;

    // Calculer la croissance par rapport à la période précédente
    const previousTotal = new Set(previousPeriodAppointments.map(app => app.clientId.toString())).size;
    const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

    // Compter les rendez-vous par statut
    const byStatus = currentPeriodAppointments.reduce((acc: Record<AppointmentStatus, number>, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<AppointmentStatus, number>);

    return {
      total,
      new: newClients,
      returning,
      growth: Math.round(growth * 100) / 100, // Arrondir à 2 décimales
      byStatus,
      period: {
        start: startDate,
        end: endDate
      }
    };
  }
}

export default new AppointmentService();
