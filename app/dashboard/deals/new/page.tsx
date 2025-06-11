import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { DealForm } from "@/components/deals/deal-form" // New component

export const metadata: Metadata = {
  title: "Add Deal",
  description: "Add a new deal to your CRM",
}

export default function NewDealPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Add Deal" text="Add a new deal or opportunity to your CRM." />
      <div className="grid gap-8">
        <DealForm />
      </div>
    </DashboardShell>
  )
}
