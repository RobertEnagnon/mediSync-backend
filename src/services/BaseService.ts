
import { Model, Document } from 'mongoose';
import { ApiError } from '../middleware/errorHandler';

export abstract class BaseService<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async getAll(): Promise<T[]> {
    return this.model.find();
  }

  async getById(id: string): Promise<T> {
    const item = await this.model.findById(id);
    if (!item) {
      throw new ApiError(404, 'Item not found');
    }
    return item;
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const updatedItem = await this.model.findByIdAndUpdate(id, data, { new: true });
    if (!updatedItem) {
      throw new ApiError(404, 'Item not found');
    }
    return updatedItem;
  }

  async delete(id: string): Promise<void> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) {
      throw new ApiError(404, 'Item not found');
    }
  }
}
