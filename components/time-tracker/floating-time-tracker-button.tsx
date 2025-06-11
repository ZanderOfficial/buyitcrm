"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTimeTracker } from "@/components/time-tracker/time-tracker-provider"
import { supabase } from "@/lib/supabaseClient"
import { useUser } from "@/components/auth/user-provider"

export function FloatingTimeTrackerButton() {
  const { toggleTimeTracker } = useTimeTracker()
  const { user } = useUser()
  const [dailyHours, setDailyHours] = useState(0)

  useEffect(() => {
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

    fetchTodaysTime()

    // Refresh every minute
    const interval = setInterval(fetchTodaysTime, 60000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <Button
        onClick={toggleTimeTracker}
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        size="icon"
      >
        <div className="flex flex-col items-center">
          <Clock className="h-5 w-5" />
          <span className="text-xs font-bold">{dailyHours.toFixed(1)}h</span>
        </div>
      </Button>

      {/* Progress ring */}
      <div className="absolute inset-0 -m-1">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${(dailyHours / 8) * 175.93} 175.93`}
            className="text-primary transition-all duration-300"
          />
        </svg>
      </div>

      {/* Goal reached badge */}
      <AnimatePresence>
        {dailyHours >= 8 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-2 -right-2"
          >
            <Badge className="bg-green-500 hover:bg-green-600 text-white">Goal!</Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
