"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HardDrive, FileText, ExternalLink, Loader2 } from "lucide-react"
import { getGoogleDriveFiles } from "@/actions/google-drive"
import { toast } from "@/hooks/use-toast"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  iconLink?: string
}

export function GoogleDriveView() {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true)
      setError(null)
      const { files: fetchedFiles, error: fetchError } = await getGoogleDriveFiles()
      if (fetchError) {
        setError(fetchError)
        toast({ title: "Drive Error", description: fetchError, variant: "destructive" })
        setFiles([])
      } else if (fetchedFiles) {
        setFiles(fetchedFiles)
      }
      setLoading(false)
    }
    fetchFiles()
  }, [])

  const handleReconnect = () => {
    // For a full reconnect, redirect to the main Google login to re-grant scopes
    window.location.href = "/" // Or a specific re-auth URL if designed
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          <HardDrive className="h-5 w-5 mr-2 text-primary" />
          Google Drive Files
        </h3>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Fetching Drive files...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <HardDrive className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Google Drive Error</h3>
          <p className="text-sm text-muted-foreground mb-6">Could not load files: {error}</p>
          <Button onClick={handleReconnect}>Reconnect Google Account</Button>
        </div>
      ) : files.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No recent files found or Drive not connected.
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    {file.iconLink ? (
                      <img src={file.iconLink || "/placeholder.svg"} alt="file icon" className="h-4 w-4 mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Google Drive"
                      className="text-muted-foreground hover:text-primary transition-colors ml-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
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
            const fetchFiles = async () => {
              setLoading(true)
              setError(null)
              const { files: fetchedFiles, error: fetchError } = await getGoogleDriveFiles()
              if (fetchError) {
                setError(fetchError)
                toast({ title: "Drive Error", description: fetchError, variant: "destructive" })
                setFiles([])
              } else if (fetchedFiles) {
                setFiles(fetchedFiles)
              }
              setLoading(false)
            }
            fetchFiles()
          }}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh Files
        </Button>
      </div>
    </div>
  )
}
