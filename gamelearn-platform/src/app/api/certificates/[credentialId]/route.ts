import { NextRequest, NextResponse } from "next/server"
import { verifyCertificate } from "@/lib/progress"

export async function GET(
  request: NextRequest,
  { params }: { params: { credentialId: string } }
) {
  try {
    const { credentialId } = params

    if (!credentialId) {
      return NextResponse.json(
        { error: "Credential ID is required" },
        { status: 400 }
      )
    }

    const certificate = await verifyCertificate(credentialId)

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: certificate,
    })
  } catch (error) {
    console.error("Error verifying certificate:", error)
    return NextResponse.json(
      { error: "Failed to verify certificate" },
      { status: 500 }
    )
  }
}