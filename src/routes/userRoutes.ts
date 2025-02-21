import express from 'express';
import { 
    getUserProfile, 
    updateUserProfile, 
    updateUserSettings,
    getUserSettings
} from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();


// Routes protégées nécessitant une authentification
router.use(protect);

// Routes pour le profil utilisateur
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Routes pour les paramètres utilisateur
router.get('/settings', getUserSettings);
router.put('/settings', updateUserSettings);

// Routes d'administration (à protéger davantage si nécessaire)
// router.get('/', userController.getAllUsers);
// router.get('/:id', userController.getUserById);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);

export default router;
