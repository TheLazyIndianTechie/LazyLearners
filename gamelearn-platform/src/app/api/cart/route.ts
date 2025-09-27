import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { getOrCreateCart, addToCart, removeFromCart } from "@/lib/payment"

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cart = await getOrCreateCart(userId)

    if (!cart) {
      return NextResponse.json({ error: "Failed to get cart" }, { status: 500 })
    }

    return NextResponse.json({ cart })
  } catch (error) {
    console.error("Error getting cart:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, courseId } = await request.json()

    if (!action || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let result
    switch (action) {
      case "add":
        result = await addToCart(userId, courseId)
        break
      case "remove":
        result = await removeFromCart(userId, courseId)
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Action failed" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      cart: result.cart
    })
  } catch (error) {
    console.error("Error updating cart:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}