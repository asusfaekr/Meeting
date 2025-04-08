"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Clock, Home } from "lucide-react"
import { SidebarCalendar } from "./sidebar-calendar"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export default function Sidebar() {
  const pathname = usePathname()

  // Simplified navigation items - no admin-only items
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "My Reservations",
      href: "/dashboard/my-reservations",
      icon: <Clock className="h-5 w-5" />,
    },
  ]

  // Direct navigation function to avoid router issues
  const navigateTo = (href: string) => {
    window.location.href = href
  }

  return (
    <div className="w-72 bg-white border-r border-gray-200 h-full flex flex-col overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-bold">ASUS</h2>
        <p className="text-sm text-gray-500">Meeting Room System</p>
      </div>

      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "w-full justify-start text-left font-normal",
              pathname === item.href
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
            )}
            onClick={() => navigateTo(item.href)}
          >
            <span className="mr-3">{item.icon}</span>
            {item.title}
          </Button>
        ))}
      </div>

      {/* Add the calendar to the sidebar */}
      <div className="mt-auto border-t border-gray-200 pt-2 pb-4 px-2">
        <SidebarCalendar />
      </div>
    </div>
  )
}
