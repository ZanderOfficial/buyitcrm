import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Contacts",
  description: "Manage your contacts and leads",
}

export default function ContactsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Contacts" text="Manage your contacts and leads in one place.">
        <Link href="/dashboard/contacts/new">
          <Button size="sm" className="h-9">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </Link>
      </DashboardHeader>
      <ContactsTable />
    </DashboardShell>
  )
}
