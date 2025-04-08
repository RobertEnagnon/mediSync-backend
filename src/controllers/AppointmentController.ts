import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import Appointment, { IAppointment } from '../models/Appointment';
import AppointmentService from '../services/AppointmentService';
import { AuthRequest } from '@/types/express';
import { Types } from 'mongoose';

export class AppointmentController extends BaseController<IAppointment> {
  constructor() {
    super(AppointmentService);
  }

   /**
     * Récupère tous les rendez-vous du praticien
     */
   getAll= async (req: AuthRequest, res: Response) => {
      try {
        if (!req.user?._id) {
          return res.status(401).json({ message: 'Utilisateur non authentifié' });
        }
  
        const practitionerId = new Types.ObjectId(req.user._id);
        console.log("practitionerId: ", practitionerId)
        const appointments = await Appointment.find({ practitionerId });
       return res.json(appointments);
      } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        return  res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous' });
      }
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
