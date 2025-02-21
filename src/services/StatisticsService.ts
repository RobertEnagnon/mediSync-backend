import AppointmentService from './AppointmentService';
import ClientService from './ClientService';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export class StatisticsService {
  static async getDashboardStats() {
    const [appointmentStats, clientGrowth, monthlyStats] = await Promise.all([
      AppointmentService.getStatistics(),
      AppointmentService.getClientGrowth(),
      this.getMonthlyStats()
    ]);

    return {
      appointments: {
        total: appointmentStats.total,
        upcoming: appointmentStats.upcoming,
        completed: appointmentStats.completed,
        cancelled: appointmentStats.cancelled,
        byType: appointmentStats.byType
      },
      clients: {
        total: clientGrowth.newClients + clientGrowth.returningClients,
        new: clientGrowth.newClients,
        returning: clientGrowth.returningClients,
        averageAppointments: Math.round(clientGrowth.averageAppointmentsPerClient * 10) / 10
      },
      monthly: {
        appointments: monthlyStats.appointments,
        newClients: monthlyStats.newClients,
        growth: monthlyStats.growth
      }
    };
  }

  static async getMonthlyStats() {
    const currentDate = new Date();
    const startMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(currentDate);

    const [appointments, clients] = await Promise.all([
      AppointmentService.getByDateRange(startMonth, endMonth),
      ClientService.getByDateRange(startMonth, endMonth)
    ]);

    const lastMonth = {
      start: startOfMonth(subMonths(currentDate, 1)),
      end: endOfMonth(subMonths(currentDate, 1))
    };

    const [lastMonthAppointments, lastMonthClients] = await Promise.all([
      AppointmentService.getByDateRange(lastMonth.start, lastMonth.end),
      ClientService.getByDateRange(lastMonth.start, lastMonth.end)
    ]);

    const growth = {
      appointments: this.calculateGrowth(appointments.length, lastMonthAppointments.length),
      clients: this.calculateGrowth(clients.length, lastMonthClients.length)
    };

    return {
      appointments: appointments.length,
      newClients: clients.length,
      growth
    };
  }

  private static calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}

export default StatisticsService;