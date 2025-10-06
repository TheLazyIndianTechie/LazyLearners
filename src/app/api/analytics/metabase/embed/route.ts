import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

import { createMetabaseEmbed } from "@/lib/analytics/metabase-embed";

export const dynamic = "force-dynamic";

const embedRequestSchema = z
  .object({
    dashboardId: z.number().int().positive().optional(),
    questionId: z.number().int().positive().optional(),
    filters: z.record(z.any()).optional(),
    parameters: z.record(z.any()).optional(),
    theme: z.enum(['light', 'dark', 'transparent']).optional(),
    bordered: z.boolean().optional(),
    titled: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    const hasDashboard = Boolean(value.dashboardId);
    const hasQuestion = Boolean(value.questionId);

    if (!hasDashboard && !hasQuestion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either dashboardId or questionId must be provided.",
        path: ["dashboardId"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either dashboardId or questionId must be provided.",
        path: ["questionId"],
      });
    }

    if (hasDashboard && hasQuestion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one of dashboardId or questionId can be provided.",
        path: ["questionId"],
      });
    }
  });

export async function POST(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const payload = embedRequestSchema.parse(json);

    // Add instructor-specific parameters for data filtering
    const enhancedPayload = {
      ...payload,
      parameters: {
        ...payload.parameters,
        instructor_id: userId, // Filter data by instructor
      },
    };

    const embed = await createMetabaseEmbed(enhancedPayload);

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
          : "Failed to generate Metabase embed.";

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