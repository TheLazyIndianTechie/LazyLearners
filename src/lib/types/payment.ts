export interface PaymentProvider {
  id: string
  name: string
  type: PaymentProviderType
  isActive: boolean
  config: PaymentProviderConfig
  supportedCurrencies: string[]
  supportedCountries: string[]
  fees: PaymentFees
}

export type PaymentProviderType =
  | "stripe"
  | "paypal"
  | "square"
  | "razorpay"
  | "mollie"

export interface PaymentProviderConfig {
  publicKey: string
  webhookEndpoint: string
  returnUrl: string
  cancelUrl: string
  environment: "sandbox" | "production"
}

export interface PaymentFees {
  percentageFee: number
  fixedFee: number
  currency: string
}

export interface Payment {
  id: string
  userId: string
  courseId?: string
  amount: number
  currency: string
  status: PaymentStatus
  provider: PaymentProviderType
  providerPaymentId: string
  providerCustomerId?: string
  metadata: PaymentMetadata
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  failedAt?: Date
  refundedAt?: Date
}

export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded"
  | "partially_refunded"

export interface PaymentMetadata {
  courseTitle?: string
  instructorId?: string
  discountCode?: string
  originalAmount?: number
  taxAmount?: number
  platformFee?: number
  instructorPayout?: number
}

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: SubscriptionStatus
  provider: PaymentProviderType
  providerSubscriptionId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date
  trialStart?: Date
  trialEnd?: Date
  createdAt: Date
  updatedAt: Date
}

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: BillingInterval
  intervalCount: number
  trialPeriodDays?: number
  features: PlanFeature[]
  isActive: boolean
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type BillingInterval = "day" | "week" | "month" | "year"

export interface PlanFeature {
  id: string
  name: string
  description: string
  included: boolean
  limit?: number
  unit?: string
}

export interface Invoice {
  id: string
  userId: string
  subscriptionId?: string
  paymentId?: string
  number: string
  amount: number
  currency: string
  status: InvoiceStatus
  dueDate: Date
  items: InvoiceItem[]
  taxAmount: number
  discountAmount: number
  totalAmount: number
  providerInvoiceId?: string
  pdfUrl?: string
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
}

export type InvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "void"
  | "uncollectible"

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  metadata?: Record<string, any>
}

export interface Coupon {
  id: string
  code: string
  name: string
  type: CouponType
  value: number
  currency?: string
  minimumAmount?: number
  maxRedemptions?: number
  redemptionsCount: number
  validFrom: Date
  validUntil?: Date
  isActive: boolean
  applicableCourses: string[]
  applicableCategories: string[]
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type CouponType = "percentage" | "fixed_amount"

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: PaymentIntentStatus
  clientSecret: string
  paymentMethodId?: string
  customerId?: string
  metadata: Record<string, any>
  provider: PaymentProviderType
  providerIntentId: string
  createdAt: Date
  updatedAt: Date
}

export type PaymentIntentStatus =
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_action"
  | "processing"
  | "succeeded"
  | "canceled"

export interface PaymentMethod {
  id: string
  userId: string
  type: PaymentMethodType
  provider: PaymentProviderType
  providerMethodId: string
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  isActive: boolean
  billingDetails: BillingDetails
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type PaymentMethodType = "card" | "bank_account" | "digital_wallet"

export interface BillingDetails {
  name: string
  email: string
  phone?: string
  address: {
    line1: string
    line2?: string
    city: string
    state?: string
    postalCode: string
    country: string
  }
}

export interface Refund {
  id: string
  paymentId: string
  amount: number
  currency: string
  reason: RefundReason
  status: RefundStatus
  providerRefundId: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  processedAt?: Date
}

export type RefundReason =
  | "duplicate"
  | "fraudulent"
  | "requested_by_customer"
  | "expired_uncaptured_charge"

export type RefundStatus = "pending" | "succeeded" | "failed" | "canceled"

export interface PaymentAnalytics {
  period: AnalyticsPeriod
  totalRevenue: number
  totalTransactions: number
  averageOrderValue: number
  successRate: number
  topCourses: CourseRevenue[]
  revenueByDay: DailyRevenue[]
  paymentMethodBreakdown: PaymentMethodStats[]
  geographicBreakdown: GeographicStats[]
  refundRate: number
  chargebackRate: number
}

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "1y" | "all"

export interface CourseRevenue {
  courseId: string
  courseTitle: string
  revenue: number
  transactions: number
  enrollments: number
}

export interface DailyRevenue {
  date: string
  revenue: number
  transactions: number
}

export interface PaymentMethodStats {
  type: PaymentMethodType
  count: number
  percentage: number
  revenue: number
}

export interface GeographicStats {
  country: string
  countryCode: string
  revenue: number
  transactions: number
  percentage: number
}

// Enrollment specific types
export interface Enrollment {
  id: string
  userId: string
  courseId: string
  status: EnrollmentStatus
  paymentId?: string
  enrolledAt: Date
  completedAt?: Date
  certificateIssued?: boolean
  progress: number
  timeSpent: number
  lastAccessedAt?: Date
  metadata: EnrollmentMetadata
}

export type EnrollmentStatus =
  | "active"
  | "completed"
  | "suspended"
  | "refunded"
  | "expired"

export interface EnrollmentMetadata {
  paymentMethod?: PaymentMethodType
  discountApplied?: number
  originalPrice?: number
  finalPrice?: number
  enrollmentSource?: string
  referralCode?: string
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  currency: string
  couponCode?: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  id: string
  courseId: string
  price: number
  discountedPrice?: number
  addedAt: Date
}

export interface CheckoutSession {
  id: string
  userId: string
  cartId: string
  status: CheckoutStatus
  paymentIntentId?: string
  totalAmount: number
  currency: string
  provider: PaymentProviderType
  returnUrl: string
  cancelUrl: string
  expiresAt: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type CheckoutStatus =
  | "pending"
  | "completed"
  | "expired"
  | "canceled"

// API request/response types
export interface CreatePaymentIntentRequest {
  amount: number
  currency: string
  courseId?: string
  couponCode?: string
  paymentMethodId?: string
  savePaymentMethod?: boolean
}

export interface CreatePaymentIntentResponse {
  paymentIntent: PaymentIntent
  clientSecret: string
  ephemeralKey?: string
  customer?: string
}

export interface ProcessPaymentRequest {
  paymentIntentId: string
  paymentMethodId: string
  billingDetails?: BillingDetails
}

export interface ProcessPaymentResponse {
  success: boolean
  payment?: Payment
  enrollment?: Enrollment
  error?: string
  requiresAction?: boolean
  nextAction?: any
}

export interface CreateSubscriptionRequest {
  planId: string
  paymentMethodId: string
  couponCode?: string
  trialPeriodDays?: number
}

export interface CreateSubscriptionResponse {
  subscription: Subscription
  paymentIntent?: PaymentIntent
  clientSecret?: string
}

export interface ApplyCouponRequest {
  code: string
  courseId?: string
  amount?: number
}

export interface ApplyCouponResponse {
  valid: boolean
  coupon?: Coupon
  discountAmount?: number
  error?: string
}

// Webhook types
export interface WebhookEvent {
  id: string
  type: WebhookEventType
  provider: PaymentProviderType
  data: any
  processed: boolean
  retries: number
  createdAt: Date
  processedAt?: Date
}

export type WebhookEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "invoice.payment_succeeded"
  | "invoice.payment_failed"
  | "customer.created"
  | "customer.updated"