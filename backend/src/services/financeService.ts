import mongoose from 'mongoose';
import Payment from '../models/Payment';
import EmployeePayment from '../models/EmployeePayment';
import Expense from '../models/Expense';
import OilProduct from '../models/OilProduct';
import Filter from '../models/Filter';
import OilChange from '../models/OilChange';
import Service from '../models/Service';

const MONTH_LABELS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

export class FinanceService {
  async getSummary(tenantId: string, startDate: Date, endDate: Date) {
    const tid = new mongoose.Types.ObjectId(tenantId);
    const payDateFilter = { $gte: startDate, $lte: endDate };

    const [revenueAgg, commissionsAgg, expensesAgg, unpaidOC, unpaidSv] = await Promise.all([
      Payment.aggregate([
        { $match: { tenant: tid, paymentDate: payDateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      EmployeePayment.aggregate([
        { $match: { tenant: tid, paymentDate: payDateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { tenant: tid, date: payDateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      OilChange.aggregate([
        { $match: { tenant: tid, paymentStatus: { $ne: 'paid' }, isArchived: false } },
        { $group: { _id: null, total: { $sum: '$amountDue' } } },
      ]),
      Service.aggregate([
        { $match: { tenant: tid, paymentStatus: { $ne: 'paid' }, isArchived: false } },
        { $group: { _id: null, total: { $sum: '$amountDue' } } },
      ]),
    ]);

    const revenue = revenueAgg[0]?.total ?? 0;
    const serviceCount = revenueAgg[0]?.count ?? 0;
    const commissionsPaid = commissionsAgg[0]?.total ?? 0;
    const otherExpenses = expensesAgg[0]?.total ?? 0;
    const netProfit = revenue - commissionsPaid - otherExpenses;
    const unpaidAmount = (unpaidOC[0]?.total ?? 0) + (unpaidSv[0]?.total ?? 0);

    return { revenue, commissionsPaid, otherExpenses, netProfit, serviceCount, unpaidAmount };
  }

  async getMonthlyChart(tenantId: string, months: number = 12) {
    const tid = new mongoose.Types.ObjectId(tenantId);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const [revenueByMonth, expensesByMonth, commissionsByMonth] = await Promise.all([
      Payment.aggregate([
        { $match: { tenant: tid, paymentDate: { $gte: startDate } } },
        {
          $group: {
            _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
            revenue: { $sum: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { tenant: tid, date: { $gte: startDate } } },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            expenses: { $sum: '$amount' },
          },
        },
      ]),
      EmployeePayment.aggregate([
        { $match: { tenant: tid, paymentDate: { $gte: startDate } } },
        {
          $group: {
            _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
            commissions: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const result = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(startDate.getMonth() + i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      const rev = revenueByMonth.find((r) => r._id.year === year && r._id.month === month);
      const exp = expensesByMonth.find((e) => e._id.year === year && e._id.month === month);
      const com = commissionsByMonth.find((c) => c._id.year === year && c._id.month === month);

      result.push({
        label: `${MONTH_LABELS[month - 1]} ${year}`,
        revenue: rev?.revenue ?? 0,
        commissions: com?.commissions ?? 0,
        otherExpenses: exp?.expenses ?? 0,
      });
    }

    return result;
  }

  async getInventoryValue(tenantId: string) {
    const tid = new mongoose.Types.ObjectId(tenantId);

    const [oilProducts, filters] = await Promise.all([
      OilProduct.find({ tenant: tid, active: true }).select('costPrice costCurrency exchangeRateUsed price stock'),
      Filter.find({ tenant: tid, active: true }).select('costPrice costCurrency exchangeRateUsed price stock'),
    ]);

    let costValue = 0;
    let sellValue = 0;

    for (const p of [...oilProducts, ...filters]) {
      const cost =
        p.costCurrency === 'USD'
          ? (p.costPrice ?? 0) * (p.exchangeRateUsed ?? 1)
          : (p.costPrice ?? 0);
      costValue += cost * p.stock;
      sellValue += p.price * p.stock;
    }

    return { costValue: Math.round(costValue), sellValue: Math.round(sellValue) };
  }

  async getExpensesByCategory(tenantId: string, startDate: Date, endDate: Date) {
    const tid = new mongoose.Types.ObjectId(tenantId);
    return Expense.aggregate([
      { $match: { tenant: tid, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
  }
}
