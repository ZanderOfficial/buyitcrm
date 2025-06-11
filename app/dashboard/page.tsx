import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "CRM Dashboard Overview",
}

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Get an overview of your real estate business performance." />
      <DashboardOverview />
    </DashboardShell>
  )
}
