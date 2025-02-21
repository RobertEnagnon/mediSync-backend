import { Response } from 'express';
// import { AuthRequest } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import User from '../models/User';
import { ApiError } from '../middleware/errorHandler';

// Obtenir le profil de l'utilisateur
export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, 'Utilisateur non trouvé');
        }

        res.json(user);
    } catch (error) {
        throw error;
    }
};

// Mettre à jour le profil de l'utilisateur
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }

        const { firstName,lastName, email, specialization, phoneNumber } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, 'Utilisateur non trouvé');
        }

        // Mise à jour des champs
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (specialization) user.specialization = specialization;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        await user.save();

        res.json(user);
    } catch (error) {
        throw error;
    }
};

// Mettre à jour le mot de passe de l'utilisateur
export const updatePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }

        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, 'Utilisateur non trouvé');
        }

        // Vérifier l'ancien mot de passe
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            throw new ApiError(400, 'Mot de passe actuel incorrect');
        }

        // Mettre à jour le mot de passe
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (error) {
        throw error;
    }
};

// Obtenir les paramètres de l'utilisateur
export const getUserSettings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, 'Utilisateur non trouvé');
        }

        res.json(user.settings || {});
    } catch (error) {
        throw error;
    }
};

// Mettre à jour les paramètres de l'utilisateur
export const updateUserSettings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            throw new ApiError(401, 'Utilisateur non authentifié');
        }

        const { theme, notifications, language } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, 'Utilisateur non trouvé');
        }

        // Initialiser les settings s'ils n'existent pas
        if (!user.settings) {
            user.settings = {
                theme: 'light',
                notifications: true,
                language: 'fr'
            };
        }

        // Mise à jour des settings
        if (theme) user.settings.theme = theme;
        if (notifications !== undefined) user.settings.notifications = notifications;
        if (language) user.settings.language = language;

        await user.save();

        res.json(user.settings);
    } catch (error) {
        throw error;
    }
};
