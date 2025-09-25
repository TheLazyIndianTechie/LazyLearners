import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/courses/[id]/route";
import { POST } from "@/app/api/courses/route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Instructor Course Management", () => {
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

  const mockAdminSession = {
    user: {
      id: "admin-1",
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockStudentSession = {
    user: {
      id: "student-1",
      name: "Student User",
      email: "student@example.com",
      role: "STUDENT",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockCourseData = {
    id: "course-1",
    title: "Unity Game Development",
    description: "Learn Unity from scratch",
    thumbnail: "https://example.com/thumb.jpg",
    price: 99.99,
    published: true,
    category: "UNITY_DEVELOPMENT",
    engine: "UNITY",
    difficulty: "BEGINNER",
    duration: 40,
    requirements: JSON.stringify(["Basic programming knowledge"]),
    objectives: JSON.stringify(["Build your first game"]),
    tags: JSON.stringify(["unity", "beginner"]),
    instructorId: "instructor-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    instructor: {
      id: "instructor-1",
      name: "Jane Instructor",
      email: "jane@example.com",
      image: null,
      bio: "Experienced Unity developer",
    },
    modules: [],
    reviews: [
      { rating: 5, user: { id: "user1", name: "User 1", image: null } },
      { rating: 4, user: { id: "user2", name: "User 2", image: null } },
    ],
    _count: {
      enrollments: 150,
      reviews: 2,
    },
  };

  describe("POST /api/courses - Create Course", () => {
    const createCourseRequest = (body: any): NextRequest => {
      return new NextRequest("http://localhost:3000/api/courses", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
    };

    describe("Successful course creation", () => {
      it("should create course for instructor", async () => {
        const courseData = {
          title: "Unity Basics",
          description: "Learn Unity fundamentals",
          price: 49.99,
          category: "UNITY_DEVELOPMENT",
          engine: "UNITY",
          difficulty: "BEGINNER",
          duration: 20,
          requirements: ["Basic programming knowledge"],
          objectives: ["Build your first Unity project"],
          tags: ["unity", "beginner", "3d"],
        };

        const createdCourse = {
          id: "new-course-1",
          ...courseData,
          instructorId: "instructor-1",
          requirements: JSON.stringify(courseData.requirements),
          objectives: JSON.stringify(courseData.objectives),
          tags: JSON.stringify(courseData.tags),
          instructor: mockCourseData.instructor,
          modules: [],
        };

        mockGetServerSession.mockResolvedValue(mockInstructorSession);
        mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });
        mockPrisma.course.create.mockResolvedValue(createdCourse);

        const request = createCourseRequest(courseData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.course.title).toBe("Unity Basics");
        expect(data.course.instructorId).toBe("instructor-1");
        expect(data.course.requirements).toEqual(["Basic programming knowledge"]);
        expect(data.course.objectives).toEqual(["Build your first Unity project"]);
        expect(data.course.tags).toEqual(["unity", "beginner", "3d"]);
      });

      it("should create course for admin", async () => {
        const courseData = {
          title: "Admin Course",
          description: "Course created by admin",
          price: 99.99,
          category: "GAME_DESIGN",
          difficulty: "INTERMEDIATE",
          duration: 30,
        };

        mockGetServerSession.mockResolvedValue(mockAdminSession);
        mockPrisma.user.findUnique.mockResolvedValue({ role: "ADMIN" });
        mockPrisma.course.create.mockResolvedValue({
          id: "admin-course-1",
          ...courseData,
          instructorId: "admin-1",
          instructor: { id: "admin-1", name: "Admin User" },
          modules: [],
        });

        const request = createCourseRequest(courseData);
        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(mockPrisma.course.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            instructorId: "admin-1",
          }),
          include: expect.any(Object),
        });
      });

      it("should handle optional fields correctly", async () => {
        const minimalCourseData = {
          title: "Minimal Course",
          description: "Basic course data",
          price: 0,
          category: "GAME_PROGRAMMING",
          difficulty: "BEGINNER",
          duration: 10,
        };

        mockGetServerSession.mockResolvedValue(mockInstructorSession);
        mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });
        mockPrisma.course.create.mockResolvedValue({
          id: "minimal-course-1",
          ...minimalCourseData,
          requirements: null,
          objectives: null,
          tags: null,
          instructor: mockCourseData.instructor,
          modules: [],
        });

        const request = createCourseRequest(minimalCourseData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.course.requirements).toEqual([]);
        expect(data.course.objectives).toEqual([]);
        expect(data.course.tags).toEqual([]);
      });
    });

    describe("Authentication and authorization", () => {
      it("should reject unauthenticated requests", async () => {
        mockGetServerSession.mockResolvedValue(null);

        const request = createCourseRequest({
          title: "Test Course",
          description: "Test",
          price: 50,
          category: "UNITY_DEVELOPMENT",
          difficulty: "BEGINNER",
          duration: 10,
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Authentication required");
        expect(mockPrisma.course.create).not.toHaveBeenCalled();
      });

      it("should reject student course creation", async () => {
        mockGetServerSession.mockResolvedValue(mockStudentSession);
        mockPrisma.user.findUnique.mockResolvedValue({ role: "STUDENT" });

        const request = createCourseRequest({
          title: "Student Course",
          description: "Test",
          price: 50,
          category: "UNITY_DEVELOPMENT",
          difficulty: "BEGINNER",
          duration: 10,
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe("Only instructors can create courses");
        expect(mockPrisma.course.create).not.toHaveBeenCalled();
      });
    });

    describe("Input validation", () => {
      const validationTestCases = [
        {
          name: "should reject empty title",
          data: {
            title: "",
            description: "Test course",
            price: 50,
            category: "UNITY_DEVELOPMENT",
            difficulty: "BEGINNER",
            duration: 10,
          },
        },
        {
          name: "should reject title that's too long",
          data: {
            title: "a".repeat(201),
            description: "Test course",
            price: 50,
            category: "UNITY_DEVELOPMENT",
            difficulty: "BEGINNER",
            duration: 10,
          },
        },
        {
          name: "should reject negative price",
          data: {
            title: "Test Course",
            description: "Test course",
            price: -10,
            category: "UNITY_DEVELOPMENT",
            difficulty: "BEGINNER",
            duration: 10,
          },
        },
        {
          name: "should reject invalid category",
          data: {
            title: "Test Course",
            description: "Test course",
            price: 50,
            category: "INVALID_CATEGORY",
            difficulty: "BEGINNER",
            duration: 10,
          },
        },
        {
          name: "should reject zero duration",
          data: {
            title: "Test Course",
            description: "Test course",
            price: 50,
            category: "UNITY_DEVELOPMENT",
            difficulty: "BEGINNER",
            duration: 0,
          },
        },
      ];

      validationTestCases.forEach(({ name, data }) => {
        it(name, async () => {
          mockGetServerSession.mockResolvedValue(mockInstructorSession);

          const request = createCourseRequest(data);
          const response = await POST(request);
          const responseData = await response.json();

          expect(response.status).toBe(400);
          expect(responseData.error).toBe("Invalid input");
          expect(responseData).toHaveProperty("details");
        });
      });
    });
  });

  describe("PUT /api/courses/[id] - Update Course", () => {
    const createUpdateRequest = (id: string, body: any): NextRequest => {
      return new NextRequest(`http://localhost:3000/api/courses/${id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
    };

    describe("Successful course updates", () => {
      it("should update course by instructor", async () => {
        const updateData = {
          title: "Updated Unity Course",
          price: 79.99,
          published: true,
        };

        mockGetServerSession.mockResolvedValue(mockInstructorSession);
        mockPrisma.course.findUnique.mockResolvedValue(mockCourseData);
        mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });
        mockPrisma.course.update.mockResolvedValue({
          ...mockCourseData,
          ...updateData,
        });

        const request = createUpdateRequest("course-1", updateData);
        const response = await PUT(request, { params: { id: "course-1" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.course.title).toBe("Updated Unity Course");
        expect(data.course.price).toBe(79.99);
        expect(data.course.published).toBe(true);
      });

      it("should update course by admin", async () => {
        const updateData = { title: "Admin Updated Course" };

        mockGetServerSession.mockResolvedValue(mockAdminSession);
        mockPrisma.course.findUnique.mockResolvedValue(mockCourseData);
        mockPrisma.user.findUnique.mockResolvedValue({ role: "ADMIN" });
        mockPrisma.course.update.mockResolvedValue({
          ...mockCourseData,
          ...updateData,
        });

        const request = createUpdateRequest("course-1", updateData);
        const response = await PUT(request, { params: { id: "course-1" } });

        expect(response.status).toBe(200);
        expect(mockPrisma.course.update).toHaveBeenCalled();
      });

      it("should handle JSON field updates", async () => {
        const updateData = {
          requirements: ["New requirement", "Another requirement"],
          objectives: ["New objective"],
          tags: ["updated", "tags"],
        };

        mockGetServerSession.mockResolvedValue(mockInstructorSession);
        mockPrisma.course.findUnique.mockResolvedValue(mockCourseData);
        mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });
        mockPrisma.course.update.mockResolvedValue(mockCourseData);

        const request = createUpdateRequest("course-1", updateData);
        await PUT(request, { params: { id: "course-1" } });

        expect(mockPrisma.course.update).toHaveBeenCalledWith({
          where: { id: "course-1" },
          data: {
            requirements: JSON.stringify(updateData.requirements),
            objectives: JSON.stringify(updateData.objectives),
            tags: JSON.stringify(updateData.tags),
          },
          include: expect.any(Object),
        });
      });
    });

    describe("Authorization checks", () => {
      it("should prevent non-owner from updating course", async () => {
        const differentInstructorSession = {
          ...mockInstructorSession,
          user: { ...mockInstructorSession.user, id: "different-instructor" },
        };

        mockGetServerSession.mockResolvedValue(differentInstructorSession);
        mockPrisma.course.findUnique.mockResolvedValue(mockCourseData);
        mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });

        const request = createUpdateRequest("course-1", { title: "Hacked Title" });
        const response = await PUT(request, { params: { id: "course-1" } });
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe("You can only edit your own courses");
        expect(mockPrisma.course.update).not.toHaveBeenCalled();
      });

      it("should return 404 for non-existent course", async () => {
        mockGetServerSession.mockResolvedValue(mockInstructorSession);
        mockPrisma.course.findUnique.mockResolvedValue(null);

        const request = createUpdateRequest("non-existent", { title: "Test" });
        const response = await PUT(request, { params: { id: "non-existent" } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Course not found");
      });
    });
  });

  describe("DELETE /api/courses/[id] - Delete Course", () => {
    const createDeleteRequest = (id: string): NextRequest => {
      return new NextRequest(`http://localhost:3000/api/courses/${id}`, {
        method: "DELETE",
      });
    };

    describe("Successful course deletion", () => {
      it("should delete course with no enrollments", async () => {
        mockGetServerSession.mockResolvedValue(mockInstructorSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          instructorId: "instructor-1",
        });
        mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });
        mockPrisma.enrollment.count.mockResolvedValue(0);
        mockPrisma.course.delete.mockResolvedValue(undefined);

        const request = createDeleteRequest("course-1");
        const response = await DELETE(request, { params: { id: "course-1" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe("Course deleted successfully");
        expect(mockPrisma.course.delete).toHaveBeenCalledWith({
          where: { id: "course-1" },
        });
      });

      it("should allow admin to delete any course", async () => {
        mockGetServerSession.mockResolvedValue(mockAdminSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          instructorId: "different-instructor",
        });
        mockPrisma.user.findUnique.mockResolvedValue({ role: "ADMIN" });
        mockPrisma.enrollment.count.mockResolvedValue(0);
        mockPrisma.course.delete.mockResolvedValue(undefined);

        const request = createDeleteRequest("course-1");
        const response = await DELETE(request, { params: { id: "course-1" } });

        expect(response.status).toBe(200);
        expect(mockPrisma.course.delete).toHaveBeenCalled();
      });
    });

    describe("Deletion restrictions", () => {
      it("should prevent deletion of course with enrollments", async () => {
        mockGetServerSession.mockResolvedValue(mockInstructorSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          instructorId: "instructor-1",
        });
        mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });
        mockPrisma.enrollment.count.mockResolvedValue(5);

        const request = createDeleteRequest("course-1");
        const response = await DELETE(request, { params: { id: "course-1" } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Cannot delete course with active enrollments");
        expect(mockPrisma.course.delete).not.toHaveBeenCalled();
      });

      it("should prevent non-owner from deleting course", async () => {
        const differentInstructorSession = {
          ...mockInstructorSession,
          user: { ...mockInstructorSession.user, id: "different-instructor" },
        };

        mockGetServerSession.mockResolvedValue(differentInstructorSession);
        mockPrisma.course.findUnique.mockResolvedValue({
          instructorId: "instructor-1",
        });
        mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });

        const request = createDeleteRequest("course-1");
        const response = await DELETE(request, { params: { id: "course-1" } });
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe("You can only delete your own courses");
        expect(mockPrisma.course.delete).not.toHaveBeenCalled();
      });

      it("should return 404 for non-existent course", async () => {
        mockGetServerSession.mockResolvedValue(mockInstructorSession);
        mockPrisma.course.findUnique.mockResolvedValue(null);

        const request = createDeleteRequest("non-existent");
        const response = await DELETE(request, { params: { id: "non-existent" } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Course not found");
      });
    });
  });

  describe("GET /api/courses/[id] - Get Course Details", () => {
    it("should return course with formatted data", async () => {
      mockPrisma.course.findUnique.mockResolvedValue(mockCourseData);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1");
      const response = await GET(request, { params: { id: "course-1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.course.id).toBe("course-1");
      expect(data.course.title).toBe("Unity Game Development");
      expect(data.course.requirements).toEqual(["Basic programming knowledge"]);
      expect(data.course.objectives).toEqual(["Build your first game"]);
      expect(data.course.tags).toEqual(["unity", "beginner"]);
      expect(data.course.rating).toBe(4.5); // (5+4)/2
      expect(data.course.enrollmentCount).toBe(150);
      expect(data.course.reviewCount).toBe(2);
    });

    it("should return 404 for non-existent course", async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/courses/non-existent");
      const response = await GET(request, { params: { id: "non-existent" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Course not found");
    });

    it("should handle courses with no reviews", async () => {
      const courseWithNoReviews = {
        ...mockCourseData,
        reviews: [],
        _count: { ...mockCourseData._count, reviews: 0 },
      };

      mockPrisma.course.findUnique.mockResolvedValue(courseWithNoReviews);

      const request = new NextRequest("http://localhost:3000/api/courses/course-1");
      const response = await GET(request, { params: { id: "course-1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.course.rating).toBe(0);
      expect(data.course.reviewCount).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      mockGetServerSession.mockResolvedValue(mockInstructorSession);
      mockPrisma.course.findUnique.mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest("http://localhost:3000/api/courses", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Course",
          description: "Test",
          price: 50,
          category: "UNITY_DEVELOPMENT",
          difficulty: "BEGINNER",
          duration: 10,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create course");
    });
  });
});