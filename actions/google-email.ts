"use server"
import { getSupabaseServerClient } from "@/lib/supabaseServer"
// Placeholder for Gmail API interactions

interface EmailMessage {
  id: string
  threadId: string
  snippet?: string
  payload?: { headers?: { name: string; value: string }[] }
}

async function getGoogleTokens(userId: string): Promise<{ accessToken: string; refreshToken?: string | null } | null> {
  const supabase = getSupabaseServerClient()
  const { data: tokens, error } = await supabase
    .from("google_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single()

  if (error || !tokens) {
    console.warn("No Google tokens found for user for Email:", userId, error?.message)
    return null
  }
  // Basic expiry check (can be enhanced with refresh logic)
  if (new Date(tokens.expires_at).getTime() < Date.now() + 5 * 60 * 1000) {
    console.log("Email access token expired, refresh needed (not implemented in this stub).")
    return null // Placeholder: requires refresh logic
  }
  return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token }
}

export async function getGmailMessages(): Promise<{ messages: EmailMessage[] | null; error: string | null }> {
  const supabase = getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { messages: null, error: "User not authenticated." }

  const tokenInfo = await getGoogleTokens(user.id)
  if (!tokenInfo) return { messages: null, error: "Gmail not connected or token expired." }

  try {
    // Fetch 5 most recent messages
    const response = await fetch(
      "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=5&format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date",
      {
        headers: {
          Authorization: `Bearer ${tokenInfo.accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error fetching Gmail messages:", response.status, errorData)
      return {
        messages: null,
        error: `Failed to fetch Gmail messages: ${errorData.error?.message || response.statusText}`,
      }
    }
    const listData = await response.json()
    // For simplicity, returning the list response; actual message content requires further calls.
    // A full implementation would fetch each message individually using its ID.
    return { messages: listData.messages as EmailMessage[], error: null }
  } catch (error: any) {
    console.error("Exception fetching Gmail messages:", error)
    return { messages: null, error: `An unexpected error occurred: ${error.message}` }
  }
}
