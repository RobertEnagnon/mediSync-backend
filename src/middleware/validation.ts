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
export const validateAppointmentData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    title,
    description,
    date,
    duration,
    clientId,
    practitionerId,
    type,
    notes,
    location
  } = req.body;

  // Validation des champs requis
  if (!title || !date || !duration || !clientId || !practitionerId || !type) {
    return res.status(400).json({
      error: 'Les champs title, date, duration, clientId, practitionerId et type sont requis'
    });
  }

  // Validation du type de rendez-vous
  const validTypes = ['consultation', 'follow-up', 'emergency', 'other'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Le type de rendez-vous doit être : consultation, follow-up, emergency ou other'
    });
  }

  // Validation de la date
  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) {
    return res.status(400).json({
      error: 'La date du rendez-vous est invalide'
    });
  }

  // Validation de la durée (doit être un nombre positif)
  if (!Number.isInteger(duration) || duration <= 0) {
    return res.status(400).json({
      error: 'La durée doit être un nombre entier positif en minutes'
    });
  }

  // Validation des IDs (format MongoDB ObjectId)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  console.log(clientId, practitionerId);
  if (!objectIdRegex.test(clientId)) {
    return res.status(400).json({
      error: 'L\'ID du client est invalide'
    });
  }
  if (!objectIdRegex.test(practitionerId)) {
    return res.status(400).json({
      error: 'L\'ID du praticien est invalide'
    });
  }

  // Validation des champs optionnels
  if (description && typeof description !== 'string') {
    return res.status(400).json({
      error: 'La description doit être une chaîne de caractères'
    });
  }

  if (notes && typeof notes !== 'string') {
    return res.status(400).json({
      error: 'Les notes doivent être une chaîne de caractères'
    });
  }

  if (location && typeof location !== 'string') {
    return res.status(400).json({
      error: 'La localisation doit être une chaîne de caractères'
    });
  }

  // Si toutes les validations sont passées
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
