
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import User, { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extension de l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Middleware de protection des routes
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Vérification de la présence du token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Not authorized to access this route');
    }

    // Extraction et vérification du token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    // Récupération de l'utilisateur
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Ajout de l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, 'Not authorized to access this route'));
  }
};

/**
 * Middleware de vérification des rôles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Not authorized to perform this action');
    }
    next();
  };
};
