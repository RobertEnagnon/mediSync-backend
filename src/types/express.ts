import { Request } from 'express';
import { IUser } from '../models/User';

// Extension de l'interface Request pour inclure l'utilisateur
export interface AuthRequest extends Request {
    user?: IUser;
}
