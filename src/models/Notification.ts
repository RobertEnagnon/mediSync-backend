import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId:  Schema.Types.ObjectId | String;
  type: 'APPOINTMENT_REMINDER' | 'APPOINTMENT_CANCELLATION' | 'APPOINTMENT_MODIFICATION' |
        'NEW_DOCUMENT' | 'NEW_INVOICE' | 'INVOICE_PAID' | 'INVOICE_OVERDUE' |
        'BIRTHDAY_REMINDER' | 'INACTIVITY_ALERT' | 'SYSTEM_NOTIFICATION' | 'CLIENT_CREATED' |
        'CLIENT_UPDATED' | 'CLIENT_DELETED';
  title: string;
  message: string;
  data?: {
    appointmentId?:  Schema.Types.ObjectId | String; 
    date?: Date;
    oldDate?: Date;
    newDate?: Date;
    type?: string;
    reason?: string;
    documentId?: Schema.Types.ObjectId | String;
    fileName?: string;
    invoiceId?: string;
    number?: string;
    amount?: number;
    clientId?: Schema.Types.ObjectId | String;
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
      'SYSTEM_NOTIFICATION',
      'CLIENT_CREATED',
      'CLIENT_UPDATED',
      'CLIENT_DELETED'
    ]
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { 
    type: Schema.Types.Mixed,
    default: {} 
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
