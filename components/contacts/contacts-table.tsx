"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react" // Import useRef
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Search, Loader2, Upload } from "lucide-react" // Added Upload icon
import { supabase } from "@/lib/supabaseClient"
import { toast } from "@/hooks/use-toast"

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: string
  lastContacted: string // This would ideally be a Date type
  followupType: string
  suggestedFollowup: string // This would ideally be a Date type
  notes?: string
}

export function ContactsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false) // New state for import loading
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for file input

  const fetchContacts = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("contacts").select("*")

    if (error) {
      console.error("Error fetching contacts:", error.message)
      toast({
        title: "Error",
        description: "Failed to load contacts.",
        variant: "destructive",
      })
    } else {
      setContacts(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          status: c.status,
          lastContacted: c.lastContacted || "N/A",
          followupType: c.followupType || "N/A",
          suggestedFollowup: c.suggestedFollowup || "N/A",
          notes: c.notes || "",
        })),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const handleDeleteContact = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from("contacts").delete().eq("id", id)
    setDeletingId(null)

    if (error) {
      console.error("Error deleting contact:", error.message)
      toast({
        title: "Error",
        description: `Failed to delete contact: ${error.message}`,
        variant: "destructive",
      })
    } else {
      setContacts(contacts.filter((contact) => contact.id !== id))
      toast({
        title: "Contact deleted",
        description: "The contact has been successfully deleted.",
      })
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/contacts/import-csv", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Import Successful",
          description: result.message,
        })
        fetchContacts() // Refresh the table after successful import
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "An unknown error occurred during import.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Client-side import error:", error)
      toast({
        title: "Import Error",
        description: `Network or server error: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setImporting(false)
      // Clear the file input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          className="h-9 ml-4"
          onClick={() => fileInputRef.current?.click()} // Trigger file input click
          disabled={importing}
        >
          {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {importing ? "Importing..." : "Import CSV"}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden" // Hide the actual file input
          />
        </Button>
      </div>
      <div className="rounded-md border">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No contacts found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Contacted</TableHead>
                <TableHead>Follow Up</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>
                          {contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {contact.name}
                    </div>
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contact.status === "New Lead"
                          ? "default"
                          : contact.status === "Follow Up"
                            ? "secondary"
                            : contact.status === "Contacted"
                              ? "outline"
                              : "success"
                      }
                    >
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{contact.lastContacted}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{contact.followupType}</span>
                      <span className="text-xs text-muted-foreground">{contact.suggestedFollowup}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/contacts/${contact.id}/edit`}>Edit contact</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={deletingId === contact.id}
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          {deletingId === contact.id ? "Deleting..." : "Delete contact"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Add to deal</DropdownMenuItem>
                        <DropdownMenuItem>Schedule follow-up</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
