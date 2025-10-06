import { createRevenueAnalyticsService, RevenueAnalyticsService } from "@/lib/analytics/revenue-service";
import type { RevenueAnalyticsRepository, RevenueMetrics, RevenueTimeseriesPoint } from "@/lib/analytics/revenue-service";

describe("RevenueAnalyticsService", () => {
  let mockRepository: jest.Mocked<RevenueAnalyticsRepository>;
  let service: RevenueAnalyticsService;

  const mockMetrics: RevenueMetrics = {
    grossRevenue: 10000,
    netRevenue: 9500,
    refunds: 500,
    arpu: 475,
    aov: 190,
    refundRate: 5,
    totalTransactions: 100,
    successfulTransactions: 95,
    failedTransactions: 5,
  };

  const mockTimeseries: RevenueTimeseriesPoint[] = [
    {
      date: "2024-01-01",
      grossRevenue: 1000,
      netRevenue: 950,
      refunds: 50,
      transactions: 10,
      arpu: 95,
      aov: 95,
    },
  ];

  beforeEach(() => {
    mockRepository = {
      fetchRevenueMetrics: jest.fn(),
      fetchRevenueTimeseries: jest.fn(),
    };

    mockRepository.fetchRevenueMetrics.mockResolvedValue(mockMetrics);
    mockRepository.fetchRevenueTimeseries.mockResolvedValue(mockTimeseries);

    service = createRevenueAnalyticsService(mockRepository);
  });

  describe("getRevenueAnalytics", () => {
    it("should return revenue analytics with metrics and timeseries", async () => {
      const params = {
        instructorId: "instructor-1",
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-01-31T23:59:59.999Z",
      };

      const result = await service.getRevenueAnalytics(params);

      expect(result.metrics).toEqual(mockMetrics);
      expect(result.timeseries).toEqual(mockTimeseries);
      expect(result.meta.generatedAt).toBeDefined();
      expect(result.meta.window.start).toBe("2024-01-01T00:00:00.000Z");
      expect(result.meta.window.end).toBe("2024-01-31T23:59:59.999Z");
    });

    it("should call repository with correct parameters", async () => {
      const params = {
        instructorId: "instructor-1",
        courseIds: ["course-1", "course-2"],
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-01-31T23:59:59.999Z",
      };

      await service.getRevenueAnalytics(params);

      expect(mockRepository.fetchRevenueMetrics).toHaveBeenCalledWith({
        ...params,
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-01-31T23:59:59.999Z",
      });

      expect(mockRepository.fetchRevenueTimeseries).toHaveBeenCalledWith({
        ...params,
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-01-31T23:59:59.999Z",
      });
    });

    it("should handle default date range when not provided", async () => {
      const params = {
        instructorId: "instructor-1",
      };

      await service.getRevenueAnalytics(params);

      const calls = mockRepository.fetchRevenueMetrics.mock.calls[0];
      expect(calls[0].startDate).toBeDefined();
      expect(calls[0].endDate).toBeDefined();
    });
  });
});