import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import { FinanceService } from '../services/financeService';
import Expense from '../models/Expense';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const financeService = new FinanceService();

function parseDateRange(query: any): { start: Date; end: Date } {
  const start = query.startDate
    ? new Date(query.startDate as string)
    : (() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; })();
  const end = query.endDate ? new Date(query.endDate as string) : new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export class FinanceController {
  async getSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { start, end } = parseDateRange(req.query);
      const data = await financeService.getSummary(tenantId, start, end);
      res.json(ApiResponse.success('Finance summary', data));
    } catch (err) {
      next(err);
    }
  }

  async getChart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const months = Math.min(parseInt(req.query.months as string) || 12, 24);
      const data = await financeService.getMonthlyChart(tenantId, months);
      res.json(ApiResponse.success('Monthly chart data', data));
    } catch (err) {
      next(err);
    }
  }

  async getInventoryValue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const data = await financeService.getInventoryValue(tenantId);
      res.json(ApiResponse.success('Inventory value', data));
    } catch (err) {
      next(err);
    }
  }

  async getExpenses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { start, end } = parseDateRange(req.query);
      const { category } = req.query;

      const filter: any = {
        tenant: new mongoose.Types.ObjectId(tenantId),
        date: { $gte: start, $lte: end },
      };
      if (category && category !== 'all') filter.category = category;

      const expenses = await Expense.find(filter)
        .sort({ date: -1 })
        .limit(500)
        .populate('createdBy', 'name');
      res.json(ApiResponse.success('Expenses retrieved', expenses));
    } catch (err) {
      next(err);
    }
  }

  async createExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { date, category, amount, description } = req.body;

      if (!category || !amount || !description) {
        throw new ApiError(400, 'Kategoriya, miqdor va tavsif to\'ldirilishi shart');
      }
      if (Number(amount) <= 0) {
        throw new ApiError(400, 'Miqdor 0 dan katta bo\'lishi kerak');
      }

      const expense = await Expense.create({
        tenant: tenantId,
        date: date ? new Date(date) : new Date(),
        category,
        amount: Number(amount),
        description: String(description).trim(),
        createdBy: userId,
      });

      res.status(201).json(ApiResponse.success('Xarajat qo\'shildi', expense));
    } catch (err) {
      next(err);
    }
  }

  async updateExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const { date, category, amount, description } = req.body;

      const update: any = {};
      if (date) update.date = new Date(date);
      if (category) update.category = category;
      if (amount !== undefined) update.amount = Number(amount);
      if (description) update.description = String(description).trim();

      const expense = await Expense.findOneAndUpdate(
        { _id: id, tenant: tenantId },
        update,
        { new: true, runValidators: true }
      );

      if (!expense) throw new ApiError(404, 'Xarajat topilmadi');
      res.json(ApiResponse.success('Xarajat yangilandi', expense));
    } catch (err) {
      next(err);
    }
  }

  async deleteExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const expense = await Expense.findOneAndDelete({ _id: id, tenant: tenantId });
      if (!expense) throw new ApiError(404, 'Xarajat topilmadi');
      res.json(ApiResponse.success('Xarajat o\'chirildi'));
    } catch (err) {
      next(err);
    }
  }
}
