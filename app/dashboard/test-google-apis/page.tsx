"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, HardDrive, Mail, CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import { getGoogleCalendarEvents, disconnectGoogleCalendar } from "@/actions/google-calendar"
import { getGoogleDriveFiles } from "@/actions/google-drive"
import { getGmailMessages } from "@/actions/google-email"
import { toast } from "@/hooks/use-toast"

interface TestResult {
  service: string
  status: "idle" | "testing" | "success" | "error"
  data?: any
  error?: string
  details?: string
}

export default function TestGoogleAPIsPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { service: "Calendar", status: "idle" },
    { service: "Drive", status: "idle" },
    { service: "Email", status: "idle" },
  ])
  const [isTestingAll, setIsTestingAll] = useState(false)

  const updateTestResult = (service: string, updates: Partial<TestResult>) => {
    setTestResults((prev) => prev.map((result) => (result.service === service ? { ...result, ...updates } : result)))
  }

  const testCalendarAPI = async () => {
    updateTestResult("Calendar", { status: "testing", error: undefined, data: undefined })

    try {
      const { events, error } = await getGoogleCalendarEvents()

      if (error) {
        updateTestResult("Calendar", {
          status: "error",
          error,
          details: `Failed to fetch calendar events: ${error}`,
        })
        toast({
          title: "Calendar API Test Failed",
          description: error,
          variant: "destructive",
        })
      } else {
        updateTestResult("Calendar", {
          status: "success",
          data: events,
          details: `Successfully fetched ${events?.length || 0} calendar events`,
        })
        toast({
          title: "Calendar API Test Passed",
          description: `Found ${events?.length || 0} events`,
        })
      }
    } catch (err: any) {
      const errorMsg = `Exception: ${err.message}`
      updateTestResult("Calendar", {
        status: "error",
        error: errorMsg,
        details: errorMsg,
      })
      toast({
        title: "Calendar API Test Failed",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const testDriveAPI = async () => {
    updateTestResult("Drive", { status: "testing", error: undefined, data: undefined })

    try {
      const { files, error } = await getGoogleDriveFiles()

      if (error) {
        updateTestResult("Drive", {
          status: "error",
          error,
          details: `Failed to fetch Drive files: ${error}`,
        })
        toast({
          title: "Drive API Test Failed",
          description: error,
          variant: "destructive",
        })
      } else {
        updateTestResult("Drive", {
          status: "success",
          data: files,
          details: `Successfully fetched ${files?.length || 0} Drive files`,
        })
        toast({
          title: "Drive API Test Passed",
          description: `Found ${files?.length || 0} files`,
        })
      }
    } catch (err: any) {
      const errorMsg = `Exception: ${err.message}`
      updateTestResult("Drive", {
        status: "error",
        error: errorMsg,
        details: errorMsg,
      })
      toast({
        title: "Drive API Test Failed",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const testEmailAPI = async () => {
    updateTestResult("Email", { status: "testing", error: undefined, data: undefined })

    try {
      const { messages, error } = await getGmailMessages()

      if (error) {
        updateTestResult("Email", {
          status: "error",
          error,
          details: `Failed to fetch Gmail messages: ${error}`,
        })
        toast({
          title: "Email API Test Failed",
          description: error,
          variant: "destructive",
        })
      } else {
        updateTestResult("Email", {
          status: "success",
          data: messages,
          details: `Successfully fetched ${messages?.length || 0} email messages`,
        })
        toast({
          title: "Email API Test Passed",
          description: `Found ${messages?.length || 0} messages`,
        })
      }
    } catch (err: any) {
      const errorMsg = `Exception: ${err.message}`
      updateTestResult("Email", {
        status: "error",
        error: errorMsg,
        details: errorMsg,
      })
      toast({
        title: "Email API Test Failed",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const testAllAPIs = async () => {
    setIsTestingAll(true)

    // Reset all results
    setTestResults([
      { service: "Calendar", status: "idle" },
      { service: "Drive", status: "idle" },
      { service: "Email", status: "idle" },
    ])

    // Test each API sequentially
    await testCalendarAPI()
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Small delay between tests

    await testDriveAPI()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await testEmailAPI()

    setIsTestingAll(false)

    toast({
      title: "API Testing Complete",
      description: "Check the results below for detailed information",
    })
  }

  const resetTests = () => {
    setTestResults([
      { service: "Calendar", status: "idle" },
      { service: "Drive", status: "idle" },
      { service: "Email", status: "idle" },
    ])
  }

  const handleDisconnectGoogle = async () => {
    const { success, error } = await disconnectGoogleCalendar()
    if (success) {
      toast({
        title: "Google Account Disconnected",
        description: "All Google services have been disconnected. You'll need to reconnect to test APIs.",
      })
      resetTests()
    } else {
      toast({
        title: "Disconnect Failed",
        description: error || "Failed to disconnect Google account",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "testing":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case "Calendar":
        return <CalendarDays className="h-5 w-5" />
      case "Drive":
        return <HardDrive className="h-5 w-5" />
      case "Email":
        return <Mail className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Google APIs Integration Test</h1>
        <p className="text-muted-foreground">
          Test your Google Calendar, Drive, and Email API integrations to ensure they're working properly.
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 mb-6">
        <Button onClick={testAllAPIs} disabled={isTestingAll} className="flex items-center gap-2">
          {isTestingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Test All APIs
        </Button>

        <Button variant="outline" onClick={resetTests}>
          Reset Tests
        </Button>

        <Button variant="destructive" onClick={handleDisconnectGoogle}>
          Disconnect Google
        </Button>
      </div>

      {/* Individual API Tests */}
      <div className="grid gap-4 mb-6">
        {testResults.map((result) => (
          <Card key={result.service}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getServiceIcon(result.service)}
                  Google {result.service} API
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <Badge
                    variant={
                      result.status === "success"
                        ? "default"
                        : result.status === "error"
                          ? "destructive"
                          : result.status === "testing"
                            ? "secondary"
                            : "outline"
                    }
                  >
                    {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Button
                  size="sm"
                  onClick={() => {
                    if (result.service === "Calendar") testCalendarAPI()
                    else if (result.service === "Drive") testDriveAPI()
                    else if (result.service === "Email") testEmailAPI()
                  }}
                  disabled={result.status === "testing"}
                >
                  {result.status === "testing" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Test {result.service}
                </Button>
              </div>

              {result.details && (
                <p
                  className={`text-sm mb-2 ${
                    result.status === "success"
                      ? "text-green-600"
                      : result.status === "error"
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {result.details}
                </p>
              )}

              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                  <p className="text-red-800 text-sm font-medium">Error:</p>
                  <p className="text-red-700 text-sm">{result.error}</p>
                </div>
              )}

              {result.data && result.status === "success" && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-green-800 text-sm font-medium mb-2">Sample Data:</p>
                  <ScrollArea className="h-32">
                    <pre className="text-xs text-green-700 whitespace-pre-wrap">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {testResults.filter((r) => r.status === "success").length}
              </p>
              <p className="text-sm text-muted-foreground">Passed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {testResults.filter((r) => r.status === "error").length}
              </p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {testResults.filter((r) => r.status === "idle").length}
              </p>
              <p className="text-sm text-muted-foreground">Not Tested</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium">1. Prerequisites</h4>
            <p className="text-sm text-muted-foreground">
              Make sure you're logged in with a Google account that has the required permissions.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">2. Expected Results</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • <strong>Calendar:</strong> Should fetch your upcoming calendar events
              </li>
              <li>
                • <strong>Drive:</strong> Should fetch your recent Google Drive files
              </li>
              <li>
                • <strong>Email:</strong> Should fetch your recent Gmail messages
              </li>
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">3. Troubleshooting</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• If tests fail, check that the Google APIs are enabled in Google Cloud Console</li>
              <li>• Verify that your OAuth scopes include the required permissions</li>
              <li>• Check that your access tokens haven't expired</li>
              <li>• Try disconnecting and reconnecting your Google account</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
