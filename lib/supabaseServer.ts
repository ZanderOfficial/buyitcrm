import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function getSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // This can fail in middleware/edge runtime, ignore
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch {
          // This can fail in middleware/edge runtime, ignore
        }
      },
    },
  })
}

// Alternative function for server actions that need to handle auth properly
export async function getSupabaseServerClientWithAuth() {
  const supabase = getSupabaseServerClient()

  // Get the session to ensure we have proper auth context
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("Error getting session:", error)
    throw new Error("Authentication error")
  }

  if (!session) {
    throw new Error("User not authenticated")
  }

  return { supabase, session, user: session.user }
}
