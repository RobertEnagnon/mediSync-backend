
import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { IAppointment } from '../models/Appointment';
import AppointmentService from '../services/AppointmentService';

export class AppointmentController extends BaseController<IAppointment> {
  constructor() {
    super(AppointmentService);
  }

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string;
      const appointments = await AppointmentService.search(query);
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  };

  filter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, date, clientId } = req.query;
      const appointments = await AppointmentService.filter({
        status: status as string,
        date: date as string,
        clientId: clientId as string
      });
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  };

  getUpcoming = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointments = await AppointmentService.getUpcoming();
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  };
}

export default new AppointmentController();
