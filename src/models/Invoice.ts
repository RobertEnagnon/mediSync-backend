import mongoose, { Schema, Document } from 'mongoose';
import { IClient } from './Client';
import { IAppointment } from './Appointment';

export interface IInvoice extends Document {
  invoiceNumber: string;
  clientId: string | IClient;
  appointmentId: string | IAppointment;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: string;
  paidAt?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: { type: String },
  paidAt: { type: Date },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
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

invoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
