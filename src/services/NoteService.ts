import { BaseService } from './BaseService'; // Importer la classe de base
import Note, { INote } from '../models/Note'; // Importer le modèle Note

export class NoteService extends BaseService<INote> {
  constructor() {
    super(Note); // Appeler le constructeur de BaseService avec le modèle Note
  }

  // Récupérer toutes les notes par ID de client
  async getNotesByClientId(clientId: string): Promise<INote[]> {
    return this.model.find({ clientId }); // Trouver toutes les notes associées à l'ID du client
  }

  // Créer une nouvelle note
  async create(data: Partial<INote>): Promise<INote> {
    const note = new this.model(data); // Créer une nouvelle instance de Note
    return note.save(); // Sauvegarder la note dans la base de données
  }

  // Mettre à jour une note existante
  async update(id: string, data: Partial<INote>): Promise<INote | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }); // Mettre à jour la note
  }

  // Supprimer une note
  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id); // Supprimer la note
  }
}

export default new NoteService(); // Exporter une instance de NoteService