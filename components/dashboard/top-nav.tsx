"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BarChart3, User, Moon, Sun, Settings, Clock } from "lucide-react"
import { useTheme } from "next-themes"
import { useUser } from "@/components/auth/user-provider"
import { useTimeTracker } from "@/components/time-tracker/time-tracker-provider"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export function TopNav() {
  const { user, loading } = useUser()
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const { toggleTimeTracker } = useTimeTracker()

  const [overviewData, setOverviewData] = useState({
    dealsInAnalysis: 0,
    dealsUnderContract: 0,
    completionPercentage: 0,
    loading: true,
  })

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const { data: deals, error } = await supabase.from("deals").select("dealStage, status")

        if (error) {
          console.error("Error fetching overview data:", error.message)
          return
        }

        const dealsInAnalysis = deals?.filter((deal) => deal.dealStage === "Needs Followup").length || 0
        const dealsUnderContract = deals?.filter((deal) => deal.dealStage === "Under Contract").length || 0

        // Calculate completion percentage (completed deals vs total deals)
        const totalDeals = deals?.length || 0
        const completedDeals = deals?.filter((deal) => deal.dealStage === "Completed").length || 0
        const completionPercentage = totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 100) : 0

        setOverviewData({
          dealsInAnalysis,
          dealsUnderContract,
          completionPercentage,
          loading: false,
        })
      } catch (error) {
        console.error("Error in fetchOverviewData:", error)
        setOverviewData((prev) => ({ ...prev, loading: false }))
      }
    }

    fetchOverviewData()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push("/")
    } else {
      console.error("Error logging out:", error.message)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo and BuyIt CRM */}
        <Link href="/dashboard/hq" className="flex items-center gap-2 font-semibold">
          <BarChart3 className="h-6 w-6" />
          <span>BuyIt CRM</span>
        </Link>

        {/* Overview Metrics */}
        <div className="ml-8 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Deals in Analysis:</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">
              {overviewData.loading ? "..." : overviewData.dealsInAnalysis}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Deals Under Contract:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {overviewData.loading ? "..." : overviewData.dealsUnderContract}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Deals to Completed:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {overviewData.loading ? "..." : `${overviewData.completionPercentage}%`}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side: Time Tracker, Dark/Light mode toggle and Account dropdown */}
        <div className="flex items-center gap-2">
          {/* Time Tracker Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border h-8 w-8"
            onClick={toggleTimeTracker}
            title="Open Time Tracker"
          >
            <Clock className="h-4 w-4" />
            <span className="sr-only">Time Tracker</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full border h-8 w-8">
                <User className="h-4 w-4" />
                <span className="sr-only">Account menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {loading
                  ? "Loading..."
                  : user
                    ? user.email || user.user_metadata?.full_name || "My Account"
                    : "My Account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTimeTracker}>
                <Clock className="mr-2 h-4 w-4" />
                Time Tracker
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
