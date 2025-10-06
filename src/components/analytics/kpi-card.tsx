import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp, LucideIcon, Minus } from "lucide-react"

export interface KPICardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  description?: string
  trend?: {
    value: number
    label?: string
    isPositive?: boolean
  }
  loading?: boolean
  className?: string
  valueClassName?: string
  format?: "number" | "currency" | "percentage" | "duration" | "custom"
  prefix?: string
  suffix?: string
}

export function KPICard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  loading = false,
  className,
  valueClassName,
  format = "number",
  prefix,
  suffix,
}: KPICardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === "string") return val

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(val)
      case "percentage":
        return `${val.toFixed(1)}%`
      case "duration":
        // Assume value is in minutes
        const hours = Math.floor(val / 60)
        const minutes = val % 60
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      case "number":
        return val.toLocaleString()
      default:
        return val.toString()
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null

    const isPositive = trend.isPositive ?? trend.value >= 0
    const absValue = Math.abs(trend.value)

    if (absValue === 0) {
      return <Minus className="h-3 w-3" />
    }

    return isPositive ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    )
  }

  const getTrendColor = () => {
    if (!trend) return ""

    const isPositive = trend.isPositive ?? trend.value >= 0
    const absValue = Math.abs(trend.value)

    if (absValue === 0) return "text-muted-foreground"

    return isPositive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
  }

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          {Icon && <Skeleton className="h-4 w-4 rounded" />}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-40" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>
          {prefix}
          {formatValue(value)}
          {suffix}
        </div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", getTrendColor())}>
                {getTrendIcon()}
                <span>{Math.abs(trend.value).toFixed(1)}%</span>
                {trend.label && (
                  <span className="text-muted-foreground font-normal">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
            {description && !trend && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function KPICardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  )
}
