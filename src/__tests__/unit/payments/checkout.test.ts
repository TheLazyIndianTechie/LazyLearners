import { NextResponse } from "next/server";
import { POST } from "@/app/api/payments/checkout/route";
import { dodoPayments } from "@/lib/payments/dodo";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/payments/dodo", () => ({
  dodoPayments: {
    createCheckoutSession: jest.fn(),
  },
}));

const mockDodoPayments = dodoPayments as jest.Mocked<typeof dodoPayments>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as unknown as {
  course: { findUnique: jest.Mock };
  enrollment: { findUnique: jest.Mock };
};
const mockNextResponse = NextResponse as unknown as { json: jest.Mock };

describe("/api/payments/checkout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.APP_URL = "https://gamelearn.example.com";
    mockAuth.mockReturnValue({ userId: "user_123" } as any);
    mockPrisma.course.findUnique.mockResolvedValue({
      id: "course-1",
      title: "Premium Course",
      price: 99.99,
      isPublished: true,
    });
    mockPrisma.enrollment.findUnique.mockResolvedValue(null);
    mockNextResponse.json.mockImplementation((body, init) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }));
  });

  afterEach(() => {
    delete process.env.APP_URL;
  });

  const createCheckoutRequest = (body: any) => {
    return {
      async json() {
        return body;
      },
      nextUrl: new URL("http://localhost:3000/api/payments/checkout"),
    } as any;
  };

  const mockCheckoutSession = {
    id: "checkout-session-1",
    url: "https://checkout.dodo.com/session-1",
    paymentId: "payment-123",
    status: "pending",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  describe("Successful checkout creation", () => {
    it("should create checkout session with valid data", async () => {
      const checkoutData = {
        courseId: "course-1",
        quantity: 1,
        customer: {
          name: "John Doe",
          email: "john@example.com",
          phoneNumber: "+1234567890",
        },
        returnUrl: "https://example.com/success",
        discountCode: "SAVE20",
      };

      mockDodoPayments.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

      const request = createCheckoutRequest(checkoutData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        sessionId: "checkout-session-1",
        checkoutUrl: "https://checkout.dodo.com/session-1",
        paymentId: "payment-123",
        returnUrl: "https://example.com/success",
        courseTitle: "Premium Course",
      });

      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith({
        products: [{ productId: "course-1", quantity: 1 }],
        customer: {
          name: "John Doe",
          email: "john@example.com",
          phoneNumber: "+1234567890",
        },
        returnUrl: "https://example.com/success",
        metadata: {
          course_id: "course-1",
          user_id: "user_123",
          course_title: "Premium Course",
          source: "gamelearn-platform",
          timestamp: expect.any(String),
        },
        discountCode: "SAVE20",
      });
    });

    it("should use default return URL when not provided", async () => {
      const checkoutData = {
        courseId: "course-1",
        customer: {
          name: "John Doe",
          email: "john@example.com",
        },
      };

      mockDodoPayments.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

      const request = createCheckoutRequest(checkoutData);
      await POST(request);

      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          returnUrl: "https://gamelearn.example.com/courses/course-1/success",
        })
      );
    });

    it("should default quantity to 1 when not provided", async () => {
      const checkoutData = {
        courseId: "course-1",
        customer: {
          name: "John Doe",
          email: "john@example.com",
        },
      };

      mockDodoPayments.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

      const request = createCheckoutRequest(checkoutData);
      await POST(request);

      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          products: [{ productId: "course-1", quantity: 1 }],
        })
      );
    });

    it("should handle checkout without optional fields", async () => {
      const minimalCheckoutData = {
        courseId: "course-1",
        customer: {
          name: "Jane Doe",
          email: "jane@example.com",
        },
      };

      mockDodoPayments.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

      const request = createCheckoutRequest(minimalCheckoutData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith({
        products: [{ productId: "course-1", quantity: 1 }],
        customer: {
          name: "Jane Doe",
          email: "jane@example.com",
        },
        returnUrl: "https://gamelearn.example.com/courses/course-1/success",
        metadata: {
          course_id: "course-1",
          user_id: "user_123",
          course_title: "Premium Course",
          source: "gamelearn-platform",
          timestamp: expect.any(String),
        },
        discountCode: undefined,
      });
    });

    it("should handle multiple quantities", async () => {
      const checkoutData = {
        courseId: "course-1",
        quantity: 5,
        customer: {
          name: "Corporate Buyer",
          email: "corp@example.com",
        },
      };

      mockDodoPayments.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

      const request = createCheckoutRequest(checkoutData);
      await POST(request);

      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          products: [{ productId: "course-1", quantity: 5 }],
        })
      );
    });
  });

  describe("Input validation", () => {
    const validationTestCases = [
      {
        name: "should reject missing courseId",
        data: {
          customer: { name: "John", email: "john@example.com" },
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject empty courseId",
        data: {
          courseId: "",
          customer: { name: "John", email: "john@example.com" },
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject missing customer",
        data: {
          courseId: "course-1",
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject missing customer name",
        data: {
          courseId: "course-1",
          customer: { email: "john@example.com" },
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject empty customer name",
        data: {
          courseId: "course-1",
          customer: { name: "", email: "john@example.com" },
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject missing customer email",
        data: {
          courseId: "course-1",
          customer: { name: "John Doe" },
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject invalid customer email",
        data: {
          courseId: "course-1",
          customer: { name: "John Doe", email: "invalid-email" },
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject zero quantity",
        data: {
          courseId: "course-1",
          quantity: 0,
          customer: { name: "John Doe", email: "john@example.com" },
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject negative quantity",
        data: {
          courseId: "course-1",
          quantity: -1,
          customer: { name: "John Doe", email: "john@example.com" },
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject invalid return URL",
        data: {
          courseId: "course-1",
          customer: { name: "John Doe", email: "john@example.com" },
          returnUrl: "not-a-url",
        },
        expectedError: "Invalid request data",
      },
    ];

    validationTestCases.forEach(({ name, data, expectedError }) => {
      it(name, async () => {
        const request = createCheckoutRequest(data);
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe(expectedError);
        expect(responseData).toHaveProperty("details");
        expect(mockDodoPayments.createCheckoutSession).not.toHaveBeenCalled();
      });
    });

    it("should accept valid URL formats", async () => {
      const validUrls = [
        "https://example.com/success",
        "http://localhost:3000/success",
        "https://subdomain.example.com/path/to/success?param=value",
      ];

      for (const url of validUrls) {
        mockDodoPayments.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

        const checkoutData = {
          courseId: "course-1",
          customer: { name: "John", email: "john@example.com" },
          returnUrl: url,
        };

        const request = createCheckoutRequest(checkoutData);
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith(
          expect.objectContaining({
            returnUrl: url,
          })
        );

        mockDodoPayments.createCheckoutSession.mockClear();
      }
    });

    it("should accept valid email formats", async () => {
      const validEmails = [
        "user@example.com",
        "test+label@example.co.uk",
        "firstname.lastname@subdomain.example.com",
        "user123@example-site.org",
      ];

      for (const email of validEmails) {
        mockDodoPayments.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

        const checkoutData = {
          courseId: "course-1",
          customer: { name: "John", email },
        };

        const request = createCheckoutRequest(checkoutData);
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith(
          expect.objectContaining({
            customer: expect.objectContaining({ email }),
          })
        );

        mockDodoPayments.createCheckoutSession.mockClear();
      }
    });
  });

  describe("Authorization and course validation", () => {
    const baseRequest = {
      courseId: "course-1",
      customer: { name: "John", email: "john@example.com" },
    };

    it("should return unauthorized when user is not authenticated", async () => {
      mockAuth.mockReturnValueOnce({ userId: null } as any);

      const request = createCheckoutRequest(baseRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
      expect(mockDodoPayments.createCheckoutSession).not.toHaveBeenCalled();
    });

    it("should return not found when course does not exist", async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce(null);

      const request = createCheckoutRequest(baseRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Course not found");
      expect(mockDodoPayments.createCheckoutSession).not.toHaveBeenCalled();
    });

    it("should reject unpublished courses", async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce({
        id: "course-1",
        title: "Premium Course",
        price: 99.99,
        isPublished: false,
      });

      const request = createCheckoutRequest(baseRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Course is not available for purchase");
      expect(mockDodoPayments.createCheckoutSession).not.toHaveBeenCalled();
    });

    it("should reject free courses", async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce({
        id: "course-1",
        title: "Free Course",
        price: 0,
        isPublished: true,
      });

      const request = createCheckoutRequest(baseRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Course is free. Use standard enrollment instead.");
      expect(mockDodoPayments.createCheckoutSession).not.toHaveBeenCalled();
    });

    it("should reject when user already enrolled", async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValueOnce({
        id: "enroll-1",
      });

      const request = createCheckoutRequest(baseRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("You are already enrolled in this course");
      expect(mockDodoPayments.createCheckoutSession).not.toHaveBeenCalled();
    });
  });

  describe("Dodo Payments integration", () => {
    it("should handle Dodo Payments service errors", async () => {
      const checkoutData = {
        courseId: "course-1",
        customer: { name: "John", email: "john@example.com" },
      };

      mockDodoPayments.createCheckoutSession.mockRejectedValue(
        new Error("Dodo Payments API error")
      );

      const request = createCheckoutRequest(checkoutData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create checkout session");
      expect(data.message).toBe("Dodo Payments API error");
    });

    it("should handle Dodo Payments timeout errors", async () => {
      const checkoutData = {
        courseId: "course-1",
        customer: { name: "John", email: "john@example.com" },
      };

      mockDodoPayments.createCheckoutSession.mockRejectedValue(
        new Error("Request timeout")
      );

      const request = createCheckoutRequest(checkoutData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create checkout session");
      expect(data.message).toBe("Request timeout");
    });

    it("should handle unexpected error types", async () => {
      const checkoutData = {
        courseId: "course-1",
        customer: { name: "John", email: "john@example.com" },
      };

      mockDodoPayments.createCheckoutSession.mockRejectedValue("String error");

      const request = createCheckoutRequest(checkoutData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create checkout session");
      expect(data.message).toBe("Unknown error");
    });
  });

  describe("Metadata handling", () => {
    it("should include correct metadata in checkout session", async () => {
      const checkoutData = {
        courseId: "advanced-unity-course",
        customer: { name: "John", email: "john@example.com" },
      };

      mockPrisma.course.findUnique.mockResolvedValueOnce({
        id: "advanced-unity-course",
        title: "Advanced Unity Course",
        price: 249.0,
        isPublished: true,
      });
      mockDodoPayments.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

      const beforeRequest = Date.now();
      const request = createCheckoutRequest(checkoutData);
      await POST(request);
      const afterRequest = Date.now();

      const callArgs = mockDodoPayments.createCheckoutSession.mock.calls[0][0];
      expect(callArgs.metadata).toEqual({
        course_id: "advanced-unity-course",
        user_id: "user_123",
        course_title: "Advanced Unity Course",
        source: "gamelearn-platform",
        timestamp: expect.any(String),
      });

      // Verify timestamp is reasonable
      const timestamp = new Date(callArgs.metadata.timestamp).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(beforeRequest);
      expect(timestamp).toBeLessThanOrEqual(afterRequest);
    });
  });

  describe("Edge cases", () => {
    it("should handle malformed JSON request", async () => {
      const request = {
        async json() {
          throw new Error("Invalid JSON");
        },
        nextUrl: new URL("http://localhost:3000/api/payments/checkout"),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create checkout session");
    });

    it("should handle empty request body", async () => {
      const request = {
        async json() {
          throw new Error("Unexpected end of JSON input");
        },
        nextUrl: new URL("http://localhost:3000/api/payments/checkout"),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it("should handle large quantity values", async () => {
      const checkoutData = {
        courseId: "course-1",
        quantity: 1000,
        customer: { name: "John", email: "john@example.com" },
      };

      mockDodoPayments.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

      const request = createCheckoutRequest(checkoutData);
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          products: [{ productId: "course-1", quantity: 1000 }],
        })
      );
    });

    it("should handle special characters in customer data", async () => {
      const checkoutData = {
        courseId: "course-1",
        customer: {
          name: "José María O'Connor-Smith",
          email: "josé@example.com",
          phoneNumber: "+1-234-567-8900 ext. 123",
        },
      };

      mockDodoPayments.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

      const request = createCheckoutRequest(checkoutData);
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: {
            name: "José María O'Connor-Smith",
            email: "josé@example.com",
            phoneNumber: "+1-234-567-8900 ext. 123",
          },
        })
      );
    });
  });
});