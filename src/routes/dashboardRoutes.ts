import express from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * Routes pour le tableau de bord
 * Toutes les routes nécessitent une authentification
 */

// Récupère toutes les statistiques du tableau de bord
router.get('/stats', authenticateToken, DashboardController.getDashboardStats);

// Récupère les données pour le graphique d'activité
router.get('/activity-chart', authenticateToken, DashboardController.getActivityChart);

export default router;
