import express from 'express';
import {
    getNotifications,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    deleteReadNotifications
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Routes protégées par authentification
router.use(protect);

// Routes pour les notifications
router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);
router.put('/read-all', markAllNotificationsAsRead);
router.delete('/delete-read', deleteReadNotifications);

export default router;
