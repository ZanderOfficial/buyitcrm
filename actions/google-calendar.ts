"use server"

import { getSupabaseServerClient } from "@/lib/supabaseServer"

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  htmlLink: string
  location?: string
}

// Helper to refresh access token
async function refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("Missing Google Client ID or Secret for token refresh.")
    return null
  }

  const supabase = getSupabaseServerClient()

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    })

    const data = await response.json()

    if (data.error) {
      console.error("Error refreshing token:", data.error_description || data.error)
      // If refresh token is invalid, delete it from DB to force re-auth
      await supabase.from("google_tokens").delete().eq("user_id", userId)
      return null
    }

    const newAccessToken = data.access_token
    const newExpiresIn = data.expires_in || 3600

    // Update the database with the new access token and expiry
    const { error: updateError } = await supabase
      .from("google_tokens")
      .update({
        access_token: newAccessToken,
        expires_at: new Date(Date.now() + newExpiresIn * 1000).toISOString(),
        // refresh_token is usually not returned on refresh, so we keep the old one
      })
      .eq("user_id", userId)

    if (updateError) {
      console.error("Error updating refreshed token in DB:", updateError.message)
      return null
    }

    return newAccessToken
  } catch (error) {
    console.error("Exception during token refresh:", error)
    return null
  }
}

export async function getGoogleCalendarEvents(): Promise<{ events: CalendarEvent[] | null; error: string | null }> {
  try {
    const supabase = getSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("User not authenticated:", userError?.message)
      return { events: null, error: "User not authenticated." }
    }

    const { data: tokens, error: tokenError } = await supabase
      .from("google_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .single()

    if (tokenError || !tokens) {
      console.warn("No Google tokens found for user:", user.id, tokenError?.message)
      return { events: null, error: "Google Calendar not connected. Please connect your Google account." }
    }

    let accessToken = tokens.access_token
    const refreshToken = tokens.refresh_token
    const expiresAt = new Date(tokens.expires_at)

    // Check if token is expired or about to expire (e.g., within 5 minutes)
    if (expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
      if (refreshToken) {
        console.log("Access token expired, attempting to refresh...")
        const newAccessToken = await refreshAccessToken(user.id, refreshToken)
        if (!newAccessToken) {
          return { events: null, error: "Failed to refresh Google access token. Please reconnect your Google account." }
        }
        accessToken = newAccessToken
      } else {
        return {
          events: null,
          error: "Access token expired and no refresh token available. Please reconnect your Google account.",
        }
      }
    }

    try {
      const now = new Date()
      const timeMin = now.toISOString()
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days

      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          // Ensure no-cache to always get fresh data
          cache: "no-store",
        },
      )

      if (!calendarResponse.ok) {
        const errorText = await calendarResponse.text()
        console.error("Error fetching Google Calendar events:", calendarResponse.status, errorText)
        // If 401, token is likely invalid, delete it
        if (calendarResponse.status === 401) {
          await supabase.from("google_tokens").delete().eq("user_id", user.id)
          return { events: null, error: "Google access token invalid. Please reconnect your Google account." }
        }
        return { events: null, error: `Failed to fetch calendar events: ${calendarResponse.statusText}` }
      }

      const calendarData = await calendarResponse.json()
      const events: CalendarEvent[] = (calendarData.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || "No Title",
        description: item.description,
        start: item.start,
        end: item.end,
        htmlLink: item.htmlLink,
        location: item.location,
      }))

      return { events, error: null }
    } catch (error: any) {
      console.error("Exception fetching Google Calendar events:", error)
      return { events: null, error: `An unexpected error occurred: ${error.message}` }
    }
  } catch (authError: any) {
    console.error("Authentication error in getGoogleCalendarEvents:", authError)
    return { events: null, error: "User not authenticated." }
  }
}

export async function disconnectGoogleCalendar(): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getSupabaseServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("User not authenticated:", userError?.message)
      return { success: false, error: "User not authenticated." }
    }

    // Delete tokens from Supabase
    const { error: dbError } = await supabase.from("google_tokens").delete().eq("user_id", user.id)

    if (dbError) {
      console.error("Error deleting Google tokens from DB:", dbError.message)
      return { success: false, error: "Failed to disconnect calendar." }
    }

    return { success: true, error: null }
  } catch (authError: any) {
    console.error("Authentication error in disconnectGoogleCalendar:", authError)
    return { success: false, error: "User not authenticated." }
  }
}
