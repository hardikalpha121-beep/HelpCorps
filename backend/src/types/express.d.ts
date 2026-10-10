import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface User {
      _id: Types.ObjectId;
      fullName: string;
      email: string;
      role: 'user' | 'volunteer' | 'admin';
      isVolunteer: boolean;
    }
    interface Request {
      user?: User;
    }
  }
}

export {};
