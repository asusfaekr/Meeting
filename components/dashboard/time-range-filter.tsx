"use client"

import { useState, memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Search } from "lucide-react"

interface TimeRangeFilterProps {
  initialStartTime: string
  initialEndTime: string
  selectedDate: Date
}

export const TimeRangeFilter = memo(function TimeRangeFilter({
  initialStartTime,
  initialEndTime,
  selectedDate,
}: TimeRangeFilterProps) {
  const [startTime, setStartTime] = useState(initialStartTime)
  const [endTime, setEndTime] = useState(initialEndTime)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Time slot options (30-minute intervals from 8:00 to 18:00)
  const timeSlots = []
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) continue // Don't go past 18:00

      const formattedHour = hour.toString().padStart(2, "0")
      const formattedMinute = minute.toString().padStart(2, "0")
      timeSlots.push(`${formattedHour}:${formattedMinute}`)
    }
  }

  function handleFilter() {
    try {
      setIsLoading(true)

      // Format date as YYYY-MM-DD to avoid timezone issues
      const dateString = format(selectedDate, "yyyy-MM-dd")

      // Navigate directly using window.location
      window.location.href = `/dashboard?date=${dateString}&startTime=${startTime}&endTime=${endTime}`
    } catch (error) {
      console.error("Navigation error:", error)
      toast({
        title: "Navigation error",
        description: "There was a problem applying the filter. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-1/3">
            <Label htmlFor="startTime" className="mb-2 block">
              Start Time
            </Label>
            <Select
              value={startTime}
              onValueChange={(value) => {
                setStartTime(value)
                // Auto-adjust end time if it's earlier than start time
                if (value >= endTime) {
                  // Find the next time slot
                  const index = timeSlots.findIndex((t) => t === value)
                  if (index < timeSlots.length - 1) {
                    setEndTime(timeSlots[index + 1])
                  }
                }
              }}
            >
              <SelectTrigger id="startTime">
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={`start-${time}`} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-1/3">
            <Label htmlFor="endTime" className="mb-2 block">
              End Time
            </Label>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger id="endTime">
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots
                  .filter((time) => time > startTime)
                  .map((time) => (
                    <SelectItem key={`end-${time}`} value={time}>
                      {time}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleFilter} className="w-full sm:w-auto" disabled={isLoading}>
            {isLoading ? (
              <>Searching...</>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Find Available Rooms
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
