import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { ApiError } from './errorHandler';

/**
 * Middleware pour valider les IDs MongoDB
 */
export const validateId = (req: Request, res: Response, next: NextFunction) => {
  // Récupérer tous les paramètres qui pourraient contenir un ID
  const idParams = ['id', 'clientId', 'practitionerId', 'appointmentId', 'documentId'];
  
  for (const param of idParams) {
    const id = req.params[param];
    if (id !== undefined && !isValidObjectId(id)) {
      return res.status(400).json({
        message: `ID invalide: ${id} pour le paramètre ${param}`
      });
    }
  }
  
  next();
};

/**
 * Middleware pour valider les données d'un rendez-vous
 */
export const validateAppointmentData = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate, clientId } = req.body;

  if (!startDate || !endDate || !clientId) {
    return res.status(400).json({
      message: 'Les champs startDate, endDate et clientId sont requis'
    });
  }

  if (!isValidObjectId(clientId)) {
    return res.status(400).json({
      message: 'ID de client invalide'
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      message: 'Dates invalides'
    });
  }

  if (start >= end) {
    return res.status(400).json({
      message: 'La date de début doit être antérieure à la date de fin'
    });
  }

  next();
};

/**
 * Middleware pour valider les données d'un client
 */
export const validateClientData = (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, phone } = req.body;

  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({
      message: 'Les champs firstName, lastName, email et phone sont requis'
    });
  }

  // Validation simple de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Format d\'email invalide'
    });
  }

  next();
};

/**
 * Middleware pour valider les données d'un document
 */
export const validateDocumentData = (req: Request, res: Response, next: NextFunction) => {
  const { title, clientId } = req.body;

  if (!title || !clientId) {
    return res.status(400).json({
      message: 'Les champs title et clientId sont requis'
    });
  }

  if (!isValidObjectId(clientId)) {
    return res.status(400).json({
      message: 'ID de client invalide'
    });
  }

  next();
};

/**
 * Middleware pour valider les données d'inscription
 */
export const validateRegisterData = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    throw new ApiError(400, 'Please provide all required fields');
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new ApiError(400, 'Please provide a valid email');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  next();
};

/**
 * Middleware pour valider les données de connexion
 */
export const validateLoginData = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  next();
};
