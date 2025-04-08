
import { Request, Response, NextFunction } from 'express';
import { BaseService } from '../services/BaseService';
import { Document } from 'mongoose';

export abstract class BaseController<T extends Document> {
  protected service: BaseService<T>;

  constructor(service: BaseService<T>) {
    this.service = service;
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.getAll();
      return res.json(items);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    console.log("appointements getbyId:")
    try {
      const item = await this.service.getById(req.params.id);
     return res.json(item);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.service.create(req.body);
     return res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.service.update(req.params.id, req.body);
      return res.json(item);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
    return  res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
