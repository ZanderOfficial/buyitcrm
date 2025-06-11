"use server"
import { getSupabaseServerClient } from "@/lib/supabaseServer"
// Placeholder for Google Drive API interactions

interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  iconLink?: string
}

async function getGoogleTokens(userId: string): Promise<{ accessToken: string; refreshToken?: string | null } | null> {
  const supabase = getSupabaseServerClient()
  const { data: tokens, error } = await supabase
    .from("google_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single()

  if (error || !tokens) {
    console.warn("No Google tokens found for user for Drive:", userId, error?.message)
    return null
  }

  // Basic expiry check (can be enhanced with refresh logic like in calendar actions)
  if (new Date(tokens.expires_at).getTime() < Date.now() + 5 * 60 * 1000) {
    // Token expired or about to expire, attempt refresh (implement refresh logic here or share from calendar)
    console.log("Drive access token expired, refresh needed (not implemented in this stub).")
    // For now, return null or the expired token; a full implementation needs refresh.
    // const newAccessToken = await refreshAccessToken(userId, tokens.refresh_token); // Assuming refreshAccessToken exists
    // if (!newAccessToken) return null;
    // return { accessToken: newAccessToken, refreshToken: tokens.refresh_token };
    return null // Placeholder: requires refresh logic
  }

  return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token }
}

export async function getGoogleDriveFiles(): Promise<{ files: DriveFile[] | null; error: string | null }> {
  const supabase = getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { files: null, error: "User not authenticated." }

  const tokenInfo = await getGoogleTokens(user.id)
  if (!tokenInfo) return { files: null, error: "Google Drive not connected or token expired." }

  try {
    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,webViewLink,iconLink)",
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
      console.error("Error fetching Google Drive files:", response.status, errorData)
      return { files: null, error: `Failed to fetch Drive files: ${errorData.error?.message || response.statusText}` }
    }

    const data = await response.json()
    return { files: data.files as DriveFile[], error: null }
  } catch (error: any) {
    console.error("Exception fetching Google Drive files:", error)
    return { files: null, error: `An unexpected error occurred: ${error.message}` }
  }
}
