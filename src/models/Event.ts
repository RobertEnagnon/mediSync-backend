import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // en minutes
  type: 'appointment' | 'meeting' | 'break' | 'holiday' | 'other';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  color?: string;
  location?: string;
  participants?: string[];
  practitionerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isRecurring?: boolean;
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[];
  };
  reminder?: {
    enabled: boolean;
    timing: number; // minutes before event
  };
  notes?: string;
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['appointment', 'meeting', 'break', 'holiday', 'other']
  },
  status: {
    type: String,
    required: true,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  color: { type: String },
  location: { type: String },
  participants: [{ type: String }],
  practitionerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: {
    frequency: { 
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: { type: Number },
    endDate: { type: Date },
    daysOfWeek: [{ type: Number }]
  },
  reminder: {
    enabled: { type: Boolean, default: false },
    timing: { type: Number, default: 30 }
  },
  notes: { type: String }
}, {
  timestamps: true
});

// Index pour améliorer les performances des requêtes
eventSchema.index({ practitionerId: 1, date: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ type: 1 });

const EventModel = mongoose.model<IEvent>('Event', eventSchema);
export default EventModel;