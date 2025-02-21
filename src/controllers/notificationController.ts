import { Request, Response } from 'express';
import Notification from '../models/Notification';

// Obtenir toutes les notifications de l'utilisateur
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(100);
        
        res.json(notifications);
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const notification = await Notification.findOne({ _id: id, userId });
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }

        notification.read = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer une notification
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const notification = await Notification.findOneAndDelete({ _id: id, userId });
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }

        res.json({ message: 'Notification supprimée' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la notification:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Marquer toutes les notifications comme lues
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        await Notification.updateMany(
            { userId, read: false },
            { $set: { read: true } }
        );

        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
        console.error('Erreur lors du marquage des notifications:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer toutes les notifications lues
export const deleteReadNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        await Notification.deleteMany({ userId, read: true });

        res.json({ message: 'Toutes les notifications lues ont été supprimées' });
    } catch (error) {
        console.error('Erreur lors de la suppression des notifications:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
