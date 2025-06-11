"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Deal name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  status: z.string(), // e.g., Open, Closed Won, Closed Lost
  dealStage: z.string(), // e.g., Pre-Qualified, Needs Followup
  value: z.coerce.number().min(0, {
    message: "Value must be a positive number.",
  }),
  closeDate: z.string().optional(), // Expected close date
  notes: z.string().optional(),
  dealLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")), // Existing dealLink
  external_link: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")), // New: External Link
})

type DealFormValues = z.infer<typeof formSchema>

interface DealFormProps {
  dealId?: string // Optional prop for editing existing deals
}

export function DealForm({ dealId }: DealFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingDeal, setIsFetchingDeal] = useState(false)

  const form = useForm<DealFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      status: "Open",
      dealStage: "Pre-Qualified",
      value: 0,
      closeDate: "",
      notes: "",
      dealLink: "",
      external_link: "", // Initialize new field
    },
  })

  // Fetch deal data if dealId is provided (edit mode)
  useEffect(() => {
    async function fetchDeal() {
      if (!dealId) return

      setIsFetchingDeal(true)
      const { data, error } = await supabase.from("deals").select("*").eq("id", dealId).single()

      if (error) {
        console.error("Error fetching deal:", error.message)
        toast({
          title: "Error",
          description: "Failed to load deal data.",
          variant: "destructive",
        })
        router.push("/dashboard/deals") // Redirect back if deal not found or error
      } else if (data) {
        form.reset(data) // Populate form with fetched data
      }
      setIsFetchingDeal(false)
    }

    fetchDeal()
  }, [dealId, form, router])

  async function onSubmit(values: DealFormValues) {
    setIsLoading(true)

    let error = null
    if (dealId) {
      // Update existing deal
      const { error: updateError } = await supabase.from("deals").update(values).eq("id", dealId)
      error = updateError
    } else {
      // Insert new deal
      const { error: insertError } = await supabase.from("deals").insert(values)
      error = insertError
    }

    setIsLoading(false)

    if (error) {
      console.error("Supabase operation error:", error.message)
      toast({
        title: "Error",
        description: `Failed to ${dealId ? "update" : "add"} deal: ${error.message}`,
        variant: "destructive",
      })
    } else {
      toast({
        title: dealId ? "Deal updated" : "Deal added",
        description: `${values.name} has been ${dealId ? "updated" : "added"} to your deals.`,
      })
      router.refresh() // <--- Add this line to revalidate data
      router.push("/dashboard/deals")
    }
  }

  if (isFetchingDeal) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">Loading deal data...</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Name / Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp Deal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Value</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Email</FormLabel>
                    <FormControl>
                      <Input placeholder="client@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, Anytown, CA 90210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dealStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Stage</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a deal stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pre-Qualified">Pre-Qualified</SelectItem>
                        <SelectItem value="Needs Followup">Needs Followup</SelectItem>
                        <SelectItem value="Appointment Set">Appointment Set</SelectItem>
                        <SelectItem value="In Negotiation">In Negotiation</SelectItem>
                        <SelectItem value="Under Contract">Under Contract</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a deal status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Closed Won">Closed Won</SelectItem>
                        <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Close Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Optional: When do you expect to close this deal?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dealLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Deal Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/internal-deal-details" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional: A link to internal deal details (e.g., a specific CRM record).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="external_link" // New field
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/external-document" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional: A link to an external document or resource related to this deal.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information about this deal..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Include any relevant details about the deal.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (dealId ? "Updating..." : "Adding...") : dealId ? "Update Deal" : "Add Deal"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
