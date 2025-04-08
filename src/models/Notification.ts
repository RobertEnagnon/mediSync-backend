import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId:  Schema.Types.ObjectId | String;
  type: 'APPOINTMENT_REMINDER' | 'APPOINTMENT_CANCELLATION' | 'APPOINTMENT_MODIFICATION' |
        'NEW_DOCUMENT' | 'NEW_INVOICE' | 'INVOICE_PAID' | 'INVOICE_OVERDUE' |
        'BIRTHDAY_REMINDER' | 'INACTIVITY_ALERT' | 'SYSTEM_NOTIFICATION';
  title: string;
  message: string;
  data?: {
    appointmentId?: string; 
    date?: Date;
    oldDate?: Date;
    newDate?: Date;
    type?: string;
    reason?: string;
    documentId?: string;
    fileName?: string;
    invoiceId?: string;
    number?: string;
    amount?: number;
  };
  read: boolean;
  createdAt: Date;
  severity: 'info' | 'warning' | 'success' | 'error';
  expiresAt?: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    required: true,
    enum: [
      'APPOINTMENT_REMINDER',
      'APPOINTMENT_CANCELLATION',
      'APPOINTMENT_MODIFICATION',
      'NEW_DOCUMENT',
      'NEW_INVOICE',
      'INVOICE_PAID',
      'INVOICE_OVERDUE',
      'BIRTHDAY_REMINDER',
      'INACTIVITY_ALERT',
      'SYSTEM_NOTIFICATION'
    ]
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    date: Date,
    oldDate: Date,
    newDate: Date,
    type: String,
    reason: String,
    documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
    fileName: String,
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    number: String,
    amount: Number
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  severity: { 
    type: String, 
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info'
  },
  expiresAt: { 
    type: Date,
    default: function() {
      // Par défaut, les notifications expirent après 30 jours
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  }
});

// Index pour améliorer les performances des requêtes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index pour l'expiration automatique

// Méthode pour vérifier si la notification est expirée
notificationSchema.methods.isExpired = function(): boolean {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Méthode pour étendre la durée de vie d'une notification
notificationSchema.methods.extendExpiration = function(days: number): void {
  const newExpirationDate = new Date();
  newExpirationDate.setDate(newExpirationDate.getDate() + days);
  this.expiresAt = newExpirationDate;
};

export default mongoose.model<INotification>('Notification', notificationSchema);
