import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-1 aria-invalid:ring-destructive/30 aria-invalid:border-destructive transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary text-primary-foreground shadow-sm [a&]:hover:bg-primary/90 [a&]:hover:shadow-md focus-visible:ring-primary/50",
        secondary:
          "border-secondary/20 bg-secondary text-secondary-foreground shadow-sm [a&]:hover:bg-secondary/90 [a&]:hover:shadow-md focus-visible:ring-secondary/50",
        destructive:
          "border-destructive/20 bg-destructive text-destructive-foreground shadow-sm [a&]:hover:bg-destructive/90 [a&]:hover:shadow-md focus-visible:ring-destructive/50",
        outline:
          "text-foreground border-border bg-background [a&]:hover:bg-accent [a&]:hover:text-accent-foreground [a&]:hover:border-accent focus-visible:ring-ring/50",
        accent:
          "border-accent/20 bg-accent text-accent-foreground shadow-sm [a&]:hover:bg-accent/90 [a&]:hover:shadow-md focus-visible:ring-accent/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
