"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Tag,
  CreditCard,
  ArrowRight,
  X
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Cart as CartType, CartItem } from "@/lib/types/payment"
import Image from "next/image"

interface CartProps {
  isOpen: boolean
  onClose: () => void
}

export function Cart({ isOpen, onClose }: CartProps) {
  const [cart, setCart] = useState<CartType | null>(null)
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState("")
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      fetchCart()
    }
  }, [isOpen])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/cart")
      if (response.ok) {
        const data = await response.json()
        setCart(data.cart)
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (courseId: string) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "remove",
          courseId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCart(data.cart)
      }
    } catch (error) {
      console.error("Error removing from cart:", error)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim() || !cart) return

    try {
      setApplyingCoupon(true)
      const response = await fetch("/api/coupon/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cartId: cart.id,
          code: couponCode
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          fetchCart() // Refresh cart to get updated totals
          setCouponCode("")
        } else {
          alert(data.error || "Failed to apply coupon")
        }
      }
    } catch (error) {
      console.error("Error applying coupon:", error)
    } finally {
      setApplyingCoupon(false)
    }
  }

  const proceedToCheckout = () => {
    if (cart && cart.items.length > 0) {
      router.push("/checkout")
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Cart sidebar */}
      <div className="relative ml-auto w-full max-w-md bg-white dark:bg-slate-900 shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Shopping Cart</h2>
              {cart && (
                <Badge variant="secondary">
                  {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">Loading...</div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Add some courses to get started
                </p>
                <Button onClick={onClose}>Continue Shopping</Button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Cart items */}
                {cart.items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
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

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              {item.discountedPrice && item.discountedPrice < item.price ? (
                                <>
                                  <span className="text-sm font-semibold text-green-600">
                                    ${item.discountedPrice.toFixed(2)}
                                  </span>
                                  <span className="text-xs text-slate-500 line-through">
                                    ${item.price.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm font-semibold">
                                  ${item.price.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.courseId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Coupon section */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4" />
                      <span className="text-sm font-medium">Coupon Code</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={applyCoupon}
                        disabled={!couponCode.trim() || applyingCoupon}
                      >
                        Apply
                      </Button>
                    </div>
                    {cart.couponCode && (
                      <div className="mt-2 text-xs text-green-600">
                        Coupon "{cart.couponCode}" applied
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order summary */}
                <Card>
                  <CardContent className="p-4 space-y-2">
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

                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${cart.total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Footer */}
          {cart && cart.items.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                className="w-full gap-2"
                onClick={proceedToCheckout}
              >
                <CreditCard className="w-4 h-4" />
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}