import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createPosthogEmbed } from "@/lib/analytics/posthog-embed";

export const dynamic = "force-dynamic";

const embedRequestSchema = z
  .object({
    insightId: z.string().min(1).optional(),
    dashboardId: z.string().min(1).optional(),
    filters: z.record(z.any()).optional(),
    refresh: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    const hasInsight = Boolean(value.insightId);
    const hasDashboard = Boolean(value.dashboardId);

    if (!hasInsight && !hasDashboard) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either insightId or dashboardId must be provided.",
        path: ["insightId"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either insightId or dashboardId must be provided.",
        path: ["dashboardId"],
      });
    }

    if (hasInsight && hasDashboard) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one of insightId or dashboardId can be provided.",
        path: ["dashboardId"],
      });
    }
  });

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = embedRequestSchema.parse(json);

    const embed = await createPosthogEmbed(payload);

    return NextResponse.json(
      {
        success: true,
        data: embed,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Invalid request payload."
        : error instanceof Error
          ? error.message
          : "Failed to generate PostHog embed.";

    const status = error instanceof z.ZodError ? 400 : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
