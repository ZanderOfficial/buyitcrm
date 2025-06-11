"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Mail, ChromeIcon as Google, AlertCircle, Loader2, CheckCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

type AuthStateType = "checking" | "idle" | "loading" | "error" | "magicLinkSent"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [authState, setAuthState] = useState<AuthStateType>("checking")
  const [message, setMessage] = useState<string | null>(null) // For general messages or errors
  const [debugInfo, setDebugInfo] = useState<string | null>(null) // For dev debugging

  const router = useRouter()
  const searchParams = useSearchParams()
  const finalRedirectTo = searchParams.get("redirectTo") || "/dashboard/hq"

  useEffect(() => {
    const errorParam = searchParams.get("error")
    const messageParam = searchParams.get("message") // For messages from callback

    if (errorParam) {
      let msg = "Authentication failed. Please try again."
      if (errorParam === "unauthorized_domain") {
        msg = "Your email domain is not authorized. Please use a @buyitrealestate.org or @buyitacquisitions.com email."
      } else if (messageParam) {
        msg = `Error: ${decodeURIComponent(messageParam)}`
      }
      setMessage(msg)
      setAuthState("error")
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete("error")
      newParams.delete("message")
      router.replace(`/?${newParams.toString()}`, { scroll: false })
    } else if (messageParam && messageParam === "magic_link_sent") {
      setMessage("Magic link sent! Please check your email to sign in.")
      setAuthState("magicLinkSent")
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete("message")
      router.replace(`/?${newParams.toString()}`, { scroll: false })
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          setDebugInfo(`Active session found for ${session.user.email}. Redirecting...`)
          router.push(finalRedirectTo)
        } else {
          // Only set to idle if not already showing an error or magic link sent message
          if (authState !== "error" && authState !== "magicLinkSent") {
            setAuthState("idle")
          }
          setDebugInfo("No active session. Ready for login.")
        }
      })
      .catch((err) => {
        console.error("Error checking session:", err)
        setMessage("Could not verify authentication status. Please try again.")
        setAuthState("error")
      })

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setDebugInfo(`Auth Event: ${event}`)
      if (event === "SIGNED_IN" && session) {
        setDebugInfo(`Auth event: SIGNED_IN as ${session.user.email}. Redirecting...`)
        router.push(finalRedirectTo)
      } else if (event === "SIGNED_OUT") {
        setAuthState("idle")
        setMessage(null) // Clear any previous messages on sign out
        setDebugInfo("Auth event: SIGNED_OUT.")
      }
    })

    return () => {
      authSubscription?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, finalRedirectTo, searchParams]) // authState removed to prevent re-triggering on its change

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthState("loading")
    setMessage(null)
    setDebugInfo("Processing Magic Link request...")

    const allowedDomains = ["buyitrealestate.org", "buyitacquisitions.com"]
    const domain = email.split("@")[1]

    if (!allowedDomains.includes(domain)) {
      setMessage("Your email domain is not authorized.")
      setAuthState("idle") // Or 'error' if preferred
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // emailRedirectTo is where the user will be ultimately redirected after clicking the link
        // and the /auth/callback route has processed the token.
        // Our /auth/callback route uses the 'next' query param, which is appended by default
        // if signInWithOtp is called from the client side and SITE_URL is configured.
        // For clarity, we can specify it, but Supabase often handles this well.
        // The link in the email itself will point to Supabase, then to your /auth/callback.
        emailRedirectTo: `${window.location.origin}${finalRedirectTo}`,
        // We can also pass data to the email template if needed
        // data: { full_name: 'User Name' } // Example
      },
    })

    if (error) {
      console.error("Magic Link error:", error)
      setMessage(`Failed to send magic link: ${error.message}`)
      setAuthState("error")
      setDebugInfo(`Magic Link Error Details: ${JSON.stringify(error, null, 2)}`)
    } else {
      setMessage("Magic link sent! Please check your email to sign in.")
      setAuthState("magicLinkSent")
      setDebugInfo("Magic link request successful. User should check email.")
    }
  }

  const handleGoogleLogin = async () => {
    setAuthState("loading")
    setMessage(null)
    setDebugInfo("Initiating Google OAuth flow...")

    const googleScopes = [
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/gmail.readonly",
    ]

    // The `next` param in redirectTo will be used by our /auth/callback route
    const supabaseCallbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(finalRedirectTo)}`
    setDebugInfo(`Supabase callback for Google: ${supabaseCallbackUrl}`)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: supabaseCallbackUrl,
        scopes: googleScopes.join(" "),
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    })

    if (oauthError) {
      console.error("Google OAuth error:", oauthError)
      setMessage(`Google Sign-In failed: ${oauthError.message}`)
      setAuthState("error")
      setDebugInfo(`OAuth Error Details: ${JSON.stringify(oauthError, null, 2)}`)
    } else {
      setDebugInfo("OAuth request sent. Redirecting to Google...")
    }
  }

  if (authState === "checking") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-center text-lg">Verifying authentication...</p>
            {debugInfo && <p className="text-xs text-muted-foreground mt-2">{debugInfo}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
      {authState === "loading" && (
        <LoadingOverlay
          isLoading={true}
          message={debugInfo?.includes("Google") ? "Connecting to Google..." : "Sending Magic Link..."}
          fullScreen={true}
        />
      )}

      <Card className="w-full max-w-md bg-card text-card-foreground">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">BuyIt CRM</span>
          </div>
          <CardTitle className="text-xl">Welcome Back</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to access your CRM</p>
        </CardHeader>
        <CardContent>
          {authState !== "magicLinkSent" && (
            <>
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                    disabled={authState === "loading"}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={authState === "loading" || !email}>
                  {authState === "loading" && !debugInfo?.includes("Google") ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Sign In with Magic Link
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={authState === "loading"}
              >
                {authState === "loading" && debugInfo?.includes("Google") ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Google className="mr-2 h-4 w-4" />
                    Sign In with Google
                  </>
                )}
              </Button>
            </>
          )}

          {message && (
            <div
              className={`mt-4 p-3 rounded-md ${authState === "error" ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30" : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30"}`}
            >
              <div className="flex items-start">
                {authState === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                )}
                <div
                  className={`text-sm ${authState === "error" ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}`}
                >
                  {message}
                </div>
              </div>
              {authState === "magicLinkSent" && (
                <Button
                  variant="link"
                  className="text-sm p-0 h-auto mt-2"
                  onClick={() => {
                    setAuthState("idle")
                    setMessage(null)
                    setEmail("")
                  }}
                >
                  Use a different email or method
                </Button>
              )}
            </div>
          )}

          {debugInfo && process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 rounded-md">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-mono break-all">DEBUG: {debugInfo}</p>
            </div>
          )}

          {authState !== "magicLinkSent" && (
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Don't have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    alert("Please contact your administrator to get an account.")
                  }}
                  className="text-primary hover:underline"
                >
                  Contact administrator
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
