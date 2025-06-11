import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { DealForm } from "@/components/deals/deal-form" // New component

interface EditDealPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditDealPageProps): Promise<Metadata> {
  return {
    title: `Edit Deal ${params.id}`,
    description: `Edit deal with ID: ${params.id}`,
  }
}

export default function EditDealPage({ params }: EditDealPageProps) {
  return (
    <DashboardShell>
      <DashboardHeader heading="Edit Deal" text={`Edit details for deal ID: ${params.id}`} />
      <div className="grid gap-8">
        <DealForm dealId={params.id} />
      </div>
    </DashboardShell>
  )
}
