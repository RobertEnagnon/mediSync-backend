import express from 'express';
import statisticsController from '../controllers/statisticsController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Protection de toutes les routes
router.use(protect);

// Routes pour les statistiques
router.get('/dashboard', statisticsController.getDashboardStatistics);
router.get('/appointments', statisticsController.getAppointmentStatistics);
router.get('/clients', statisticsController.getClientStatistics);

export default router;