
import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  title: string;
  date: string;
  time: string;
  clientId: mongoose.Types.ObjectId;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

const AppointmentSchema: Schema = new Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
