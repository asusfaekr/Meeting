import React, { useState, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Reservation {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  attendees: string[] | null
  meeting_rooms: {
    name: string
  }
}

export default function MyReservations() {
  const router = useRouter()
  const { toast } = useToast()
  const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([])
  const [pastReservations, setPastReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStartTime, setEditStartTime] = useState("")
  const [editEndTime, setEditEndTime] = useState("")
  const [editAttendees, setEditAttendees] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  // Supabase 클라이언트 초기화 방식 변경
  const supabase = createClientComponentClient()

  console.log("MyReservations 컴포넌트가 렌더링되었습니다.")

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

  // 페이지 로드 시 즉시 데이터 가져오기
  useEffect(() => {
    console.log("useEffect가 실행되었습니다. 데이터를 가져옵니다.")
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    console.log("fetchReservations 함수가 호출되었습니다.")
    setLoading(true)
    try {
      // 세션 확인 전에 Supabase 상태 로깅
      console.log("Supabase 클라이언트 상태:", supabase)
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const session = sessionData?.session
      console.log("세션 정보:", session ? "세션 있음" : "세션 없음")
      console.log("세션 에러:", sessionError)
      
      if (sessionError) {
        console.error("세션 에러 발생:", sessionError)
        throw sessionError
      }
      
      if (!session) {
        console.log("세션이 없습니다. 로그인 페이지로 이동합니다.")
        router.push("/login")
        return
      }

      console.log("현재 로그인된 사용자 ID:", session.user.id)

      // 쿼리 실행 전 로깅
      console.log("예약 데이터 조회 시작...")
      
      const { data: reservations, error: reservationsError } = await supabase
        .from("reservations")
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          attendees,
          meeting_rooms (
            name
          )
        `)
        .eq("user_id", session.user.id)
        .order("start_time", { ascending: true })

      if (reservationsError) {
        console.error("예약 데이터 조회 중 오류 발생:", reservationsError)
        throw reservationsError
      }

      console.log("=== 예약 데이터 디버깅 정보 ===")
      console.log("전체 예약 데이터:", reservations)
      console.log("예약 개수:", reservations?.length || 0)

      if (!reservations || reservations.length === 0) {
        console.log("예약 데이터가 없습니다.")
        setUpcomingReservations([])
        setPastReservations([])
        return
      }

      const now = new Date().toISOString()
      console.log("현재 시간:", now)

      const upcoming = reservations.filter((r: Reservation) => new Date(r.start_time) >= new Date(now))
      const past = reservations.filter((r: Reservation) => new Date(r.start_time) < new Date(now))

      console.log("=== 예약 분류 결과 ===")
      console.log("예정된 예약:", upcoming.map(r => ({
        id: r.id,
        title: r.title,
        room: r.meeting_rooms.name,
        start: r.start_time,
        end: r.end_time
      })))
      console.log("지난 예약:", past.map(r => ({
        id: r.id,
        title: r.title,
        room: r.meeting_rooms.name,
        start: r.start_time,
        end: r.end_time
      })))

      setUpcomingReservations(upcoming)
      setPastReservations(past)
    } catch (error) {
      console.error("예약 데이터 처리 중 오류 발생:", error)
      toast({
        title: "Error",
        description: "Failed to fetch reservations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Reservation Deleted",
        description: "Your reservation has been successfully deleted.",
      })

      fetchReservations()
    } catch (error) {
      console.error("Error deleting reservation:", error)
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting your reservation.",
        variant: "destructive",
      })
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
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
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
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
                      {timeSlots.map((time: string) => (
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
                        .filter((time: string) => time > editStartTime)
                        .map((time: string) => (
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditAttendees(e.target.value)}
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
                    {upcomingReservations.map((reservation: Reservation) => (
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
                    {pastReservations.map((reservation: Reservation) => (
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