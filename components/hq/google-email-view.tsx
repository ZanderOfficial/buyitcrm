"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, Loader2 } from "lucide-react"
import { getGmailMessages } from "@/actions/google-email"
import { toast } from "@/hooks/use-toast"

interface EmailMessage {
  id: string
  threadId: string
  snippet?: string
  // For simplicity, we're not fetching full payload here, just snippet
}

export function GoogleEmailView() {
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      setError(null)
      const { messages: fetchedMessages, error: fetchError } = await getGmailMessages()
      if (fetchError) {
        setError(fetchError)
        toast({ title: "Gmail Error", description: fetchError, variant: "destructive" })
        setMessages([])
      } else if (fetchedMessages) {
        setMessages(fetchedMessages)
      }
      setLoading(false)
    }
    fetchMessages()
  }, [])

  const handleReconnect = () => {
    window.location.href = "/"
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          <Mail className="h-5 w-5 mr-2 text-primary" />
          Recent Emails
        </h3>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Fetching emails...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <Mail className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Gmail Error</h3>
          <p className="text-sm text-muted-foreground mb-6">Could not load emails: {error}</p>
          <Button onClick={handleReconnect}>Reconnect Google Account</Button>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No recent emails found or Gmail not connected.
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {messages.map((msg) => (
              <Card key={msg.id}>
                <CardContent className="p-3">
                  {/* Gmail API's list doesn't give subject directly, full fetch needed for that. Snippet is available. */}
                  <p className="text-sm truncate" title={msg.snippet}>
                    {msg.snippet || "No snippet available"}
                  </p>
                  <p className="text-xs text-muted-foreground">ID: {msg.id}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
      <div className="p-3 border-t text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            /* Refresh logic */
            const fetchMessages = async () => {
              setLoading(true)
              setError(null)
              const { messages: fetchedMessages, error: fetchError } = await getGmailMessages()
              if (fetchError) {
                setError(fetchError)
                toast({ title: "Gmail Error", description: fetchError, variant: "destructive" })
                setMessages([])
              } else if (fetchedMessages) {
                setMessages(fetchedMessages)
              }
              setLoading(false)
            }
            fetchMessages()
          }}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh Emails
        </Button>
      </div>
    </div>
  )
}
