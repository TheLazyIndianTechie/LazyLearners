"use client";

import { useMemo } from "react";
import { useAnalytics } from "@/contexts/analytics-context";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { RevenueExportButton } from "@/components/analytics/export-button";

interface RevenueAnalyticsProps {
  className?: string;
}

interface RevenueMetrics {
  grossRevenue: number;
  netRevenue: number;
  refunds: number;
  arpu: number;
  aov: number;
  refundRate: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
}

export interface RevenueAnalyticsResponse {
  metrics: RevenueMetrics;
  timeseries: Array<{
    date: string;
    grossRevenue: number;
    netRevenue: number;
    refunds: number;
    transactions: number;
    arpu: number;
    aov: number;
  }>;
  meta: {
    generatedAt: string;
    window: {
      start: string;
      end: string;
      preset?: string;
    };
    sampleSize: number;
  };
}

export function RevenueAnalytics({ className }: RevenueAnalyticsProps) {
  const { selectedCourseIds, dateRange } = useAnalytics();

  const query = useMemo(() => ({
    courseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined,
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
  }), [selectedCourseIds, dateRange]);

  const { data, isLoading, error } = useAnalyticsData<RevenueAnalyticsResponse>(
    "/api/analytics/revenue",
    query
  );

  const metrics = data?.data.metrics;
  const timeseries = data?.data.timeseries;

  // Calculate trends (comparing to previous period if available)
  const revenueTrend = useMemo(() => {
    if (!timeseries || timeseries.length < 2) return null;

    const current = timeseries[timeseries.length - 1];
    const previous = timeseries[timeseries.length - 2];

    if (!previous.netRevenue) return null;

    const change = ((current.netRevenue - previous.netRevenue) / previous.netRevenue) * 100;
    return {
      value: change,
      isPositive: change >= 0,
    };
  }, [timeseries]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-sm text-muted-foreground">
            Failed to load revenue analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-8 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Revenue Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track revenue metrics, transactions, and financial performance
          </p>
        </div>
        <RevenueExportButton />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.netRevenue)}
            </div>
            {revenueTrend && (
              <div className="flex items-center text-xs text-muted-foreground">
                {revenueTrend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={revenueTrend.isPositive ? "text-green-500" : "text-red-500"}>
                  {Math.abs(revenueTrend.value).toFixed(1)}%
                </span>
                <span className="ml-1">from last period</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.arpu)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average Revenue Per User
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AOV</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.aov)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average Order Value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refund Rate</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.refundRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.refunds)} total refunds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.successfulTransactions}
              </div>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.failedTransactions}
              </div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalTransactions}
              </div>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gross Revenue</span>
              <Badge variant="secondary">
                {formatCurrency(metrics.grossRevenue)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Refunds</span>
              <Badge variant="destructive">
                -{formatCurrency(metrics.refunds)}
              </Badge>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Net Revenue</span>
                <Badge variant="default">
                  {formatCurrency(metrics.netRevenue)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}