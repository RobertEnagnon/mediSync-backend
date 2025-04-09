/// <reference types="express" />
import { Types } from 'mongoose';
import { Request } from 'express';
import { IUser } from '../models/User';

// declare global {
//   namespace Express {
//     interface Request {
//       practitioner?: {
//         _id: Types.ObjectId;
//         email: string;
//         firstName: string;
//         lastName: string;
//         speciality: string;
//       };
//     }
//   }
// }

// Extension de l'interface Request pour inclure platitionner
export interface PrationnerUserRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    email: string;
    firstName: string;
    lastName: string;
    speciality: string;
  };
}



// Extension de l'interface Request pour inclure l'utilisateur
export interface AuthRequest extends Request {
    user?: IUser;
}