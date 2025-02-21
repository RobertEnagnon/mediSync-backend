import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import User, { IUser } from '../models/User';

// Extension de l'interface Request pour inclure l'utilisateur
export interface AuthRequest extends Request {
  user?: IUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware de protection des routes
 * Vérifie le token JWT et ajoute l'utilisateur à la requête
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Vérifier si le token est présent dans les headers
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Si pas de token, renvoyer une erreur
    if (!token) {
      throw new ApiError(401, 'Non autorisé - Token manquant');
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      // Récupérer l'utilisateur et l'ajouter à la requête
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        throw new ApiError(401, 'Non autorisé - Utilisateur non trouvé');
      }

      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(401, 'Non autorisé - Token invalide');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Génère un token JWT pour un utilisateur
 */
export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * Middleware pour vérifier les rôles d'utilisateur
 */
export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Non autorisé - Utilisateur non authentifié');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Non autorisé - Rôle insuffisant');
    }

    next();
  };
};
