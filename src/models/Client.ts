import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: Date | null;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastVisit?: Date | null;
  isArchived?: boolean;
  archivedAt?: Date | null;
  practitionerId: mongoose.Types.ObjectId;
}

const ClientSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  birthDate: { type: Date, default: null },
  address: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: null },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  practitionerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.name = `${ret.firstName} ${ret.lastName}`;
      return ret;
    }
  }
});

// Index pour la recherche
ClientSchema.index({ firstName: 'text', lastName: 'text', email: 'text', phone: 'text' });

// Index pour les anniversaires
ClientSchema.index({ birthDate: 1 });

// Index pour les clients archivés
ClientSchema.index({ isArchived: 1, archivedAt: 1 });

// Index pour la recherche par praticien
ClientSchema.index({ practitionerId: 1 });

export default mongoose.model<IClient>('Client', ClientSchema);
