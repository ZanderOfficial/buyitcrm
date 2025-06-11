"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthErrorProps {
  title?: string
  message: string
  retryAction?: () => void
  retryLabel?: string
  homeAction?: () => void
}

export function AuthError({
  title = "Authentication Error",
  message,
  retryAction,
  retryLabel = "Try Again",
  homeAction,
}: AuthErrorProps) {
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <CardTitle className="text-xl text-destructive">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground">{message}</p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {retryAction && (
          <Button onClick={retryAction} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryLabel}
          </Button>
        )}
        {homeAction && (
          <Button variant="outline" onClick={homeAction} className="w-full">
            Return to Login
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
