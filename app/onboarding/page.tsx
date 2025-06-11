import type { Metadata } from "next"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"

export const metadata: Metadata = {
  title: "Complete Your Profile",
  description: "Provide additional details to complete your BuyIt CRM profile.",
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <OnboardingForm />
    </div>
  )
}
