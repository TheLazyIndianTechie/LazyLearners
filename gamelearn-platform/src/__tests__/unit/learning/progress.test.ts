import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { GET, POST } from "@/app/api/progress/route";
import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";

// Mock dependencies
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    enrollment: {
      findFirst: jest.fn(),
    },
    progress: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockAuth = auth as jest.Mock;
const mockGetUser = clerkClient.users.getUser as jest.Mock;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/progress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockReturnValue({ userId: "user-1" });
    mockGetUser.mockResolvedValue({
      id: "user-1",
      emailAddresses: [
        {
          id: "user-1-email",
          emailAddress: "john@example.com",
        },
      ],
      primaryEmailAddressId: "user-1-email",
      publicMetadata: { role: "STUDENT" },
      privateMetadata: {},
      unsafeMetadata: {},
    });
  });

  const setAuthUser = (options: { id: string | null; email?: string; role?: string }) => {
    const { id, email = "john@example.com", role = "STUDENT" } = options;
    mockAuth.mockReturnValue({ userId: id });

    if (id) {
      mockGetUser.mockResolvedValue({
        id,
        emailAddresses: [
          {
            id: `${id}-email`,
            emailAddress: email,
          },
        ],
        primaryEmailAddressId: `${id}-email`,
        publicMetadata: { role },
        privateMetadata: {},
        unsafeMetadata: {},
      });
    } else {
      mockGetUser.mockResolvedValue(null);
    }
  };

  describe("POST /api/progress - Update progress", () => {
    const createProgressRequest = (body: any): NextRequest => {
      return new NextRequest("http://localhost:3000/api/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
    };

    describe("Successful progress updates", () => {
      it("should create new progress record", async () => {
        const progressData = {
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
          completionPercentage: 50,
          completed: false,
          timeSpent: 300,
        };

        const mockEnrollment = {
          id: "enrollment-1",
          userId: "user-1",
          courseId: "cuid_course_1",
        };

        const mockProgressResult = {
          id: "progress-1",
          userId: "user-1",
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
          completionPercentage: 50,
          completed: false,
          timeSpent: 300,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.enrollment.findFirst.mockResolvedValue(mockEnrollment);
        mockPrisma.progress.upsert.mockResolvedValue(mockProgressResult);

        const request = createProgressRequest(progressData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockProgressResult);
        expect(mockPrisma.progress.upsert).toHaveBeenCalledWith({
          where: {
            userId_courseId_lessonId: {
              userId: "user-1",
              courseId: "cuid_course_1",
              lessonId: "cuid_lesson_1",
            },
          },
          update: {
            completionPercentage: 50,
            completed: false,
            timeSpent: 300,
            updatedAt: expect.any(Date),
          },
          create: {
            userId: "user-1",
            courseId: "cuid_course_1",
            lessonId: "cuid_lesson_1",
            completionPercentage: 50,
            completed: false,
            timeSpent: 300,
          },
        });
      });

      it("should auto-complete lesson when completion >= 90%", async () => {
        const progressData = {
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
          completionPercentage: 95,
        };

        mockPrisma.enrollment.findFirst.mockResolvedValue({ id: "enrollment-1" });
        mockPrisma.progress.upsert.mockResolvedValue({
          id: "progress-1",
          completed: true,
          completionPercentage: 95,
        });

        const request = createProgressRequest(progressData);
        await POST(request);

        expect(mockPrisma.progress.upsert).toHaveBeenCalledWith({
          where: expect.any(Object),
          update: expect.objectContaining({
            completed: true,
            completionPercentage: 95,
          }),
          create: expect.objectContaining({
            completed: true,
            completionPercentage: 95,
          }),
        });
      });

      it("should handle progress update without timeSpent", async () => {
        const progressData = {
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
          completionPercentage: 25,
        };

        mockPrisma.enrollment.findFirst.mockResolvedValue({ id: "enrollment-1" });
        mockPrisma.progress.upsert.mockResolvedValue({ id: "progress-1" });

        const request = createProgressRequest(progressData);
        await POST(request);

        expect(mockPrisma.progress.upsert).toHaveBeenCalledWith({
          where: expect.any(Object),
          update: expect.objectContaining({
            timeSpent: 0,
          }),
          create: expect.objectContaining({
            timeSpent: 0,
          }),
        });
      });

      it("should override auto-completion when explicitly set to false", async () => {
        const progressData = {
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
          completionPercentage: 95,
          completed: false,
        };

        mockPrisma.enrollment.findFirst.mockResolvedValue({ id: "enrollment-1" });
        mockPrisma.progress.upsert.mockResolvedValue({ id: "progress-1" });

        const request = createProgressRequest(progressData);
        await POST(request);

        expect(mockPrisma.progress.upsert).toHaveBeenCalledWith({
          where: expect.any(Object),
          update: expect.objectContaining({
            completed: false,
          }),
          create: expect.objectContaining({
            completed: false,
          }),
        });
      });
    });

    describe("Authentication and authorization", () => {
      it("should return 401 for unauthenticated requests", async () => {
        setAuthUser({ id: null });

        const request = createProgressRequest({
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
          completionPercentage: 50,
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Authentication required");
        expect(mockPrisma.enrollment.findFirst).not.toHaveBeenCalled();
      });

      it("should return 403 when user is not enrolled", async () => {
        mockPrisma.enrollment.findFirst.mockResolvedValue(null);

        const request = createProgressRequest({
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
          completionPercentage: 50,
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe("You must be enrolled in this course to track progress");
        expect(mockPrisma.progress.upsert).not.toHaveBeenCalled();
      });
    });

    describe("Input validation", () => {
      const validationTestCases = [
        {
          name: "should reject invalid courseId format",
          data: {
            courseId: "invalid-id",
            lessonId: "cuid_lesson_1",
            completionPercentage: 50,
          },
          expectedError: "Validation failed",
        },
        {
          name: "should reject invalid lessonId format",
          data: {
            courseId: "cuid_course_1",
            lessonId: "invalid-id",
            completionPercentage: 50,
          },
          expectedError: "Validation failed",
        },
        {
          name: "should reject completion percentage < 0",
          data: {
            courseId: "cuid_course_1",
            lessonId: "cuid_lesson_1",
            completionPercentage: -10,
          },
          expectedError: "Validation failed",
        },
        {
          name: "should reject completion percentage > 100",
          data: {
            courseId: "cuid_course_1",
            lessonId: "cuid_lesson_1",
            completionPercentage: 150,
          },
          expectedError: "Validation failed",
        },
        {
          name: "should reject negative timeSpent",
          data: {
            courseId: "cuid_course_1",
            lessonId: "cuid_lesson_1",
            completionPercentage: 50,
            timeSpent: -100,
          },
          expectedError: "Validation failed",
        },
      ];

      validationTestCases.forEach(({ name, data, expectedError }) => {
        it(name, async () => {
          const request = createProgressRequest(data);
          const response = await POST(request);
          const responseData = await response.json();

          expect(response.status).toBe(400);
          expect(responseData.error).toBe(expectedError);
          expect(responseData).toHaveProperty("details");
        });
      });

      it("should accept valid completion percentage boundaries", async () => {
        const testCases = [0, 100];

        for (const percentage of testCases) {
          mockPrisma.enrollment.findFirst.mockResolvedValue({ id: "enrollment-1" });
          mockPrisma.progress.upsert.mockResolvedValue({ id: "progress-1" });

          const request = createProgressRequest({
            courseId: "cuid_course_1",
            lessonId: "cuid_lesson_1",
            completionPercentage: percentage,
          });
          const response = await POST(request);

          expect(response.status).toBe(200);
        }
      });
    });

    describe("Error handling", () => {
      it("should handle database errors gracefully", async () => {
        mockPrisma.enrollment.findFirst.mockRejectedValue(new Error("Database connection failed"));

        const request = createProgressRequest({
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
          completionPercentage: 50,
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to update progress");
      });

      it("should handle malformed JSON", async () => {
        const request = new NextRequest("http://localhost:3000/api/progress", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: "invalid json",
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to update progress");
      });
    });
  });

  describe("GET /api/progress - Fetch progress", () => {
    const createProgressGetRequest = (searchParams: Record<string, string> = {}): NextRequest => {
      const url = new URL("http://localhost:3000/api/progress");
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      return new NextRequest(url.toString());
    };

    describe("Get specific lesson progress", () => {
      it("should return progress for specific lesson", async () => {
        const mockProgress = {
          id: "progress-1",
          userId: "user-1",
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
          completionPercentage: 75,
          completed: false,
          timeSpent: 450,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.progress.findUnique.mockResolvedValue(mockProgress);

        const request = createProgressGetRequest({
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
        });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockProgress);
        expect(mockPrisma.progress.findUnique).toHaveBeenCalledWith({
          where: {
            userId_courseId_lessonId: {
              userId: "user-1",
              courseId: "cuid_course_1",
              lessonId: "cuid_lesson_1",
            },
          },
        });
      });

      it("should return null when no progress exists for lesson", async () => {
        mockPrisma.progress.findUnique.mockResolvedValue(null);

        const request = createProgressGetRequest({
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
        });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBe(null);
      });
    });

    describe("Get course progress", () => {
      it("should return all progress for a course", async () => {
        const mockProgressList = [
          {
            id: "progress-1",
            userId: "user-1",
            courseId: "cuid_course_1",
            lessonId: "cuid_lesson_1",
            completionPercentage: 100,
            completed: true,
            lesson: {
              id: "cuid_lesson_1",
              title: "Introduction",
              order: 1,
            },
          },
          {
            id: "progress-2",
            userId: "user-1",
            courseId: "cuid_course_1",
            lessonId: "cuid_lesson_2",
            completionPercentage: 50,
            completed: false,
            lesson: {
              id: "cuid_lesson_2",
              title: "Getting Started",
              order: 2,
            },
          },
        ];

        mockPrisma.progress.findMany.mockResolvedValue(mockProgressList);

        const request = createProgressGetRequest({ courseId: "cuid_course_1" });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(2);
        expect(data.data[0].lesson.title).toBe("Introduction");
        expect(data.data[1].lesson.title).toBe("Getting Started");
        expect(mockPrisma.progress.findMany).toHaveBeenCalledWith({
          where: {
            userId: "user-1",
            courseId: "cuid_course_1",
          },
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
          orderBy: [{ lesson: { order: "asc" } }],
        });
      });

      it("should return empty array when no progress exists for course", async () => {
        mockPrisma.progress.findMany.mockResolvedValue([]);

        const request = createProgressGetRequest({ courseId: "cuid_course_1" });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual([]);
      });
    });

    describe("Authentication and validation", () => {
      it("should return 401 for unauthenticated requests", async () => {
        setAuthUser({ id: null });

        const request = createProgressGetRequest({ courseId: "cuid_course_1" });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Authentication required");
        expect(mockPrisma.progress.findMany).not.toHaveBeenCalled();
      });

      it("should return 400 when courseId is missing", async () => {

        const request = createProgressGetRequest({});
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Missing courseId parameter");
        expect(mockPrisma.progress.findMany).not.toHaveBeenCalled();
      });

      it("should handle lessonId without courseId", async () => {

        const request = createProgressGetRequest({ lessonId: "cuid_lesson_1" });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Missing courseId parameter");
      });
    });

    describe("Error handling", () => {
      it("should handle database errors gracefully", async () => {
        mockPrisma.progress.findMany.mockRejectedValue(new Error("Database connection failed"));

        const request = createProgressGetRequest({ courseId: "cuid_course_1" });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to fetch progress");
      });

      it("should handle findUnique database errors", async () => {
        mockPrisma.progress.findUnique.mockRejectedValue(new Error("Database error"));

        const request = createProgressGetRequest({
          courseId: "cuid_course_1",
          lessonId: "cuid_lesson_1",
        });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to fetch progress");
      });
    });
  });
});