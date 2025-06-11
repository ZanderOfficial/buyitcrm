"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Folder,
  Upload,
  Search,
  MoreHorizontal,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  LinkIcon,
} from "lucide-react"

interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string // Keep mimeType for conceptual type
  modifiedTime: string
  size?: string
  webViewLink?: string
}

const folders = [
  { name: "Contracts", count: 12, color: "bg-blue-100 text-blue-800" },
  { name: "Photos", count: 8, color: "bg-green-100 text-green-800" },
  { name: "Reports", count: 15, color: "bg-yellow-100 text-yellow-800" },
  { name: "Analysis", count: 6, color: "bg-purple-100 text-purple-800" },
  { name: "Legal", count: 9, color: "bg-red-100 text-red-800" },
]

// Sample local files data
const sampleFiles = [
  {
    id: "local-1",
    name: "ClientAgreement_2023.pdf",
    mimeType: "application/pdf",
    type: "PDF",
    size: "1.2 MB",
    modifiedTime: new Date().toISOString(),
  },
  {
    id: "local-2",
    name: "PropertyPhotos_Jan2024.zip",
    mimeType: "application/zip",
    type: "ZIP",
    size: "25.8 MB",
    modifiedTime: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "local-3",
    name: "QuarterlyReport_Q1.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    type: "Excel",
    size: "345 KB",
    modifiedTime: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "local-4",
    name: "MeetingMinutes_2024-05-15.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    type: "Word",
    size: "120 KB",
    modifiedTime: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
]

export function FilesHub() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [files, setFiles] = useState(sampleFiles) // Use local sample files for now

  const filteredFiles = files.filter(
    (file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedFolder || file.name.toLowerCase().includes(selectedFolder.toLowerCase())), // Simple filter for sample
  )

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button className="flex items-center gap-2" disabled>
          <Upload className="h-4 w-4" />
          Upload Files (Coming Soon)
        </Button>
        <Button variant="outline" className="flex items-center gap-2" disabled>
          <Plus className="h-4 w-4" />
          Create Folder (Coming Soon)
        </Button>
        <Button variant="outline" className="flex items-center gap-2" disabled>
          <LinkIcon className="h-4 w-4" />
          Connect Google Drive (Coming Soon)
        </Button>
      </div>

      {/* Folders Overview (Placeholder for now, as Google Drive API doesn't directly map to these) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {folders.map((folder) => (
          <Card
            key={folder.name}
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedFolder === folder.name ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedFolder(selectedFolder === folder.name ? null : folder.name)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  {folder.name}
                </div>
                <Badge className={folder.color} variant="secondary">
                  {folder.count}
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search files..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedFolder && (
          <Button variant="outline" size="sm" onClick={() => setSelectedFolder(null)}>
            Clear Filter
          </Button>
        )}
      </div>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Files</span>
            <Badge variant="outline">{files.length} files</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No files found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        {file.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.type}</Badge>
                    </TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(file.modifiedTime).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem disabled>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" disabled>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
