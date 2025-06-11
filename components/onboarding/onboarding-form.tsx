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
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { useUser } from "@/components/auth/user-provider"

// Define the schema for the onboarding form
const onboardingFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Please enter a valid date (YYYY-MM-DD)." }),
  companyTitle: z.string().min(2, { message: "Company title must be at least 2 characters." }),
  interests: z.string().optional(),
  consentedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
  consentedToPrivacy: z.boolean().refine((val) => val === true, {
    message: "You must agree to the privacy policy.",
  }),
})

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>

export function OnboardingForm() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      fullName: "",
      birthday: "",
      companyTitle: "",
      interests: "",
      consentedToTerms: false,
      consentedToPrivacy: false,
    },
  })

  // Pre-fill full name from email if available
  useEffect(() => {
    if (!userLoading && user?.email) {
      const emailParts = user.email.split("@")[0]
      // Attempt to format name from email (e.g., "john.doe" -> "John Doe")
      const suggestedName = emailParts
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
      form.setValue("fullName", suggestedName)
    }
  }, [user, userLoading, form])

  async function onSubmit(values: OnboardingFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive",
      })
      router.push("/") // Redirect to login
      return
    }

    setIsLoading(true)

    const { error } = await supabase.from("user_profiles").insert({
      user_id: user.id,
      full_name: values.fullName,
      birthday: values.birthday,
      company_title: values.companyTitle,
      interests: values.interests,
      consented_to_terms: values.consentedToTerms,
      consented_to_privacy: values.consentedToPrivacy,
    })

    setIsLoading(false)

    if (error) {
      console.error("Error saving profile:", error.message)
      toast({
        title: "Error",
        description: `Failed to save your profile: ${error.message}`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Profile Complete!",
        description: "Your profile has been successfully saved. Welcome to BuyIt CRM!",
      })
      router.push("/dashboard/hq") // Redirect to HQ after successful onboarding
    }
  }

  if (userLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center text-muted-foreground">Loading user data...</CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        <p className="text-sm text-muted-foreground">Just a few more details to get started.</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birthday</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>Your date of birth (YYYY-MM-DD).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Sales Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Real Estate Investing, Marketing, Technology" {...field} />
                  </FormControl>
                  <FormDescription>Tell us a bit about your professional interests.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consentedToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                        Terms and Conditions
                      </a>
                      .
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consentedToPrivacy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                      </a>
                      .
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving Profile..." : "Complete Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
