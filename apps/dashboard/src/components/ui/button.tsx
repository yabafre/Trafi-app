import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        // Primary: White bg, black text, hover to acid lime
        default:
          "bg-foreground text-background border border-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary",
        // Collective: Acid lime bg, hover to white
        collective:
          "bg-primary text-primary-foreground border border-primary hover:bg-foreground hover:text-background hover:border-foreground",
        // Destructive: Red bg
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive hover:bg-foreground hover:text-background hover:border-foreground",
        // Outline: Transparent, hover to white
        outline:
          "border border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground hover:bg-foreground hover:text-background",
        // Secondary: Muted bg, hover to invert
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-foreground hover:text-background hover:border-foreground",
        // Ghost: No border, hover to accent
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground",
        // Link: Underline on hover
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-3",
        sm: "h-8 gap-1.5 px-4 py-2",
        lg: "h-12 px-8 py-4",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
