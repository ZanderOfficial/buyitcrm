"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
// Make sure to import useMotionValue if you decide to use it directly for x, y in state,
// but for this approach, direct state update is fine.
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Users, DollarSign, X, Maximize2, Minimize2, BarChart3 } from "lucide-react"
import { PipelineView } from "@/components/pipeline/pipeline-view"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { DealsTable } from "@/components/deals/deals-table"
import { FilesHub } from "@/components/files/files-hub"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { useIsMobile } from "@/hooks/use-mobile"
import { GoogleCalendarView } from "@/components/hq/google-calendar-view"

interface HQItemConfig {
  id: string
  name: string
  icon: React.ReactNode
  defaultPosition?: { x: number; y: number } // Percentage based for initial placement
  defaultSize: { width: number; height: number } // Pixels
  description: string
  href?: string
  component?: React.ReactNode
}

interface OpenWindowConfig extends HQItemConfig {
  currentPosition: { x: number; y: number } // Pixels
  currentSize: { width: number; height: number } // Pixels
  zIndex: number
  isMaximized: boolean
  isMinimized: boolean
  key: string // Unique key for React list rendering
}

const HQ_ITEMS_CONFIG: HQItemConfig[] = [
  {
    id: "whiteboard",
    name: "Deals Pipeline",
    icon: <DollarSign className="h-6 w-6" />,
    defaultPosition: { x: 10, y: 15 },
    defaultSize: { width: 700, height: 500 },
    description: "View and manage your deals pipeline",
    component: <PipelineView />,
  },
  {
    id: "binder-contacts",
    name: "Contacts Binder",
    icon: <Users className="h-6 w-6" />,
    defaultPosition: { x: 50, y: 50 },
    defaultSize: { width: 800, height: 600 },
    description: "Browse your contacts",
    component: <ContactsTable />,
  },
  {
    id: "binder-deals",
    name: "Deals Binder",
    icon: <DollarSign className="h-6 w-6" />,
    defaultPosition: { x: 45, y: 40 },
    defaultSize: { width: 800, height: 600 },
    description: "Browse your deals",
    component: <DealsTable />,
  },
  {
    id: "calendar",
    name: "Wall Calendar",
    icon: <Calendar className="h-6 w-6" />,
    defaultPosition: { x: 70, y: 10 },
    defaultSize: { width: 600, height: 450 },
    description: "Check your Google Calendar",
    component: <GoogleCalendarView />,
  },
  {
    id: "filing-cabinet",
    name: "Filing Cabinet",
    icon: <FileText className="h-6 w-6" />,
    defaultPosition: { x: 5, y: 60 },
    defaultSize: { width: 750, height: 550 },
    description: "Access your files",
    component: <FilesHub />,
  },
  {
    id: "kpi-bench",
    name: "KPI Tracker Bench",
    icon: <BarChart3 className="h-6 w-6" />,
    defaultPosition: { x: 30, y: 65 },
    defaultSize: { width: 900, height: 650 },
    description: "View your performance dashboard",
    component: <DashboardOverview />,
  },
]

const calculateInitialPosition = (
  parentWidth: number,
  parentHeight: number,
  defaultPos: { x: number; y: number } | undefined,
  defaultSize: { width: number; height: number },
  index: number,
): { x: number; y: number } => {
  const cascadeOffset = index * 25
  if (defaultPos && parentWidth > 0 && parentHeight > 0) {
    // Ensure parent dimensions are available
    return {
      x: Math.max(0, (defaultPos.x / 100) * parentWidth - defaultSize.width / 2 + cascadeOffset),
      y: Math.max(0, (defaultPos.y / 100) * parentHeight - defaultSize.height / 2 + cascadeOffset),
    }
  }
  // Fallback to center if parent dimensions are not ready or no defaultPos
  const fallbackX = parentWidth > 0 ? parentWidth / 2 - defaultSize.width / 2 + cascadeOffset : 50 + cascadeOffset
  const fallbackY = parentHeight > 0 ? parentHeight / 2 - defaultSize.height / 2 + cascadeOffset : 50 + cascadeOffset
  return { x: Math.max(0, fallbackX), y: Math.max(0, fallbackY) }
}

const SNAP_THRESHOLD = 20 // Pixels for snapping

