"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import { useDate } from "@/contexts/date-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addMinutes, setHours, setMinutes } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

interface Room {
  id: string
  name: string
}

interface BookingFormProps {
  rooms: Room[]
  selectedDate: Date
  selectedRoomId: string | null
  userId: string
  initialStartTime: string
  initialEndTime: string
}

export function BookingForm({
  rooms,
  selectedDate: initialDate,
  selectedRoomId,
  userId,
  initialStartTime,
  initialEndTime,
}: BookingFormProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const { selectedDate, setSelectedDate } = useDate()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [roomId, setRoomId] = useState(selectedRoomId || "")
  const [startTime, setStartTime] = useState(initialStartTime)
  const [endTime, setEndTime] = useState(initialEndTime)
  const [attendees, setAttendees] = useState("")
  const [loading, setLoading] = useState(false)
  const [existingReservations, setExistingReservations] = useState<any[]>([])
  const [timeSlotAvailable, setTimeSlotAvailable] = useState(true)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Sync with server-provided date on initial load
  useEffect(() => {
    setSelectedDate(new Date(initialDate))
  }, [initialDate, setSelectedDate])

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

  // Fetch existing reservations for the selected date and room
  useEffect(() => {
    if (!roomId) return

    const fetchReservations = async () => {
      setCheckingAvailability(true)

      try {
        // Create date range for the selected date
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
          .from("reservations")
          .select("*")
          .eq("room_id", roomId)
          .gte("start_time", startOfDay.toISOString())
          .lte("end_time", endOfDay.toISOString())

        if (error) {
          throw error
        }

        setExistingReservations(data || [])

        // Check if the current time slot is available
        const available = checkTimeSlotAvailability(startTime, endTime, data || [])
        setTimeSlotAvailable(available)
      } catch (error) {
        console.error("Error fetching reservations:", error)
        toast({
          title: "Error checking availability",
          description: "Could not verify room availability. Please try again.",
          variant: "destructive",
        })
      } finally {
        setCheckingAvailability(false)
      }
    }

    fetchReservations()
  }, [roomId, selectedDate, startTime, endTime, supabase, toast])

  // Check if a time slot is available
  const checkTimeSlotAvailability = (start: string, end: string, reservations: any[]) => {
    if (!roomId || reservations.length === 0) return true

    // Convert form times to Date objects
    const [startHour, startMinute] = start.split(":").map(Number)
    const [endHour, endMinute] = end.split(":").map(Number)

    const startDateTime = new Date(selectedDate)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(selectedDate)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    // Check for overlaps with existing reservations
    return !reservations.some((reservation) => {
      const reservationStart = new Date(reservation.start_time)
      const reservationEnd = new Date(reservation.end_time)

      // Check for overlap
      return startDateTime < reservationEnd && endDateTime > reservationStart
    })
  }

  // Update time slot availability when time changes
  useEffect(() => {
    if (roomId && existingReservations.length > 0) {
      const available = checkTimeSlotAvailability(startTime, endTime, existingReservations)
      setTimeSlotAvailable(available)
    }
  }, [startTime, endTime, roomId, existingReservations])

  const validateForm = () => {
    if (!roomId) {
      setValidationError("Please select a meeting room")
      return false
    }

    if (!title.trim()) {
      setValidationError("Please enter a meeting title")
      return false
    }

    if (!timeSlotAvailable) {
      setValidationError("The selected time slot is already booked")
      return false
    }

    setValidationError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Check if user is still authenticated
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        // If session is lost, save booking data to localStorage and redirect to login
        const bookingData = {
          roomId,
          title,
          description,
          startTime,
          endTime,
          attendees,
          selectedDate: selectedDate.toISOString(),
        }

        localStorage.setItem("pendingBooking", JSON.stringify(bookingData))

        toast({
          title: "Session expired",
          description: "Please log in again to complete your booking",
        })

        window.location.href = "/"
        return
      }

      // Convert form times to ISO strings
      const [startHour, startMinute] = startTime.split(":").map(Number)
      const [endHour, endMinute] = endTime.split(":").map(Number)

      const startDateTime = new Date(selectedDate)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(selectedDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)

      // Double-check for overlapping reservations (prevent race conditions)
      const { data: latestReservations } = await supabase
        .from("reservations")
        .select("*")
        .eq("room_id", roomId)
        .gte("start_time", startDateTime.toISOString().split("T")[0])
        .lte("end_time", endDateTime.toISOString().split("T")[0] + "T23:59:59.999Z")

      const isAvailable = checkTimeSlotAvailability(startTime, endTime, latestReservations || [])

      if (!isAvailable) {
        toast({
          title: "Time slot unavailable",
          description: "This time slot was just booked by someone else",
          variant: "destructive",
        })
        setTimeSlotAvailable(false)
        setLoading(false)
        return
      }

      // Parse attendees into an array
      const attendeesList = attendees
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email)

      const { error } = await supabase.from("reservations").insert({
        room_id: roomId,
        user_id: userId,
        title,
        description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        attendees: attendeesList.length > 0 ? attendeesList : null,
        status: "confirmed",
      })

      if (error) throw error

      toast({
        title: "Reservation created",
        description: "Your meeting room has been booked successfully",
      })

      // Use direct navigation for more reliable redirect
      window.location.href = "/dashboard"
    } catch (error: any) {
      toast({
        title: "Error creating reservation",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Simple function to handle cancel without hooks
  function handleCancel() {
    window.location.href = "/dashboard"
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="room">Meeting Room</Label>
            <Select
              value={roomId}
              onValueChange={(value) => {
                setRoomId(value)
                // Reset availability when room changes
                setTimeSlotAvailable(true)
              }}
              disabled={loading}
            >
              <SelectTrigger id="room">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly Team Meeting"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Meeting agenda and details"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Select
                value={startTime}
                onValueChange={(value) => {
                  setStartTime(value)

                  // Auto-set end time to be 1 hour after start time
                  const [hour, minute] = value.split(":").map(Number)
                  const startDate = setHours(setMinutes(new Date(), minute), hour)
                  const endDate = addMinutes(startDate, 60)
                  const newEndTime = format(endDate, "HH:mm")

                  // Only update if the new end time is valid
                  if (timeSlots.includes(newEndTime)) {
                    setEndTime(newEndTime)
                  }
                }}
                disabled={loading}
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

            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime} disabled={loading}>
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

          {checkingAvailability && roomId && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking availability...</span>
            </div>
          )}

          {roomId && !timeSlotAvailable && !checkingAvailability && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Time slot unavailable</AlertTitle>
              <AlertDescription>
                This room is already booked for the selected time. Please choose a different time or room.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="attendees">Attendees (Optional)</Label>
            <Input
              id="attendees"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="email1@asus.com, email2@asus.com"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Separate email addresses with commas</p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || (roomId && !timeSlotAvailable) || checkingAvailability}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Reservation...
              </>
            ) : (
              "Book Room"
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
