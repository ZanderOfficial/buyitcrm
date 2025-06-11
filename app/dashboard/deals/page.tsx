import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { DealsTable } from "@/components/deals/deals-table" // New component
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Deals",
  description: "Manage your deals and opportunities",
}

export default function DealsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Deals" text="Manage your deals and opportunities in one place.">
        <Link href="/dashboard/deals/new">
          <Button size="sm" className="h-9">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
        </Link>
      </DashboardHeader>
      <DealsTable />
    </DashboardShell>
  )
}
