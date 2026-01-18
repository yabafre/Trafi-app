"use client"

/**
 * Dropdown Menu Component
 *
 * Simple dropdown menu built on top of Popover.
 * Digital Brutalism v2 design pattern.
 */

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "@/lib/utils"

const DropdownMenu = Popover

const DropdownMenuTrigger = PopoverTrigger

function DropdownMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  return (
    <PopoverContent
      className={cn(
        "w-48 p-1",
        className
      )}
      {...props}
    />
  )
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean
}

function DropdownMenuItem({
  className,
  destructive,
  children,
  ...props
}: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center px-2 py-1.5 text-sm transition-colors",
        "hover:bg-secondary focus:bg-secondary focus:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        destructive && "text-destructive hover:bg-destructive/10 focus:bg-destructive/10",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}
