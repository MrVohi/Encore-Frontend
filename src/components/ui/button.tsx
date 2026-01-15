import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full text-sm font-extrabold",
    "transition-transform active:translate-y-[1px]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
    "brutal-sm",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[var(--encore-accent-warm)] text-white hover:brightness-95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted",
        outline:
          "bg-transparent text-foreground hover:bg-accent",
        ghost:
          "brutal-sm border-transparent shadow-none hover:bg-accent",
        link:
          "brutal-sm border-transparent shadow-none underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-95",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-10 w-10 p-0",
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
