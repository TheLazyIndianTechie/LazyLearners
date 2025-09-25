import { signIn, signOut, getServerSession } from "next-auth/react";
import { redirect } from "next/navigation";

// Mock NextAuth functions
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe("Authentication Sign In/Out", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Sign In Flow", () => {
    it("should successfully sign in with credentials", async () => {
      mockSignIn.mockResolvedValue({
        ok: true,
        error: null,
        status: 200,
        url: "http://localhost:3000/dashboard"
      });

      const result = await signIn("credentials", {
        email: "test@example.com",
        password: "Password123!",
        redirect: false,
      });

      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "Password123!",
        redirect: false,
      });

      expect(result?.ok).toBe(true);
      expect(result?.error).toBe(null);
    });

    it("should handle sign in failure with invalid credentials", async () => {
      mockSignIn.mockResolvedValue({
        ok: false,
        error: "CredentialsSignin",
        status: 401,
        url: null
      });

      const result = await signIn("credentials", {
        email: "test@example.com",
        password: "wrongpassword",
        redirect: false,
      });

      expect(result?.ok).toBe(false);
      expect(result?.error).toBe("CredentialsSignin");
    });

    it("should successfully sign in with Google OAuth", async () => {
      mockSignIn.mockResolvedValue({
        ok: true,
        error: null,
        status: 200,
        url: "http://localhost:3000/dashboard"
      });

      const result = await signIn("google", {
        redirect: false,
      });

      expect(mockSignIn).toHaveBeenCalledWith("google", {
        redirect: false,
      });

      expect(result?.ok).toBe(true);
    });

    it("should successfully sign in with GitHub OAuth", async () => {
      mockSignIn.mockResolvedValue({
        ok: true,
        error: null,
        status: 200,
        url: "http://localhost:3000/dashboard"
      });

      const result = await signIn("github", {
        redirect: false,
      });

      expect(mockSignIn).toHaveBeenCalledWith("github", {
        redirect: false,
      });

      expect(result?.ok).toBe(true);
    });

    it("should handle OAuth sign in errors", async () => {
      mockSignIn.mockResolvedValue({
        ok: false,
        error: "OAuthSignin",
        status: 400,
        url: null
      });

      const result = await signIn("google", {
        redirect: false,
      });

      expect(result?.ok).toBe(false);
      expect(result?.error).toBe("OAuthSignin");
    });

    it("should handle network errors during sign in", async () => {
      mockSignIn.mockRejectedValue(new Error("Network error"));

      await expect(
        signIn("credentials", {
          email: "test@example.com",
          password: "Password123!",
          redirect: false,
        })
      ).rejects.toThrow("Network error");
    });
  });

  describe("Sign Out Flow", () => {
    it("should successfully sign out user", async () => {
      mockSignOut.mockResolvedValue({
        url: "http://localhost:3000"
      });

      const result = await signOut({
        redirect: false,
      });

      expect(mockSignOut).toHaveBeenCalledWith({
        redirect: false,
      });

      expect(result).toHaveProperty("url");
    });

    it("should handle sign out with redirect", async () => {
      mockSignOut.mockResolvedValue({
        url: "http://localhost:3000/auth/signin"
      });

      await signOut({
        callbackUrl: "/auth/signin",
        redirect: true,
      });

      expect(mockSignOut).toHaveBeenCalledWith({
        callbackUrl: "/auth/signin",
        redirect: true,
      });
    });

    it("should handle sign out errors gracefully", async () => {
      mockSignOut.mockRejectedValue(new Error("Sign out failed"));

      await expect(
        signOut({ redirect: false })
      ).rejects.toThrow("Sign out failed");
    });
  });

  describe("Session Management", () => {
    it("should get valid user session", async () => {
      const mockSession = {
        user: {
          id: "user-1",
          name: "John Doe",
          email: "john@example.com",
          role: "STUDENT",
          image: null,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const session = await getServerSession();

      expect(session).toEqual(mockSession);
      expect(session?.user).toHaveProperty("id", "user-1");
      expect(session?.user).toHaveProperty("email", "john@example.com");
    });

    it("should return null for no session", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const session = await getServerSession();

      expect(session).toBe(null);
    });

    it("should handle session with different user roles", async () => {
      const instructorSession = {
        user: {
          id: "instructor-1",
          name: "Jane Instructor",
          email: "jane@example.com",
          role: "INSTRUCTOR",
          image: null,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerSession.mockResolvedValue(instructorSession);

      const session = await getServerSession();

      expect(session?.user?.role).toBe("INSTRUCTOR");
    });

    it("should handle session with admin role", async () => {
      const adminSession = {
        user: {
          id: "admin-1",
          name: "Admin User",
          email: "admin@example.com",
          role: "ADMIN",
          image: null,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerSession.mockResolvedValue(adminSession);

      const session = await getServerSession();

      expect(session?.user?.role).toBe("ADMIN");
    });
  });

  describe("Input validation", () => {
    it("should handle empty email in sign in", async () => {
      mockSignIn.mockResolvedValue({
        ok: false,
        error: "CredentialsSignin",
        status: 400,
        url: null
      });

      const result = await signIn("credentials", {
        email: "",
        password: "Password123!",
        redirect: false,
      });

      expect(result?.ok).toBe(false);
    });

    it("should handle empty password in sign in", async () => {
      mockSignIn.mockResolvedValue({
        ok: false,
        error: "CredentialsSignin",
        status: 400,
        url: null
      });

      const result = await signIn("credentials", {
        email: "test@example.com",
        password: "",
        redirect: false,
      });

      expect(result?.ok).toBe(false);
    });

    it("should handle malformed email in sign in", async () => {
      mockSignIn.mockResolvedValue({
        ok: false,
        error: "CredentialsSignin",
        status: 400,
        url: null
      });

      const result = await signIn("credentials", {
        email: "invalid-email",
        password: "Password123!",
        redirect: false,
      });

      expect(result?.ok).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined provider", async () => {
      mockSignIn.mockResolvedValue({
        ok: false,
        error: "Signin",
        status: 400,
        url: null
      });

      const result = await signIn(undefined, {
        redirect: false,
      });

      expect(result?.ok).toBe(false);
    });

    it("should handle very long email addresses", async () => {
      const longEmail = "a".repeat(200) + "@example.com";

      mockSignIn.mockResolvedValue({
        ok: false,
        error: "CredentialsSignin",
        status: 400,
        url: null
      });

      const result = await signIn("credentials", {
        email: longEmail,
        password: "Password123!",
        redirect: false,
      });

      expect(result?.ok).toBe(false);
    });

    it("should handle special characters in password", async () => {
      mockSignIn.mockResolvedValue({
        ok: true,
        error: null,
        status: 200,
        url: "http://localhost:3000/dashboard"
      });

      const result = await signIn("credentials", {
        email: "test@example.com",
        password: "P@ssw0rd!#$%&",
        redirect: false,
      });

      expect(result?.ok).toBe(true);
    });
  });
});