"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Settings, Users, BarChart } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems: NavItem[] = [
    {
      title: "Manage Rooms",
      href: "/dashboard/rooms",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: "Manage Users",
      href: "/dashboard/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Statistics",
      href: "/dashboard/statistics",
      icon: <BarChart className="h-5 w-5" />,
    },
  ]

  return (
    <div className="mb-6 flex space-x-2">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? "default" : "outline"}
          className="flex items-center"
          onClick={() => router.push(item.href)}
        >
          <span className="mr-2">{item.icon}</span>
          {item.title}
        </Button>
      ))}
    </div>
  )
}
