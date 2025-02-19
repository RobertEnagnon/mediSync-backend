import { Request, Response, NextFunction } from 'express';
import Event, {IEvent} from '../models/Event'; // Assurez-vous que le modèle Event est défini
import {BaseController} from './BaseController'; // Importer la classe de base
import EventService from '../services/EventService'; // Importer le service Event

class EventController extends BaseController<IEvent> {
  constructor() {
    super(EventService); // Appeler le constructeur de BaseController avec EventService
  }

  // Récupérer tous les événements
  public getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await this.service.getAll(); // Utiliser le service pour récupérer tous les événements
      res.json(events);
    } catch (error) {
      next(error); // Passer l'erreur au middleware de gestion des erreurs
    }
  }

  // Récupérer un événement par ID
  public getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.service.getById(req.params.id); // Utiliser le service pour récupérer l'événement par ID
      if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
      res.json(event);
    } catch (error) {
      next(error); // Passer l'erreur au middleware de gestion des erreurs
    }
  }

  // Créer un nouvel événement
  public createEvent = async (req: Request, res: Response, next: NextFunction) => {
    const event = new Event(req.body); // Créer un nouvel événement à partir des données de la requête
    try {
      const savedEvent = await event.save(); // Sauvegarder l'événement
      res.status(201).json(savedEvent); // Retourner l'événement sauvegardé
    } catch (error) {
      next(error); // Passer l'erreur au middleware de gestion des erreurs
    }
  }

  // Mettre à jour un événement existant
  public updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedEvent = await this.service.update(req.params.id, req.body); // Mettre à jour l'événement
      if (!updatedEvent) return res.status(404).json({ message: 'Événement non trouvé' });
      res.json(updatedEvent); // Retourner l'événement mis à jour
    } catch (error) {
      next(error); // Passer l'erreur au middleware de gestion des erreurs
    }
  }
}

export default new EventController(); // Exporter une instance de EventController