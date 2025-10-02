"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CreditCard,
  Lock,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Cart as CartType } from "@/lib/types/payment"
import Image from "next/image"

export default function CheckoutPage() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()

  const [cart, setCart] = useState<CartType | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US"
    }
  })
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: ""
  })
  const [savePaymentMethod, setSavePaymentMethod] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/auth/signin?callbackUrl=/checkout")
      return
    }

    fetchCart()
  }, [isSignedIn, router])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/cart")
      if (response.ok) {
        const data = await response.json()
        setCart(data.cart)

        // Pre-fill email from user
        if (user?.emailAddresses?.[0]?.emailAddress) {
          setBillingDetails(prev => ({
            ...prev,
            email: user.emailAddresses[0].emailAddress || "",
            name: user.fullName || ""
          }))
        }
      } else {
        setError("Failed to load cart")
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
      setError("Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("address.")) {
      const addressField = field.split(".")[1]
      setBillingDetails(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setBillingDetails(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleCardInputChange = (field: string, value: string) => {
    // Basic formatting for card inputs
    if (field === "number") {
      value = value.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim()
      if (value.length > 19) return
    } else if (field === "expiry") {
      value = value.replace(/\D/g, "")
      if (value.length >= 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4)
      }
      if (value.length > 5) return
    } else if (field === "cvc") {
      value = value.replace(/\D/g, "")
      if (value.length > 4) return
    }

    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!billingDetails.name.trim()) return "Name is required"
    if (!billingDetails.email.trim()) return "Email is required"
    if (!billingDetails.address.line1.trim()) return "Address is required"
    if (!billingDetails.address.city.trim()) return "City is required"
    if (!billingDetails.address.postalCode.trim()) return "Postal code is required"

    if (paymentMethod === "card") {
      if (!cardDetails.number.replace(/\s/g, "")) return "Card number is required"
      if (!cardDetails.expiry) return "Expiry date is required"
      if (!cardDetails.cvc) return "CVC is required"
      if (!cardDetails.name.trim()) return "Cardholder name is required"
    }

    if (!agreeToTerms) return "You must agree to the terms and conditions"

    return null
  }

  const processPayment = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!cart) {
      setError("Cart not found")
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Step 1: Create payment intent
      const intentResponse = await fetch("/api/payment/intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: cart.total * 100, // Convert to cents
          currency: cart.currency,
          courseIds: cart.items.map(item => item.courseId)
        })
      })

      if (!intentResponse.ok) {
        throw new Error("Failed to create payment intent")
      }

      const { paymentIntent } = await intentResponse.json()

      // Step 2: Process payment
      const paymentResponse = await fetch("/api/payment/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          paymentMethodId: "pm_demo_card", // Demo payment method
          billingDetails
        })
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        throw new Error(errorData.error || "Payment failed")
      }

      const { success, enrollment } = await paymentResponse.json()

      if (success) {
        setSuccess(true)
        // Redirect to success page after a short delay
        setTimeout(() => {
          router.push("/dashboard/courses")
        }, 2000)
      } else {
        throw new Error("Payment was not successful")
      }

    } catch (error) {
      console.error("Payment error:", error)
      setError(error instanceof Error ? error.message : "Payment failed")
    } finally {
      setProcessing(false)
    }
  }

  if (!isSignedIn) {
    return <div>Redirecting to login...</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              You have been enrolled in your courses. Redirecting to dashboard...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Cart is Empty</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Add some courses to your cart before checking out.
            </p>
            <Button onClick={() => router.push("/courses")}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment form */}
          <div className="space-y-6">
            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={billingDetails.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={billingDetails.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address1">Address Line 1 *</Label>
                  <Input
                    id="address1"
                    value={billingDetails.address.line1}
                    onChange={(e) => handleInputChange("address.line1", e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    value={billingDetails.address.line2}
                    onChange={(e) => handleInputChange("address.line2", e.target.value)}
                    placeholder="Apartment, suite, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={billingDetails.address.city}
                      onChange={(e) => handleInputChange("address.city", e.target.value)}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={billingDetails.address.state}
                      onChange={(e) => handleInputChange("address.state", e.target.value)}
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal">Postal Code *</Label>
                    <Input
                      id="postal"
                      value={billingDetails.address.postalCode}
                      onChange={(e) => handleInputChange("address.postalCode", e.target.value)}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit/Debit Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 opacity-50">
                    <RadioGroupItem value="paypal" id="paypal" disabled />
                    <Label htmlFor="paypal">PayPal (Coming Soon)</Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input
                        id="cardNumber"
                        value={cardDetails.number}
                        onChange={(e) => handleCardInputChange("number", e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry Date *</Label>
                        <Input
                          id="expiry"
                          value={cardDetails.expiry}
                          onChange={(e) => handleCardInputChange("expiry", e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvc">CVC *</Label>
                        <Input
                          id="cvc"
                          value={cardDetails.cvc}
                          onChange={(e) => handleCardInputChange("cvc", e.target.value)}
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cardName">Cardholder Name *</Label>
                      <Input
                        id="cardName"
                        value={cardDetails.name}
                        onChange={(e) => handleCardInputChange("name", e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saveCard"
                        checked={savePaymentMethod}
                        onCheckedChange={(checked) => setSavePaymentMethod(checked as boolean)}
                      />
                      <Label htmlFor="saveCard" className="text-sm">
                        Save this payment method for future purchases
                      </Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms and conditions */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </Label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart items */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-12 rounded overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                        {item.course?.thumbnail && (
                          <Image
                            src={item.course.thumbnail}
                            alt={item.course.title || "Course"}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.course?.title || "Course"}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          by {item.course?.instructor?.name || "Instructor"}
                        </p>
                        <div className="mt-1">
                          {item.discountedPrice && item.discountedPrice < item.price ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-green-600">
                                ${item.discountedPrice.toFixed(2)}
                              </span>
                              <span className="text-xs text-slate-500 line-through">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold">
                              ${item.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>

                  {cart.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-${cart.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${cart.taxAmount.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${cart.total.toFixed(2)} {cart.currency}</span>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={processPayment}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {processing ? "Processing..." : `Pay $${cart.total.toFixed(2)}`}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  Your payment information is secure and encrypted
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}