"use client"

import Link from "next/link"
import { AnalyticsProvider } from "@/contexts/analytics-context"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { CalendarClock, RefreshCw } from "lucide-react"
import { useAnalyticsRealTime } from "@/contexts/analytics-context"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AnalyticsLayoutProps {
  title: string
  description?: string
  actions?: React.ReactNode
  filters?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  footer?: React.ReactNode
  children: React.ReactNode
  disableProvider?: boolean
  className?: string
  contentClassName?: string
}

/**
 * Wraps the core analytics experience with shared layout, header, breadcrumbs, and filter rails.
 * By default the layout includes the AnalyticsProvider so downstream components can access shared state.
 */
export function AnalyticsLayout({
  title,
  description,
  actions,
  filters,
  breadcrumbs,
  footer,
  children,
  disableProvider = false,
  className,
  contentClassName,
}: AnalyticsLayoutProps) {
  const content = (
    <div className={cn("flex flex-col gap-6", className)}>
      <AnalyticsHeader
        title={title}
        description={description}
        actions={actions}
        breadcrumbs={breadcrumbs}
      />

      {(filters || breadcrumbs) && (
        <AnalyticsToolbar filters={filters} breadcrumbs={!breadcrumbs ? undefined : breadcrumbs} />
      )}

      <div className={cn("flex flex-col gap-6", contentClassName)}>
        {children}
      </div>

      {footer && (
        <>
          <Separator />
          <div className="pt-2">{footer}</div>
        </>
      )}
    </div>
  )

  if (disableProvider) {
    return content
  }

  return (
    <AnalyticsProvider>
      {content}
    </AnalyticsProvider>
  )
}

interface AnalyticsHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

function AnalyticsHeader({ title, description, actions, breadcrumbs }: AnalyticsHeaderProps) {
  return (
    <div className="space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-primary transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <span className="text-muted-foreground/60">/</span>}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

interface AnalyticsToolbarProps {
  filters?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

function AnalyticsToolbar({ filters }: AnalyticsToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card/40 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <RealTimeStatus />
      {filters && (
        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
          {filters}
        </div>
      )}
    </div>
  )
}

function RealTimeStatus() {
  const { realTime, toggleRealTime, markRealTimeRefreshed } = useAnalyticsRealTime()

  if (!realTime) return null

  const isActive = realTime.enabled

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarClock className="h-4 w-4" />
        <span>
          {isActive
            ? `Live updates every ${realTime.intervalSeconds}s`
            : "Real-time updates paused"}
        </span>
        {realTime.lastUpdated && (
          <span className="text-xs text-muted-foreground">
            • Updated {realTime.lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isActive ? "default" : "outline"}
          onClick={() => toggleRealTime()}
        >
          {isActive ? "Pause Live Updates" : "Enable Live Updates"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            markRealTimeRefreshed()
          }}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh now
        </Button>
      </div>
    </div>
  )
}

interface AnalyticsSectionProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/**
 * Utility wrapper for analytics modules (charts, tables, etc.).
 */
export function AnalyticsSection({
  title,
  description,
  actions,
  className,
  children,
}: AnalyticsSectionProps) {
  return (
    <section className={cn("space-y-4 rounded-lg border bg-card p-6 shadow-sm", className)}>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <Separator />
      <div className="space-y-4">
        {children}
      </div>
    </section>
  )
}
