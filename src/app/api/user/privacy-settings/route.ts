import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface PrivacySettings {
  analyticsEnabled: boolean;
  marketingEmails: boolean;
  dataRetention: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's privacy settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        privacySettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Default settings if none exist
    const defaultSettings: PrivacySettings = {
      analyticsEnabled: true,
      marketingEmails: true,
      dataRetention: true,
    };

    const settings = user.privacySettings
      ? JSON.parse(user.privacySettings)
      : defaultSettings;

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings: PrivacySettings = await request.json();

    // Validate settings
    if (
      typeof settings.analyticsEnabled !== 'boolean' ||
      typeof settings.marketingEmails !== 'boolean' ||
      typeof settings.dataRetention !== 'boolean'
    ) {
      return NextResponse.json(
        { error: "Invalid settings format" },
        { status: 400 }
      );
    }

    // Update user's privacy settings
    await prisma.user.update({
      where: { id: userId },
      data: {
        privacySettings: JSON.stringify(settings),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}