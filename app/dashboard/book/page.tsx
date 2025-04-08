import { createServerSupabaseClient } from "@/lib/supabase-server"
import { BookingForm } from "@/components/dashboard/booking-form"
import { DashboardDateDisplay } from "@/components/dashboard/dashboard-date-display"
import { redirect } from "next/navigation"
import { format } from "date-fns"

export default async function BookPage({
  searchParams,
}: {
  searchParams: { date?: string; room?: string; startTime?: string; endTime?: string }
}) {
  const supabase = createServerSupabaseClient()

  // Get user info
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Parse selected date from query params or use today
  const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date()
  const dateString = format(selectedDate, "yyyy-MM-dd")

  // Get selected room if provided
  const selectedRoomId = searchParams.room || null

  // Get time range if provided
  const startTime = searchParams.startTime || "09:00"
  const endTime = searchParams.endTime || "10:00"

  // Get all active meeting rooms
  const { data: rooms } = await supabase.from("meeting_rooms").select("*").eq("is_active", true).order("name")

  // If a room is selected, check if it's available for the selected time
  if (selectedRoomId) {
    // Convert form times to ISO strings for database query
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startDateTime = new Date(selectedDate)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(selectedDate)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    // Check for existing reservations in this time slot
    const { data: existingReservations } = await supabase
      .from("reservations")
      .select("*")
      .eq("room_id", selectedRoomId)
      .lte("start_time", endDateTime.toISOString())
      .gte("end_time", startDateTime.toISOString())

    // If the room is already booked for this time, redirect to dashboard
    if (existingReservations && existingReservations.length > 0) {
      redirect(`/dashboard?date=${dateString}&startTime=${startTime}&endTime=${endTime}&error=room_unavailable`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Book a Meeting Room</h1>
        <DashboardDateDisplay initialDate={selectedDate} />
      </div>

      <BookingForm
        rooms={rooms || []}
        selectedDate={selectedDate}
        selectedRoomId={selectedRoomId}
        userId={user?.id || ""}
        initialStartTime={startTime}
        initialEndTime={endTime}
      />
    </div>
  )
}
