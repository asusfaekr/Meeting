import { createServerSupabaseClient } from "@/lib/supabase-server"
import { DailySchedule } from "@/components/dashboard/daily-schedule"
import { RoomList } from "@/components/dashboard/room-list"
import { DashboardDateDisplay } from "@/components/dashboard/dashboard-date-display"
import { TimeRangeFilter } from "@/components/dashboard/time-range-filter"
import { format, addHours } from "date-fns"
import { cache } from "react"

// Cache the data fetching to prevent excessive requests
const getRooms = cache(async (supabase: any) => {
  const { data } = await supabase.from("meeting_rooms").select("*").eq("is_active", true).order("name")
  return data || []
})

const getReservations = cache(async (supabase: any, startOfDay: string, endOfDay: string) => {
  const { data } = await supabase
    .from("reservations")
    .select(`
      *,
      meeting_rooms (name),
      users (first_name, last_name)
    `)
    .gte("start_time", startOfDay)
    .lte("end_time", endOfDay)
    .order("start_time")

  return data || []
})

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { date?: string; startTime?: string; endTime?: string }
}) {
  const supabase = createServerSupabaseClient()

  // Get selected date from query params or use today
  const selectedDate = searchParams.date ? new Date(`${searchParams.date}T00:00:00`) : new Date()

  // Format date for database query
  const dateString = format(selectedDate, "yyyy-MM-dd")
  const startOfDay = `${dateString}T00:00:00.000Z`
  const endOfDay = `${dateString}T23:59:59.999Z`

  // Calculate default time range based on current time (if not provided in URL)
  const now = new Date()
  let defaultStartTime: string
  let defaultEndTime: string

  if (!searchParams.startTime || !searchParams.endTime) {
    // Get current time + 1 hour for start time
    const oneHourLater = addHours(now, 1)

    // Round to nearest 30 minutes
    const startHour = oneHourLater.getHours()
    const startMinute = Math.floor(oneHourLater.getMinutes() / 30) * 30

    // Format the start time
    defaultStartTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`

    // Calculate end time (1 hour after start time)
    const endTime = new Date(oneHourLater)
    endTime.setHours(startHour + 1)
    endTime.setMinutes(startMinute)

    defaultEndTime = `${endTime.getHours().toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`

    // Ensure times are within business hours (8:00-18:00)
    if (startHour < 8) {
      defaultStartTime = "08:00"
      defaultEndTime = "09:00"
    } else if (startHour >= 17) {
      defaultStartTime = "17:00"
      defaultEndTime = "18:00"
    }
  }

  // Get time range from query params or use defaults
  const startTime = searchParams.startTime || defaultStartTime
  const endTime = searchParams.endTime || defaultEndTime

  // Fetch data with caching to prevent excessive requests
  const rooms = await getRooms(supabase)
  const reservations = await getReservations(supabase, startOfDay, endOfDay)

  // Filter available rooms based on time range
  let availableRooms = rooms || []

  if (startTime && endTime) {
    // Convert time strings to Date objects for comparison
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const requestStartTime = new Date(selectedDate)
    requestStartTime.setHours(startHour, startMinute, 0, 0)

    const requestEndTime = new Date(selectedDate)
    requestEndTime.setHours(endHour, endMinute, 0, 0)

    // Filter out rooms that have reservations overlapping with the selected time range
    availableRooms =
      rooms?.filter((room) => {
        // Get all reservations for this room on the selected date
        const roomReservations = reservations?.filter((res) => res.room_id === room.id) || []

        // If the room has no reservations, it's available
        if (roomReservations.length === 0) return true

        // Check if any reservation overlaps with the selected time range
        const hasOverlap = roomReservations.some((res) => {
          const resStartTime = new Date(res.start_time)
          const resEndTime = new Date(res.end_time)

          // Check for overlap:
          // If the requested start time is before the reservation end time
          // AND the requested end time is after the reservation start time
          // then there is an overlap
          return (
            (requestStartTime < resEndTime && requestEndTime > resStartTime) ||
            // Also check for exact matches
            requestStartTime.getTime() === resStartTime.getTime() ||
            requestEndTime.getTime() === resEndTime.getTime()
          )
        })

        // Return true if there's no overlap (room is available)
        return !hasOverlap
      }) || []
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <DashboardDateDisplay initialDate={selectedDate} />
      </div>

      <TimeRangeFilter initialStartTime={startTime} initialEndTime={endTime} selectedDate={selectedDate} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <DailySchedule
            reservations={reservations || []}
            rooms={rooms || []}
            selectedDate={selectedDate}
            dateString={dateString}
          />
        </div>

        <div>
          <RoomList rooms={availableRooms} selectedDate={selectedDate} startTime={startTime} endTime={endTime} />
        </div>
      </div>
    </div>
  )
}
