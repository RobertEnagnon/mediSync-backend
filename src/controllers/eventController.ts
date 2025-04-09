import { Request, Response, NextFunction } from 'express';
import eventService from '../services/EventService';
import { ApiError } from '../middleware/errorHandler';
import { Types } from 'mongoose';
import {PrationnerUserRequest} from "../types/express"

class EventController { 
  private service = eventService;

  // Récupérer tous les événements
    getAll = async(req: PrationnerUserRequest, res: Response, next: NextFunction) => {
    try {
      const practitionerId = req.user?._id;
      // console.log("practitionerId getAll ")
      // console.log(req.user)
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      const events = await this.service.getAllForPractitioner(practitionerId.toString());
      res.json(events);
    } catch (error) {
      next(error);
    }
  }

  // Récupérer un événement par ID
   getById = async(req: PrationnerUserRequest, res: Response, next: NextFunction) =>{
    try {
      const { id } = req.params;
      const practitionerId = req.user?._id;
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      const event = await this.service.getByIdForPractitioner(id, practitionerId.toString());
      if (!event) {
        throw new ApiError(404, 'Event not found');
      }
      res.json(event);
    } catch (error) {
      next(error);
    }
  }

  // Créer un nouvel événement
  create = async(req: PrationnerUserRequest, res: Response, next: NextFunction) => {
    try {
      const practitionerId = req.user?._id;
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      const eventData = { ...req.body, practitionerId: practitionerId.toString() };
      // console.log("create event")
      // console.log(eventData);
      const event = await this.service.create(eventData);
      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  }

  // Créer des événements récurrents
   createRecurring = async(req: PrationnerUserRequest, res: Response, next: NextFunction) =>{
    try {
      const practitionerId = req.user?._id;
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      const { recurrencePattern, ...eventData } = req.body;
      if (!recurrencePattern) {
        throw new ApiError(400, 'Recurrence pattern is required');
      }
      console.log("createRecurring event")
      console.log(eventData);
      const events = await this.service.createRecurringEvent(
        { ...eventData, practitionerId: practitionerId.toString() },
        recurrencePattern
      );
      res.status(201).json(events);
    } catch (error) {
      next(error);
    }
  }

  // Mettre à jour un événement
   update = async(req: PrationnerUserRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const practitionerId = req.user?._id;
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      const event = await this.service.updateForPractitioner(id, practitionerId.toString(), req.body);
      if (!event) {
        throw new ApiError(404, 'Event not found');
      }
      res.json(event);
    } catch (error) {
      next(error);
    }
  }

  // Supprimer un événement
   delete = async(req: PrationnerUserRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const practitionerId = req.user?._id;
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      await this.service.deleteForPractitioner(id, practitionerId.toString());
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Récupérer les événements du jour
   getTodayEvents = async(req: PrationnerUserRequest, res: Response, next: NextFunction) =>{
    try {
      const practitionerId = req.user?._id;
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      const events = await this.service.getTodayEvents(practitionerId.toString());
      res.json(events);
    } catch (error) {
      next(error);
    }
  }

  // Récupérer les événements à venir
   getUpcoming = async(req: PrationnerUserRequest, res: Response, next: NextFunction) => {
    try {
      const practitionerId = req.user?._id;
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const events = await this.service.getUpcomingEvents(practitionerId.toString(), days);
      res.json(events);
    } catch (error) {
      next(error);
    }
  }

  // Rechercher des événements
   search = async(req: PrationnerUserRequest, res: Response, next: NextFunction) => {
    try {
      const { query, startDate, endDate, type, status } = req.query;
      const practitionerId = req.user?._id;
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      if (!query) {
        throw new ApiError(400, 'Search query is required');
      }
      const filters = {
        ...(startDate && endDate ? {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string)
        } : {}),
        ...(type ? { type: type as string } : {}),
        ...(status ? { status: status as string } : {})
      };
      const events = await this.service.searchEvents(practitionerId.toString(), query as string, filters);
      res.json(events);
    } catch (error) {
      next(error);
    }
  }

  // Mettre à jour le statut d'un événement
   updateStatus = async(req: PrationnerUserRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const practitionerId = req.user?._id;
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      if (!status) {
        throw new ApiError(400, 'Status is required');
      }
      const event = await this.service.updateStatus(id, practitionerId.toString(), status);
      if (!event) {
        throw new ApiError(404, 'Event not found');
      }
      res.json(event);
    } catch (error) {
      next(error);
    }
  }

  // Récupérer les événements par plage de dates
   getByDateRange = async(req: PrationnerUserRequest, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;
      const practitionerId = req.user?._id;
      if (!practitionerId) {
        throw new ApiError(401, 'Unauthorized');
      }
      if (!startDate || !endDate) {
        throw new ApiError(400, 'Start date and end date are required');
      }
      const events = await this.service.getEventsByDateRange(
        practitionerId.toString(),
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(events);
    } catch (error) {
      next(error);
    }
  }
}

export default new EventController();