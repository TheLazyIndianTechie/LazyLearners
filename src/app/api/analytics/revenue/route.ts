import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createRevenueAnalyticsService,
  type RevenueAnalyticsRepository,
  type RevenueAnalyticsParams,
} from "@/lib/analytics/revenue-service";

const querySchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  preset: z.string().optional(),
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  courseIds: z
    .union([
      z.array(z.string().min(1)),
      z.string().min(1),
      z.undefined(),
      z.null(),
    ])
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      return Array.isArray(value) ? value : [value];
    }),
  groupBy: z.enum(["day", "week", "month"]).optional(),
});

class PrismaRevenueAnalyticsRepository implements RevenueAnalyticsRepository {
  constructor(private readonly client = prisma) {}

  async fetchRevenueMetrics(params: RevenueAnalyticsParams) {
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

  async fetchRevenueTimeseries(params: RevenueAnalyticsParams) {
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
    const timeseries = [];

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

const repository = new PrismaRevenueAnalyticsRepository();
const service = createRevenueAnalyticsService(repository);

export async function GET(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const rawCourseIds = url.searchParams.getAll("courseIds[]");

    const parsed = querySchema.safeParse({
      startDate: url.searchParams.get("startDate") ?? undefined,
      endDate: url.searchParams.get("endDate") ?? undefined,
      preset: url.searchParams.get("preset") ?? undefined,
      includeArchived: url.searchParams.get("includeArchived") ?? undefined,
      courseIds: rawCourseIds.length ? rawCourseIds : url.searchParams.get("courseIds") ?? undefined,
      groupBy: url.searchParams.get("groupBy") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid query parameters",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const {
      courseIds,
      includeArchived,
      preset,
      startDate,
      endDate,
      groupBy,
    } = parsed.data;

    const params: RevenueAnalyticsParams = {
      instructorId: userId,
      courseIds,
      includeArchived,
      preset,
      startDate,
      endDate,
      groupBy,
    };

    const analytics = await service.getRevenueAnalytics(params);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[analytics.revenue] Failed to compute revenue analytics", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid request payload",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Unable to compute revenue analytics",
      },
      { status: 500 },
    );
  }
}