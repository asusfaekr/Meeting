"use client"

import { useState, useEffect, useMemo } from "react"
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
  const [startTime, setStartTime] = useState(() => {
    // 현재 시간을 한국 시간(KST)으로 설정
    const now = new Date()
    const kstOffset = 9 * 60 * 60 * 1000 // KST는 UTC+9
    const kstNow = new Date(now.getTime() + kstOffset)
    
    // 30분 단위로 올림
    const minutes = kstNow.getMinutes()
    const roundedMinutes = Math.ceil(minutes / 30) * 30
    const hours = kstNow.getHours()
    
    // 30분이 60분이 되면 시간을 1시간 증가시키고 분을 0으로 설정
    if (roundedMinutes === 60) {
      kstNow.setHours(hours + 1)
      kstNow.setMinutes(0)
    } else {
      kstNow.setMinutes(roundedMinutes)
    }
    
    // 8시 이전이면 8시로 설정
    if (kstNow.getHours() < 8) {
      kstNow.setHours(8)
      kstNow.setMinutes(0)
    }
    
    // 17시 이후면 다음 날 8시로 설정
    if (kstNow.getHours() >= 17) {
      kstNow.setDate(kstNow.getDate() + 1)
      kstNow.setHours(8)
      kstNow.setMinutes(0)
    }
    
    return format(kstNow, "HH:mm")
  })

  const [endTime, setEndTime] = useState(() => {
    // 현재 시간을 한국 시간(KST)으로 설정
    const now = new Date()
    const kstOffset = 9 * 60 * 60 * 1000 // KST는 UTC+9
    const kstNow = new Date(now.getTime() + kstOffset)
    
    // 30분 단위로 올림
    const minutes = kstNow.getMinutes()
    const roundedMinutes = Math.ceil(minutes / 30) * 30
    const hours = kstNow.getHours()
    
    // 30분이 60분이 되면 시간을 1시간 증가시키고 분을 0으로 설정
    if (roundedMinutes === 60) {
      kstNow.setHours(hours + 1)
      kstNow.setMinutes(0)
    } else {
      kstNow.setMinutes(roundedMinutes)
    }
    
    // 8시 이전이면 9시로 설정
    if (kstNow.getHours() < 8) {
      kstNow.setHours(9)
      kstNow.setMinutes(0)
    }
    
    // 17시 이후면 다음 날 9시로 설정
    if (kstNow.getHours() >= 17) {
      kstNow.setDate(kstNow.getDate() + 1)
      kstNow.setHours(9)
      kstNow.setMinutes(0)
    } else {
      // 종료 시간은 시작 시간에서 1시간 후
      kstNow.setHours(kstNow.getHours() + 1)
      
      // 18시를 넘어가면 18시로 설정
      if (kstNow.getHours() > 18) {
        kstNow.setHours(18)
        kstNow.setMinutes(0)
      }
    }
    
    return format(kstNow, "HH:mm")
  })

  const [attendees, setAttendees] = useState("")
  const [loading, setLoading] = useState(false)
  const [existingReservations, setExistingReservations] = useState<any[]>([])
  const [timeSlotAvailable, setTimeSlotAvailable] = useState(true)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])

  // Sync with server-provided date on initial load
  useEffect(() => {
    setSelectedDate(new Date(initialDate))
  }, [initialDate, setSelectedDate])

  // Time slot options (30-minute intervals from 8:00 to 18:00)
  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) continue // Don't go past 18:00
        const formattedHour = hour.toString().padStart(2, "0")
        const formattedMinute = minute.toString().padStart(2, "0")
        slots.push(`${formattedHour}:${formattedMinute}`)
      }
    }
    return slots
  }, [])

  // Fetch existing reservations for the selected date and room
  useEffect(() => {
    if (!roomId) return

    const fetchReservations = async () => {
      setCheckingAvailability(true)

      try {
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

        if (error) throw error

        setExistingReservations(data || [])
        const available = checkTimeSlotAvailability(startTime, endTime, data || [])
        setTimeSlotAvailable(available)
      } catch (error) {
        console.error("Error fetching reservations:", error)
        toast({
          title: "Unable to check availability",
          description: "Unable to check meeting room availability. Please try again later.",
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

    const [startHour, startMinute] = start.split(":").map(Number)
    const [endHour, endMinute] = end.split(":").map(Number)

    const startDateTime = new Date(selectedDate)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(selectedDate)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    return !reservations.some((reservation) => {
      const reservationStart = new Date(reservation.start_time)
      const reservationEnd = new Date(reservation.end_time)
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
      setValidationError("This time slot is already booked")
      return false
    }

    setValidationError(null)
    return true
  }

  const checkAvailability = async () => {
    if (!roomId || !startTime || !endTime) return

    setCheckingAvailability(true)
    setTimeSlotAvailable(true)

    try {
      const [startHour, startMinute] = startTime.split(":").map(Number)
      const [endHour, endMinute] = endTime.split(":").map(Number)

      // Create dates in KST
      const startDateTime = new Date(selectedDate)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(selectedDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)

      console.log("Checking availability for:", {
        roomId,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      })

      // Check for overlapping reservations
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("room_id", roomId)
        .gte("start_time", startDateTime.toISOString())
        .lte("end_time", endDateTime.toISOString())

      if (error) {
        console.error("Error checking availability:", error)
        throw error
      }

      console.log("Found reservations:", reservations)

      const isAvailable = checkTimeSlotAvailability(startTime, endTime, reservations || [])
      setTimeSlotAvailable(isAvailable)

      if (!isAvailable) {
        toast({
          title: "Time Slot Unavailable",
          description: "This time slot is already booked.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking availability:", error)
      toast({
        title: "Error",
        description: "Failed to check availability. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        toast({
          title: "Authentication Error",
          description: "Please log in to continue.",
          variant: "destructive",
        })
        return
      }

      // Verify user exists in the database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (userError || !userData) {
        toast({
          title: "User Error",
          description: "User information not found. Please contact administrator.",
          variant: "destructive",
        })
        return
      }

      const [startHour, startMinute] = startTime.split(":").map(Number)
      const [endHour, endMinute] = endTime.split(":").map(Number)

      // Create dates in KST
      const startDateTime = new Date(selectedDate)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(selectedDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)

      console.log("Submitting reservation:", {
        roomId,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      })

      // Double-check for overlapping reservations
      const { data: latestReservations, error: reservationError } = await supabase
        .from("reservations")
        .select("*")
        .eq("room_id", roomId)
        .gte("start_time", startDateTime.toISOString())
        .lte("end_time", endDateTime.toISOString())

      if (reservationError) {
        console.error("Error checking latest reservations:", reservationError)
        throw reservationError
      }

      console.log("Latest reservations:", latestReservations)

      const isAvailable = checkTimeSlotAvailability(startTime, endTime, latestReservations || [])

      if (!isAvailable) {
        toast({
          title: "Time Slot Unavailable",
          description: "This time slot is already booked.",
          variant: "destructive",
        })
        setTimeSlotAvailable(false)
        setLoading(false)
        return
      }

      const attendeesList = attendees
        .split(",")
        .map((email: string) => email.trim())
        .filter((email: string) => email)

      const { error: insertError } = await supabase.from("reservations").insert({
        room_id: roomId,
        user_id: session.user.id,
        title,
        description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        attendees: attendeesList,
        status: "confirmed"
      })

      if (insertError) {
        console.error("Error inserting reservation:", insertError)
        throw insertError
      }

      toast({
        title: "Booking Successful",
        description: "Meeting room has been successfully booked.",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setAttendees("")
      setLoading(false)
    } catch (error) {
      console.error("Error creating reservation:", error)
      toast({
        title: "Booking Failed",
        description: "An error occurred while booking. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Add this function to check if a room is available for a specific time slot
  const isRoomAvailable = async (roomId: string, startTime: string, endTime: string) => {
    try {
      const [startHour, startMinute] = startTime.split(":").map(Number)
      const [endHour, endMinute] = endTime.split(":").map(Number)

      const startDateTime = new Date(selectedDate)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(selectedDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)

      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("room_id", roomId)
        .gte("start_time", startDateTime.toISOString())
        .lte("end_time", endDateTime.toISOString())

      if (error) throw error

      return checkTimeSlotAvailability(startTime, endTime, reservations || [])
    } catch (error) {
      console.error("Error checking room availability:", error)
      return false
    }
  }

  // Update the useEffect for fetching available rooms
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (!startTime || !endTime) return

      setLoading(true)
      try {
        const { data: rooms, error } = await supabase
          .from("meeting_rooms")
          .select("*")
          .order("name", { ascending: true })

        if (error) throw error

        const availableRooms = await Promise.all(
          rooms.map(async (room) => {
            const isAvailable = await isRoomAvailable(room.id, startTime, endTime)
            return { ...room, isAvailable }
          })
        )

        setAvailableRooms(availableRooms.filter(room => room.isAvailable))
      } catch (error) {
        console.error("Error fetching available rooms:", error)
        toast({
          title: "Error",
          description: "Failed to fetch available rooms. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableRooms()
  }, [startTime, endTime, selectedDate])

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
              onValueChange={(value: string) => {
                setRoomId(value)
                setTimeSlotAvailable(true)
              }}
              disabled={loading}
            >
              <SelectTrigger id="room">
                <SelectValue placeholder="Select a meeting room" />
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
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
                onValueChange={(value: string) => {
                  setStartTime(value)
                  const [hour, minute] = value.split(":").map(Number)
                  const startDate = setHours(setMinutes(new Date(), minute), hour)
                  const endDate = addMinutes(startDate, 60)
                  const newEndTime = format(endDate, "HH:mm")
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
                  {timeSlots.map((time: string) => (
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
                    .filter((time: string) => time > startTime)
                    .map((time: string) => (
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
              <AlertTitle>Time Slot Unavailable</AlertTitle>
              <AlertDescription>
                This time slot is already booked. Please select a different time or room.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="attendees">Attendees (Optional)</Label>
            <Input
              id="attendees"
              value={attendees}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttendees(e.target.value)}
              placeholder="email1@asus.com, email2@asus.com"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Separate email addresses with commas</p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => window.location.href = "/dashboard"} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || (roomId && !timeSlotAvailable) || checkingAvailability}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              "Book Now"
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
