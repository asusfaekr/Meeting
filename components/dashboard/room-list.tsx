"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
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

interface Room {
  id: string
  name: string
  capacity: number
  location: string
  features: string[] | null
  photo_url: string | null
}

interface RoomListProps {
  rooms: Room[]
  selectedDate: Date
  startTime?: string
  endTime?: string
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

  const availableRoomsTitle = startTime && endTime ? `Available Rooms (${startTime} - ${endTime})` : "Available Rooms"

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{availableRoomsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <div key={room.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{room.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {room.capacity} people
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-2">Location: {room.location}</p>

                  {/* Room photo with error handling */}
                  <div className="mb-3 relative w-full h-40 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={room.photo_url || "/placeholder.svg?height=160&width=320"}
                      alt={room.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Fallback to placeholder on error
                        e.currentTarget.src = "/placeholder.svg?height=160&width=320"
                      }}
                    />
                  </div>

                  {room.features && room.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {room.features.map((feature, index) => (
                        <Badge key={index} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button size="sm" onClick={() => handleBookNow(room)}>
                    Book Now
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No rooms available for the selected time</div>
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
