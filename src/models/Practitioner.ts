import { Schema, model, Document, Types } from 'mongoose';

export interface IPractitioner extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  speciality: string;
  phoneNumber: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const practitionerSchema = new Schema<IPractitioner>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    speciality: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<IPractitioner>('Practitioner', practitionerSchema);
