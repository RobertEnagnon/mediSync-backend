
import { Router } from 'express';
import AuthController from '../controllers/AuthController';

const router = Router();

// Routes publiques
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password/:token', AuthController.resetPassword);

export default router;
