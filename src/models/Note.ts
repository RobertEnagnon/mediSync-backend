import mongoose, { Schema, Document } from 'mongoose';

export interface Note extends Document {
  clientId: string; // Référence à l'ID du client
  content: string; // Contenu de la note
  date: Date; // Date de création de la note
}

const noteSchema = new Schema<Note>({
  clientId: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const NoteModel = mongoose.model<Note>('Note', noteSchema);
export default NoteModel;