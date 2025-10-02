import { NextRequest } from "next/server";
import { POST } from "@/app/api/license/validate/route";
import { licenseKeyService } from "@/lib/license/license-service";
import { ZodError } from "zod";

// Mock dependencies
jest.mock("@/lib/license/license-service", () => ({
  licenseKeyService: {
    validateLicenseKey: jest.fn(),
  },
}));

const mockLicenseKeyService = licenseKeyService as jest.Mocked<typeof licenseKeyService>;

describe("/api/license/validate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createValidationRequest = (body: any): NextRequest => {
    return new NextRequest("http://localhost:3000/api/license/validate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  const mockValidLicenseKey = {
    id: "license-1",
    key: "GAMELEARN-ABCD-1234-EFGH-5678",
    status: "ACTIVE",
    activationsCount: 1,
    activationsLimit: 5,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    course: {
      id: "course-1",
      title: "Unity Fundamentals",
      price: 99.99,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("Successful license validation", () => {
    it("should validate active license key", async () => {
      const validationData = {
        key: "GAMELEARN-ABCD-1234-EFGH-5678",
        userId: "user-1",
        courseId: "course-1",
      };

      const mockValidation = {
        valid: true,
        reason: "License key is valid and active",
        licenseKey: mockValidLicenseKey,
      };

      mockLicenseKeyService.validateLicenseKey.mockResolvedValue(mockValidation);

      const request = createValidationRequest(validationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(true);
      expect(data.data.reason).toBe("License key is valid and active");
      expect(data.data.licenseKey).toEqual({
        id: "license-1",
        key: "GAMELEARN-ABCD-1234-EFGH-5678",
        status: "ACTIVE",
        activationsCount: 1,
        activationsLimit: 5,
        expiresAt: mockValidLicenseKey.expiresAt,
        course: {
          id: "course-1",
          title: "Unity Fundamentals",
          price: 99.99,
        },
      });

      expect(mockLicenseKeyService.validateLicenseKey).toHaveBeenCalledWith({
        key: "GAMELEARN-ABCD-1234-EFGH-5678",
        userId: "user-1",
        courseId: "course-1",
      });
    });

    it("should handle validation with different license key formats", async () => {
      const testCases = [
        "GAMELEARN-ABCD-1234-EFGH-5678",
        "GL-XXXX-YYYY-ZZZZ-AAAA",
        "COURSE123-USER456-789ABC",
        "license_key_format_v2_123456789",
      ];

      for (const key of testCases) {
        const validationData = {
          key,
          userId: "user-1",
          courseId: "course-1",
        };

        mockLicenseKeyService.validateLicenseKey.mockResolvedValue({
          valid: true,
          reason: "Valid license key",
          licenseKey: { ...mockValidLicenseKey, key },
        });

        const request = createValidationRequest(validationData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.valid).toBe(true);
        expect(data.data.licenseKey.key).toBe(key);

        mockLicenseKeyService.validateLicenseKey.mockClear();
      }
    });

    it("should return validation result without license key data", async () => {
      const validationData = {
        key: "INVALID-KEY",
        userId: "user-1",
        courseId: "course-1",
      };

      const mockValidation = {
        valid: false,
        reason: "License key not found",
        licenseKey: null,
      };

      mockLicenseKeyService.validateLicenseKey.mockResolvedValue(mockValidation);

      const request = createValidationRequest(validationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(false);
      expect(data.data.reason).toBe("License key not found");
      expect(data.data.licenseKey).toBe(null);
    });
  });

  describe("License validation scenarios", () => {
    const validationScenarios = [
      {
        name: "should handle expired license key",
        mockResponse: {
          valid: false,
          reason: "License key has expired",
          licenseKey: {
            ...mockValidLicenseKey,
            status: "EXPIRED",
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          },
        },
        expectedValid: false,
        expectedReason: "License key has expired",
      },
      {
        name: "should handle revoked license key",
        mockResponse: {
          valid: false,
          reason: "License key has been revoked",
          licenseKey: {
            ...mockValidLicenseKey,
            status: "REVOKED",
          },
        },
        expectedValid: false,
        expectedReason: "License key has been revoked",
      },
      {
        name: "should handle activation limit exceeded",
        mockResponse: {
          valid: false,
          reason: "Activation limit exceeded",
          licenseKey: {
            ...mockValidLicenseKey,
            activationsCount: 5,
            activationsLimit: 5,
          },
        },
        expectedValid: false,
        expectedReason: "Activation limit exceeded",
      },
      {
        name: "should handle wrong course association",
        mockResponse: {
          valid: false,
          reason: "License key is not valid for this course",
          licenseKey: {
            ...mockValidLicenseKey,
            course: {
              id: "different-course",
              title: "Different Course",
              price: 149.99,
            },
          },
        },
        expectedValid: false,
        expectedReason: "License key is not valid for this course",
      },
      {
        name: "should handle suspended license key",
        mockResponse: {
          valid: false,
          reason: "License key is temporarily suspended",
          licenseKey: {
            ...mockValidLicenseKey,
            status: "SUSPENDED",
          },
        },
        expectedValid: false,
        expectedReason: "License key is temporarily suspended",
      },
    ];

    validationScenarios.forEach(({ name, mockResponse, expectedValid, expectedReason }) => {
      it(name, async () => {
        const validationData = {
          key: "TEST-LICENSE-KEY",
          userId: "user-1",
          courseId: "course-1",
        };

        mockLicenseKeyService.validateLicenseKey.mockResolvedValue(mockResponse);

        const request = createValidationRequest(validationData);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.valid).toBe(expectedValid);
        expect(data.data.reason).toBe(expectedReason);
        expect(data.data.licenseKey).toBeTruthy();
      });
    });
  });

  describe("Input validation", () => {
    const validationTestCases = [
      {
        name: "should reject missing license key",
        data: {
          userId: "user-1",
          courseId: "course-1",
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject empty license key",
        data: {
          key: "",
          userId: "user-1",
          courseId: "course-1",
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject missing userId",
        data: {
          key: "GAMELEARN-ABCD-1234",
          courseId: "course-1",
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject empty userId",
        data: {
          key: "GAMELEARN-ABCD-1234",
          userId: "",
          courseId: "course-1",
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject missing courseId",
        data: {
          key: "GAMELEARN-ABCD-1234",
          userId: "user-1",
        },
        expectedError: "Invalid request data",
      },
      {
        name: "should reject empty courseId",
        data: {
          key: "GAMELEARN-ABCD-1234",
          userId: "user-1",
          courseId: "",
        },
        expectedError: "Invalid request data",
      },
    ];

    validationTestCases.forEach(({ name, data, expectedError }) => {
      it(name, async () => {
        const request = createValidationRequest(data);
        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe(expectedError);
        expect(responseData).toHaveProperty("details");
        expect(mockLicenseKeyService.validateLicenseKey).not.toHaveBeenCalled();
      });
    });

    it("should accept various ID formats", async () => {
      const testCases = [
        {
          key: "GAMELEARN-TEST-KEY-123",
          userId: "cuid_user_123",
          courseId: "cuid_course_456",
        },
        {
          key: "GL-SIMPLE-KEY",
          userId: "uuid-v4-user-id",
          courseId: "uuid-v4-course-id",
        },
        {
          key: "VERY-LONG-LICENSE-KEY-WITH-MANY-SEGMENTS-FOR-TESTING",
          userId: "user123",
          courseId: "course456",
        },
      ];

      for (const testData of testCases) {
        mockLicenseKeyService.validateLicenseKey.mockResolvedValue({
          valid: true,
          reason: "Valid",
          licenseKey: mockValidLicenseKey,
        });

        const request = createValidationRequest(testData);
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockLicenseKeyService.validateLicenseKey).toHaveBeenCalledWith(testData);

        mockLicenseKeyService.validateLicenseKey.mockClear();
      }
    });
  });

  describe("Service integration", () => {
    it("should handle license service errors", async () => {
      const validationData = {
        key: "GAMELEARN-ABCD-1234",
        userId: "user-1",
        courseId: "course-1",
      };

      mockLicenseKeyService.validateLicenseKey.mockRejectedValue(
        new Error("License service database error")
      );

      const request = createValidationRequest(validationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("License validation failed");
      expect(data.message).toBe("License service database error");
    });

    it("should handle license service timeout", async () => {
      const validationData = {
        key: "GAMELEARN-ABCD-1234",
        userId: "user-1",
        courseId: "course-1",
      };

      mockLicenseKeyService.validateLicenseKey.mockRejectedValue(
        new Error("Service timeout")
      );

      const request = createValidationRequest(validationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("License validation failed");
      expect(data.message).toBe("Service timeout");
    });

    it("should handle unexpected error types", async () => {
      const validationData = {
        key: "GAMELEARN-ABCD-1234",
        userId: "user-1",
        courseId: "course-1",
      };

      mockLicenseKeyService.validateLicenseKey.mockRejectedValue("String error");

      const request = createValidationRequest(validationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("License validation failed");
      expect(data.message).toBe("Unknown error");
    });
  });

  describe("Security considerations", () => {
    it("should not expose sensitive license information", async () => {
      const validationData = {
        key: "GAMELEARN-ABCD-1234",
        userId: "user-1",
        courseId: "course-1",
      };

      const licenseWithSensitiveData = {
        ...mockValidLicenseKey,
        paymentId: "payment-123-secret",
        customerId: "customer-456-secret",
        internalNotes: "Internal license notes",
        activationDetails: ["sensitive", "activation", "data"],
      };

      mockLicenseKeyService.validateLicenseKey.mockResolvedValue({
        valid: true,
        reason: "Valid license",
        licenseKey: licenseWithSensitiveData,
      });

      const request = createValidationRequest(validationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.licenseKey).toEqual({
        id: licenseWithSensitiveData.id,
        key: licenseWithSensitiveData.key,
        status: licenseWithSensitiveData.status,
        activationsCount: licenseWithSensitiveData.activationsCount,
        activationsLimit: licenseWithSensitiveData.activationsLimit,
        expiresAt: licenseWithSensitiveData.expiresAt,
        course: licenseWithSensitiveData.course,
      });

      // Should not contain sensitive fields
      expect(data.data.licenseKey).not.toHaveProperty("paymentId");
      expect(data.data.licenseKey).not.toHaveProperty("customerId");
      expect(data.data.licenseKey).not.toHaveProperty("internalNotes");
      expect(data.data.licenseKey).not.toHaveProperty("activationDetails");
    });

    it("should handle case-sensitive license keys", async () => {
      const testCases = [
        "gamelearn-abcd-1234",
        "GAMELEARN-ABCD-1234",
        "GameLearn-AbCd-1234",
      ];

      for (const key of testCases) {
        mockLicenseKeyService.validateLicenseKey.mockResolvedValue({
          valid: true,
          reason: "Valid",
          licenseKey: { ...mockValidLicenseKey, key },
        });

        const request = createValidationRequest({
          key,
          userId: "user-1",
          courseId: "course-1",
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
        expect(mockLicenseKeyService.validateLicenseKey).toHaveBeenCalledWith(
          expect.objectContaining({ key })
        );

        mockLicenseKeyService.validateLicenseKey.mockClear();
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle malformed JSON request", async () => {
      const request = new NextRequest("http://localhost:3000/api/license/validate", {
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
      expect(data.error).toBe("License validation failed");
    });

    it("should handle empty request body", async () => {
      const request = new NextRequest("http://localhost:3000/api/license/validate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: "",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it("should handle license keys with special characters", async () => {
      const specialKeys = [
        "GAMELEARN-SPECIAL-KEY!@#",
        "GL_UNDERSCORE_KEY_123",
        "GL.DOT.SEPARATED.KEY",
        "GL+PLUS+SEPARATED+KEY",
      ];

      for (const key of specialKeys) {
        mockLicenseKeyService.validateLicenseKey.mockResolvedValue({
          valid: true,
          reason: "Valid",
          licenseKey: { ...mockValidLicenseKey, key },
        });

        const request = createValidationRequest({
          key,
          userId: "user-1",
          courseId: "course-1",
        });

        const response = await POST(request);
        expect(response.status).toBe(200);

        mockLicenseKeyService.validateLicenseKey.mockClear();
      }
    });

    it("should handle very long license keys", async () => {
      const longKey = "GAMELEARN-" + "A".repeat(100) + "-VERY-LONG-KEY";

      mockLicenseKeyService.validateLicenseKey.mockResolvedValue({
        valid: true,
        reason: "Valid long key",
        licenseKey: { ...mockValidLicenseKey, key: longKey },
      });

      const request = createValidationRequest({
        key: longKey,
        userId: "user-1",
        courseId: "course-1",
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockLicenseKeyService.validateLicenseKey).toHaveBeenCalledWith(
        expect.objectContaining({ key: longKey })
      );
    });
  });
});