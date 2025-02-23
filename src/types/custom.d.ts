import { Types } from 'mongoose';

declare namespace Express {
  export interface Request {
    user?: {
      _id: Types.ObjectId;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    }
  }
}
