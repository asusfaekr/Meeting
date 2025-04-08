"use client"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDate } from "@/contexts/date-context"

export function DashboardCalendar() {
  const router = useRouter()
  const { selectedDate, setSelectedDate } = useDate()

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)

      // Format date as YYYY-MM-DD to avoid timezone issues
      const formattedDate = date.toISOString().split("T")[0]

      // Use direct navigation to avoid React errors
      window.location.href = `/dashboard/book?date=${formattedDate}`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar mode="single" selected={selectedDate} onSelect={handleSelect} className="rounded-md border" />
      </CardContent>
    </Card>
  )
}
