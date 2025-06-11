import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { FilesHub } from "@/components/files/files-hub"

export const metadata: Metadata = {
  title: "Files Hub",
  description: "Access and manage your deal documents",
}

export default function FilesPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Files Hub" text="Access and manage all your deal-related documents in one place." />
      <FilesHub />
    </DashboardShell>
  )
}
