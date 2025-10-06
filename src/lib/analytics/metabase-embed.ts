/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MetabaseEmbedOptions {
  dashboardId?: number;
  questionId?: number;
  filters?: Record<string, any>;
  parameters?: Record<string, any>;
  theme?: 'light' | 'dark' | 'transparent';
  bordered?: boolean;
  titled?: boolean;
}

export interface MetabaseEmbedResponse {
  url: string;
  iframeUrl: string;
  expiresAt: string;
}

/**
 * Creates a signed embed URL for Metabase dashboards/questions.
 *
 * NOTE: This helper relies on the following environment variables:
 * - METABASE_SITE_URL       (Base URL of your Metabase instance)
 * - METABASE_SECRET_KEY     (Secret key for signed embedding)
 * - METABASE_DATABASE_ID     (Database ID for the reporting database)
 */
export async function createMetabaseEmbed(
  options: MetabaseEmbedOptions,
): Promise<MetabaseEmbedResponse> {
  const siteUrl = process.env.METABASE_SITE_URL;
  const secretKey = process.env.METABASE_SECRET_KEY;

  if (!siteUrl) {
    throw new Error(
      "METABASE_SITE_URL is required to generate Metabase embed URLs.",
    );
  }

  if (!secretKey) {
    throw new Error(
      "METABASE_SECRET_KEY is required to generate signed Metabase embed URLs.",
    );
  }

  const payload = buildPayload(options);
  const token = await signPayload(payload, secretKey);
  const url = buildEmbedUrl(siteUrl, options, token);

  return {
    url,
    iframeUrl: url,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : "",
  };
}

function buildPayload(options: MetabaseEmbedOptions): any {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (60 * 60); // 1 hour from now

  const payload: any = {
    resource: {},
    params: options.parameters || {},
    exp: expiresAt,
  };

  if (options.dashboardId) {
    payload.resource.dashboard = options.dashboardId;
  } else if (options.questionId) {
    payload.resource.question = options.questionId;
  } else {
    throw new Error(
      "Either dashboardId or questionId must be provided for Metabase embed.",
    );
  }

  return payload;
}

async function signPayload(payload: any, secretKey: string): Promise<string> {
  // Import crypto for JWT signing
  const crypto = await import('crypto');

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

function buildEmbedUrl(
  siteUrl: string,
  options: MetabaseEmbedOptions,
  token: string,
): string {
  const baseUrl = siteUrl.replace(/\/$/, '');
  let path: string;

  if (options.dashboardId) {
    path = `/embed/dashboard/${token}#bordered=${options.bordered ?? true}&titled=${options.titled ?? true}&theme=${options.theme ?? 'light'}`;
  } else if (options.questionId) {
    path = `/embed/question/${token}#bordered=${options.bordered ?? true}&titled=${options.titled ?? true}&theme=${options.theme ?? 'light'}`;
  } else {
    throw new Error('Invalid embed options: missing dashboardId or questionId');
  }

  return `${baseUrl}${path}`;
}