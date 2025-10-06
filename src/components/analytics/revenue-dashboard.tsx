"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RevenueAnalytics } from "./revenue-analytics";
import { MetabaseEmbed } from "./metabase-embed";
import { BarChart3, TrendingUp, DollarSign, Calendar } from "lucide-react";

interface RevenueDashboardProps {
  className?: string;
}

// These would be configured based on your Metabase setup
const REVENUE_DASHBOARD_CONFIG = {
  revenueOverview: {
    dashboardId: 1, // Replace with actual Metabase dashboard ID
    title: "Revenue Overview",
    description: "Comprehensive view of revenue metrics and trends",
  },
  grossRevenueTrends: {
    questionId: 1, // Replace with actual Metabase question ID
    title: "Gross Revenue Trends",
    description: "Time-series analysis of gross revenue",
  },
  refundAnalysis: {
    questionId: 2, // Replace with actual Metabase question ID
    title: "Refund Analysis",
    description: "Analysis of refunds and refund rates",
  },
  arpuAovMetrics: {
    questionId: 3, // Replace with actual Metabase question ID
    title: "ARPU & AOV Metrics",
    description: "Average Revenue Per User and Average Order Value analysis",
  },
};

export function RevenueDashboard({ className }: RevenueDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold">Revenue Analytics</h1>
          <Badge variant="secondary" className="ml-auto">
            Instructor Dashboard
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Track your course revenue, refunds, and key performance metrics
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Refunds
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            ARPU/AOV
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RevenueAnalytics />

          <MetabaseEmbed
            dashboardId={REVENUE_DASHBOARD_CONFIG.revenueOverview.dashboardId}
            title={REVENUE_DASHBOARD_CONFIG.revenueOverview.title}
            height={500}
          />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Detailed time-series analysis of revenue performance across your courses.
              </p>
            </CardContent>
          </Card>

          <MetabaseEmbed
            questionId={REVENUE_DASHBOARD_CONFIG.grossRevenueTrends.questionId}
            title={REVENUE_DASHBOARD_CONFIG.grossRevenueTrends.title}
            height={400}
          />
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Refund Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Monitor refund patterns, rates, and their impact on net revenue.
              </p>
            </CardContent>
          </Card>

          <MetabaseEmbed
            questionId={REVENUE_DASHBOARD_CONFIG.refundAnalysis.questionId}
            title={REVENUE_DASHBOARD_CONFIG.refundAnalysis.title}
            height={400}
          />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ARPU & AOV Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Track Average Revenue Per User and Average Order Value metrics.
              </p>
            </CardContent>
          </Card>

          <MetabaseEmbed
            questionId={REVENUE_DASHBOARD_CONFIG.arpuAovMetrics.questionId}
            title={REVENUE_DASHBOARD_CONFIG.arpuAovMetrics.title}
            height={400}
          />
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Create and view custom revenue analytics dashboards and reports.
              </p>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>Note:</strong> Custom dashboards can be configured in Metabase
                  and embedded here using the dashboard/question IDs.
                </p>
                <p>
                  Contact your administrator to set up additional revenue analytics views.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}