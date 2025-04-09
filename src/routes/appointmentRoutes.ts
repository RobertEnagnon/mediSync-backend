import { Router } from 'express';
import AppointmentController from '../controllers/AppointmentController';
import { validateId, validateAppointmentData } from '../middleware/validation';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

// Routes principales
router.get('/', AppointmentController.getAll);
router.get('/history', AppointmentController.getHistory);
// Obtenir l'historique des rendez-vous
// router.get('/history', AppointmentController.getAppointmentHistory);
router.get('/upcoming', AppointmentController.getUpcoming);
router.get('/search', AppointmentController.search);
router.get('/filter', AppointmentController.filter);
router.get('/client/:clientId', AppointmentController.getByClientId);
router.get('/:id', validateId, AppointmentController.getById);

// Routes de modification
router.post('/', validateAppointmentData, AppointmentController.create);
router.put('/:id', validateId, validateAppointmentData, AppointmentController.update);
router.delete('/:id', validateId, AppointmentController.delete);
router.patch('/:id/status', validateId, AppointmentController.updateStatus);

export default router;
