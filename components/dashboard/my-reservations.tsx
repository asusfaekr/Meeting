import React, { useState, useMemo } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useSupabase } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const MyReservations: React.FC = () => {
  const router = useRouter()
  const supabase = useSupabase()
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStartTime, setEditStartTime] = useState("")
  const [editEndTime, setEditEndTime] = useState("")
  const [editAttendees, setEditAttendees] = useState("")
  const [editLoading, setEditLoading] = useState(false)

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

  const handleEditClick = (reservation: Reservation) => {
    setEditingReservation(reservation)
    setEditTitle(reservation.title)
    setEditDescription(reservation.description || "")
    setEditStartTime(format(new Date(reservation.start_time), "HH:mm"))
    setEditEndTime(format(new Date(reservation.end_time), "HH:mm"))
    setEditAttendees(reservation.attendees?.join(", ") || "")
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReservation) return

    setEditLoading(true)

    try {
      const [startHour, startMinute] = editStartTime.split(":").map(Number)
      const [endHour, endMinute] = editEndTime.split(":").map(Number)

      const startDateTime = new Date(editingReservation.start_time)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(editingReservation.end_time)
      endDateTime.setHours(endHour, endMinute, 0, 0)

      const attendeesList = editAttendees
        .split(",")
        .map((email: string) => email.trim())
        .filter((email: string) => email)

      const { error: updateError } = await supabase
        .from("reservations")
        .update({
          title: editTitle,
          description: editDescription,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          attendees: attendeesList,
        })
        .eq("id", editingReservation.id)

      if (updateError) throw updateError

      toast({
        title: "Reservation Updated",
        description: "Your reservation has been successfully updated.",
      })

      setEditingReservation(null)
      setEditLoading(false)
      fetchReservations()
    } catch (error) {
      console.error("Error updating reservation:", error)
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your reservation.",
        variant: "destructive",
      })
      setEditLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingReservation(null)
    setEditTitle("")
    setEditDescription("")
    setEditStartTime("")
    setEditEndTime("")
    setEditAttendees("")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Reservations</h2>
        <Button onClick={() => window.location.href = "/dashboard/book"}>
          Book New Room
        </Button>
      </div>

      {editingReservation ? (
        <Card className="p-6">
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Meeting Title</Label>
                <Input
                  id="editTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Weekly Team Meeting"
                  required
                  disabled={editLoading}
                />
              </div>

              <div>
                <Label htmlFor="editDescription">Description (Optional)</Label>
                <Textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Meeting agenda and details"
                  rows={3}
                  disabled={editLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStartTime">Start Time</Label>
                  <Select
                    value={editStartTime}
                    onValueChange={setEditStartTime}
                    disabled={editLoading}
                  >
                    <SelectTrigger id="editStartTime">
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
                  <Label htmlFor="editEndTime">End Time</Label>
                  <Select
                    value={editEndTime}
                    onValueChange={setEditEndTime}
                    disabled={editLoading}
                  >
                    <SelectTrigger id="editEndTime">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots
                        .filter((time) => time > editStartTime)
                        .map((time) => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="editAttendees">Attendees (Optional)</Label>
                <Input
                  id="editAttendees"
                  value={editAttendees}
                  onChange={(e) => setEditAttendees(e.target.value)}
                  placeholder="email1@asus.com, email2@asus.com"
                  disabled={editLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Separate email addresses with commas</p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={editLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Reservation"
                )}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            <Card>
              <CardContent className="p-6">
                {upcomingReservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No upcoming reservations</div>
                ) : (
                  <div className="space-y-4">
                    {upcomingReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <h3 className="font-medium">{reservation.title}</h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(reservation.start_time), "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(reservation.start_time), "h:mm a")} -
                            {format(new Date(reservation.end_time), "h:mm a")}
                          </p>
                          <p className="text-sm text-gray-500">
                            Room: {reservation.meeting_rooms.name}
                          </p>
                          {reservation.description && (
                            <p className="text-sm text-gray-500">{reservation.description}</p>
                          )}
                          {reservation.attendees && reservation.attendees.length > 0 && (
                            <p className="text-sm text-gray-500">
                              Attendees: {reservation.attendees.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(reservation)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(reservation.id)}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="past">
            <Card>
              <CardContent className="p-6">
                {pastReservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No past reservations</div>
                ) : (
                  <div className="space-y-4">
                    {pastReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <h3 className="font-medium">{reservation.title}</h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(reservation.start_time), "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(reservation.start_time), "h:mm a")} -
                            {format(new Date(reservation.end_time), "h:mm a")}
                          </p>
                          <p className="text-sm text-gray-500">
                            Room: {reservation.meeting_rooms.name}
                          </p>
                          {reservation.description && (
                            <p className="text-sm text-gray-500">{reservation.description}</p>
                          )}
                          {reservation.attendees && reservation.attendees.length > 0 && (
                            <p className="text-sm text-gray-500">
                              Attendees: {reservation.attendees.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default MyReservations 