import { NextRequest } from "next/server";
import { GET } from "@/app/api/courses/[id]/modules/[moduleId]/lessons/[lessonId]/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
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

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/courses/[id]/modules/[moduleId]/lessons/[lessonId] - GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockInstructorSession = {
    user: {
      id: "instructor-1",
      name: "Jane Instructor",
      email: "jane@example.com",
      role: "INSTRUCTOR",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockStudentSession = {
    user: {
      id: "student-1",
      name: "John Student",
      email: "john@example.com",
      role: "STUDENT",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
      mockGetServerSession.mockResolvedValue(mockInstructorSession);
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
      mockGetServerSession.mockResolvedValue(mockInstructorSession);
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
      mockGetServerSession.mockResolvedValue(mockInstructorSession);
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

      mockGetServerSession.mockResolvedValue(mockInstructorSession);
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

      mockGetServerSession.mockResolvedValue(mockInstructorSession);
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
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockPrisma.course.findFirst).not.toHaveBeenCalled();
    });

    it("should return 404 when instructor doesn't own the course", async () => {
      const differentInstructorSession = {
        ...mockInstructorSession,
        user: {
          ...mockInstructorSession.user,
          id: "different-instructor",
        },
      };

      mockGetServerSession.mockResolvedValue(differentInstructorSession);
      mockPrisma.course.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Course not found");
      expect(mockPrisma.lesson.findFirst).not.toHaveBeenCalled();
    });

    it("should check course ownership for admin users", async () => {
      const adminSession = {
        user: {
          id: "admin-1",
          name: "Admin User",
          email: "admin@example.com",
          role: "ADMIN",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerSession.mockResolvedValue(adminSession);
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
      mockGetServerSession.mockResolvedValue(mockStudentSession);
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
      mockGetServerSession.mockResolvedValue(mockInstructorSession);
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Lesson not found");
    });

    it("should return 404 when lesson belongs to wrong module", async () => {
      mockGetServerSession.mockResolvedValue(mockInstructorSession);
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
      mockGetServerSession.mockResolvedValue(mockInstructorSession);
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
        mockGetServerSession.mockResolvedValue(mockInstructorSession);
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
      mockGetServerSession.mockResolvedValue(mockInstructorSession);
      mockPrisma.course.findFirst.mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch lesson");
    });

    it("should handle lesson database errors", async () => {
      mockGetServerSession.mockResolvedValue(mockInstructorSession);
      mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
      mockPrisma.lesson.findFirst.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/courses/course-1/modules/module-1/lessons/lesson-1");
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch lesson");
    });

    it("should handle authentication service errors", async () => {
      mockGetServerSession.mockRejectedValue(new Error("Auth service unavailable"));

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

      mockGetServerSession.mockResolvedValue(mockInstructorSession);
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

      mockGetServerSession.mockResolvedValue(mockInstructorSession);
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

      mockGetServerSession.mockResolvedValue(mockInstructorSession);
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