
import { Router } from 'express';
import AppointmentController from '../controllers/AppointmentController';
import { validateId, validateAppointmentData } from '../middleware/validation';

const router = Router();

router.get('/', AppointmentController.getAll);
router.get('/search', AppointmentController.search);
router.get('/filter', AppointmentController.filter);
router.get('/upcoming', AppointmentController.getUpcoming);
router.get('/:id', validateId, AppointmentController.getById);
router.post('/', validateAppointmentData, AppointmentController.create);
router.put('/:id', validateId, validateAppointmentData, AppointmentController.update);
router.delete('/:id', validateId, AppointmentController.delete);

export default router;
