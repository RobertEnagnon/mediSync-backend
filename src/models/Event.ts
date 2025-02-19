import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string; // Titre de l'événement
  time: string; // Heure de l'événement
  duration: string; // Durée de l'événement
  type: string; // Type de l'événement (ex: Rendez-vous, Suivi)
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: String, required: true },
  type: { type: String, required: true },
});

const EventModel = mongoose.model<IEvent>('Event', eventSchema);
export default EventModel;