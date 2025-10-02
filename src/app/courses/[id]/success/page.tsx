'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { SiteLayout } from '@/components/layout/site-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

type PaymentState = 'checking' | 'processing' | 'success' | 'failed' | 'not-found'

interface StoredPayment {
  paymentId: string
  courseId: string
  courseTitle?: string
  returnUrl?: string
  customer?: {
    name: string
    email: string
    phoneNumber?: string
  }
  sessionId?: string
  timestamp: string
}

interface PaymentStatusResponse {
  paymentId: string
  status: 'succeeded' | 'failed' | 'cancelled' | 'processing' | 'requires_payment_method'
  amount: number
  currency: string
  customer: {
    name: string
    email: string
    phoneNumber?: string
  }
  paymentMethod?: string
  createdAt: string
}

const POLL_INTERVAL_MS = 3000
const MAX_ATTEMPTS = 5

export default function CoursePurchaseSuccessPage({ params }: { params: { id: string } }) {
  const { getToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<PaymentState>('checking')
  const [paymentDetails, setPaymentDetails] = useState<PaymentStatusResponse | null>(null)
  const [pending, setPending] = useState<StoredPayment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [storedPaymentId, setStoredPaymentId] = useState<string | null>(null)

  const courseSlug = params.id
  const paymentIdParam = searchParams?.get('paymentId') || null

  useEffect(() => {
    let paymentId: string | null = paymentIdParam

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('pending_payment')
        if (raw) {
          const parsed: StoredPayment = JSON.parse(raw)
          if (parsed.courseId === courseSlug) {
            setPending(parsed)
            paymentId = parsed.paymentId
          } else {
            setPending(null)
          }
        } else {
          setPending(null)
        }
      } catch (parseError) {
        console.warn('Unable to parse pending payment cache', parseError)
        setPending(null)
      }
    }

    setStoredPaymentId(paymentId)
  }, [courseSlug, paymentIdParam])

  useEffect(() => {
    if (!storedPaymentId) {
      setStatus('not-found')
      return
    }

    let attempts = 0
    let cancelled = false
    let currentState: PaymentState = 'checking'

    const verifyPayment = async () => {
      try {
        const token = await getToken()
        const response = await fetch(`/api/payments/status/${storedPaymentId}`, {
          cache: 'no-store',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        })
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to verify payment')
        }

        if (cancelled) {
          return
        }

        const data: PaymentStatusResponse = result.data
        setPaymentDetails(data)

        switch (data.status) {
          case 'succeeded':
            currentState = 'success'
            setStatus('success')
            window.localStorage.removeItem('pending_payment')
            break
          case 'processing':
          case 'requires_payment_method':
            currentState = 'processing'
            setStatus('processing')
            break
          default:
            currentState = 'failed'
            setStatus('failed')
            break
        }
      } catch (err) {
        if (cancelled) {
          return
        }
        console.error('Payment verification failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        currentState = 'failed'
        setStatus('failed')
      }
    }

    verifyPayment()

    const interval = setInterval(() => {
      if (cancelled || currentState === 'success' || currentState === 'failed') {
        return
      }

      attempts += 1
      if (attempts >= MAX_ATTEMPTS) {
        if (currentState !== 'success' && currentState !== 'failed') {
          currentState = 'processing'
          setStatus('processing')
        }
        clearInterval(interval)
        return
      }

      void verifyPayment()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [storedPaymentId])

  const title = useMemo(() => {
    if (status === 'success') {
      return 'Purchase confirmed'
    }
    if (status === 'processing') {
      return 'Processing payment'
    }
    if (status === 'failed') {
      return 'Payment issue detected'
    }
    if (status === 'not-found') {
      return 'Payment not found'
    }
    return 'Verifying payment'
  }, [status])

  const description = useMemo(() => {
    if (status === 'success') {
      return 'You now have full access to the course content.'
    }
    if (status === 'processing') {
      return 'We are finalizing your payment. This may take a few moments.'
    }
    if (status === 'failed') {
      return error || 'There was an issue completing your payment.'
    }
    if (status === 'not-found') {
      return 'We could not locate a payment for this course. Please try again or contact support.'
    }
    return 'Please wait while we validate your payment with our provider.'
  }, [error, status])

  const courseTitle = pending?.courseTitle || 'your course'

  const handleGoToCourse = () => {
    router.push(`/courses/${courseSlug}`)
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard/courses')
  }

  return (
    <SiteLayout>
      <div className="container max-w-3xl py-16">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-3xl font-bold">{title}</CardTitle>
            <p className="text-muted-foreground text-base">{description}</p>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {status === 'success' && (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-lg font-semibold">Enjoy {courseTitle}!</p>
                <p className="text-sm text-muted-foreground">
                  Your enrollment is active. You can resume learning immediately.
                </p>
              </div>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p className="text-lg font-semibold">Almost there...</p>
                <p className="text-sm text-muted-foreground">
                  We are waiting for confirmation from Dodo Payments. This screen will refresh automatically.
                </p>
              </div>
            )}

            {status === 'checking' && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p className="text-lg font-semibold">Verifying transaction</p>
              </div>
            )}

            {status === 'failed' && (
              <div className="flex flex-col items-center gap-3 text-red-600">
                <AlertCircle className="h-12 w-12" />
                <p className="text-lg font-semibold">Payment could not be confirmed.</p>
                <p className="text-sm text-muted-foreground">
                  {error ? error : 'Please retry the checkout flow or contact support@lazygamedevs.com.'}
                </p>
              </div>
            )}

            {status === 'not-found' && (
              <div className="flex flex-col items-center gap-3 text-yellow-600">
                <AlertCircle className="h-12 w-12" />
                <p className="text-lg font-semibold">No recent payment detected.</p>
                <p className="text-sm text-muted-foreground">
                  If you reached this page by mistake, return to the course and start the checkout again.
                </p>
              </div>
            )}

            {paymentDetails && (
              <div className="rounded-lg border bg-muted/30 p-4 text-left">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Payment ID:</span>
                    <span className="ml-2 font-mono text-xs">{paymentDetails.paymentId}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>
                    <span className="ml-2 capitalize">{paymentDetails.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Amount:</span>
                    <span className="ml-2">
                      {(paymentDetails.amount / 100).toLocaleString(undefined, {
                        style: 'currency',
                        currency: paymentDetails.currency,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Customer:</span>
                    <span className="ml-2">{paymentDetails.customer.name}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button onClick={handleGoToCourse} disabled={status === 'checking'}>
                Go to Course
              </Button>
              <Button variant="outline" onClick={handleGoToDashboard}>
                View My Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  )
}
