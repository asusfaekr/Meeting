"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { useDate } from "@/contexts/date-context"
import { format } from "date-fns"
import { useEffect, useState } from "react"

export function SidebarCalendar() {
  const { selectedDate, setSelectedDate } = useDate()
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(selectedDate))

  // Update calendar date when context date changes
  useEffect(() => {
    setCalendarDate(new Date(selectedDate))
  }, [selectedDate])

  const handleSelect = (date: Date | undefined) => {
    if (!date) return

    // Create a new date object to avoid timezone issues
    const newDate = new Date(date)

    // Update local state
    setCalendarDate(newDate)

    // Update context
    setSelectedDate(newDate)

    // Format date as YYYY-MM-DD to avoid timezone issues
    const formattedDate = format(newDate, "yyyy-MM-dd")

    // Navigate to dashboard with the selected date
    window.location.href = `/dashboard?date=${formattedDate}`
  }

  return (
    <div className="px-2 py-2">
      <p className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase">Calendar</p>
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-2">
          <div className="text-center mb-2 text-sm font-medium">{format(calendarDate, "MMMM yyyy")}</div>
          <Calendar
            mode="single"
            selected={calendarDate}
            onSelect={handleSelect}
            className="w-full"
            classNames={{
              day_today: "bg-primary/10 text-primary font-bold",
              day_selected: "bg-primary text-primary-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
              caption: "text-xs",
              table: "w-full border-collapse text-xs",
              head_cell: "text-muted-foreground font-normal text-[0.6rem] py-1 text-center",
              cell: "text-center p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-7 w-7 p-0 font-normal aria-selected:opacity-100",
              nav_button: "h-5 w-5",
              nav_button_previous: "absolute left-0",
              nav_button_next: "absolute right-0",
              root: "w-full max-w-full",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
