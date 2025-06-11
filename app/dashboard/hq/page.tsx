import type { Metadata } from "next"
import { HQRoom } from "@/components/hq/hq-room"

export const metadata: Metadata = {
  title: "HQ - Command Center",
  description: "Your interactive CRM headquarters",
}

export default function HQPage() {
  return <HQRoom />
}
