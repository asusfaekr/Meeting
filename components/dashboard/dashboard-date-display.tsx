"use client"

import { useEffect, memo } from "react"
import { format } from "date-fns"
import { useDate } from "@/contexts/date-context"

interface DashboardDateDisplayProps {
  initialDate: Date
}

export const DashboardDateDisplay = memo(function DashboardDateDisplay({ initialDate }: DashboardDateDisplayProps) {
  const { selectedDate, setSelectedDate } = useDate()

  // Sync with server-provided date on initial load
  useEffect(() => {
    // Create a new date object to avoid timezone issues
    const newDate = new Date(initialDate)
    newDate.setHours(0, 0, 0, 0)
    setSelectedDate(newDate)
  }, [initialDate, setSelectedDate])

  return <p className="text-gray-500">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
})
