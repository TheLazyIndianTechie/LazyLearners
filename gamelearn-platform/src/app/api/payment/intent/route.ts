import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { createPaymentIntent } from "@/lib/payment"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, currency = "USD", courseId, couponCode } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const metadata: Record<string, any> = {}
    if (courseId) metadata.courseId = courseId
    if (couponCode) metadata.couponCode = couponCode

    const paymentIntent = await createPaymentIntent(
      userId,
      amount,
      currency,
      metadata
    )

    if (!paymentIntent) {
      return NextResponse.json(
        { error: "Failed to create payment intent" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}