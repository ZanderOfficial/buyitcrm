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
import { supabase } from "@/lib/supabaseClient" // Import Supabase client

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
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
  status: z.string(),
  followupType: z.string(),
  notes: z.string().optional(),
})

type ContactFormValues = z.infer<typeof formSchema>

interface ContactFormProps {
  contactId?: string // Optional prop for editing existing contacts
}

export function ContactForm({ contactId }: ContactFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingContact, setIsFetchingContact] = useState(false)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      status: "New Lead",
      followupType: "Call",
      notes: "",
    },
  })

  // Fetch contact data if contactId is provided (edit mode)
  useEffect(() => {
    async function fetchContact() {
      if (!contactId) return

      setIsFetchingContact(true)
      const { data, error } = await supabase.from("contacts").select("*").eq("id", contactId).single()

      if (error) {
        console.error("Error fetching contact:", error.message)
        toast({
          title: "Error",
          description: "Failed to load contact data.",
          variant: "destructive",
        })
        router.push("/dashboard/contacts") // Redirect back if contact not found or error
      } else if (data) {
        form.reset(data) // Populate form with fetched data
      }
      setIsFetchingContact(false)
    }

    fetchContact()
  }, [contactId, form, router])

  async function onSubmit(values: ContactFormValues) {
    setIsLoading(true)

    let error = null
    if (contactId) {
      // Update existing contact
      const { error: updateError } = await supabase.from("contacts").update(values).eq("id", contactId)
      error = updateError
    } else {
      // Insert new contact
      const { error: insertError } = await supabase.from("contacts").insert(values)
      error = insertError
    }

    setIsLoading(false)

    if (error) {
      console.error("Supabase operation error:", error.message)
      toast({
        title: "Error",
        description: `Failed to ${contactId ? "update" : "add"} contact: ${error.message}`,
        variant: "destructive",
      })
    } else {
      toast({
        title: contactId ? "Contact updated" : "Contact added",
        description: `${values.name} has been ${contactId ? "updated" : "added"} to your contacts.`,
      })
      router.push("/dashboard/contacts")
    }
  }

  if (isFetchingContact) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">Loading contact data...</CardContent>
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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.smith@example.com" {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
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
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, Anytown, CA 90210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="New Lead">New Lead</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Follow Up">Follow Up</SelectItem>
                        <SelectItem value="Qualified">Qualified</SelectItem>
                        <SelectItem value="Proposal">Proposal</SelectItem>
                        <SelectItem value="Negotiation">Negotiation</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="followupType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a follow-up type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Call">Call</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                        <SelectItem value="Text">Text</SelectItem>
                        <SelectItem value="None">None</SelectItem>
                      </SelectContent>
                    </Select>
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
                      placeholder="Add any additional information about this contact..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Include any relevant details about the contact.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (contactId ? "Updating..." : "Adding...") : contactId ? "Update Contact" : "Add Contact"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
