import { Router } from 'express';
import { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from '../controllers/eventController';

const router = Router();

// Routes pour les événements
router.get('/', getAllEvents); // Récupérer tous les événements
router.get('/:id', getEventById); // Récupérer un événement par ID
router.post('/', createEvent); // Créer un nouvel événement
router.put('/:id', updateEvent); // Mettre à jour un événement existant
router.delete('/:id', deleteEvent); // Supprimer un événement

export default router;