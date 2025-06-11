import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { PipelineView } from "@/components/pipeline/pipeline-view"
import { PipelineTabs } from "@/components/pipeline/pipeline-tabs"

export const metadata: Metadata = {
  title: "Deal Pipeline",
  description: "Visualize and manage your deal pipeline",
}

export default function PipelinePage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Deal Pipeline"
        text="Visualize and manage your deals through each stage of the process."
      />
      <PipelineTabs />
      <PipelineView />
    </DashboardShell>
  )
}
