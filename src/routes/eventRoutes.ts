import { Router } from 'express';
import EventController from '../controllers/eventController';

const router = Router();

// Routes pour les événements
router.get('/', EventController.getAllEvents); // Récupérer tous les événements
router.get('/:id', EventController.getEventById); // Récupérer un événement par ID
router.post('/', EventController.createEvent); // Créer un nouvel événement
router.put('/:id', EventController.updateEvent); // Mettre à jour un événement existant
router.delete('/:id', EventController.delete); // Supprimer un événement

export default router;