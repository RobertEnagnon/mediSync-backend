import { Router } from 'express';
import { getNotesByClientId, createNote } from '../controllers/NoteController';

const router = Router();

// Routes pour les notes
router.get('/:clientId', getNotesByClientId); // Récupérer les notes par ID de client
router.post('/', createNote); // Créer une nouvelle note

export default router;