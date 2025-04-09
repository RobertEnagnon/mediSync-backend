import { Model, Document } from 'mongoose';
import { BaseService } from './BaseService';
import { ApiError } from '../middleware/errorHandler';

export abstract class PractitionerService<T extends Document> extends BaseService<T> {
  constructor(model: Model<T>) {
    super(model);
  }

  async getAll(): Promise<T[]> {
    throw new ApiError(400, 'practitionerId is required');
  }

  async getById(id: string): Promise<T | null> {
    throw new ApiError(400, 'practitionerId is required');
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    throw new ApiError(400, 'practitionerId is required');
  }

  async delete(id: string): Promise<void> {
    throw new ApiError(400, 'practitionerId is required');
  }

  // Nouvelles méthodes avec practitionerId
  async getAllForPractitioner(practitionerId: string): Promise<T[]> {
    return this.model.find({ practitionerId });
  }

  async getByIdForPractitioner(id: string, practitionerId: string): Promise<T | null> {
    return this.model.findOne({ _id: id, practitionerId });
  }

  async updateForPractitioner(id: string, practitionerId: string, data: Partial<T>): Promise<T | null> {
    const updatedItem = await this.model.findOneAndUpdate(
      { _id: id, practitionerId },
      data,
      { new: true }
    );
    if (!updatedItem) {
      throw new ApiError(404, 'Item not found');
    }
    return updatedItem;
  }

  async deleteForPractitioner(id: string, practitionerId: string): Promise<void> {
    const result = await this.model.findOneAndDelete({ _id: id, practitionerId });
    if (!result) {
      throw new ApiError(404, 'Item not found');
    }
  }
}
