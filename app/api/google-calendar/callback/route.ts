import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabaseServer"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state") // This should contain the user ID
  const error = searchParams.get("error")

  if (error) {
    console.error("OAuth error:", error)
    const redirectUrl = new URL("/dashboard/hq", request.url)
    redirectUrl.searchParams.set("error", "auth_failed")
    redirectUrl.searchParams.set("message", error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    console.error("No authorization code received")
    const redirectUrl = new URL("/dashboard/hq", request.url)
    redirectUrl.searchParams.set("error", "auth_failed")
    redirectUrl.searchParams.set("message", "No authorization code received")
    return NextResponse.redirect(redirectUrl)
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("Missing Google OAuth credentials")
    const redirectUrl = new URL("/dashboard/hq", request.url)
    redirectUrl.searchParams.set("error", "auth_failed")
    redirectUrl.searchParams.set("message", "Server configuration error")
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const supabase = getSupabaseServerClient()

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("User not authenticated:", userError?.message)
      const redirectUrl = new URL("/", request.url)
      redirectUrl.searchParams.set("error", "auth_failed")
      redirectUrl.searchParams.set("message", "User not authenticated")
      return NextResponse.redirect(redirectUrl)
    }

    // Exchange authorization code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_VERCEL_URL}/api/google-calendar/callback`

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }).toString(),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error_description || tokenData.error)
      const redirectUrl = new URL("/dashboard/hq", request.url)
      redirectUrl.searchParams.set("error", "token_exchange_failed")
      redirectUrl.searchParams.set("message", tokenData.error_description || tokenData.error)
      return NextResponse.redirect(redirectUrl)
    }

    // Store tokens in Supabase
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    const { error: tokenStoreError } = await supabase.from("google_tokens").upsert({
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
    })

    if (tokenStoreError) {
      console.error("Error storing Google tokens:", tokenStoreError.message)
      const redirectUrl = new URL("/dashboard/hq", request.url)
      redirectUrl.searchParams.set("error", "token_storage_failed")
      redirectUrl.searchParams.set("message", "Failed to store authentication tokens")
      return NextResponse.redirect(redirectUrl)
    }

    // Success - redirect to HQ
    const redirectUrl = new URL("/dashboard/hq", request.url)
    redirectUrl.searchParams.set("google_calendar", "connected")
    return NextResponse.redirect(redirectUrl)
  } catch (error: any) {
    console.error("Exception in OAuth callback:", error)
    const redirectUrl = new URL("/dashboard/hq", request.url)
    redirectUrl.searchParams.set("error", "auth_failed")
    redirectUrl.searchParams.set("message", "An unexpected error occurred")
    return NextResponse.redirect(redirectUrl)
  }
}
