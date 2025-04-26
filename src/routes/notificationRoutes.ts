import express from 'express';
import notificationController from "../controllers/notificationController"
import { protect } from '../middleware/auth';

const router = express.Router();

// Routes protégées par authentification
router.use(protect);

// Routes pour les notifications
// router.get('/', notificationController.getNotifications);
router.get('/', notificationController.getAllNotifications);
router.put('/:id/read', notificationController.markNotificationAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.put('/read-all', notificationController.markAllNotificationsAsRead);
router.delete('/delete-read', notificationController.deleteReadNotifications);

export default router;
