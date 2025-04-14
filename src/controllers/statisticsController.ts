import { Request, Response } from 'express';
import statisticsService from '../services/StatisticsService';
import { catchAsync } from '../utils/catchAsync';

class StatisticsController {
  getDashboardStatistics = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const stats = await statisticsService.getDashboardStatistics(userId);
    res.json(stats);
  });

  getAppointmentStatistics = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Les dates de début et de fin sont requises'
      });
    }

    const stats = await statisticsService.getAppointmentStatistics(
      userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(stats);
  });

  getClientStatistics = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { period } = req.query;

    if (!period || !['day', 'week', 'month', 'year'].includes(period as string)) {
      return res.status(400).json({
        status: 'error',
        message: 'Une période valide est requise (day, week, month, year)'
      });
    }

    const stats = await statisticsService.getClientStatistics(
      userId,
      period as 'day' | 'week' | 'month' | 'year'
    );

    res.json(stats);
  });
}

export default new StatisticsController();
