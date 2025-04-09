import { Router } from 'express';
import ClientController from '../controllers/ClientController';
import { validateId, validateClientData } from '../middleware/validation';

const router = Router();

router.get('/', ClientController.getAll);
router.get('/search', ClientController.search);
router.get('/statistics', ClientController.getStatistics);
router.get('/upcoming-birthdays', ClientController.getUpcomingBirthdays);
router.get('/:id', validateId, ClientController.getById);
router.post('/', validateClientData, ClientController.create);
router.put('/:id', validateId, validateClientData, ClientController.update);
router.put('/:id/archive', validateId, ClientController.archive);
router.put('/:id/unarchive', validateId, ClientController.unarchive);
router.delete('/:id', validateId, ClientController.delete);
export default router;
