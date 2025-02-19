import { Request, Response, NextFunction } from 'express';
import Note, {INote} from '../models/Note'; // Importer le modèle Note
import {BaseController} from './BaseController'; // Importer la classe de base
import NoteService from '../services/NoteService'; // Importer le service Note

class NoteController extends BaseController<INote> {
  constructor() {
    super(NoteService); // Appeler le constructeur de BaseController avec NoteService
  }

  // Récupérer les notes par ID de client
  public getNotesByClientId = async (req: Request, res: Response, next: NextFunction) => {
    const { clientId } = req.params;
    try {
      const notes = await NoteService.getNotesByClientId(clientId); // Utiliser le service pour récupérer les notes
      res.json(notes);
    } catch (error) {
      next(error); // Passer l'erreur au middleware de gestion des erreurs
    }
  };

  // Créer une nouvelle note
  public createNote = async (req: Request, res: Response, next: NextFunction) => {
    const { clientId, content } = req.body; // Récupérer l'ID du client et le contenu de la note
    const note = new Note({ clientId, content }); // Créer une nouvelle instance de Note
    try {
      const savedNote = await note.save(); // Sauvegarder la note dans la base de données
      res.status(201).json(savedNote); // Retourner la note sauvegardée
    } catch (error) {
      next(error); // Passer l'erreur au middleware de gestion des erreurs
    }
  }
}

export default new NoteController(); // Exporter une instance de NoteController