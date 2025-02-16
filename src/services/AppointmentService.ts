
import { BaseService } from './BaseService';
import Appointment, { IAppointment } from '../models/Appointment';
import ClientService from './ClientService';

export class AppointmentService extends BaseService<IAppointment> {
  constructor() {
    super(Appointment);
  }

  async create(data: Partial<IAppointment>): Promise<IAppointment> {
    const appointment = await super.create(data);
    await ClientService.updateLastVisit(data.clientId!.toString());
    return appointment;
  }

  async search(query: string): Promise<IAppointment[]> {
    const regex = new RegExp(query, 'i');
    return this.model.find({
      $or: [
        { title: regex },
        { notes: regex }
      ]
    }).populate('clientId');
  }

  async filter(filters: {
    status?: string;
    date?: string;
    clientId?: string;
  }): Promise<IAppointment[]> {
    const query: any = {};

    if (filters.status) query.status = filters.status;
    if (filters.date) query.date = filters.date;
    if (filters.clientId) query.clientId = filters.clientId;

    return this.model.find(query).populate('clientId');
  }

  async getUpcoming(): Promise<IAppointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.model.find({
      date: { $gte: today },
      status: 'pending'
    }).populate('clientId').sort({ date: 1, time: 1 });
  }
}

export default new AppointmentService();
