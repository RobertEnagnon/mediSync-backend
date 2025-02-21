// backend/src/routes/analytics.routes.ts
import express from 'express';
import analyticsController from '../controllers/AnalyticsController';

const router = express.Router();

// Routes pour les statistiques
router.get('/appointments', analyticsController.getAppointmentStats);
router.get('/revenue', analyticsController.getRevenueSummary);
router.get('/clients', analyticsController.getClientStats);

export default router;