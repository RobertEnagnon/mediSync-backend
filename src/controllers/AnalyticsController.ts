// backend/src/controllers/AnalyticsController.ts
import { Request, Response } from 'express';
import { AppointmentService } from '../services/AppointmentService';
import { InvoiceService } from '../services/InvoiceService';

class AnalyticsController {
  private appointmentService: AppointmentService;
  private invoiceService: InvoiceService;

  constructor() {
    this.appointmentService = new AppointmentService();
    this.invoiceService = new InvoiceService();
  }

  public getAppointmentStats = async (req: Request, res: Response) => {
    try {
      const { period = 'month' } = req.query;
      const validPeriods = ['day', 'week', 'month', 'year'];
      
      if (!validPeriods.includes(period as string)) {
        return res.status(400).json({ 
          error: 'Invalid period. Must be one of: day, week, month, year' 
        });
      }

      const stats = await this.appointmentService.getStatistics(period as 'day' | 'week' | 'month' | 'year');
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch appointment statistics' });
    }
  };

  public getRevenueSummary = async (req: Request, res: Response) => {
    try {
      const summary = await this.invoiceService.getRevenueSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch revenue summary' });
    }
  };

  public getClientStats = async (req: Request, res: Response) => {
    try {
      const { period = 'month' } = req.query;
      const validPeriods = ['day', 'week', 'month', 'year'];
      
      if (!validPeriods.includes(period as string)) {
        return res.status(400).json({ 
          error: 'Invalid period. Must be one of: day, week, month, year' 
        });
      }

      const stats = await this.appointmentService.getClientStats(period as 'day' | 'week' | 'month' | 'year');
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch client statistics' });
    }
  };
}

export default new AnalyticsController();