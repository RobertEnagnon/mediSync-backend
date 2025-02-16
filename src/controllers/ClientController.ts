
import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { IClient } from '../models/Client';
import ClientService from '../services/ClientService';

export class ClientController extends BaseController<IClient> {
  constructor() {
    super(ClientService);
  }

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string;
      const clients = await ClientService.search(query);
      res.json(clients);
    } catch (error) {
      next(error);
    }
  };
}

export default new ClientController();
