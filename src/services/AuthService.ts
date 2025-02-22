import User, { IUser } from '../models/User';
import { generateToken } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { sendEmail } from '../utils/emailService';
import crypto from 'crypto';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  specialization?: string;
  phoneNumber?: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<{ user: IUser; token: string }> {
    const { email, password, firstName, lastName, role, specialization, phoneNumber } = data;
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'Un utilisateur avec cet email existe déjà');
    }
    console.log('existingUser: ', existingUser);

    // Créer le token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex').trim();

    // Créer le nouvel utilisateur
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'practitioner',
      specialization,
      phoneNumber,
      verificationToken,
      settings: {
        theme: 'light',
        notifications: true,
        language: 'fr'
      }
    });

    // Envoyer l'email de vérification
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Vérification de votre compte',
      text: `Pour vérifier votre compte, cliquez sur ce lien : ${verificationUrl}`,
      html: '',
    });

    // Générer le token
    const token = generateToken(user._id.toString());

    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    console.log("login: ", email, password);
    // Trouver l'utilisateur
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(401, 'Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Email ou mot de passe incorrect');
    }

    // Mettre à jour la date de dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer le token
    const token = generateToken(user._id.toString());

    return { user, token };
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await User.findOne({ verificationToken: token });
    console.log('verif: ', user);
    
    if (!user) {
      throw new ApiError(400, 'Token de vérification invalide');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
  }

  async forgotPassword(email: string): Promise<void> {
    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'Aucun utilisateur trouvé avec cet email');
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Sauvegarder le token dans la base de données
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // Envoyer l'email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Réinitialisation de mot de passe',
      text: `Pour réinitialiser votre mot de passe, cliquez sur ce lien : ${resetUrl}`
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash le token reçu
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Trouver l'utilisateur avec le token valide
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ApiError(400, 'Token invalide ou expiré');
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }
}

export default new AuthService();
