import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// Interface définissant la structure d'un utilisateur
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: string;
  specialization?: string;
  phoneNumber?: string;
  settings?: {
    theme: string;
    notifications: boolean;
    language: string;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Schéma MongoDB pour les utilisateurs
const UserSchema: Schema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'practitioner', 'assistant'],
    default: 'practitioner' 
  },
  specialization: { 
    type: String, 
    trim: true 
  },
  phoneNumber: { 
    type: String, 
    trim: true 
  },
  settings: {
    theme: {
      type: String,
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'fr'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

// Middleware pour hasher le mot de passe avant la sauvegarde
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
