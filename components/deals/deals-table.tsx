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
import { MoreHorizontal, Search, Loader2, Upload, LinkIcon } from "lucide-react" // Added Upload icon
import { supabase } from "@/lib/supabaseClient"
import { toast } from "@/hooks/use-toast"

interface Deal {
  id: string
  name: string // Could be client name or deal name
  email: string
  phone: string
  address: string
  status: string // e.g., Open, Closed Won, Closed Lost
  dealStage: string // e.g., Pre-Qualified, Needs Followup, Appointment Set, In Negotiation, Under Contract, Completed
  value: number
  closeDate: string // Expected close date
  lastContacted: string
  notes?: string
  dealLink?: string // Existing internal link
  external_link?: string // New: External Link
}

export function DealsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false) // New state for import loading
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for file input

  const fetchDeals = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("deals").select("*")

    if (error) {
      console.error("Error fetching deals:", error.message)
      toast({
        title: "Error",
        description: "Failed to load deals.",
        variant: "destructive",
      })
    } else {
      setDeals(
        data.map((d) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          address: d.address,
          status: d.status,
          dealStage: d.dealStage,
          value: d.value,
          closeDate: d.closeDate || "N/A",
          lastContacted: d.lastContacted || "N/A",
          notes: d.notes || "",
          dealLink: d.dealLink || "",
          external_link: d.external_link || "", // Map new field
        })),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDeals()
  }, [])

  const handleDeleteDeal = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from("deals").delete().eq("id", id)
    setDeletingId(null)

    if (error) {
      console.error("Error deleting deal:", error.message)
      toast({
        title: "Error",
        description: `Failed to delete deal: ${error.message}`,
        variant: "destructive",
      })
    } else {
      setDeals(deals.filter((deal) => deal.id !== id))
      toast({
        title: "Deal deleted",
        description: "The deal has been successfully deleted.",
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
      const response = await fetch("/api/deals/import-csv", {
        // Target new API route
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Import Successful",
          description: result.message,
        })
        fetchDeals() // Refresh the table after successful import
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

  const filteredDeals = deals.filter(
    (deal) =>
      deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.phone.includes(searchTerm),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search deals..."
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
        ) : filteredDeals.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No deals found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead>Internal Link</TableHead>
                <TableHead>External Link</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>
                          {deal.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {deal.name}
                    </div>
                  </TableCell>
                  <TableCell>${deal.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{deal.dealStage}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        deal.status === "Open" ? "default" : deal.status === "Closed Won" ? "success" : "destructive"
                      }
                    >
                      {deal.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{deal.closeDate}</TableCell>
                  <TableCell>
                    {deal.dealLink ? (
                      <a
                        href={deal.dealLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        View Link
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deal.external_link ? (
                      <a
                        href={deal.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        View External
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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
                          <Link href={`/dashboard/deals/${deal.id}/edit`}>Edit deal</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={deletingId === deal.id} onClick={() => handleDeleteDeal(deal.id)}>
                          {deletingId === deal.id ? "Deleting..." : "Delete deal"}
                        </DropdownMenuItem>
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
