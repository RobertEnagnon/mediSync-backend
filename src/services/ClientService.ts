
import { BaseService } from './BaseService';
import Client, { IClient } from '../models/Client';

export class ClientService extends BaseService<IClient> {
  constructor() {
    super(Client);
  }

  async search(query: string): Promise<IClient[]> {
    const regex = new RegExp(query, 'i');
    return this.model.find({
      $or: [
        { name: regex },
        { email: regex },
        { phone: regex }
      ]
    });
  }

  async updateLastVisit(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, {
      lastVisit: new Date()
    });
  }
}

export default new ClientService();
