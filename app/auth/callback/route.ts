import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // 'next' parameter determines where to redirect after successful login
  const next = searchParams.get("next") ?? "/dashboard/hq" // Default to dashboard

  if (code) {
    // Create a response object that we can set cookies on before redirecting
    const redirectURL = new URL(next, origin)
    const response = NextResponse.redirect(redirectURL.toString())

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options })
          },
        },
      },
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      return response // Return the response with session cookies set
    }

    console.error("Auth Callback - Error exchanging code for session:", exchangeError.message)
    // Redirect to login page with error message
    const errorRedirectUrl = new URL(`/?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`, origin)
    return NextResponse.redirect(errorRedirectUrl.toString())
  }

  console.error("Auth Callback - No code found in request.")
  // Redirect to login page if no code is present
  const noCodeRedirectUrl = new URL("/?error=auth_failed&message=no_auth_code_received", origin)
  return NextResponse.redirect(noCodeRedirectUrl.toString())
}
