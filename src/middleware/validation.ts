import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

export const validateId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  console.log("validateId: ", id)
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, 'Invalid ID format');
  }
  next();
};

export const validateClientData = (req: Request, res: Response, next: NextFunction) => {
  const { firstName,lastName, email, phone } = req.body;
  
  if (!firstName || !lastName || !email || !phone) {
    throw new ApiError(400, 'Missing required fields');
  }

  if (typeof firstName !== 'string' || firstName.trim().length < 2) {
    throw new ApiError(400, 'Invalid firstname');
  }
  if (typeof lastName !== 'string' || lastName.trim().length < 2) {
    throw new ApiError(400, 'Invalid lastName');
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new ApiError(400, 'Invalid email format');
  }

  next();
};

export const validateAppointmentData = (req: Request, res: Response, next: NextFunction) => {
  const { title, date, time, clientId } = req.body;
  
  if (!title || !date || !time || !clientId) {
    throw new ApiError(400, 'Missing required fields');
  }

  if (typeof title !== 'string' || title.trim().length < 2) {
    throw new ApiError(400, 'Invalid title');
  }

  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new ApiError(400, 'Invalid date format (YYYY-MM-DD required)');
  }

  if (!time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
    throw new ApiError(400, 'Invalid time format (HH:mm required)');
  }

  if (!clientId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, 'Invalid client ID format');
  }

  next();
};

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

export const validateLoginData = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  next();
};
