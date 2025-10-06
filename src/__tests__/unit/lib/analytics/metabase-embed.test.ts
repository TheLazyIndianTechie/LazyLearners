import { createMetabaseEmbed } from "@/lib/analytics/metabase-embed";

// Mock environment variables
const mockEnv = {
  METABASE_SITE_URL: "https://metabase.example.com",
  METABASE_SECRET_KEY: "test-secret-key",
};

Object.assign(process.env, mockEnv);

// Mock crypto
const mockCrypto = {
  createHmac: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => Buffer.from("mock-signature", "utf8")),
    })),
  })),
};

jest.mock("crypto", () => mockCrypto);

describe("createMetabaseEmbed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create embed URL for dashboard", async () => {
    const options = {
      dashboardId: 123,
      filters: { course_id: 456 },
      theme: 'light' as const,
      bordered: true,
      titled: true,
    };

    const result = await createMetabaseEmbed(options);

    expect(result.url).toContain("https://metabase.example.com/embed/dashboard/");
    expect(result.iframeUrl).toBe(result.url);
    expect(result.expiresAt).toBeDefined();
  });

  it("should create embed URL for question", async () => {
    const options = {
      questionId: 456,
      parameters: { instructor_id: "user-123" },
    };

    const result = await createMetabaseEmbed(options);

    expect(result.url).toContain("https://metabase.example.com/embed/question/");
    expect(result.iframeUrl).toBe(result.url);
  });

  it("should throw error when neither dashboardId nor questionId is provided", async () => {
    const options = {
      filters: { test: true },
    };

    await expect(createMetabaseEmbed(options as any)).rejects.toThrow(
      "Either dashboardId or questionId must be provided for Metabase embed."
    );
  });

  it("should throw error when both dashboardId and questionId are provided", async () => {
    const options = {
      dashboardId: 123,
      questionId: 456,
    };

    await expect(createMetabaseEmbed(options)).rejects.toThrow(
      "Only one of dashboardId or questionId can be provided."
    );
  });

  it("should throw error when METABASE_SITE_URL is not set", async () => {
    const originalUrl = process.env.METABASE_SITE_URL;
    delete process.env.METABASE_SITE_URL;

    const options = { dashboardId: 123 };

    await expect(createMetabaseEmbed(options)).rejects.toThrow(
      "METABASE_SITE_URL is required to generate Metabase embed URLs."
    );

    process.env.METABASE_SITE_URL = originalUrl;
  });

  it("should throw error when METABASE_SECRET_KEY is not set", async () => {
    const originalKey = process.env.METABASE_SECRET_KEY;
    delete process.env.METABASE_SECRET_KEY;

    const options = { dashboardId: 123 };

    await expect(createMetabaseEmbed(options)).rejects.toThrow(
      "METABASE_SECRET_KEY is required to generate signed Metabase embed URLs."
    );

    process.env.METABASE_SECRET_KEY = originalKey;
  });

  it("should include theme and border parameters in URL", async () => {
    const options = {
      dashboardId: 123,
      theme: 'dark' as const,
      bordered: false,
      titled: false,
    };

    const result = await createMetabaseEmbed(options);

    expect(result.url).toContain("bordered=false");
    expect(result.url).toContain("titled=false");
    expect(result.url).toContain("theme=dark");
  });
});