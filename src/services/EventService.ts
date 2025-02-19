import { BaseService } from './BaseService'; // Importer la classe de base
import Event, { IEvent } from '../models/Event'; // Importer le modèle Event

export class EventService extends BaseService<IEvent> {
  constructor() {
    super(Event); // Appeler le constructeur de BaseService avec le modèle Event
  }

  // Récupérer tous les événements
  async getAll(): Promise<IEvent[]> {
    return this.model.find(); // Récupérer tous les événements
  }

  // Récupérer un événement par ID
  async getById(id: string): Promise<IEvent | null> {
    return this.model.findById(id); // Récupérer l'événement par ID
  }

  // Créer un nouvel événement
  async create(data: Partial<IEvent>): Promise<IEvent> {
    const event = new this.model(data); // Créer une nouvelle instance de Event
    return event.save(); // Sauvegarder l'événement dans la base de données
  }

  // Mettre à jour un événement existant
  async update(id: string, data: Partial<IEvent>): Promise<IEvent | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }); // Mettre à jour l'événement
  }

  // Supprimer un événement
  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id); // Supprimer l'événement
  }
}

export default new EventService(); // Exporter une instance de EventService