import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/enrollment/route";
import { getServerSession } from "next-auth";
import { enrollUserInCourse, getUserEnrollments } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/payment", () => ({
  enrollUserInCourse: jest.fn(),
  getUserEnrollments: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findUnique: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockEnrollUserInCourse = enrollUserInCourse as jest.MockedFunction<typeof enrollUserInCourse>;
const mockGetUserEnrollments = getUserEnrollments as jest.MockedFunction<typeof getUserEnrollments>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/enrollment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSession = {
    user: {
      id: "user-1",
      name: "John Doe",
      email: "john@example.com",
      role: "STUDENT",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  describe("GET /api/enrollment - Get user enrollments", () => {
    it("should return user enrollments for authenticated user", async () => {
      const mockEnrollments = [
        {
          id: "enrollment-1",
          userId: "user-1",
          courseId: "course-1",
          enrolledAt: new Date(),
          progress: 25,
          completed: false,
          course: {
            id: "course-1",
            title: "Unity Fundamentals",
            thumbnail: "https://example.com/thumb.jpg",
          },
        },
        {
          id: "enrollment-2",
          userId: "user-1",
          courseId: "course-2",
          enrolledAt: new Date(),
          progress: 100,
          completed: true,
          course: {
            id: "course-2",
            title: "Advanced Unity",
            thumbnail: "https://example.com/thumb2.jpg",
          },
        },
      ];

      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetUserEnrollments.mockResolvedValue(mockEnrollments);

      const request = new NextRequest("http://localhost:3000/api/enrollment");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enrollments).toHaveLength(2);
      expect(data.enrollments[0]).toHaveProperty("id", "enrollment-1");
      expect(data.enrollments[0]).toHaveProperty("progress", 25);
      expect(data.enrollments[1]).toHaveProperty("completed", true);
      expect(mockGetUserEnrollments).toHaveBeenCalledWith("user-1");
    });

    it("should return 401 for unauthenticated requests", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/enrollment");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockGetUserEnrollments).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetUserEnrollments.mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest("http://localhost:3000/api/enrollment");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should return empty array when user has no enrollments", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockGetUserEnrollments.mockResolvedValue([]);

      const request = new NextRequest("http://localhost:3000/api/enrollment");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enrollments).toEqual([]);
    });
  });

  describe("POST /api/enrollment - Enroll in course", () => {
    const createEnrollmentRequest = (body: any): NextRequest => {
      return new NextRequest("http://localhost:3000/api/enrollment", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
    };

    describe("Free course enrollment", () => {
      it("should enroll user in free course", async () => {
        const mockEnrollment = {
          id: "enrollment-1",
          userId: "user-1",
          courseId: "course-1",
          enrolledAt: new Date(),
          progress: 0,
          completed: false,
        };

        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          id: "course-1",
          price: 0,
          title: "Free Unity Course",
          description: "Learn Unity for free",
          thumbnail: null,
          category: "UNITY_DEVELOPMENT",
          engine: "UNITY",
          difficulty: "BEGINNER",
          duration: 20,
          published: true,
          instructorId: "instructor-1",
          requirements: null,
          objectives: null,
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        mockEnrollUserInCourse.mockResolvedValue(mockEnrollment);

        const request = createEnrollmentRequest({ courseId: "course-1" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.enrollment).toEqual(mockEnrollment);
        expect(mockEnrollUserInCourse).toHaveBeenCalledWith("user-1", "course-1");
      });

      it("should handle enrollment when course price is 0", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          id: "course-1",
          price: 0.00,
          title: "Free Course",
          description: "Free course",
          thumbnail: null,
          category: "UNITY_DEVELOPMENT",
          engine: "UNITY",
          difficulty: "BEGINNER",
          duration: 10,
          published: true,
          instructorId: "instructor-1",
          requirements: null,
          objectives: null,
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        mockEnrollUserInCourse.mockResolvedValue({
          id: "enrollment-1",
          userId: "user-1",
          courseId: "course-1",
          enrolledAt: new Date(),
          progress: 0,
          completed: false,
        });

        const request = createEnrollmentRequest({ courseId: "course-1" });
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockEnrollUserInCourse).toHaveBeenCalled();
      });
    });

    describe("Paid course enrollment", () => {
      it("should reject enrollment in paid course without payment", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          id: "course-1",
          price: 99.99,
          title: "Paid Unity Course",
          description: "Premium Unity course",
          thumbnail: null,
          category: "UNITY_DEVELOPMENT",
          engine: "UNITY",
          difficulty: "ADVANCED",
          duration: 50,
          published: true,
          instructorId: "instructor-1",
          requirements: null,
          objectives: null,
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const request = createEnrollmentRequest({ courseId: "course-1" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Payment required for this course");
        expect(mockEnrollUserInCourse).not.toHaveBeenCalled();
      });

      it("should handle courses with high prices", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          id: "course-1",
          price: 999.99,
          title: "Premium Course",
          description: "Expensive course",
          thumbnail: null,
          category: "UNITY_DEVELOPMENT",
          engine: "UNITY",
          difficulty: "ADVANCED",
          duration: 100,
          published: true,
          instructorId: "instructor-1",
          requirements: null,
          objectives: null,
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const request = createEnrollmentRequest({ courseId: "course-1" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Payment required for this course");
      });
    });

    describe("Authentication and authorization", () => {
      it("should return 401 for unauthenticated requests", async () => {
        mockGetServerSession.mockResolvedValue(null);

        const request = createEnrollmentRequest({ courseId: "course-1" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
        expect(mockPrisma.course.findUnique).not.toHaveBeenCalled();
      });

      it("should handle session without user ID", async () => {
        mockGetServerSession.mockResolvedValue({
          user: {
            name: "John Doe",
            email: "john@example.com",
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

        const request = createEnrollmentRequest({ courseId: "course-1" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
      });
    });

    describe("Input validation", () => {
      it("should return 400 for missing courseId", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);

        const request = createEnrollmentRequest({});
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Course ID is required");
        expect(mockPrisma.course.findUnique).not.toHaveBeenCalled();
      });

      it("should return 400 for null courseId", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);

        const request = createEnrollmentRequest({ courseId: null });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Course ID is required");
      });

      it("should return 400 for empty string courseId", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);

        const request = createEnrollmentRequest({ courseId: "" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Course ID is required");
      });
    });

    describe("Course validation", () => {
      it("should return 404 for non-existent course", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.course.findUnique.mockResolvedValue(null);

        const request = createEnrollmentRequest({ courseId: "non-existent" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Course not found");
        expect(mockEnrollUserInCourse).not.toHaveBeenCalled();
      });

      it("should query course with correct parameters", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          id: "course-1",
          price: 0,
          title: "Test Course",
          description: "Test",
          thumbnail: null,
          category: "UNITY_DEVELOPMENT",
          engine: "UNITY",
          difficulty: "BEGINNER",
          duration: 10,
          published: true,
          instructorId: "instructor-1",
          requirements: null,
          objectives: null,
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        mockEnrollUserInCourse.mockResolvedValue({
          id: "enrollment-1",
          userId: "user-1",
          courseId: "course-1",
          enrolledAt: new Date(),
          progress: 0,
          completed: false,
        });

        const request = createEnrollmentRequest({ courseId: "course-1" });
        await POST(request);

        expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
          where: { id: "course-1" },
          select: { price: true }
        });
      });
    });

    describe("Enrollment process", () => {
      it("should handle enrollment failure", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          id: "course-1",
          price: 0,
          title: "Free Course",
          description: "Test",
          thumbnail: null,
          category: "UNITY_DEVELOPMENT",
          engine: "UNITY",
          difficulty: "BEGINNER",
          duration: 10,
          published: true,
          instructorId: "instructor-1",
          requirements: null,
          objectives: null,
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        mockEnrollUserInCourse.mockResolvedValue(null);

        const request = createEnrollmentRequest({ courseId: "course-1" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to enroll in course");
      });

      it("should handle enrollment service errors", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          id: "course-1",
          price: 0,
          title: "Free Course",
          description: "Test",
          thumbnail: null,
          category: "UNITY_DEVELOPMENT",
          engine: "UNITY",
          difficulty: "BEGINNER",
          duration: 10,
          published: true,
          instructorId: "instructor-1",
          requirements: null,
          objectives: null,
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        mockEnrollUserInCourse.mockRejectedValue(new Error("Database error"));

        const request = createEnrollmentRequest({ courseId: "course-1" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
      });
    });

    describe("Edge cases", () => {
      it("should handle malformed JSON request", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);

        const request = new NextRequest("http://localhost:3000/api/enrollment", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: "invalid json",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
      });

      it("should handle database connection errors", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.course.findUnique.mockRejectedValue(new Error("Database connection failed"));

        const request = createEnrollmentRequest({ courseId: "course-1" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
      });

      it("should handle courses with decimal prices", async () => {
        mockGetServerSession.mockResolvedValue(mockSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          id: "course-1",
          price: 29.99,
          title: "Paid Course",
          description: "Test",
          thumbnail: null,
          category: "UNITY_DEVELOPMENT",
          engine: "UNITY",
          difficulty: "BEGINNER",
          duration: 10,
          published: true,
          instructorId: "instructor-1",
          requirements: null,
          objectives: null,
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const request = createEnrollmentRequest({ courseId: "course-1" });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Payment required for this course");
      });
    });
  });
});