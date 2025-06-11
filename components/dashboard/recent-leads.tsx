"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const recentLeads = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    status: "New Lead",
    date: "2 hours ago",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "(555) 987-6543",
    status: "Follow Up",
    date: "5 hours ago",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "m.brown@example.com",
    phone: "(555) 456-7890",
    status: "Contacted",
    date: "1 day ago",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.d@example.com",
    phone: "(555) 234-5678",
    status: "New Lead",
    date: "1 day ago",
  },
  {
    id: "5",
    name: "Robert Wilson",
    email: "r.wilson@example.com",
    phone: "(555) 876-5432",
    status: "Qualified",
    date: "2 days ago",
  },
]

export function RecentLeads() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentLeads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="font-medium">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback>
                    {lead.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {lead.name}
              </div>
            </TableCell>
            <TableCell>{lead.email}</TableCell>
            <TableCell>{lead.phone}</TableCell>
            <TableCell>
              <Badge
                variant={
                  lead.status === "New Lead"
                    ? "default"
                    : lead.status === "Follow Up"
                      ? "secondary"
                      : lead.status === "Contacted"
                        ? "outline"
                        : "success"
                }
              >
                {lead.status}
              </Badge>
            </TableCell>
            <TableCell>{lead.date}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
