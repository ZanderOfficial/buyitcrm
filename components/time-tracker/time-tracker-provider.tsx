"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface TimeTrackerContextType {
  isTimeTrackerOpen: boolean
  openTimeTracker: () => void
  closeTimeTracker: () => void
  toggleTimeTracker: () => void
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined)

export function TimeTrackerProvider({ children }: { children: React.ReactNode }) {
  const [isTimeTrackerOpen, setIsTimeTrackerOpen] = useState(false)

  const openTimeTracker = () => setIsTimeTrackerOpen(true)
  const closeTimeTracker = () => setIsTimeTrackerOpen(false)
  const toggleTimeTracker = () => setIsTimeTrackerOpen(!isTimeTrackerOpen)

  return (
    <TimeTrackerContext.Provider
      value={{
        isTimeTrackerOpen,
        openTimeTracker,
        closeTimeTracker,
        toggleTimeTracker,
      }}
    >
      {children}
    </TimeTrackerContext.Provider>
  )
}

export function useTimeTracker() {
  const context = useContext(TimeTrackerContext)
  if (context === undefined) {
    throw new Error("useTimeTracker must be used within a TimeTrackerProvider")
  }
  return context
}
