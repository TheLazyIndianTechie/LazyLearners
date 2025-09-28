'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { usePayments, type PaymentCustomer } from '@/hooks/use-payments'
import { toast } from 'sonner'
import { Loader2, CreditCard, ShoppingCart } from 'lucide-react'

interface PurchaseButtonProps {
  courseId: string
  courseName: string
  price: number
  currency?: string
  className?: string
  variant?: 'default' | 'secondary' | 'outline'
  size?: 'sm' | 'default' | 'lg'
  children?: React.ReactNode
}

export function PurchaseButton({
  courseId,
  courseName,
  price,
  currency = 'USD',
  className,
  variant = 'default',
  size = 'default',
  children,
}: PurchaseButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customer, setCustomer] = useState<PaymentCustomer>({
    name: '',
    email: '',
    phoneNumber: '',
  })
  const [discountCode, setDiscountCode] = useState('')

  const { isLoading, purchaseCourse, error, clearError } = usePayments()

  const handlePurchase = async () => {
    if (!customer.name || !customer.email) {
      toast.error('Please fill in your name and email')
      return
    }

    try {
      await purchaseCourse(courseId, customer, {
        discountCode: discountCode || undefined,
        courseName,
      })
    } catch (err) {
      console.error('Purchase failed:', err)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      clearError()
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100) // Assuming price is in cents
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {children || (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy Now - {formatPrice(price, currency)}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Course
          </DialogTitle>
          <DialogDescription>
            You're about to purchase "{courseName}" for {formatPrice(price, currency)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={customer.name}
              onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={customer.email}
              onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={customer.phoneNumber}
              onChange={(e) => setCustomer(prev => ({ ...prev, phoneNumber: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="discount">Discount Code (Optional)</Label>
            <Input
              id="discount"
              type="text"
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isLoading || !customer.name || !customer.email}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {formatPrice(price, currency)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}