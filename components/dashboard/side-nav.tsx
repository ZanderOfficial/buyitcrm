"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Users, PieChart, FileText, Settings, Calendar, DollarSign, Home } from "lucide-react"

const items = [
  {
    title: "HQ",
    href: "/dashboard/hq",
    icon: Home,
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Contacts",
    href: "/dashboard/contacts",
    icon: Users,
  },
  {
    title: "Deals",
    href: "/dashboard/deals",
    icon: DollarSign,
  },
  {
    title: "Pipeline",
    href: "/dashboard/pipeline",
    icon: PieChart,
  },
  {
    title: "Files",
    href: "/dashboard/files",
    icon: FileText,
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function SideNav() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-gray-100/40 md:block dark:bg-gray-800/40">
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="flex h-14 items-center border-b px-4 py-2">
          <Link href="/dashboard/hq" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-6 w-6" />
            <span>BuyIt CRM</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  pathname === item.href && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
