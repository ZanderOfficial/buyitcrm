import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { ContactForm } from "@/components/contacts/contact-form"

interface EditContactPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditContactPageProps): Promise<Metadata> {
  return {
    title: `Edit Contact ${params.id}`,
    description: `Edit contact with ID: ${params.id}`,
  }
}

export default function EditContactPage({ params }: EditContactPageProps) {
  return (
    <DashboardShell>
      <DashboardHeader heading="Edit Contact" text={`Edit details for contact ID: ${params.id}`} />
      <div className="grid gap-8">
        <ContactForm contactId={params.id} />
      </div>
    </DashboardShell>
  )
}
