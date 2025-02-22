import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';

class AuthController {
  /**
   * @desc    Inscription d'un nouvel utilisateur
   * @route   POST /api/auth/register
   * @access  Public
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, role,phoneNumber,specialization } = req.body;

      // Validation des champs requis
      if (!email || !password || !firstName || !lastName) {
        throw new Error('Veuillez fournir tous les champs requis');
      }

      const { user, token } = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role,
        specialization,
        phoneNumber
      });

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Connexion d'un utilisateur
   * @route   POST /api/auth/login
   * @access  Public
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new Error('Veuillez fournir l\'email et le mot de passe');
      }

      const { user, token } = await AuthService.login(email, password);

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Vérification de l'email
   * @route   GET /api/auth/verify-email/:token
   * @access  Public
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("token verify: ", req.params.token);
      await AuthService.verifyEmail(req.params.token);
      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Demande de réinitialisation de mot de passe
   * @route   POST /api/auth/forgot-password
   * @access  Public
   */
  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new Error('Veuillez fournir une adresse email');
      }

      await AuthService.forgotPassword(email);

      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Réinitialisation du mot de passe
   * @route   POST /api/auth/reset-password/:token
   * @access  Public
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw new Error('Veuillez fournir le token et le nouveau mot de passe');
      }

      await AuthService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
