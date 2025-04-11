import mongoose, { Schema, Document, Types } from 'mongoose';
import { IClient } from './Client';
import { IPractitioner } from './Practitioner';

export interface IDocument extends Document {
  clientId: Types.ObjectId | IClient;
  practitionerId: Types.ObjectId | IPractitioner;
  title: string;
  type: string;
  description?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>({
  clientId: { 
    type: Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  practitionerId: {
    type: Types.ObjectId,
    ref: 'Practitioner',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: { 
    type: String, 
    required: true,
    enum: ['ordonnance', 'rapport_medical', 'resultat_examens', 'autre']
  },
  description: { 
    type: String 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  mimeType: { 
    type: String, 
    required: true 
  },
  size: { 
    type: Number, 
    required: true 
  },
  path: { 
    type: String, 
    required: true 
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexation pour améliorer les performances des requêtes
documentSchema.index({ clientId: 1, type: 1 });
documentSchema.index({ practitionerId: 1 });
documentSchema.index({ createdAt: -1 });

// Middleware pour la suppression en cascade
documentSchema.pre('deleteOne', { document: true, query: false }, async function() {
  // La suppression du fichier physique est gérée dans le service
});

export default mongoose.model<IDocument>('Document', documentSchema);
