import type React from "react"
import { TimeTrackerProvider } from "@/components/time-tracker/time-tracker-provider"

export default function TestComponentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TimeTrackerProvider>
      <div className="min-h-screen bg-background">{children}</div>
    </TimeTrackerProvider>
  )
}