export function HQRoom() {
  const isMobile = useIsMobile()
  const [openWindows, setOpenWindows] = useState<OpenWindowConfig[]>([])
  const roomRef = useRef<HTMLDivElement>(null)
  const [roomDimensions, setRoomDimensions] = useState({ width: 0, height: 0 })
  const [highestZIndex, setHighestZIndex] = useState(10)
  const [mobileSelectedItem, setMobileSelectedItem] = useState<OpenWindowConfig | null>(null)

  // State to store initial position of the window being dragged
  const [draggedWindowInfo, setDraggedWindowInfo] = useState<{
    key: string
    initialX: number
    initialY: number
  } | null>(null)

  useEffect(() => {
    const updateRoomDimensions = () => {
      if (roomRef.current) {
        setRoomDimensions({
          width: roomRef.current.offsetWidth,
          height: roomRef.current.offsetHeight,
        })
      }
    }
    updateRoomDimensions() // Initial call
    window.addEventListener("resize", updateRoomDimensions)
    return () => window.removeEventListener("resize", updateRoomDimensions)
  }, [])

  const openWindow = (itemConfig: HQItemConfig) => {
    if (itemConfig.href) {
      window.location.href = itemConfig.href
      return
    }
    if (!itemConfig.component) return

    const newZIndex = highestZIndex + 1
    setHighestZIndex(newZIndex)

    const initialPos = calculateInitialPosition(
      roomDimensions.width,
      roomDimensions.height,
      itemConfig.defaultPosition,
      itemConfig.defaultSize,
      openWindows.length,
    )

    const newWindow: OpenWindowConfig = {
      ...itemConfig,
      key: `${itemConfig.id}-${Date.now()}`,
      currentPosition: { x: initialPos.x, y: initialPos.y },
      currentSize: itemConfig.defaultSize,
      zIndex: newZIndex,
      isMaximized: false,
      isMinimized: false,
    }

    if (isMobile) {
      setMobileSelectedItem(newWindow)
    } else {
      setOpenWindows((prev) => [...prev, newWindow])
    }
  }

  const closeWindow = (key: string) => {
    if (isMobile) {
      setMobileSelectedItem(null)
    } else {
      setOpenWindows((prev) => prev.filter((win) => win.key !== key))
    }
  }

  const bringToFront = (key: string) => {
    if (isMobile) return
    const newZIndex = highestZIndex + 1
    setHighestZIndex(newZIndex)
    setOpenWindows((prev) => prev.map((win) => (win.key === key ? { ...win, zIndex: newZIndex } : win)))
  }

  const toggleMaximizeWindow = (key: string) => {
    if (isMobile && mobileSelectedItem) {
      setMobileSelectedItem({ ...mobileSelectedItem, isMaximized: !mobileSelectedItem.isMaximized })
    } else {
      setOpenWindows((prev) => prev.map((win) => (win.key === key ? { ...win, isMaximized: !win.isMaximized } : win)))
    }
  }

  const updateWindowPosition = (key: string, position: { x: number; y: number }) => {
    setOpenWindows((prev) => prev.map((win) => (win.key === key ? { ...win, currentPosition: position } : win)))
  }

  const calculateSnappedPosition = (
    draggedKey: string,
    currentX: number,
    currentY: number,
    draggedSize: { width: number; height: number },
  ): { x: number; y: number } => {
    let snappedX = currentX
    let snappedY = currentY

    const draggedRect = {
      left: currentX,
      top: currentY,
      right: currentX + draggedSize.width,
      bottom: currentY + draggedSize.height,
      width: draggedSize.width,
      height: draggedSize.height,
    }

    const roomRect = {
      left: 0,
      top: 0,
      right: roomDimensions.width,
      bottom: roomDimensions.height,
    }

    // X-axis snapping
    let bestSnapX = { diff: Number.POSITIVE_INFINITY, value: snappedX }

    // Room edges X
    ;[roomRect.left, roomRect.right - draggedRect.width].forEach((edge) => {
      if (Math.abs(draggedRect.left - edge) < bestSnapX.diff) {
        bestSnapX = { diff: Math.abs(draggedRect.left - edge), value: edge }
      }
    })
    if (Math.abs(draggedRect.right - roomRect.right) < bestSnapX.diff) {
      bestSnapX = { diff: Math.abs(draggedRect.right - roomRect.right), value: roomRect.right - draggedRect.width }
    }

    // Other windows X
    openWindows.forEach((otherWin) => {
      if (otherWin.key === draggedKey || otherWin.isMaximized) return
      const otherRect = {
        left: otherWin.currentPosition.x,
        top: otherWin.currentPosition.y,
        right: otherWin.currentPosition.x + otherWin.currentSize.width,
        bottom: otherWin.currentPosition.y + otherWin.currentSize.height,
      }
      ;[
        otherRect.left,
        otherRect.right - draggedRect.width, // Align left edges, Align left to other's right
        otherRect.right,
        otherRect.left - draggedRect.width, // Align right to other's left, Align right edges
      ].forEach((edge) => {
        if (Math.abs(draggedRect.left - edge) < bestSnapX.diff) {
          bestSnapX = { diff: Math.abs(draggedRect.left - edge), value: edge }
        }
      })
      // Snap dragged right to other's right
      if (Math.abs(draggedRect.right - otherRect.right) < bestSnapX.diff) {
        bestSnapX = { diff: Math.abs(draggedRect.right - otherRect.right), value: otherRect.right - draggedRect.width }
      }
    })

    if (bestSnapX.diff <= SNAP_THRESHOLD) {
      snappedX = bestSnapX.value
    }

    // Y-axis snapping
    let bestSnapY = { diff: Number.POSITIVE_INFINITY, value: snappedY }

    // Room edges Y
    ;[roomRect.top, roomRect.bottom - draggedRect.height].forEach((edge) => {
      if (Math.abs(draggedRect.top - edge) < bestSnapY.diff) {
        bestSnapY = { diff: Math.abs(draggedRect.top - edge), value: edge }
      }
    })
    if (Math.abs(draggedRect.bottom - roomRect.bottom) < bestSnapY.diff) {
      bestSnapY = { diff: Math.abs(draggedRect.bottom - roomRect.bottom), value: roomRect.bottom - draggedRect.height }
    }

    // Other windows Y
    openWindows.forEach((otherWin) => {
      if (otherWin.key === draggedKey || otherWin.isMaximized) return
      const otherRect = {
        left: otherWin.currentPosition.x,
        top: otherWin.currentPosition.y,
        right: otherWin.currentPosition.x + otherWin.currentSize.width,
        bottom: otherWin.currentPosition.y + otherWin.currentSize.height,
      }
      ;[
        otherRect.top,
        otherRect.bottom - draggedRect.height, // Align top edges, Align top to other's bottom
        otherRect.bottom,
        otherRect.top - draggedRect.height, // Align bottom to other's top, Align bottom edges
      ].forEach((edge) => {
        if (Math.abs(draggedRect.top - edge) < bestSnapY.diff) {
          bestSnapY = { diff: Math.abs(draggedRect.top - edge), value: edge }
        }
      })
      // Snap dragged bottom to other's bottom
      if (Math.abs(draggedRect.bottom - otherRect.bottom) < bestSnapY.diff) {
        bestSnapY = {
          diff: Math.abs(draggedRect.bottom - otherRect.bottom),
          value: otherRect.bottom - draggedRect.height,
        }
      }
    })

    if (bestSnapY.diff <= SNAP_THRESHOLD) {
      snappedY = bestSnapY.value
    }

    // Ensure window stays within room bounds after snapping
    snappedX = Math.max(0, Math.min(snappedX, roomDimensions.width - draggedSize.width))
    snappedY = Math.max(0, Math.min(snappedY, roomDimensions.height - draggedSize.height))

    return { x: snappedX, y: snappedY }
  }

  const renderDesktopWindows = () => (
    <AnimatePresence>
      {openWindows.map((win) => (
        <motion.div
          key={win.key}
          drag
          dragMomentum={false} // Disable momentum for more precise snapping control
          dragConstraints={roomRef}
          dragHandle=".drag-handle"
          onDragStart={() => {
            bringToFront(win.key)
            if (!win.isMaximized) {
              setDraggedWindowInfo({ key: win.key, initialX: win.currentPosition.x, initialY: win.currentPosition.y })
            }
          }}
          onDrag={(event, info) => {
            if (win.isMaximized || !draggedWindowInfo || draggedWindowInfo.key !== win.key) return

            const newX = draggedWindowInfo.initialX + info.offset.x
            const newY = draggedWindowInfo.initialY + info.offset.y

            const { x: snappedX, y: snappedY } = calculateSnappedPosition(win.key, newX, newY, win.currentSize)

            // Directly update the position for the current drag frame for visual responsiveness
            // The state update will follow and confirm this position for Framer's animation target
            const element = document.querySelector(`[data-window-key="${win.key}"]`) as HTMLElement
            if (element) {
              // We let Framer Motion handle the visual update via the animate prop after state update.
              // Forcing style here can conflict.
            }
            updateWindowPosition(win.key, { x: snappedX, y: snappedY })
          }}
          onDragEnd={() => {
            setDraggedWindowInfo(null)
            // The final position is already set by the last onDrag call that updated the state.
          }}
          onMouseDown={() => bringToFront(win.key)}
          initial={
            // Initial animation when window is first opened
            win.isMaximized ? {} : { x: win.currentPosition.x, y: win.currentPosition.y, scale: 0.95, opacity: 0 }
          }
          animate={
            // Target state for Framer Motion to animate to
            win.isMaximized
              ? { x: 0, y: 0, width: "100%", height: "100%", scale: 1, opacity: 1 }
              : {
                  x: win.currentPosition.x,
                  y: win.currentPosition.y,
                  width: win.currentSize.width,
                  height: win.currentSize.height,
                  scale: 1,
                  opacity: 1,
                }
          }
          exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.2 } }}
          // Use a quick transition for drag updates to make snapping feel responsive
          transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.8 }}
          style={{
            position: "absolute",
            zIndex: win.zIndex,
            // width and height are set by animate prop
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            borderRadius: "0.75rem",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          className="bg-background border border-border"
          data-window-key={win.key} // Add a data attribute for potential direct DOM manipulation if needed (though usually avoided)
        >
          <div className="drag-handle flex items-center justify-between p-3 border-b border-border bg-muted/50 cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2">
              <span className="text-primary">{win.icon}</span>
              <h3 className="text-sm font-semibold">{win.name}</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleMaximizeWindow(win.key)}>
                {win.isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => closeWindow(win.key)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-background">{win.component}</div>
        </motion.div>
      ))}
    </AnimatePresence>
  )

  const renderMobileModal = () => (
    <AnimatePresence>
      {mobileSelectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0"
          onClick={() => closeWindow(mobileSelectedItem.key)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="bg-background rounded-none shadow-2xl w-full h-full flex flex-col border-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-primary">{mobileSelectedItem.icon}</span>
                <h2 className="text-lg font-semibold">{mobileSelectedItem.name}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => closeWindow(mobileSelectedItem.key)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">{mobileSelectedItem.component}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div
          className="absolute inset-0 opacity-20 dark:opacity-10"
          style={{
            backgroundImage: `
        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px),
        linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)
      `,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 dark:from-blue-900/20 dark:via-transparent dark:to-purple-900/10" />
      </div>

      <div ref={roomRef} className="relative w-full h-full z-10">
        {!isMobile &&
          HQ_ITEMS_CONFIG.map((item, index) => (
            <motion.div
              key={item.id}
              className="absolute cursor-pointer group"
              style={{
                left: `${item.defaultPosition?.x ?? 10 + index * 5}%`,
                top: `${item.defaultPosition?.y ?? 10 + index * 5}%`,
                width: `150px`,
                height: `100px`,
              }}
              whileHover={{ scale: 1.05, zIndex: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openWindow(item)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="w-full h-full border-2 border-dashed border-gray-300/60 dark:border-gray-500/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:border-primary hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3 flex flex-col items-center justify-center h-full text-center">
                  <div className="text-primary mb-1">{item.icon}</div>
                  <h3 className="font-semibold text-xs mb-0.5 text-gray-800 dark:text-gray-100">{item.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{item.description}</p>
                </CardContent>
              </Card>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  Open
                </Badge>
              </div>
            </motion.div>
          ))}

        <motion.div
          className={`absolute ${isMobile ? "top-4 left-4 right-4" : "top-8 left-8"}`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Welcome to HQ
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {isMobile ? "Tap an item to open." : "Your interactive command center. Click an item to open it."}
              </p>
              {isMobile && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {HQ_ITEMS_CONFIG.filter((item) => item.component || item.href).map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      className="w-full h-auto py-3 flex flex-col items-center gap-1.5 text-xs"
                      onClick={() => openWindow(item)}
                    >
                      <span className="text-primary">{item.icon}</span>
                      <span>{item.name}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {!isMobile && roomDimensions.width > 0 && renderDesktopWindows()}
      </div>

      {isMobile && renderMobileModal()}
    </div>
  )
}
