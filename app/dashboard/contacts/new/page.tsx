import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { ContactForm } from "@/components/contacts/contact-form"

export const metadata: Metadata = {
  title: "Add Contact",
  description: "Add a new contact to your CRM",
}

export default function NewContactPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Add Contact" text="Add a new contact or lead to your CRM." />
      <div className="grid gap-8">
        <ContactForm />
      </div>
    </DashboardShell>
  )
}
