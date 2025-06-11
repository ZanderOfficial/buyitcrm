"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  fullScreen?: boolean
  className?: string
}

export function LoadingOverlay({
  isLoading,
  message = "Loading...",
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50",
        fullScreen ? "fixed inset-0" : "absolute inset-0",
        className,
      )}
    >
      <div className="flex flex-col items-center space-y-4 p-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground">{message}</p>
      </div>
    </div>
  )
}
