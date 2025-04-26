import { Request, Response } from 'express';
import { ApiError } from '../middleware/errorHandler';
import Notification from '../models/Notification';
import { AuthRequest } from '../types/express';

class NotificationController {
    async getNotifications(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }
        console.log("userId: ", userId)

        const notifications = await Notification.find({ 
            userId,
            isRead: false 
        }).sort({ createdAt: -1 });
        console.log("getNotifications: ")
        console.log(notifications);

        res.json(notifications);
    }

    async getAllNotifications(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)  
            .limit(limit);
            console.log('getAllNotifications');
            console.log(notifications);

        const total = await Notification.countDocuments({ userId });

        res.json({
            notifications,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalNotifications: total
        });
    }

    async markNotificationAsRead(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }

        const { notificationId } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            throw new ApiError(404, 'Notification non trouvée');
        }

        res.json(notification);
    }

    async markAllNotificationsAsRead(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    }

    async deleteNotification(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }

        const { notificationId } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId
        });

        if (!notification) {
            throw new ApiError(404, 'Notification non trouvée');
        }

        res.json({ message: 'Notification supprimée avec succès' });
    }

    async deleteReadNotifications(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }

        const result = await Notification.deleteMany({
            userId,
            isRead: true
        });

        res.json({ 
            message: 'Toutes les notifications lues ont été supprimées',
            count: result.deletedCount
        });
    }
}

export default new NotificationController();
