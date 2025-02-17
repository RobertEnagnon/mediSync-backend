import { Request, Response } from 'express';
import Note from '../models/Note'; // Importer le modèle Note

// Récupérer les notes par ID de client
export const getNotesByClientId = async (req: Request, res: Response) => {
  const { clientId } = req.params;
  try {
    const notes = await Note.find({ clientId }); // Trouver toutes les notes associées à l'ID du client
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message }); // Gérer les erreurs
  }
};

// Créer une nouvelle note
export const createNote = async (req: Request, res: Response) => {
  const { clientId, content } = req.body; // Récupérer l'ID du client et le contenu de la note
  const note = new Note({ clientId, content }); // Créer une nouvelle instance de Note
  try {
    const savedNote = await note.save(); // Sauvegarder la note dans la base de données
    res.status(201).json(savedNote); // Retourner la note sauvegardée
  } catch (error) {
    res.status(400).json({ message: error.message }); // Gérer les erreurs
  }
};