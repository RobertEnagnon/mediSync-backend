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
      const { startDate, endDate, type, status, clientId } = req.query;
      const searchQuery = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        type: type as string,
        status: status as string,
        clientId: clientId as string
      };
      const appointments = await AppointmentService.search(searchQuery);
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  };

  filter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, status, clientId } = req.query;
      const searchQuery = {
        type: type as string,
        status: status as string,
        clientId: clientId as string
      };
      const appointments = await AppointmentService.search(searchQuery);
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  };

  getByDateRange = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Les dates de début et de fin sont requises' });
      }
      const appointments = await AppointmentService.getByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
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

  getByClientId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { clientId } = req.params;
      if (!clientId) {
        return res.status(400).json({ message: 'ID du client requis' });
      }
      const appointments = await AppointmentService.getByClientId(clientId);
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  };
}

export default new AppointmentController();
