import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { GET } from "@/app/api/courses/[id]/modules/[moduleId]/lessons/[lessonId]/route";
import { prisma } from "@/lib/prisma";

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
    course: {
      findFirst: jest.fn(),
    },
    lesson: {
      findFirst: jest.fn(),
    },
  },
}));

const mockAuth = auth as jest.Mock;
const mockGetUser = clerkClient.users.getUser as jest.Mock;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/courses/[id]/modules/[moduleId]/lessons/[lessonId] - GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthUser({ id: "instructor-1", email: "jane@example.com", role: "INSTRUCTOR" });
  });

const setAuthUser = (options: { id: string | null; email?: string; role?: string }) => {
  const { id, email = "user@example.com", role = "INSTRUCTOR" } = options;
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

  const mockCourse = {
    id: "course-1",
    title: "Unity Fundamentals",
    instructorId: "instructor-1",
  };

  const mockLesson = {
    id: "lesson-1",
    title: "Introduction to Unity",
    type: "VIDEO",
    content: "This lesson covers Unity basics",
    duration: 600,
    videoUrl: "https://example.com/video.mp4",
    order: 1,
    moduleId: "module-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockParams = {
    id: "course-1",
    moduleId: "module-1",
    lessonId: "lesson-1",
  };

  describe("Successful lesson access", () => {
    it("should return lesson for course instructor", async () => {
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(mockLesson);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lesson).toEqual(mockLesson);
      expect(data.lesson.title).toBe("Introduction to Unity");
      expect(data.lesson.type).toBe("VIDEO");
      expect(data.lesson.duration).toBe(600);
    });

    it("should verify instructor ownership", async () => {
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(mockLesson);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      await GET(request, { params: mockParams });

      expect(mockPrisma.course.findFirst).toHaveBeenCalledWith({
        where: {
          id: "course-1",
          instructorId: "instructor-1",
        },
      });
    });

    it("should verify lesson belongs to correct module and course", async () => {
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(mockLesson);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      await GET(request, { params: mockParams });

      expect(mockPrisma.lesson.findFirst).toHaveBeenCalledWith({
        where: {
          id: "lesson-1",
          moduleId: "module-1",
          module: {
            courseId: "course-1",
          },
        },
      });
    });

    it("should handle lessons with different types", async () => {
      const textLesson = {
        ...mockLesson,
        type: "TEXT",
        videoUrl: null,
        content: "This is a text lesson with detailed explanations.",
      };

      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(textLesson);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lesson.type).toBe("TEXT");
      expect(data.lesson.videoUrl).toBe(null);
      expect(data.lesson.content).toContain("text lesson");
    });

    it("should handle quiz lessons", async () => {
      const quizLesson = {
        ...mockLesson,
        type: "QUIZ",
        videoUrl: null,
        content: JSON.stringify({
          questions: [
            {
              question: "What is Unity?",
              options: ["Game Engine", "Text Editor", "Database", "Browser"],
              correct: 0,
            },
          ],
        }),
      };

      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(quizLesson);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lesson.type).toBe("QUIZ");
      expect(JSON.parse(data.lesson.content)).toHaveProperty("questions");
    });
  });

  describe("Authentication and authorization", () => {
    it("should return 401 for unauthenticated requests", async () => {
      setAuthUser({ id: null });

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockPrisma.course.findFirst).not.toHaveBeenCalled();
    });

    it("should return 404 when instructor doesn't own the course", async () => {
      setAuthUser({ id: "different-instructor", email: "jane@example.com", role: "INSTRUCTOR" });
      mockPrisma.course.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Course not found");
      expect(mockPrisma.lesson.findFirst).not.toHaveBeenCalled();
    });

    it("should check course ownership for admin users", async () => {
      setAuthUser({ id: "admin-1", email: "admin@example.com", role: "ADMIN" });
      mockPrisma.course.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Course not found");
      expect(mockPrisma.course.findFirst).toHaveBeenCalledWith({
        where: {
          id: "course-1",
          instructorId: "admin-1",
        },
      });
    });

    it("should restrict access for students", async () => {
      setAuthUser({ id: "student-1", email: "john@example.com", role: "STUDENT" });
      mockPrisma.course.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Course not found");
    });
  });

  describe("Resource validation", () => {
    it("should return 404 when lesson doesn't exist", async () => {
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Lesson not found");
    });

    it("should return 404 when lesson belongs to wrong module", async () => {
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(null);

      const wrongModuleParams = {
        id: "course-1",
        moduleId: "wrong-module",
        lessonId: "lesson-1",
      };

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/wrong-module/lessons/lesson-1");
      const response = await GET(request, { params: wrongModuleParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Lesson not found");
      expect(mockPrisma.lesson.findFirst).toHaveBeenCalledWith({
        where: {
          id: "lesson-1",
          moduleId: "wrong-module",
          module: {
            courseId: "course-1",
          },
        },
      });
    });

    it("should return 404 when lesson belongs to wrong course", async () => {
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(null);

      const wrongCourseParams = {
        id: "wrong-course",
        moduleId: "module-1",
        lessonId: "lesson-1",
      };

      const request = new NextRequest("http://localhost:3000/api/courses/wrong-course/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: wrongCourseParams });

      expect(mockPrisma.course.findFirst).toHaveBeenCalledWith({
        where: {
          id: "wrong-course",
          instructorId: "instructor-1",
        },
      });
    });
  });

  describe("Parameter handling", () => {
    it("should handle various parameter formats", async () => {
      const testParams = [
        {
          id: "course_123",
          moduleId: "module_456",
          lessonId: "lesson_789",
        },
        {
          id: "cm123abc",
          moduleId: "cm456def",
          lessonId: "cm789ghi",
        },
      ];

      for (const params of testParams) {
        mockPrisma.course.findFirst.mockResolvedValue({
          id: params.id,
          instructorId: "instructor-1",
        });
        mockPrisma.lesson.findFirst.mockResolvedValue({
          id: params.lessonId,
          moduleId: params.moduleId,
        });

        const request = new NextRequest(`http://localhost:3000/api/courses/${params.id}/modules/${params.moduleId}/lessons/${params.lessonId}`);
        const response = await GET(request, { params });

        expect(response.status).toBe(200);
      }
    });
  });

  describe("Error handling", () => {
    it("should handle course database errors", async () => {
      mockPrisma.course.findFirst.mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch lesson");
    });

    it("should handle lesson database errors", async () => {
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch lesson");
    });

    it("should handle authentication service errors", async () => {
      mockAuth.mockImplementation(() => {
        throw new Error("Auth service unavailable");
      });

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch lesson");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty lesson content", async () => {
      const emptyLesson = {
        ...mockLesson,
        content: "",
        videoUrl: null,
      };

      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(emptyLesson);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lesson.content).toBe("");
      expect(data.lesson.videoUrl).toBe(null);
    });

    it("should handle lessons with zero duration", async () => {
      const zeroDurationLesson = {
        ...mockLesson,
        duration: 0,
      };

      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(zeroDurationLesson);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lesson.duration).toBe(0);
    });

    it("should handle malformed JSON content in lessons", async () => {
      const malformedLesson = {
        ...mockLesson,
        content: '{"incomplete": json',
      };

      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(malformedLesson);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lesson.content).toBe('{"incomplete": json');
    });
  });
});