import { PractitionerService } from './PractitionerService';
import Event, { IEvent } from '../models/Event';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export class EventService extends PractitionerService<IEvent> {
  constructor() {
    super(Event);
  }

  // Surcharge des méthodes de BaseService pour forcer l'utilisation des méthodes avec practitionerId
  async getAll(): Promise<IEvent[]> {
    throw new Error('Use getAllForPractitioner instead');
  }

  async getById(id: string): Promise<IEvent | null> {
    throw new Error('Use getByIdForPractitioner instead');
  }

  async update(id: string, data: Partial<IEvent>): Promise<IEvent | null> {
    throw new Error('Use updateForPractitioner instead');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Use deleteForPractitioner instead');
  }

  // Méthodes spécifiques aux événements
  async getEventsByDateRange(
    practitionerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IEvent[]> {
    return this.model.find({
      practitionerId,
      date: {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate)
      }
    }).sort({ date: 1, startTime: 1 });
  }

  async getTodayEvents(practitionerId: string): Promise<IEvent[]> {
    const today = new Date();
    return this.getEventsByDateRange(practitionerId, today, today);
  }

  async getUpcomingEvents(practitionerId: string, days: number = 7): Promise<IEvent[]> {
    const startDate = new Date();
    const endDate = addDays(startDate, days);
    
    return this.model.find({
      practitionerId,
      date: { $gte: startDate, $lte: endDate },
      status: { $nin: ['completed', 'cancelled'] }
    }).sort({ date: 1, startTime: 1 });
  }

  async searchEvents(
    practitionerId: string,
    query: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
      status?: string;
    }
  ): Promise<IEvent[]> {
    const searchQuery: any = {
      practitionerId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    };

    if (filters) {
      if (filters.startDate && filters.endDate) {
        searchQuery.date = {
          $gte: startOfDay(filters.startDate),
          $lte: endOfDay(filters.endDate)
        };
      }
      if (filters.type) searchQuery.type = filters.type;
      if (filters.status) searchQuery.status = filters.status;
    }

    return this.model.find(searchQuery).sort({ date: 1, startTime: 1 });
  }

  async updateStatus(
    id: string,
    practitionerId: string,
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  ): Promise<IEvent | null> {
    return this.updateForPractitioner(id, practitionerId, { status });
  }

  async createRecurringEvent(
    eventData: Partial<IEvent>,
    recurrencePattern: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval: number;
      endDate: Date;
      daysOfWeek?: number[];
    }
  ): Promise<IEvent[]> {
    const events: IEvent[] = [];
    const startDate = new Date(eventData.date!);
    const endDate = new Date(recurrencePattern.endDate);
    let currentDate = startDate;

    while (currentDate <= endDate) {
      if (recurrencePattern.frequency === 'weekly' && recurrencePattern.daysOfWeek) {
        if (recurrencePattern.daysOfWeek.includes(currentDate.getDay())) {
          const event = await this.create({
            ...eventData,
            date: new Date(currentDate),
            isRecurring: true,
            recurrencePattern
          });
          events.push(event);
        }
      } else {
        const event = await this.create({
          ...eventData,
          date: new Date(currentDate),
          isRecurring: true,
          recurrencePattern
        });
        events.push(event);
      }

      // Incrémenter la date selon la fréquence
      switch (recurrencePattern.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + recurrencePattern.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * recurrencePattern.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + recurrencePattern.interval);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + recurrencePattern.interval);
          break;
      }
    }

    return events;
  }
}

export default new EventService();