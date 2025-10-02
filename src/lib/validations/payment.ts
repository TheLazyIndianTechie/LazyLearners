import { z } from "zod"

// Payment intent validation
export const createPaymentIntentSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(999999, "Amount too large")
    .multipleOf(0.01, "Amount must be a valid currency value"),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters")
    .regex(/^[A-Z]{3}$/, "Currency must be uppercase letters")
    .default("USD"),
  courseId: z
    .string()
    .uuid("Invalid course ID")
    .optional(),
  couponCode: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(50, "Coupon code must be less than 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Coupon code can only contain uppercase letters, numbers, hyphens, and underscores")
    .optional(),
})

// Process payment validation
export const processPaymentSchema = z.object({
  paymentIntentId: z
    .string()
    .uuid("Invalid payment intent ID"),
  paymentMethodId: z
    .string()
    .min(1, "Payment method ID is required")
    .max(255, "Payment method ID too long"),
  billingDetails: z
    .object({
      name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters"),
      email: z
        .string()
        .email("Invalid email address")
        .max(255, "Email must be less than 255 characters"),
      phone: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
        .optional(),
      address: z.object({
        line1: z
          .string()
          .min(5, "Address line 1 must be at least 5 characters")
          .max(255, "Address line 1 must be less than 255 characters"),
        line2: z
          .string()
          .max(255, "Address line 2 must be less than 255 characters")
          .optional(),
        city: z
          .string()
          .min(2, "City must be at least 2 characters")
          .max(100, "City must be less than 100 characters"),
        state: z
          .string()
          .max(100, "State must be less than 100 characters")
          .optional(),
        postalCode: z
          .string()
          .min(3, "Postal code must be at least 3 characters")
          .max(20, "Postal code must be less than 20 characters"),
        country: z
          .string()
          .length(2, "Country must be 2 characters")
          .regex(/^[A-Z]{2}$/, "Country must be uppercase letters"),
      }),
    })
    .optional(),
})

// Cart operations validation
export const cartOperationSchema = z.object({
  action: z.enum(["add", "remove"], {
    errorMap: () => ({ message: "Action must be 'add' or 'remove'" }),
  }),
  courseId: z
    .string()
    .uuid("Invalid course ID"),
})

// Apply coupon validation
export const applyCouponSchema = z.object({
  cartId: z
    .string()
    .uuid("Invalid cart ID"),
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(50, "Coupon code must be less than 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Coupon code can only contain uppercase letters, numbers, hyphens, and underscores"),
})

// Subscription creation validation
export const createSubscriptionSchema = z.object({
  planId: z
    .string()
    .uuid("Invalid plan ID"),
  paymentMethodId: z
    .string()
    .min(1, "Payment method ID is required")
    .max(255, "Payment method ID too long"),
  couponCode: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(50, "Coupon code must be less than 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Coupon code can only contain uppercase letters, numbers, hyphens, and underscores")
    .optional(),
  trialPeriodDays: z
    .number()
    .min(1, "Trial period must be at least 1 day")
    .max(365, "Trial period must be less than 365 days")
    .optional(),
})

// Cancel subscription validation
export const cancelSubscriptionSchema = z.object({
  subscriptionId: z
    .string()
    .uuid("Invalid subscription ID"),
  immediately: z
    .boolean()
    .default(false),
  reason: z
    .string()
    .max(500, "Reason must be less than 500 characters")
    .optional(),
})

// Refund request validation
export const createRefundSchema = z.object({
  paymentId: z
    .string()
    .uuid("Invalid payment ID"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(999999, "Amount too large")
    .multipleOf(0.01, "Amount must be a valid currency value")
    .optional(),
  reason: z
    .enum(["duplicate", "fraudulent", "requested_by_customer", "expired_uncaptured_charge"], {
      errorMap: () => ({ message: "Invalid refund reason" }),
    }),
  metadata: z
    .record(z.string())
    .optional(),
})

// Payment method validation
export const savePaymentMethodSchema = z.object({
  type: z
    .enum(["card", "bank_account", "digital_wallet"], {
      errorMap: () => ({ message: "Invalid payment method type" }),
    }),
  providerMethodId: z
    .string()
    .min(1, "Provider method ID is required")
    .max(255, "Provider method ID too long"),
  last4: z
    .string()
    .length(4, "Last4 must be 4 digits")
    .regex(/^\d{4}$/, "Last4 must be numeric")
    .optional(),
  brand: z
    .string()
    .max(50, "Brand must be less than 50 characters")
    .optional(),
  expiryMonth: z
    .number()
    .min(1, "Expiry month must be between 1 and 12")
    .max(12, "Expiry month must be between 1 and 12")
    .optional(),
  expiryYear: z
    .number()
    .min(new Date().getFullYear(), "Expiry year cannot be in the past")
    .max(new Date().getFullYear() + 20, "Expiry year too far in the future")
    .optional(),
  billingDetails: z
    .object({
      name: z.string().min(2).max(100),
      email: z.string().email().max(255),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      address: z.object({
        line1: z.string().min(5).max(255),
        line2: z.string().max(255).optional(),
        city: z.string().min(2).max(100),
        state: z.string().max(100).optional(),
        postalCode: z.string().min(3).max(20),
        country: z.string().length(2).regex(/^[A-Z]{2}$/),
      }),
    })
    .optional(),
})

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>
export type CartOperationInput = z.infer<typeof cartOperationSchema>
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>
export type CreateRefundInput = z.infer<typeof createRefundSchema>
export type SavePaymentMethodInput = z.infer<typeof savePaymentMethodSchema>