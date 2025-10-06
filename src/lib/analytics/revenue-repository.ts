import { prisma } from "@/lib/prisma";
import type {
  RevenueAnalyticsParams,
  RevenueAnalyticsRepository,
  RevenueMetrics,
  RevenueTimeseriesPoint,
} from "./revenue-service";

export class PrismaRevenueAnalyticsRepository implements RevenueAnalyticsRepository {
  constructor(private readonly client = prisma) {}

  async fetchRevenueMetrics(params: RevenueAnalyticsParams): Promise<RevenueMetrics> {
    const { instructorId, startDate, endDate, courseIds } = params;

    // Get all payments for the instructor's courses within the date range
    const payments = await this.client.payment.findMany({
      where: {
        course: {
          instructorId,
          ...(courseIds && courseIds.length > 0 ? { id: { in: courseIds } } : {}),
        },
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      select: {
        amount: true,
        status: true,
        course: {
          select: {
            id: true,
          },
        },
      },
    });

    // Calculate metrics
    const successfulPayments = payments.filter(p => p.status === 'SUCCEEDED');
    const failedPayments = payments.filter(p => p.status === 'FAILED');
    const cancelledPayments = payments.filter(p => p.status === 'CANCELLED');

    const grossRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0) / 100; // Convert cents to dollars
    const refunds = cancelledPayments.reduce((sum, p) => sum + p.amount, 0) / 100; // Assuming cancelled = refunded
    const netRevenue = grossRevenue - refunds;

    // Get unique users who made successful payments
    const uniqueUsers = new Set(successfulPayments.map(p => p.course.id));
    const arpu = uniqueUsers.size > 0 ? netRevenue / uniqueUsers.size : 0;

    // Average Order Value (AOV) - average revenue per transaction
    const aov = successfulPayments.length > 0 ? grossRevenue / successfulPayments.length : 0;

    const refundRate = successfulPayments.length > 0 ? (cancelledPayments.length / successfulPayments.length) * 100 : 0;

    return {
      grossRevenue,
      netRevenue,
      refunds,
      arpu,
      aov,
      refundRate,
      totalTransactions: payments.length,
      successfulTransactions: successfulPayments.length,
      failedTransactions: failedPayments.length,
    };
  }

  async fetchRevenueTimeseries(params: RevenueAnalyticsParams): Promise<RevenueTimeseriesPoint[]> {
    const { instructorId, startDate, endDate, courseIds, groupBy = 'day' } = params;

    // Get payments grouped by date
    const payments = await this.client.payment.findMany({
      where: {
        course: {
          instructorId,
          ...(courseIds && courseIds.length > 0 ? { id: { in: courseIds } } : {}),
        },
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      select: {
        amount: true,
        status: true,
        createdAt: true,
        course: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group payments by date
    const groupedPayments = new Map<string, typeof payments>();

    payments.forEach(payment => {
      const date = this.groupDate(payment.createdAt, groupBy);
      if (!groupedPayments.has(date)) {
        groupedPayments.set(date, []);
      }
      groupedPayments.get(date)!.push(payment);
    });

    // Convert to timeseries points
    const timeseries: RevenueTimeseriesPoint[] = [];

    groupedPayments.forEach((dayPayments, date) => {
      const successfulPayments = dayPayments.filter(p => p.status === 'SUCCEEDED');
      const cancelledPayments = dayPayments.filter(p => p.status === 'CANCELLED');

      const grossRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0) / 100;
      const refunds = cancelledPayments.reduce((sum, p) => sum + p.amount, 0) / 100;
      const netRevenue = grossRevenue - refunds;

      const uniqueUsers = new Set(successfulPayments.map(p => p.course.id));
      const arpu = uniqueUsers.size > 0 ? netRevenue / uniqueUsers.size : 0;
      const aov = successfulPayments.length > 0 ? grossRevenue / successfulPayments.length : 0;

      timeseries.push({
        date,
        grossRevenue,
        netRevenue,
        refunds,
        transactions: dayPayments.length,
        arpu,
        aov,
      });
    });

    return timeseries.sort((a, b) => a.date.localeCompare(b.date));
  }

  private groupDate(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    const d = new Date(date);

    switch (groupBy) {
      case 'day':
        return d.toISOString().split('T')[0]; // YYYY-MM-DD

      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
        return weekStart.toISOString().split('T')[0];

      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; // YYYY-MM-01

      default:
        return d.toISOString().split('T')[0];
    }
  }
}