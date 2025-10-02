import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary/30 selection:text-foreground border-input h-10 w-full min-w-0 rounded-md border bg-background px-3 py-2 text-base shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:shadow-focus-coral",
        "hover:border-muted-foreground/30",
        "aria-invalid:ring-destructive/30 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
