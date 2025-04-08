"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimeRangeSelectorProps {
  initialStartTime: string
  initialEndTime: string
}

export function TimeRangeSelector({ initialStartTime, initialEndTime }: TimeRangeSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [startTime, setStartTime] = useState(initialStartTime)
  const [endTime, setEndTime] = useState(initialEndTime)

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

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("startTime", startTime)
    params.set("endTime", endTime)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Find Available Rooms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Select
              value={startTime}
              onValueChange={(value) => {
                setStartTime(value)
                // If end time is before start time, update it
                if (value >= endTime) {
                  // Find the next available time slot
                  const index = timeSlots.findIndex((slot) => slot === value)
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

          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
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
        </div>

        <Button onClick={handleApply} className="w-full mt-4">
          Find Available Rooms
        </Button>
      </CardContent>
    </Card>
  )
}
