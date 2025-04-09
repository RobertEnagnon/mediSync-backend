import { Router } from 'express';
import EventController from '../controllers/eventController';
import { protect } from '../middleware/auth';
import { validateId } from '../middleware/validation';

const router = Router();

// Protection de toutes les routes
router.use(protect);

// Routes principales
router.get('/', EventController.getAll);
router.get('/today', EventController.getTodayEvents);
router.get('/upcoming', EventController.getUpcoming);
router.get('/search', EventController.search);
router.get('/date-range', EventController.getByDateRange);
router.get('/:id', validateId, EventController.getById);

// Routes de modification
router.post('/', EventController.create);
router.post('/recurring', EventController.createRecurring);
router.put('/:id', validateId, EventController.update);
router.delete('/:id', validateId, EventController.delete);
router.patch('/:id/status', validateId, EventController.updateStatus);

export default router;