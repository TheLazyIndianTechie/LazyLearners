import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/validations/auth";
import { ZodError } from "zod";

describe("Auth Validation Schemas", () => {
  describe("registerSchema", () => {
    it("should validate valid registration data", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        role: "STUDENT" as const,
      };

      const result = registerSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should default role to STUDENT when not provided", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
      };

      const result = registerSchema.parse(data);
      expect(result.role).toBe("STUDENT");
    });

    it("should convert email to lowercase", () => {
      const data = {
        name: "John Doe",
        email: "JOHN@EXAMPLE.COM",
        password: "Password123!",
      };

      const result = registerSchema.parse(data);
      expect(result.email).toBe("john@example.com");
    });

    describe("name validation", () => {
      it("should reject name that's too short", () => {
        const data = {
          name: "J",
          email: "john@example.com",
          password: "Password123!",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
        try {
          registerSchema.parse(data);
        } catch (error) {
          expect((error as ZodError).errors[0].message).toBe("Name must be at least 2 characters");
        }
      });

      it("should reject name that's too long", () => {
        const data = {
          name: "a".repeat(101),
          email: "john@example.com",
          password: "Password123!",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it("should reject name with numbers", () => {
        const data = {
          name: "John123",
          email: "john@example.com",
          password: "Password123!",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
        try {
          registerSchema.parse(data);
        } catch (error) {
          expect((error as ZodError).errors[0].message).toBe("Name can only contain letters and spaces");
        }
      });

      it("should reject name with special characters", () => {
        const data = {
          name: "John@Doe",
          email: "john@example.com",
          password: "Password123!",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it("should accept name with spaces", () => {
        const data = {
          name: "John Doe Smith",
          email: "john@example.com",
          password: "Password123!",
        };

        const result = registerSchema.parse(data);
        expect(result.name).toBe("John Doe Smith");
      });
    });

    describe("email validation", () => {
      it("should reject invalid email formats", () => {
        const testCases = [
          "invalid",
          "invalid@",
          "@example.com",
          "invalid.email",
          "invalid..email@example.com",
        ];

        testCases.forEach(email => {
          const data = {
            name: "John Doe",
            email,
            password: "Password123!",
          };

          expect(() => registerSchema.parse(data)).toThrow(ZodError);
        });
      });

      it("should reject email that's too long", () => {
        const longEmail = "a".repeat(250) + "@example.com";
        const data = {
          name: "John Doe",
          email: longEmail,
          password: "Password123!",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });
    });

    describe("password validation", () => {
      it("should reject password that's too short", () => {
        const data = {
          name: "John Doe",
          email: "john@example.com",
          password: "Short1!",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it("should reject password without uppercase letter", () => {
        const data = {
          name: "John Doe",
          email: "john@example.com",
          password: "password123!",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it("should reject password without lowercase letter", () => {
        const data = {
          name: "John Doe",
          email: "john@example.com",
          password: "PASSWORD123!",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it("should reject password without number", () => {
        const data = {
          name: "John Doe",
          email: "john@example.com",
          password: "Password!",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it("should reject password without special character", () => {
        const data = {
          name: "John Doe",
          email: "john@example.com",
          password: "Password123",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });

      it("should accept password with all requirements", () => {
        const data = {
          name: "John Doe",
          email: "john@example.com",
          password: "Password123!@#$%",
        };

        const result = registerSchema.parse(data);
        expect(result.password).toBe("Password123!@#$%");
      });
    });

    describe("role validation", () => {
      it("should accept valid roles", () => {
        const roles = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;

        roles.forEach(role => {
          const data = {
            name: "John Doe",
            email: "john@example.com",
            password: "Password123!",
            role,
          };

          const result = registerSchema.parse(data);
          expect(result.role).toBe(role);
        });
      });

      it("should reject invalid roles", () => {
        const data = {
          name: "John Doe",
          email: "john@example.com",
          password: "Password123!",
          role: "INVALID_ROLE",
        };

        expect(() => registerSchema.parse(data)).toThrow(ZodError);
      });
    });
  });

  describe("loginSchema", () => {
    it("should validate valid login data", () => {
      const validData = {
        email: "john@example.com",
        password: "password123",
      };

      const result = loginSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should convert email to lowercase", () => {
      const data = {
        email: "JOHN@EXAMPLE.COM",
        password: "password123",
      };

      const result = loginSchema.parse(data);
      expect(result.email).toBe("john@example.com");
    });

    it("should reject invalid email", () => {
      const data = {
        email: "invalid-email",
        password: "password123",
      };

      expect(() => loginSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject empty password", () => {
      const data = {
        email: "john@example.com",
        password: "",
      };

      expect(() => loginSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("passwordResetRequestSchema", () => {
    it("should validate valid email", () => {
      const validData = { email: "john@example.com" };
      const result = passwordResetRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should convert email to lowercase", () => {
      const data = { email: "JOHN@EXAMPLE.COM" };
      const result = passwordResetRequestSchema.parse(data);
      expect(result.email).toBe("john@example.com");
    });

    it("should reject invalid email", () => {
      const data = { email: "invalid-email" };
      expect(() => passwordResetRequestSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("passwordResetSchema", () => {
    it("should validate valid reset data", () => {
      const validData = {
        token: "550e8400-e29b-41d4-a716-446655440000",
        password: "NewPassword123!",
      };

      const result = passwordResetSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject invalid UUID token", () => {
      const data = {
        token: "invalid-token",
        password: "NewPassword123!",
      };

      expect(() => passwordResetSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject weak password", () => {
      const data = {
        token: "550e8400-e29b-41d4-a716-446655440000",
        password: "weak",
      };

      expect(() => passwordResetSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("changePasswordSchema", () => {
    it("should validate valid change password data", () => {
      const validData = {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      };

      const result = changePasswordSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should reject empty current password", () => {
      const data = {
        currentPassword: "",
        newPassword: "NewPassword123!",
      };

      expect(() => changePasswordSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject weak new password", () => {
      const data = {
        currentPassword: "OldPassword123!",
        newPassword: "weak",
      };

      expect(() => changePasswordSchema.parse(data)).toThrow(ZodError);
    });
  });

  describe("updateProfileSchema", () => {
    it("should validate valid profile data", () => {
      const validData = {
        name: "John Doe",
        avatar: "https://example.com/avatar.jpg",
        bio: "Game developer and instructor",
        location: "San Francisco, CA",
        website: "https://johndoe.com",
        socialLinks: {
          twitter: "https://twitter.com/johndoe",
          linkedin: "https://linkedin.com/in/johndoe",
          github: "https://github.com/johndoe",
          discord: "johndoe#1234",
        },
      };

      const result = updateProfileSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should accept partial profile data", () => {
      const data = {
        name: "John Doe",
        bio: "Game developer",
      };

      const result = updateProfileSchema.parse(data);
      expect(result.name).toBe("John Doe");
      expect(result.bio).toBe("Game developer");
      expect(result.avatar).toBeUndefined();
    });

    it("should reject invalid avatar URL", () => {
      const data = {
        avatar: "not-a-url",
      };

      expect(() => updateProfileSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject invalid website URL", () => {
      const data = {
        website: "not-a-url",
      };

      expect(() => updateProfileSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject bio that's too long", () => {
      const data = {
        bio: "a".repeat(1001),
      };

      expect(() => updateProfileSchema.parse(data)).toThrow(ZodError);
    });

    it("should reject invalid social links", () => {
      const data = {
        socialLinks: {
          twitter: "not-a-url",
        },
      };

      expect(() => updateProfileSchema.parse(data)).toThrow(ZodError);
    });

    it("should accept valid social links", () => {
      const data = {
        socialLinks: {
          twitter: "https://twitter.com/johndoe",
          linkedin: "https://linkedin.com/in/johndoe",
          github: "https://github.com/johndoe",
          discord: "johndoe#1234",
        },
      };

      const result = updateProfileSchema.parse(data);
      expect(result.socialLinks).toEqual(data.socialLinks);
    });
  });
});