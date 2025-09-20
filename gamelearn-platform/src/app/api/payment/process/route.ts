import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { processPayment, enrollUserInCourse } from "@/lib/payment"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { paymentIntentId, paymentMethodId, billingDetails } = await request.json()

    if (!paymentIntentId || !paymentMethodId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = await processPayment(paymentIntentId, paymentMethodId, billingDetails)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Payment failed" },
        { status: 400 }
      )
    }

    // If payment succeeded and there's a courseId in metadata, enroll the user
    let enrollment = null
    if (result.payment && result.payment.metadata) {
      try {
        const metadata = JSON.parse(result.payment.metadata as string)
        if (metadata.courseId) {
          enrollment = await enrollUserInCourse(
            session.user.id,
            metadata.courseId,
            result.payment.id
          )
        }
      } catch (error) {
        console.error("Error parsing payment metadata:", error)
      }
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      enrollment
    })
  } catch (error) {
    console.error("Error processing payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}