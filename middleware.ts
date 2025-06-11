import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Check for SKIP_AUTH environment variable for development/testing purposes
  // IMPORTANT: Ensure this is disabled or removed for production deployments
  if (process.env.SKIP_AUTH === "true") {
    console.log("Skipping authentication due to SKIP_AUTH environment variable.")
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicRoutes = ["/", "/auth/callback", "/auth/error"]

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return response
  }

  if (user) {
    if (pathname === "/") {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/dashboard/hq"
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return response
  }

  if (publicRoutes.includes(pathname)) {
    return response
  }

  const loginUrl = new URL("/", request.url)
  loginUrl.searchParams.set("redirectTo", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
