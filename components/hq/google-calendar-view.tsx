"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CalendarDays, Clock, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser } from "@/components/auth/user-provider"
import { getGoogleCalendarEvents, disconnectGoogleCalendar } from "@/actions/google-calendar"
import { toast } from "@/hooks/use-toast"

interface CalendarEvent {
  id: string
  summary: string // Title
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  htmlLink: string
  location?: string
}

export function GoogleCalendarView() {
  const { user, loading: userLoading, status: authStatus } = useUser()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "error" | "loading">(
    "loading",
  )

  useEffect(() => {
    console.log(
      "GoogleCalendarView: userLoading:",
      userLoading,
      "authStatus:",
      authStatus,
      "user:",
      user ? user.id : "null",
    )
    if (userLoading || authStatus === "loading") return

    if (authStatus !== "authenticated" || !user) {
      console.log("GoogleCalendarView: User not authenticated, setting connection status to disconnected.")
      setConnectionStatus("disconnected")
      setLoadingEvents(false)
      return
    }

    const fetchEvents = async () => {
      console.log("GoogleCalendarView: Fetching calendar events...")
      setLoadingEvents(true)
      const { events: fetchedEvents, error } = await getGoogleCalendarEvents()

      if (error) {
        console.error("GoogleCalendarView: Error fetching calendar events:", error)
        if (error.includes("not connected") || error.includes("reconnect") || error.includes("No Google tokens")) {
          setConnectionStatus("disconnected")
        } else {
          setConnectionStatus("error")
        }
        toast({
          title: "Calendar Error",
          description: error,
          variant: "destructive",
        })
        setEvents([])
      } else if (fetchedEvents) {
        console.log(`GoogleCalendarView: Successfully fetched ${fetchedEvents.length} events.`)
        setEvents(fetchedEvents)
        setConnectionStatus("connected")
      } else {
        console.log("GoogleCalendarView: No events fetched, but no error. Setting to disconnected.")
        setConnectionStatus("disconnected")
        setEvents([])
      }
      setLoadingEvents(false)
    }

    fetchEvents()

    const interval = setInterval(fetchEvents, 5 * 60 * 1000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [user, userLoading, authStatus])

  const handleConnect = () => {
    console.log("GoogleCalendarView: handleConnect called.")
    if (!user || authStatus !== "authenticated") {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your Google Calendar.",
        variant: "destructive",
      })
      console.error("GoogleCalendarView: handleConnect - User not authenticated or user object missing.")
      return
    }
    if (!user.id) {
      toast({
        title: "User ID Missing",
        description: "Cannot initiate Google Calendar connection without a user ID.",
        variant: "destructive",
      })
      console.error("GoogleCalendarView: handleConnect - User ID is missing.")
      return
    }
    console.log(`GoogleCalendarView: Initiating Google Calendar connection for user ID: ${user.id}. Redirecting...`)
    window.location.href = `/api/google-calendar/auth?userId=${user.id}`
  }

  const handleDisconnect = async () => {
    console.log("GoogleCalendarView: handleDisconnect called.")
    setLoadingEvents(true)
    const { success, error } = await disconnectGoogleCalendar()
    if (success) {
      setConnectionStatus("disconnected")
      setEvents([])
      toast({
        title: "Calendar Disconnected",
        description: "Your Google Calendar has been disconnected.",
      })
    } else {
      toast({
        title: "Error",
        description: error || "Failed to disconnect calendar.",
        variant: "destructive",
      })
    }
    setLoadingEvents(false)
  }

  const formatEventTime = (start: CalendarEvent["start"], end: CalendarEvent["end"]): string => {
    if (start.date) {
      return `All-day on ${new Date(start.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
    }
    if (start.dateTime && end.dateTime) {
      const startTime = new Date(start.dateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      const endTime = new Date(end.dateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      const startDate = new Date(start.dateTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      return `${startDate}, ${startTime} - ${endTime}`
    }
    return "Time not specified"
  }

  if (userLoading || connectionStatus === "loading" || authStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading calendar status...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {connectionStatus === "disconnected" || connectionStatus === "error" ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <CalendarDays className="h-16 w-16 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect your Google Calendar</h3>
          <p className="text-sm text-muted-foreground mb-6">
            View your upcoming events and schedule directly from your HQ.
          </p>
          <Button onClick={handleConnect} disabled={loadingEvents || authStatus !== "authenticated"}>
            {loadingEvents ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Connect to Google Calendar
          </Button>
          {authStatus !== "authenticated" && (
            <p className="text-xs text-yellow-600 mt-2">You must be logged in to connect.</p>
          )}
          {connectionStatus === "error" && (
            <p className="text-xs text-red-500 mt-4">
              There was an error connecting. Please try again or check your settings.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-primary" />
              Upcoming Events
            </h3>
          </div>
          {loadingEvents ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Fetching events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">No upcoming events.</div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-3 p-4">
                {events.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm mb-1">{event.summary}</h4>
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in Google Calendar"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1.5 flex items-center">
                        <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                        {formatEventTime(event.start, event.end)}
                      </p>
                      {event.location && (
                        <Badge variant="outline" className="text-xs py-0.5 px-1.5">
                          {event.location}
                        </Badge>
                      )}
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 pt-1.5 border-t border-dashed">
                          {event.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
          <div className="p-3 border-t text-center">
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={loadingEvents}>
              {loadingEvents ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Disconnect Calendar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
