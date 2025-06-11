"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, Pause, Square, X, Minimize2 } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabaseClient"
import { useUser } from "@/components/auth/user-provider"
import { useTimeTracker } from "@/components/time-tracker/time-tracker-provider"
import { toast } from "@/hooks/use-toast"

export function TimeTracker() {
  const { user } = useUser()
  const { closeTimeTracker } = useTimeTracker()
  const [dailyHours, setDailyHours] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [activity, setActivity] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchTodaysTime()
  }, [user])

  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isTimerRunning])

  const fetchTodaysTime = async () => {
    if (!user) return

    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("daily_time_tracking")
      .select("total_hours")
      .eq("user_id", user.id)
      .eq("date", today)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching time:", error.message)
    } else if (data) {
      setDailyHours(data.total_hours)
    }
  }

  const updateDailyTime = async (hoursToAdd: number) => {
    if (!user) return

    const today = new Date().toISOString().split("T")[0]
    const newTotal = Math.min(dailyHours + hoursToAdd, 24) // Cap at 24 hours

    const { error } = await supabase.from("daily_time_tracking").upsert({
      user_id: user.id,
      date: today,
      total_hours: newTotal,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error updating time:", error.message)
      toast({
        title: "Error",
        description: "Failed to update time tracking",
        variant: "destructive",
      })
    } else {
      setDailyHours(newTotal)
      toast({
        title: "Time Updated",
        description: `Added ${hoursToAdd.toFixed(2)} hours to today's total`,
      })
    }
  }

  const startTimer = () => {
    if (!activity.trim()) {
      toast({
        title: "Activity Required",
        description: "Please enter what you're working on",
        variant: "destructive",
      })
      return
    }
    setIsTimerRunning(true)
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
    if (timerSeconds > 0) {
      const hoursWorked = timerSeconds / 3600
      updateDailyTime(hoursWorked)
    }
    setTimerSeconds(0)
    setActivity("")
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const addManualTime = () => {
    const hours = Number.parseFloat(prompt("Enter hours to add (max 24 total):") || "0")
    if (hours > 0 && hours <= 24) {
      updateDailyTime(hours)
    }
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-20 right-6 z-40"
      >
        <Card className="w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{dailyHours.toFixed(1)}h</span>
                {isTimerRunning && (
                  <Badge variant="default" className="bg-green-500">
                    {formatTime(timerSeconds)}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(false)}>
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeTimeTracker}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, x: 50 }}
      animate={{ scale: 1, opacity: 1, x: 0 }}
      exit={{ scale: 0.8, opacity: 0, x: 50 }}
      className="fixed top-1/2 right-6 transform -translate-y-1/2 z-40"
    >
      <Card className="w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-0 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Tracker
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={closeTimeTracker}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Daily Hours Counter */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{dailyHours.toFixed(1)}h</div>
            <p className="text-sm text-muted-foreground">Today's Prospecting Time</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(dailyHours / 24) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{(24 - dailyHours).toFixed(1)}h remaining</p>
          </div>

          {/* Timer Section */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <Input
                placeholder="What are you working on?"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                disabled={isTimerRunning}
              />

              <div className="text-center">
                <div className="text-2xl font-mono font-bold">{formatTime(timerSeconds)}</div>

                <div className="flex justify-center gap-2 mt-2">
                  {!isTimerRunning ? (
                    <Button size="sm" onClick={startTimer} disabled={!activity.trim()}>
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={pauseTimer}>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}

                  <Button size="sm" variant="destructive" onClick={stopTimer} disabled={timerSeconds === 0}>
                    <Square className="h-4 w-4 mr-1" />
                    Stop & Save
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Time Entry */}
          <div className="border-t pt-4">
            <Button variant="outline" size="sm" onClick={addManualTime} className="w-full">
              Add Manual Time
            </Button>
          </div>

          {/* Status */}
          <div className="flex justify-center">
            <Badge variant={dailyHours >= 8 ? "default" : "secondary"}>
              {dailyHours >= 8 ? "Goal Reached!" : "Keep Going!"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
