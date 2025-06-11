"use client"

import Link from "next/link"

import { useState, useEffect, useCallback } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Phone, Mail, Clock, Plus, Loader2 } from "lucide-react" // Added Loader2
import { supabase } from "@/lib/supabaseClient" // Import Supabase client
import { toast } from "@/hooks/use-toast" // Import toast

// Define the structure for a Deal (matching your Supabase table)
interface Deal {
  id: string
  name: string
  address: string
  email: string
  phone: string
  lastContacted: string // This would ideally be a Date type
  closeDate: string // This would ideally be a Date type
  status: string // e.g., Open, Closed Won, Closed Lost
  dealStage: string // e.g., Pre-Qualified, Needs Followup, Appointment Set, In Negotiation, Under Contract, Completed
  value: number
  notes?: string
  dealLink?: string
  external_link?: string
}

// Define the structure for a Column in the pipeline
interface Column {
  id: string
  title: string
  dealIds: string[]
}

// Define the overall state structure for the pipeline
interface PipelineData {
  columns: { [key: string]: Column }
  deals: { [key: string]: Deal }
}

// Define all possible deal stages to create columns
const ALL_DEAL_STAGES = [
  "Pre-Qualified",
  "Needs Followup",
  "Appointment Set",
  "In Negotiation",
  "Under Contract",
  "Completed",
]

export function PipelineView() {
  const [pipelineData, setPipelineData] = useState<PipelineData>({ columns: {}, deals: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from("deals").select("*")

    if (error) {
      console.error("Error fetching deals for pipeline:", error.message)
      setError("Failed to load deals for the pipeline.")
      setPipelineData({ columns: {}, deals: {} })
    } else {
      const newDeals: { [key: string]: Deal } = {}
      const newColumns: { [key: string]: Column } = {}

      // Initialize columns for all possible stages
      ALL_DEAL_STAGES.forEach((stage) => {
        newColumns[stage.toLowerCase().replace(/\s/g, "-")] = {
          id: stage.toLowerCase().replace(/\s/g, "-"),
          title: stage,
          dealIds: [],
        }
      })

      // Populate deals and assign them to columns
      data.forEach((deal) => {
        newDeals[deal.id] = {
          id: deal.id,
          name: deal.name,
          address: deal.address,
          email: deal.email,
          phone: deal.phone,
          lastContacted: deal.lastContacted || "N/A",
          closeDate: deal.closeDate || "N/A",
          status: deal.status,
          dealStage: deal.dealStage,
          value: deal.value,
          notes: deal.notes || "",
          dealLink: deal.dealLink || "",
          external_link: deal.external_link || "",
        }

        const columnId = deal.dealStage.toLowerCase().replace(/\s/g, "-")
        if (newColumns[columnId]) {
          newColumns[columnId].dealIds.push(deal.id)
        } else {
          // Handle cases where a deal might have a stage not in ALL_DEAL_STAGES
          console.warn(`Deal ${deal.id} has unknown stage: ${deal.dealStage}. Placing in 'Pre-Qualified'.`)
          newColumns["pre-qualified"].dealIds.push(deal.id)
        }
      })

      setPipelineData({ columns: newColumns, deals: newDeals })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result

    // If there's no destination or the item was dropped back in the same place
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    const sourceColumn = pipelineData.columns[source.droppableId]
    const destColumn = pipelineData.columns[destination.droppableId]

    // Optimistic UI update
    const newPipelineData = { ...pipelineData }
    const movedDeal = newPipelineData.deals[draggableId]
    const oldStage = sourceColumn.title
    const newStage = destColumn.title

    // Update local state immediately
    if (sourceColumn.id === destColumn.id) {
      const newDealIds = Array.from(sourceColumn.dealIds)
      newDealIds.splice(source.index, 1)
      newDealIds.splice(destination.index, 0, draggableId)
      newPipelineData.columns[sourceColumn.id] = {
        ...sourceColumn,
        dealIds: newDealIds,
      }
    } else {
      const sourceDealIds = Array.from(sourceColumn.dealIds)
      sourceDealIds.splice(source.index, 1)
      newPipelineData.columns[sourceColumn.id] = {
        ...sourceColumn,
        dealIds: sourceDealIds,
      }

      const destDealIds = Array.from(destColumn.dealIds)
      destDealIds.splice(destination.index, 0, draggableId)
      newPipelineData.columns[destColumn.id] = {
        ...destColumn,
        dealIds: destDealIds,
      }
      // Update the deal's stage in the local data
      newPipelineData.deals[draggableId].dealStage = newStage
    }
    setPipelineData(newPipelineData)

    // Update Supabase
    const { error } = await supabase.from("deals").update({ dealStage: newStage }).eq("id", draggableId)

    if (error) {
      console.error("Error updating deal stage in Supabase:", error.message)
      toast({
        title: "Error",
        description: `Failed to update deal stage for ${movedDeal.name}. Please refresh.`,
        variant: "destructive",
      })
      // Revert UI if Supabase update fails (optional, but good for robustness)
      fetchDeals()
    } else {
      toast({
        title: "Deal Updated",
        description: `Deal "${movedDeal.name}" moved from "${oldStage}" to "${newStage}".`,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Loading pipeline...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <Button onClick={fetchDeals} className="mt-4">
          Retry Loading Deals
        </Button>
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto pb-4 space-x-4">
        {Object.values(pipelineData.columns).map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-sm">{column.title}</h3>
                <Badge variant="outline">{column.dealIds.length}</Badge>
              </div>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 min-h-[200px]">
                    {column.dealIds.map((dealId, index) => {
                      const deal = pipelineData.deals[dealId]
                      if (!deal) return null // Should not happen if data is consistent

                      return (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <Card>
                                <CardHeader className="p-4 pb-2">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center">
                                      <Avatar className="h-8 w-8 mr-2">
                                        <AvatarFallback>
                                          {deal.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <CardTitle className="text-base">{deal.name}</CardTitle>
                                    </div>
                                    <Badge
                                      variant={
                                        deal.status === "Open"
                                          ? "default"
                                          : deal.status === "Closed Won"
                                            ? "success"
                                            : "destructive"
                                      }
                                      className="ml-2"
                                    >
                                      {deal.status}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 pb-2">
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                      <MapPin className="h-3.5 w-3.5 mr-1" />
                                      <span className="truncate">{deal.address}</span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5 mr-1" />
                                      <span>{deal.phone}</span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5 mr-1" />
                                      <span className="truncate">{deal.email}</span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5 mr-1" />
                                      <span>Last contacted: {deal.lastContacted}</span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5 mr-1" />
                                      <span>Expected Close: {deal.closeDate}</span>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="p-2 flex justify-end">
                                  <Link href={`/dashboard/deals/${deal.id}/edit`} passHref>
                                    <Button variant="ghost" size="sm" asChild>
                                      <a>View Details</a>
                                    </Button>
                                  </Link>
                                </CardFooter>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                    <Link href="/dashboard/deals/new" passHref>
                      <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                        <a>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Deal
                        </a>
                      </Button>
                    </Link>
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
