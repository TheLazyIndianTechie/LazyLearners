import { prisma } from "@/lib/prisma";
import { captureServerEvent } from "@/lib/analytics/posthog";
import {
  Payment,
  PaymentStatus,
  PaymentIntent,
  PaymentProvider,
  PaymentProviderType,
  Enrollment,
  EnrollmentStatus,
  Cart,
  CartItem,
  Coupon,
  Subscription,
  SubscriptionPlan,
  Invoice,
  PaymentMethod,
  BillingDetails,
  CheckoutSession,
} from "./types/payment";

// Payment Processing
export async function createPaymentIntent(
  userId: string,
  amount: number,
  currency: string = "USD",
  metadata: Record<string, any> = {},
): Promise<PaymentIntent | null> {
  try {
    // In a real implementation, you'd create a payment intent with Stripe or other provider
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        userId,
        amount,
        currency,
        status: "requires_payment_method",
        clientSecret: generateClientSecret(),
        provider: "stripe", // Default provider
        providerIntentId: `pi_${generateRandomString(24)}`,
        metadata: JSON.stringify(metadata),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return paymentIntent as PaymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return null;
  }
}

export async function processPayment(
  paymentIntentId: string,
  paymentMethodId: string,
  billingDetails?: BillingDetails,
): Promise<{ success: boolean; payment?: Payment; error?: string }> {
  try {
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { id: paymentIntentId },
    });

    if (!paymentIntent) {
      return { success: false, error: "Payment intent not found" };
    }

    // Simulate payment processing
    const isSuccessful = Math.random() > 0.1; // 90% success rate for demo

    if (isSuccessful) {
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: paymentIntent.userId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: "succeeded",
          provider: paymentIntent.provider as PaymentProviderType,
          providerPaymentId: `py_${generateRandomString(24)}`,
          metadata: paymentIntent.metadata || "{}",
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // Update payment intent
      await prisma.paymentIntent.update({
        where: { id: paymentIntentId },
        data: {
          status: "succeeded",
          paymentMethodId,
          updatedAt: new Date(),
        },
      });

      return { success: true, payment: payment as Payment };
    } else {
      // Mark as failed
      await prisma.paymentIntent.update({
        where: { id: paymentIntentId },
        data: {
          status: "requires_payment_method",
          updatedAt: new Date(),
        },
      });

      return { success: false, error: "Payment failed. Please try again." };
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      success: false,
      error: "An error occurred processing your payment",
    };
  }
}

// Enrollment Management
export async function enrollUserInCourse(
  userId: string,
  courseId: string,
  paymentId?: string,
): Promise<Enrollment | null> {
  try {
    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (existingEnrollment) {
      return existingEnrollment as Enrollment;
    }

    // Create new enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: "active",
        paymentId,
        enrolledAt: new Date(),
        progress: 0,
        timeSpent: 0,
        metadata: JSON.stringify({
          enrollmentSource: paymentId ? "purchase" : "free",
          originalPrice: 0,
          finalPrice: 0,
        }),
      },
    });

    return enrollment as Enrollment;
  } catch (error) {
    console.error("Error enrolling user in course:", error);
    return null;
  }
}

export async function getUserEnrollments(
  userId: string,
): Promise<Enrollment[]> {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            instructor: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    return enrollments as Enrollment[];
  } catch (error) {
    console.error("Error fetching user enrollments:", error);
    return [];
  }
}

export async function updateEnrollmentProgress(
  enrollmentId: string,
  progress: number,
  timeSpent: number,
): Promise<boolean> {
  try {
    const isCompleted = progress >= 100;

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        timeSpent,
        lastAccessedAt: new Date(),
        ...(isCompleted && {
          status: "completed",
          completedAt: new Date(),
        }),
      },
    });

    return true;
  } catch (error) {
    console.error("Error updating enrollment progress:", error);
    return false;
  }
}

// Cart Management
export async function getOrCreateCart(userId: string): Promise<Cart | null> {
  try {
    let cart = await prisma.cart.findFirst({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        items: {
          include: {
            course: {
              select: {
                title: true,
                thumbnail: true,
                price: true,
                instructor: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          total: 0,
          currency: "USD",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          items: {
            include: {
              course: {
                select: {
                  title: true,
                  thumbnail: true,
                  price: true,
                  instructor: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return cart as Cart;
  } catch (error) {
    console.error("Error getting or creating cart:", error);
    return null;
  }
}

export async function addToCart(
  userId: string,
  courseId: string,
): Promise<{ success: boolean; cart?: Cart; error?: string }> {
  try {
    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId },
    });

    if (existingEnrollment) {
      return {
        success: false,
        error: "You are already enrolled in this course",
      };
    }

    const cart = await getOrCreateCart(userId);
    if (!cart) {
      return { success: false, error: "Failed to create cart" };
    }

    // Check if course is already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        courseId,
      },
    });

    if (existingItem) {
      return { success: false, error: "Course is already in your cart" };
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true },
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    // Add item to cart
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        courseId,
        price: course.price,
        addedAt: new Date(),
      },
    });

    // Update cart totals
    const updatedCart = await updateCartTotals(cart.id);

    await captureServerEvent("cart_course_added", {
      distinctId: userId,
      properties: {
        courseId,
        cartId: cart.id,
        subtotal: updatedCart?.subtotal ?? null,
        total: updatedCart?.total ?? null,
      },
    });

    return { success: true, cart: updatedCart || undefined };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return { success: false, error: "Failed to add course to cart" };
  }
}

export async function removeFromCart(
  userId: string,
  courseId: string,
): Promise<{ success: boolean; cart?: Cart }> {
  try {
    const cart = await getOrCreateCart(userId);
    if (!cart) {
      return { success: false };
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        courseId,
      },
    });

    const updatedCart = await updateCartTotals(cart.id);

    await captureServerEvent("cart_course_removed", {
      distinctId: userId,
      properties: {
        courseId,
        cartId: cart.id,
        subtotal: updatedCart?.subtotal ?? null,
        total: updatedCart?.total ?? null,
      },
    });

    return { success: true, cart: updatedCart || undefined };
  } catch (error) {
    console.error("Error removing from cart:", error);
    return { success: false };
  }
}

