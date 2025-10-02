'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useLicenseKeys, type LicenseKey } from '@/hooks/use-license-keys'
import {
  Key,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface LicenseKeyCardProps {
  licenseKey: LicenseKey
  showCourse?: boolean
  onActivate?: () => void
}

export function LicenseKeyCard({
  licenseKey,
  showCourse = true,
  onActivate
}: LicenseKeyCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusIcon = (status: LicenseKey['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'EXPIRED':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'DISABLED':
      case 'REVOKED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: LicenseKey['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'DISABLED':
      case 'REVOKED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('License key copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy license key')
    }
  }

  const isExpired = licenseKey.expiresAt && new Date(licenseKey.expiresAt) < new Date()
  const isNearExpiry = licenseKey.expiresAt &&
    new Date(licenseKey.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4" />
              License Key
              {showCourse && (
                <Badge variant="secondary" className="ml-2">
                  {licenseKey.course.category}
                </Badge>
              )}
            </CardTitle>
            {showCourse && (
              <p className="text-sm text-muted-foreground font-medium">
                {licenseKey.course.title}
              </p>
            )}
          </div>
          <Badge className={getStatusColor(licenseKey.status)}>
            {getStatusIcon(licenseKey.status)}
            <span className="ml-1">{licenseKey.status}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* License Key Display */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            LICENSE KEY
          </Label>
          <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm">
            <span className="flex-1">{licenseKey.key}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(licenseKey.key)}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Activations */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{licenseKey.activationsCount}</span>
            <span className="text-muted-foreground">
              {licenseKey.activationsLimit ? ` / ${licenseKey.activationsLimit}` : ' activations'}
            </span>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{formatDate(licenseKey.createdAt)}</span>
          </div>
          {licenseKey.expiresAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span className={isExpired ? 'text-red-600' : isNearExpiry ? 'text-orange-600' : ''}>
                {formatDate(licenseKey.expiresAt)}
                {isNearExpiry && !isExpired && (
                  <AlertTriangle className="inline h-3 w-3 ml-1" />
                )}
              </span>
            </div>
          )}
        </div>

        {/* Payment Info */}
        {licenseKey.payment && (
          <div className="pt-2 border-t space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <Badge
                variant={licenseKey.payment.status === 'succeeded' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {licenseKey.payment.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: licenseKey.payment.currency,
                }).format(licenseKey.payment.amount / 100)}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {showCourse && licenseKey.status === 'ACTIVE' && !isExpired && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // Navigate to course
                window.location.href = `/courses/${licenseKey.course.id}`
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Access Course
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface LicenseKeyActivatorProps {
  userId: string
  onSuccess?: () => void
}

export function LicenseKeyActivator({ userId, onSuccess }: LicenseKeyActivatorProps) {
  const [licenseKey, setLicenseKey] = useState('')
  const [instanceName, setInstanceName] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const { activateLicenseKey, isLoading, error, clearError } = useLicenseKeys()

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast.error('Please enter a license key')
      return
    }

    const success = await activateLicenseKey(licenseKey.trim(), userId, instanceName.trim() || undefined)

    if (success) {
      setLicenseKey('')
      setInstanceName('')
      setIsOpen(false)
      onSuccess?.()
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      clearError()
      setLicenseKey('')
      setInstanceName('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Key className="h-4 w-4 mr-2" />
          Activate License Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Activate License Key
          </DialogTitle>
          <DialogDescription>
            Enter your license key to activate access to a course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license-key">License Key *</Label>
            <Input
              id="license-key"
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              disabled={isLoading}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instance-name">Instance Name (Optional)</Label>
            <Input
              id="instance-name"
              type="text"
              placeholder="My Computer, Work Laptop, etc."
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
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
              onClick={handleActivate}
              disabled={isLoading || !licenseKey.trim()}
              className="flex-1"
            >
              {isLoading ? 'Activating...' : 'Activate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}