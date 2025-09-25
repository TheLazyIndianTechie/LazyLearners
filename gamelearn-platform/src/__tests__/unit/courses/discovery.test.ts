import { NextRequest } from "next/server";
import { GET } from "@/app/api/courses/route";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/courses - Course Discovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (searchParams: Record<string, string> = {}): NextRequest => {
    const url = new URL("http://localhost:3000/api/courses");
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return new NextRequest(url.toString(), {
      method: "GET",
    });
  };

  const mockCourseData = {
    id: "course-1",
    title: "Unity Game Development Fundamentals",
    description: "Learn Unity from scratch",
    thumbnail: "https://example.com/thumbnail.jpg",
    price: 99.99,
    category: "UNITY_DEVELOPMENT",
    engine: "UNITY",
    difficulty: "BEGINNER",
    duration: 40,
    published: true,
    requirements: JSON.stringify(["Basic programming knowledge"]),
    objectives: JSON.stringify(["Build your first game"]),
    tags: JSON.stringify(["unity", "beginner", "3d"]),
    createdAt: new Date(),
    updatedAt: new Date(),
    instructorId: "instructor-1",
    instructor: {
      id: "instructor-1",
      name: "John Instructor",
      email: "john@example.com",
      image: null,
    },
    modules: [
      {
        id: "module-1",
        title: "Introduction",
        lessons: [
          { id: "lesson-1", title: "Getting Started" },
          { id: "lesson-2", title: "Unity Interface" },
        ],
      },
    ],
    reviews: [
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
    ],
    _count: {
      enrollments: 150,
      reviews: 3,
    },
  };

  describe("Basic course listing", () => {
    it("should return all published courses by default", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.courses).toHaveLength(1);
      expect(data.courses[0]).toHaveProperty("id", "course-1");
      expect(data.courses[0]).toHaveProperty("title", "Unity Game Development Fundamentals");
      expect(data.courses[0]).toHaveProperty("rating", 4.67); // (5+4+5)/3 ≈ 4.67
      expect(data.courses[0]).toHaveProperty("reviewCount", 3);
      expect(data.courses[0]).toHaveProperty("enrollmentCount", 150);
    });

    it("should parse JSON fields correctly", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.courses[0].requirements).toEqual(["Basic programming knowledge"]);
      expect(data.courses[0].objectives).toEqual(["Build your first game"]);
      expect(data.courses[0].tags).toEqual(["unity", "beginner", "3d"]);
    });

    it("should handle courses with no reviews", async () => {
      const courseWithNoReviews = {
        ...mockCourseData,
        reviews: [],
        _count: {
          enrollments: 10,
          reviews: 0,
        },
      };

      mockPrisma.course.findMany.mockResolvedValue([courseWithNoReviews]);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.courses[0].rating).toBe(0);
      expect(data.courses[0].reviewCount).toBe(0);
    });
  });

  describe("Filtering", () => {
    it("should filter by instructor", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest({ instructorId: "instructor-1" });
      await GET(request);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: { instructorId: "instructor-1" },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });

    it("should filter by published status", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest({ published: "true" });
      await GET(request);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: { published: true },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });

    it("should filter by category", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest({ category: "unity_development" });
      await GET(request);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: { category: "UNITY_DEVELOPMENT" },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });

    it("should filter by difficulty", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest({ difficulty: "beginner" });
      await GET(request);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: { difficulty: "BEGINNER" },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });

    it("should ignore 'all' category filter", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest({ category: "all" });
      await GET(request);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });

    it("should combine multiple filters", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest({
        category: "unity_development",
        difficulty: "beginner",
        published: "true"
      });
      await GET(request);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: {
          category: "UNITY_DEVELOPMENT",
          difficulty: "BEGINNER",
          published: true
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe("Search functionality", () => {
    it("should search in title and description", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest({ search: "Unity" });
      await GET(request);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: "Unity", mode: "insensitive" } },
            { description: { contains: "Unity", mode: "insensitive" } }
          ]
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });

    it("should perform case-insensitive search", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest({ search: "UNITY" });
      await GET(request);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: "UNITY", mode: "insensitive" } },
            { description: { contains: "UNITY", mode: "insensitive" } }
          ]
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });

    it("should combine search with filters", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest({
        search: "Unity",
        category: "unity_development",
        difficulty: "beginner"
      });
      await GET(request);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: {
          category: "UNITY_DEVELOPMENT",
          difficulty: "BEGINNER",
          OR: [
            { title: { contains: "Unity", mode: "insensitive" } },
            { description: { contains: "Unity", mode: "insensitive" } }
          ]
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe("Data structure validation", () => {
    it("should include instructor information", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.courses[0].instructor).toEqual({
        id: "instructor-1",
        name: "John Instructor",
        email: "john@example.com",
        image: null,
      });
    });

    it("should include module and lesson structure", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.courses[0].modules).toHaveLength(1);
      expect(data.courses[0].modules[0].lessons).toHaveLength(2);
    });

    it("should calculate correct average rating", async () => {
      const courseWithVariedRatings = {
        ...mockCourseData,
        reviews: [
          { rating: 1 },
          { rating: 2 },
          { rating: 3 },
          { rating: 4 },
          { rating: 5 },
        ],
        _count: {
          enrollments: 100,
          reviews: 5,
        },
      };

      mockPrisma.course.findMany.mockResolvedValue([courseWithVariedRatings]);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.courses[0].rating).toBe(3); // (1+2+3+4+5)/5 = 3
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty results", async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.courses).toEqual([]);
    });

    it("should handle null JSON fields", async () => {
      const courseWithNullFields = {
        ...mockCourseData,
        requirements: null,
        objectives: null,
        tags: null,
      };

      mockPrisma.course.findMany.mockResolvedValue([courseWithNullFields]);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.courses[0].requirements).toEqual([]);
      expect(data.courses[0].objectives).toEqual([]);
      expect(data.courses[0].tags).toEqual([]);
    });

    it("should handle database errors", async () => {
      mockPrisma.course.findMany.mockRejectedValue(new Error("Database connection failed"));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch courses");
    });

    it("should handle malformed JSON in database fields", async () => {
      const courseWithMalformedJSON = {
        ...mockCourseData,
        requirements: "invalid json",
      };

      mockPrisma.course.findMany.mockResolvedValue([courseWithMalformedJSON]);

      const request = createMockRequest();
      const response = await GET(request);

      // This would throw an error in real scenario,
      // but for testing we expect graceful handling
      expect(response.status).toBe(500);
    });
  });

  describe("Performance considerations", () => {
    it("should use proper database includes", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest();
      await GET(request);

      const expectedIncludes = {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        modules: {
          include: {
            lessons: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true
          }
        }
      };

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: expectedIncludes,
        orderBy: { createdAt: 'desc' }
      });
    });

    it("should order courses by creation date descending", async () => {
      mockPrisma.course.findMany.mockResolvedValue([mockCourseData]);

      const request = createMockRequest();
      await GET(request);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });
  });
});