import { createServerSupabaseClient } from "@/lib/supabase-server"
import { ReservationList } from "@/components/dashboard/reservation-list"
import { DashboardDateDisplay } from "@/components/dashboard/dashboard-date-display"

export default async function MyReservationsPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const supabase = createServerSupabaseClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Loading...</div>
  }

  // Parse selected date from query params or use today
  const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date()

  // Get user's reservations
  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      *,
      meeting_rooms (name, location)
    `)
    .eq("user_id", user.id)
    .order("start_time", { ascending: true })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Reservations</h1>
        <DashboardDateDisplay initialDate={selectedDate} />
      </div>
      <ReservationList reservations={reservations || []} />
    </div>
  )
}
