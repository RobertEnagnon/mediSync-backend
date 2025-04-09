import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import User from '../models/User';
import { AuthRequest } from '../types/express';


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware de protection des routes
 * Vérifie le token JWT et ajoute l'utilisateur à la requête
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;

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

      // Récupérer l'utilisateur
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new ApiError(401, 'Non autorisé - Utilisateur non trouvé');
      }

      // Ajouter l'utilisateur à la requête
      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(new ApiError(401, 'Non autorisé - Token invalide'));
      } else {
        next(error);
      }
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
    expiresIn: '24h'
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
