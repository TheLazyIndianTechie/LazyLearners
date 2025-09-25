import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations/auth";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  createRequestLogger: () => ({
    time: jest.fn(() => jest.fn()),
    logRequest: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logDatabaseOperation: jest.fn(),
    logBusinessEvent: jest.fn(),
  }),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("/api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: any): NextRequest => {
    return new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("Successful registration", () => {
    it("should successfully register a new user with valid data", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        role: "STUDENT",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword123");
      mockPrisma.user.create.mockResolvedValue({
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        role: "STUDENT",
        avatar: null,
        bio: null,
        location: null,
        website: null,
        socialLinks: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.user).toHaveProperty("id", "user-1");
      expect(data.data.user).toHaveProperty("name", "John Doe");
      expect(data.data.user).toHaveProperty("email", "john@example.com");
      expect(data.data.user).not.toHaveProperty("password");
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith("Password123!", 12);
    });

    it("should default to STUDENT role when none provided", async () => {
      const userData = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "Password123!",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword123");
      mockPrisma.user.create.mockResolvedValue({
        id: "user-2",
        name: "Jane Doe",
        email: "jane@example.com",
        password: "hashedPassword123",
        role: "STUDENT",
        avatar: null,
        bio: null,
        location: null,
        website: null,
        socialLinks: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.user.role).toBe("STUDENT");
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: "Jane Doe",
          email: "jane@example.com",
          password: "hashedPassword123",
          role: "STUDENT",
        },
      });
    });
  });

  describe("Validation errors", () => {
    it("should reject registration with invalid email", async () => {
      const userData = {
        name: "John Doe",
        email: "invalid-email",
        password: "Password123!",
      };

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe("Validation failed");
      expect(data.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["email"],
            message: "Invalid email address",
          }),
        ])
      );
    });

    it("should reject registration with weak password", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "weak",
      };

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["password"],
            message: expect.stringContaining("Password must be at least 8 characters"),
          }),
        ])
      );
    });

    it("should reject registration with invalid name", async () => {
      const userData = {
        name: "J", // Too short
        email: "john@example.com",
        password: "Password123!",
      };

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["name"],
            message: "Name must be at least 2 characters",
          }),
        ])
      );
    });

    it("should reject registration with name containing numbers", async () => {
      const userData = {
        name: "John123",
        email: "john@example.com",
        password: "Password123!",
      };

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["name"],
            message: "Name can only contain letters and spaces",
          }),
        ])
      );
    });

    it("should reject registration with invalid role", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        role: "INVALID_ROLE",
      };

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["role"],
          }),
        ])
      );
    });
  });

  describe("Duplicate user handling", () => {
    it("should reject registration with existing email", async () => {
      const userData = {
        name: "John Doe",
        email: "existing@example.com",
        password: "Password123!",
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing-user",
        name: "Existing User",
        email: "existing@example.com",
        password: "hashedPassword",
        role: "STUDENT",
        avatar: null,
        bio: null,
        location: null,
        website: null,
        socialLinks: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe(
        "Registration failed. Please check your information and try again."
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle database errors gracefully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
      };

      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database connection failed"));

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe("Internal server error");
    });

    it("should handle bcrypt hashing errors", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockRejectedValue(new Error("Hashing failed"));

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe("Internal server error");
    });

    it("should handle missing request body", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should handle malformed JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: "invalid json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe("Internal server error");
    });
  });

  describe("Security considerations", () => {
    it("should hash password with appropriate salt rounds", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword123");
      mockPrisma.user.create.mockResolvedValue({
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        role: "STUDENT",
        avatar: null,
        bio: null,
        location: null,
        website: null,
        socialLinks: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest(userData);
      await POST(request);

      expect(mockBcrypt.hash).toHaveBeenCalledWith("Password123!", 12);
    });

    it("should not expose password in response", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword123");
      mockPrisma.user.create.mockResolvedValue({
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        role: "STUDENT",
        avatar: null,
        bio: null,
        location: null,
        website: null,
        socialLinks: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest(userData);
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.user).not.toHaveProperty("password");
    });

    it("should convert email to lowercase", async () => {
      const userData = {
        name: "John Doe",
        email: "JOHN@EXAMPLE.COM",
        password: "Password123!",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue("hashedPassword123");
      mockPrisma.user.create.mockResolvedValue({
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        role: "STUDENT",
        avatar: null,
        bio: null,
        location: null,
        website: null,
        socialLinks: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createMockRequest(userData);
      const response = await POST(request);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "john@example.com",
        }),
      });
    });
  });
});