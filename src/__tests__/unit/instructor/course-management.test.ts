import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { GET, PUT, DELETE } from "@/app/api/courses/[id]/route";
import { POST } from "@/app/api/courses/route";
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
    review: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockAuth = auth as jest.Mock;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const setAuthUser = (userId: string | null) => {
  if (userId) {
    mockAuth.mockReturnValue({ userId })
  } else {
    mockAuth.mockReturnValue({ userId: null })
  }
}

const createCourseRequest = (body: any): NextRequest => ({
  url: "http://localhost:3000/api/courses",
  method: "POST",
  headers: new Headers({ "content-type": "application/json" }),
  json: async () => body,
} as unknown as NextRequest)

const createUpdateRequest = (id: string, body: any): NextRequest => ({
  url: `http://localhost:3000/api/courses/${id}`,
  method: "PUT",
  headers: new Headers({ "content-type": "application/json" }),
  json: async () => body,
} as unknown as NextRequest)

const createDeleteRequest = (id: string): NextRequest => ({
  url: `http://localhost:3000/api/courses/${id}`,
  method: "DELETE",
  headers: new Headers(),
} as unknown as NextRequest)

const createGetRequest = (url: string): NextRequest => ({
  url,
  method: "GET",
  headers: new Headers(),
} as unknown as NextRequest)

describe("Instructor Course Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthUser("instructor-1");
    mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 0 } });
    mockPrisma.review.findMany.mockResolvedValue([]);
  });

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
    requirements: [
      { requirement: "Basic programming knowledge", order: 0 },
    ],
    objectives: [
      { objective: "Build your first game", order: 0 },
    ],
    tags: [
      { tag: "unity" },
      { tag: "beginner" },
    ],
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
    modules: [
      {
        id: "module-1",
        title: "Introduction",
        description: "Start here",
        order: 0,
        duration: 10,
        _count: { lessons: 5 },
      },
    ],
    reviews: [
      { rating: 5, user: { id: "user1", name: "User 1", image: null } },
      { rating: 4, user: { id: "user2", name: "User 2", image: null } },
    ],
    _count: {
      enrollments: 150,
      reviews: 2,
      modules: 1,
    },
  };

  describe("POST /api/courses - Create Course", () => {

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
          requirements: courseData.requirements?.map((req, index) => ({ requirement: req, order: index })) ?? [],
          objectives: courseData.objectives?.map((obj, index) => ({ objective: obj, order: index })) ?? [],
          tags: courseData.tags?.map(tag => ({ tag })) ?? [],
          instructor: mockCourseData.instructor,
          modules: [],
        };

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

        setAuthUser("admin-1");
        mockPrisma.user.findUnique.mockResolvedValue({ role: "ADMIN" });
        mockPrisma.course.create.mockResolvedValue({
          id: "admin-course-1",
          ...courseData,
          instructorId: "admin-1",
          requirements: [],
          objectives: [],
          tags: [],
          instructor: { id: "admin-1", name: "Admin User", email: "admin@example.com", image: null },
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

        setAuthUser("instructor-1");
        mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });
        mockPrisma.course.create.mockResolvedValue({
          id: "minimal-course-1",
          ...minimalCourseData,
          requirements: [],
          objectives: [],
          tags: [],
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
        setAuthUser(null);

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
        setAuthUser("student-1");
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

    describe("Successful course updates", () => {
      it("should update course by instructor", async () => {
        const updateData = {
          title: "Updated Unity Course",
          price: 79.99,
          published: true,
        };

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

        setAuthUser("admin-1");
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

        mockPrisma.course.findUnique.mockResolvedValue(mockCourseData);
        mockPrisma.user.findUnique.mockResolvedValue({ role: "INSTRUCTOR" });
        mockPrisma.course.update.mockResolvedValue({
          ...mockCourseData,
          requirements: updateData.requirements.map((value, index) => ({ requirement: value, order: index })),
          objectives: updateData.objectives.map((value, index) => ({ objective: value, order: index })),
          tags: updateData.tags.map(tag => ({ tag })),
        });

        const request = createUpdateRequest("course-1", updateData);
        await PUT(request, { params: { id: "course-1" } });

        expect(mockPrisma.course.update).toHaveBeenCalledWith({
          where: { id: "course-1" },
          data: expect.objectContaining({
            tags: {
              deleteMany: {},
              create: updateData.tags.map(tag => ({ tag })),
            },
            objectives: {
              deleteMany: {},
              create: updateData.objectives.map((value, index) => ({ objective: value, order: index })),
            },
            requirements: {
              deleteMany: {},
              create: updateData.requirements.map((value, index) => ({ requirement: value, order: index })),
            },
          }),
          include: expect.any(Object),
        });
      });
    });

    describe("Authorization checks", () => {
      it("should prevent non-owner from updating course", async () => {
        // Mock different instructor
        setAuthUser("different-instructor");
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

    describe("Successful course deletion", () => {
      it("should delete course with no enrollments", async () => {
        setAuthUser("instructor-1");
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
        setAuthUser("admin-1");
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
        // Mock different instructor
        setAuthUser("different-instructor");
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
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } });

      const request = createGetRequest("http://localhost:3000/api/courses/course-1");
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

      const request = createGetRequest("http://localhost:3000/api/courses/non-existent");
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
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } });

      const request = createGetRequest("http://localhost:3000/api/courses/course-1");
      const response = await GET(request, { params: { id: "course-1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.course.rating).toBe(0);
      expect(data.course.reviewCount).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      setAuthUser("instructor-1");
      mockPrisma.course.findUnique.mockRejectedValue(new Error("Database connection failed"));

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

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create course");
    });
  });
});