import mongoose, { Schema, Document } from 'mongoose';

export type AppointmentStatus = 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
export type AppointmentType = 'consultation' | 'follow-up' | 'emergency' | 'other';

export interface IAppointment extends Document {
  title: string;
  date: Date;
  duration: number; // durée en minutes
  clientId: mongoose.Types.ObjectId;
  practitionerId: mongoose.Types.ObjectId;
  type: AppointmentType;
  notes?: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date; 
  cancelledAt?: Date;
  cancellationReason?: string;
  confirmedAt?: Date;
  completedAt?: Date;
}

const AppointmentSchema: Schema = new Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true, default: 30 }, // 30 minutes par défaut
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  practitionerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'other'],
    required: true,
    default: 'consultation'
  },
  notes: { type: String },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  confirmedAt: { type: Date },
  completedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index pour la recherche par praticien et date
AppointmentSchema.index({ practitionerId: 1, date: 1 });

// Index pour la recherche par client
AppointmentSchema.index({ clientId: 1 });

// Index pour le status
AppointmentSchema.index({ status: 1 });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
