import { Router } from 'express';
import NoteController from '../controllers/NoteController';

const router = Router();

// Routes pour les notes
router.get('/:clientId', NoteController.getNotesByClientId); // Récupérer les notes par ID de client
router.post('/', NoteController.createNote); // Créer une nouvelle note

export default router;