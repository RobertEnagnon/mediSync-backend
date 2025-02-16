
import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  lastVisit?: Date;
}

const ClientSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastVisit: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model<IClient>('Client', ClientSchema);
