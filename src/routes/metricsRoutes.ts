import express from 'express';
import { protect } from '../middleware/auth';
import schedulerService from '../services/SchedulerService';

const router = express.Router();

// Route protégée par authentification
router.use(protect);

// Route pour obtenir les métriques du SchedulerService
router.get('/scheduler', (req, res) => {
  const metrics = schedulerService.getMetrics();
  res.json(metrics);
});

export default router;
