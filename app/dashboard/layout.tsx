import type React from "react"
import { TopNav } from "@/components/dashboard/top-nav"
import { TimeTrackerProvider } from "@/components/time-tracker/time-tracker-provider"
import { TimeTracker } from "@/components/hq/time-tracker"
import { FloatingTimeTrackerButton } from "@/components/time-tracker/floating-time-tracker-button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TimeTrackerProvider>
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <main className="flex-1 p-6 md:p-8">{children}</main>
        <TimeTracker />
        <FloatingTimeTrackerButton />
      </div>
    </TimeTrackerProvider>
  )
}
