"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Room {
  id: string
  name: string
  capacity: number
  location: string
  features: string[] | null
  photo_url: string | null
  floor: string
}

interface RoomListProps {
  rooms: Room[]
  selectedDate: Date
  startTime: string
  endTime: string
}

export function RoomList({ rooms, selectedDate, startTime, endTime }: RoomListProps) {
  const { toast } = useToast()
  const { supabase, user } = useSupabase()
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [attendees, setAttendees] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabaseClient = createClientComponentClient()

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (!startTime || !endTime) {
          setAvailableRooms(rooms)
          return
        }

        // 선택된 날짜와 시간을 Date 객체로 변환
        const [startHour, startMinute] = startTime.split(":").map(Number)
        const [endHour, endMinute] = endTime.split(":").map(Number)

        const requestStartTime = new Date(selectedDate)
        requestStartTime.setHours(startHour, startMinute, 0, 0)
        requestStartTime.setHours(requestStartTime.getHours() - 9) // UTC로 변환

        const requestEndTime = new Date(selectedDate)
        requestEndTime.setHours(endHour, endMinute, 0, 0)
        requestEndTime.setHours(requestEndTime.getHours() - 9) // UTC로 변환

        console.log("Checking availability for time range:", {
          start: requestStartTime.toISOString(),
          end: requestEndTime.toISOString()
        })

        // 해당 시간대의 예약 정보 가져오기
        const { data: reservations, error: reservationsError } = await supabaseClient
          .from("reservations")
          .select("*")
          .gte("start_time", requestStartTime.toISOString())
          .lte("end_time", requestEndTime.toISOString())

        if (reservationsError) {
          console.error("Reservations error:", reservationsError)
          throw reservationsError
        }

        console.log("Found reservations:", reservations)

        // 예약이 없는 회의실만 필터링
        const reservedRoomIds = new Set(reservations?.map((res) => res.room_id) || [])
        const available = rooms.filter((room) => !reservedRoomIds.has(room.id))

        console.log("Available rooms:", available)

        setAvailableRooms(available)

        // 로그 추가
        console.log("Room List - Available Rooms:", available.length)
        console.log("Room List - Selected Date:", format(selectedDate, "yyyy-MM-dd"))
        console.log("Room List - Time Range:", `${startTime} - ${endTime}`)
        console.log("Room List - Available Room Details:", available)

      } catch (err) {
        console.error("Error fetching available rooms:", err)
        setError("사용 가능한 회의실을 불러오는 중 오류가 발생했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableRooms()
  }, [rooms, selectedDate, startTime, endTime, supabaseClient])

  // Function to open the booking dialog
  const handleBookNow = (room: Room) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book a room",
        variant: "destructive",
      })
      return
    }

    setSelectedRoom(room)
    setTitle("")
    setDescription("")
    setAttendees("")
    setError(null)
    setIsBookingDialogOpen(true)
  }

  // Function to handle the booking submission
  const handleBookingSubmit = async () => {
    if (!selectedRoom || !startTime || !endTime || !user) return

    if (!title.trim()) {
      setError("Please enter a meeting title")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Convert time strings to Date objects
      const [startHour, startMinute] = startTime.split(":").map(Number)
      const [endHour, endMinute] = endTime.split(":").map(Number)

      const startDateTime = new Date(selectedDate)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(selectedDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)

      // Double-check for overlapping reservations (prevent race conditions)
      const { data: existingReservations } = await supabase
        .from("reservations")
        .select("*")
        .eq("room_id", selectedRoom.id)
        .lte("start_time", endDateTime.toISOString())
        .gte("end_time", startDateTime.toISOString())

      if (existingReservations && existingReservations.length > 0) {
        setError("This room is no longer available for the selected time slot")
        setLoading(false)
        return
      }

      // Parse attendees into an array
      const attendeesList = attendees
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email)

      // Create the reservation
      const { error: insertError } = await supabase.from("reservations").insert({
        room_id: selectedRoom.id,
        user_id: user.id,
        title,
        description: description || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        attendees: attendeesList.length > 0 ? attendeesList : null,
        status: "confirmed",
      })

      if (insertError) throw insertError

      toast({
        title: "Room booked successfully",
        description: `You have booked ${selectedRoom.name} from ${startTime} to ${endTime}`,
      })

      setIsBookingDialogOpen(false)

      // Refresh the page to update the room list
      window.location.reload()
    } catch (error: any) {
      console.error("Booking error:", error)
      setError(error.message || "Failed to book the room. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Format the date and time for display
  const displayDateTime = useMemo(() => {
    const date = format(selectedDate, "EEEE, MMMM d, yyyy")
    return `${date} from ${startTime} to ${endTime}`
  }, [selectedDate, startTime, endTime])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Available Rooms</CardTitle>
          <p className="text-sm text-gray-500">{displayDateTime}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableRooms.length === 0 ? (
              <p className="text-center text-gray-500">선택한 시간에 사용 가능한 회의실이 없습니다.</p>
            ) : (
              availableRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">{room.name}</h3>
                    <p className="text-sm text-gray-500">
                      Floor {room.floor} • Capacity: {room.capacity} people
                    </p>
                  </div>
                  <Button
                    variant="default"
                    onClick={() => handleBookNow(room)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Book Now
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book {selectedRoom?.name}</DialogTitle>
            <DialogDescription>
              {startTime && endTime
                ? `Book this room on ${format(selectedDate, "MMMM d, yyyy")} from ${startTime} to ${endTime}`
                : "Please select a time range first"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly Team Meeting"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Meeting agenda and details"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees (Optional)</Label>
              <Input
                id="attendees"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="email1@asus.com, email2@asus.com"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Separate email addresses with commas</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleBookingSubmit} disabled={loading || !startTime || !endTime}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Book Room"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
