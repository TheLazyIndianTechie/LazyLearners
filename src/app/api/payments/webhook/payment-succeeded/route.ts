import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueTemplateEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { paymentId, courseId, userId, amount, currency, customer } =
      await request.json();

    console.log("Processing payment success:", {
      paymentId,
      courseId,
      userId,
      amount,
      currency,
    });

    // Start a database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update payment record
      const payment = await tx.payment.upsert({
        where: { dodoPaymentId: paymentId },
        create: {
          dodoPaymentId: paymentId,
          status: "SUCCEEDED",
          amount,
          currency,
          userId,
          courseId,
          metadata: {
            customer,
            processedAt: new Date().toISOString(),
          },
        },
        update: {
          status: "SUCCEEDED",
          metadata: {
            customer,
            processedAt: new Date().toISOString(),
          },
        },
      });

      // 2. Generate license key for course access
      const licenseKey = await tx.licenseKey.create({
        data: {
          key: generateLicenseKey(),
          userId,
          courseId,
          paymentId: payment.id,
          status: "ACTIVE",
          activationsLimit: 3, // Allow 3 device activations
          activationsCount: 0,
          expiresAt: null, // No expiration for purchased courses
        },
      });

      // 3. Create course enrollment
      await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        create: {
          userId,
          courseId,
          status: "ACTIVE",
          enrolledAt: new Date(),
          accessType: "LICENSED",
        },
        update: {
          status: "ACTIVE",
          accessType: "LICENSED",
        },
      });

      return { payment, licenseKey };
    });

    console.log("Successfully processed payment and created license key:", {
      paymentId: result.payment.id,
      licenseKey: result.licenseKey.key,
    });

    // Send payment receipt and license key emails (async, non-blocking)
    try {
      const emailData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          enrollments: {
            where: { courseId },
            include: {
              course: {
                include: {
                  instructor: true,
                },
              },
            },
          },
        },
      });

      if (emailData?.email) {
        const course = emailData.enrollments[0]?.course;

        // Send payment receipt email
        queueTemplateEmail(
          emailData.email,
          "payment-receipt",
          {
            userName: emailData.name || "there",
            courseName: course?.name || "Course",
            amount,
            currency,
            paymentDate: new Date(),
            transactionId: paymentId,
            items: [
              {
                description: course?.name || "Course Purchase",
                amount: amount,
              },
            ],
            subtotal: amount,
            tax: 0,
            total: amount,
          },
          {
            correlationId: `payment-${result.payment.id}`,
            dedupeKey: `payment-receipt-${paymentId}`,
          },
        ).catch((error) =>
          console.error("Error queueing payment receipt:", error),
        );

        // Send license key email
        queueTemplateEmail(
          emailData.email,
          "license-key",
          {
            userName: emailData.name || "there",
            courseName: course?.name || "Course",
            licenseKey: result.licenseKey.key,
            activationUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/courses/${courseId}?activate=${result.licenseKey.key}`,
            expiresAt: result.licenseKey.expiresAt || undefined,
          },
          {
            correlationId: `license-${result.licenseKey.id}`,
            dedupeKey: `license-key-${result.licenseKey.key}`,
          },
        ).catch((error) =>
          console.error("Error queueing license key email:", error),
        );
      }
    } catch (error) {
      // Log error but don't fail the payment processing
      console.error("Error preparing payment emails:", error);
    }

    return NextResponse.json({
      success: true,
      paymentId: result.payment.id,
      licenseKey: result.licenseKey.key,
      message: "Course access granted successfully",
    });
  } catch (error) {
    console.error("Error processing payment success:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment success",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function generateLicenseKey(): string {
  // Generate a secure license key in format: XXXX-XXXX-XXXX-XXXX
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = Array.from({ length: 4 }, () => {
    return Array.from({ length: 4 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join("");
  });
  return segments.join("-");
}
