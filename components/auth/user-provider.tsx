"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { User, AuthError as SupabaseAuthError, Session } from "@supabase/supabase-js" // Renamed to avoid conflict
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: SupabaseAuthError | Error | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true) // True until initial session check completes
  const [error, setError] = useState<SupabaseAuthError | Error | null>(null)
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      // State will be updated by onAuthStateChange listener
      router.push("/")
    } catch (e) {
      console.error("Sign out error:", e)
      setError(e as SupabaseAuthError | Error)
      setIsLoading(false) // Ensure loading stops on error
    }
  }, [router])

  useEffect(() => {
    // Initial session check
    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) {
          console.error("Error getting initial session:", sessionError)
          setError(sessionError)
        }
        setSession(data.session)
        setUser(data.session?.user ?? null)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Exception during initial getSession:", err)
        setError(err as Error)
        setIsLoading(false)
      })

    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setError(null)
      setIsLoading(false) // Auth state change implies loading for that event is done

      if (_event === "SIGNED_OUT" && window.location.pathname !== "/") {
        // router.push("/"); // Optionally force redirect, or let middleware handle it
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    error,
    signOut: handleSignOut,
  }

  // Show global loading screen only during the very initial auth check if no session is immediately available
  if (isLoading && !user && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingOverlay isLoading={true} message="Initializing session..." fullScreen={false} />
      </div>
    )
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useUser() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