async function updateCartTotals(cartId: string): Promise<Cart | null> {
  try {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    if (!cart) return null;

    const subtotal = cart.items.reduce(
      (sum, item) => sum + (item.discountedPrice || item.price),
      0,
    );
    const taxAmount = subtotal * 0.08; // 8% tax rate
    const total = subtotal + taxAmount - cart.discountAmount;

    const updatedCart = await prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal,
        taxAmount,
        total,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: {
            course: {
              select: {
                title: true,
                thumbnail: true,
                price: true,
                instructor: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return updatedCart as Cart;
  } catch (error) {
    console.error("Error updating cart totals:", error);
    return null;
  }
}

// Coupon Management
export async function applyCoupon(
  cartId: string,
  couponCode: string,
): Promise<{ success: boolean; discount?: number; error?: string }> {
  try {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    });

    if (!coupon) {
      return { success: false, error: "Invalid or expired coupon code" };
    }

    if (
      coupon.maxRedemptions &&
      coupon.redemptionsCount >= coupon.maxRedemptions
    ) {
      return { success: false, error: "Coupon has reached its usage limit" };
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart) {
      return { success: false, error: "Cart not found" };
    }

    if (coupon.minimumAmount && cart.subtotal < coupon.minimumAmount) {
      return {
        success: false,
        error: `Minimum order amount of $${coupon.minimumAmount} required`,
      };
    }

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = cart.subtotal * (coupon.value / 100);
    } else {
      discountAmount = Math.min(coupon.value, cart.subtotal);
    }

    // Update cart with coupon
    await prisma.cart.update({
      where: { id: cartId },
      data: {
        couponCode: couponCode,
        discountAmount,
        total: cart.subtotal + cart.taxAmount - discountAmount,
        updatedAt: new Date(),
      },
    });

    return { success: true, discount: discountAmount };
  } catch (error) {
    console.error("Error applying coupon:", error);
    return { success: false, error: "Failed to apply coupon" };
  }
}

// Subscription Management
export async function createSubscription(
  userId: string,
  planId: string,
  paymentMethodId: string,
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return { success: false, error: "Subscription plan not found" };
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: "active",
        provider: "stripe",
        providerSubscriptionId: `sub_${generateRandomString(24)}`,
        currentPeriodStart: new Date(),
        currentPeriodEnd: getNextBillingDate(
          new Date(),
          plan.interval,
          plan.intervalCount,
        ),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: true, subscription: subscription as Subscription };
  } catch (error) {
    console.error("Error creating subscription:", error);
    return { success: false, error: "Failed to create subscription" };
  }
}

export async function cancelSubscription(
  subscriptionId: string,
  userId: string,
  immediately: boolean = false,
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    if (immediately) {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "canceled",
          canceledAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}

// Payment Methods
export async function savePaymentMethod(
  userId: string,
  type: string,
  providerMethodId: string,
  last4?: string,
  brand?: string,
  expiryMonth?: number,
  expiryYear?: number,
  billingDetails?: BillingDetails,
): Promise<PaymentMethod | null> {
  try {
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId,
        type: type as any,
        provider: "stripe",
        providerMethodId,
        last4,
        brand,
        expiryMonth,
        expiryYear,
        isDefault: false,
        isActive: true,
        billingDetails: JSON.stringify(billingDetails || {}),
        metadata: "{}",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return paymentMethod as PaymentMethod;
  } catch (error) {
    console.error("Error saving payment method:", error);
    return null;
  }
}

// Utility functions
function generateClientSecret(): string {
  return `pi_${generateRandomString(24)}_secret_${generateRandomString(32)}`;
}

function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getNextBillingDate(
  startDate: Date,
  interval: string,
  intervalCount: number,
): Date {
  const date = new Date(startDate);

  switch (interval) {
    case "day":
      date.setDate(date.getDate() + intervalCount);
      break;
    case "week":
      date.setDate(date.getDate() + intervalCount * 7);
      break;
    case "month":
      date.setMonth(date.getMonth() + intervalCount);
      break;
    case "year":
      date.setFullYear(date.getFullYear() + intervalCount);
      break;
  }

  return date;
}

// Analytics
export async function getPaymentAnalytics(
  period: string = "30d",
  instructorId?: string,
): Promise<any> {
  try {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "succeeded",
        ...(instructorId && {
          course: {
            instructorId,
          },
        }),
      },
      include: {
        course: {
          select: {
            title: true,
            instructorId: true,
          },
        },
      },
    });

    const totalRevenue = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    const totalTransactions = payments.length;
    const averageOrderValue =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalTransactions,
      averageOrderValue,
      period,
    };
  } catch (error) {
    console.error("Error getting payment analytics:", error);
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      averageOrderValue: 0,
      period,
    };
  }
}
