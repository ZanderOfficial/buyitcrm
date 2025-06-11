import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabaseServer"

export async function GET(request: Request) {
  console.log("GOOGLE_AUTH_ROUTE: Received request to /api/google-calendar/auth")
  const { searchParams } = new URL(request.url)
  const userIdFromQuery = searchParams.get("userId")
  console.log(`GOOGLE_AUTH_ROUTE: userId from query: ${userIdFromQuery}`)

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error("GOOGLE_AUTH_ROUTE: ERROR - GOOGLE_CLIENT_ID is not set.")
    return NextResponse.json({ error: "Server configuration error: Missing Google Client ID." }, { status: 500 })
  }
  if (!process.env.NEXT_PUBLIC_VERCEL_URL) {
    console.error("GOOGLE_AUTH_ROUTE: ERROR - NEXT_PUBLIC_VERCEL_URL is not set.")
    // Fallback for local development if NEXT_PUBLIC_VERCEL_URL is not set, assuming http://localhost:3000
    // In production, this must be set.
    if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_VERCEL_URL) {
      console.warn(
        "GOOGLE_AUTH_ROUTE: WARNING - NEXT_PUBLIC_VERCEL_URL is not set. Defaulting to http://localhost:3000 for local development.",
      )
      process.env.NEXT_PUBLIC_VERCEL_URL = "http://localhost:3000"
    } else {
      return NextResponse.json({ error: "Server configuration error: Missing Vercel URL." }, { status: 500 })
    }
  }
  console.log(`GOOGLE_AUTH_ROUTE: GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "Loaded" : "MISSING!"}`)
  console.log(`GOOGLE_AUTH_ROUTE: https://buyitcrm.vercel.app: ${process.env.NEXT_PUBLIC_VERCEL_URL}`)

  try {
    const supabase = getSupabaseServerClient()
    console.log("GOOGLE_AUTH_ROUTE: Supabase client initialized.")

    // Verify the user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("GOOGLE_AUTH_ROUTE: ERROR - Supabase userError:", userError.message)
      return NextResponse.redirect(new URL("/?error=auth_failed&message=Supabase_user_error", request.url))
    }
    if (!user) {
      console.error("GOOGLE_AUTH_ROUTE: ERROR - User not authenticated in API route.")
      return NextResponse.redirect(new URL("/?error=auth_failed&message=User_not_authenticated_in_API", request.url))
    }
    console.log(`GOOGLE_AUTH_ROUTE: Authenticated user ID: ${user.id}`)

    // Ensure the redirect URI is correctly formed for the current environment
    const redirectUri = `${process.env.NEXT_PUBLIC_VERCEL_URL}/api/google-calendar/callback`
    console.log(`GOOGLE_AUTH_ROUTE: Constructed redirectUri: ${redirectUri}`)

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.append("client_id", process.env.GOOGLE_CLIENT_ID)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append(
      "scope",
      "email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly",
    )
    authUrl.searchParams.append("access_type", "offline") // Request refresh token
    authUrl.searchParams.append("prompt", "consent select_account") // Force consent and account selection
    authUrl.searchParams.append("state", user.id) // Pass user ID to state for callback verification

    console.log(`GOOGLE_AUTH_ROUTE: Constructed Google OAuth URL: ${authUrl.toString()}`)
    console.log("GOOGLE_AUTH_ROUTE: Attempting to redirect to Google OAuth URL...")
    return NextResponse.redirect(authUrl.toString())
  } catch (error: any) {
    console.error(
      "GOOGLE_AUTH_ROUTE: CRITICAL ERROR - Exception in Google OAuth initiation:",
      error.message,
      error.stack,
    )
    const redirectUrl = new URL("/dashboard/hq", request.url)
    redirectUrl.searchParams.set("error", "auth_init_failed")
    redirectUrl.searchParams.set("message", "Failed to initiate Google OAuth due to an internal server error.")
    return NextResponse.redirect(redirectUrl)
  }
}
