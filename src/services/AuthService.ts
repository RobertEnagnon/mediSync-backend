
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiError } from '../middleware/errorHandler';
import User, { IUser } from '../models/User';

// Configuration des tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: IUser; token: string }> {
    // Vérification si l'email existe déjà
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(400, 'Email already exists');
    }

    // Création du token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Création de l'utilisateur
    const user = await User.create({
      ...userData,
      verificationToken
    });

    // TODO: Envoyer l'email de vérification

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Mise à jour de la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Vérification de l'email d'un utilisateur
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      throw new ApiError(400, 'Invalid verification token');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 heure
    await user.save();

    // TODO: Envoyer l'email de réinitialisation
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }

  /**
   * Génération d'un token JWT
   */
  private generateToken(user: IUser): string {
    return jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }
}

export default new AuthService();
