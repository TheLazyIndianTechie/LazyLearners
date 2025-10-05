import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { queueTemplateEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Validate webhook secret exists
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.created") {
    try {
      const user = evt.data;
      const userEmail = user.email_addresses[0]?.email_address || "";
      const userName =
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || "there";

      // Create user in our database
      await prisma.user.create({
        data: {
          id: user.id,
          email: userEmail,
          name: userName !== "there" ? userName : null,
          image: user.image_url || null,
          role: (user.public_metadata?.role as string) || "STUDENT",
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
        },
      });

      console.log(`User ${user.id} created in database`);

      // Send welcome email (async, non-blocking)
      if (userEmail) {
        queueTemplateEmail(
          userEmail,
          "welcome",
          {
            userName,
            userEmail,
            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-in`,
          },
          {
            correlationId: `welcome-${user.id}`,
            dedupeKey: `welcome-user-${user.id}`,
          },
        ).catch((error) => {
          // Log error but don't fail the webhook
          console.error("Error queueing welcome email:", error);
        });
      }
    } catch (error) {
      console.error("Error creating user in database:", error);
      return new Response("Error creating user", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    try {
      const user = evt.data;

      // Update user in our database
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email_addresses[0]?.email_address || "",
          name:
            `${user.first_name || ""} ${user.last_name || ""}`.trim() || null,
          image: user.image_url || null,
          role: (user.public_metadata?.role as string) || "STUDENT",
          updatedAt: new Date(user.updated_at),
        },
        create: {
          id: user.id,
          email: user.email_addresses[0]?.email_address || "",
          name:
            `${user.first_name || ""} ${user.last_name || ""}`.trim() || null,
          image: user.image_url || null,
          role: (user.public_metadata?.role as string) || "STUDENT",
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
        },
      });

      console.log(`User ${user.id} updated in database`);
    } catch (error) {
      console.error("Error updating user in database:", error);
      return new Response("Error updating user", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    try {
      const user = evt.data;

      // Delete user from our database
      await prisma.user.delete({
        where: { id: user.id as string },
      });

      console.log(`User ${user.id} deleted from database`);
    } catch (error) {
      console.error("Error deleting user from database:", error);
      return new Response("Error deleting user", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
