import { createServerSupabaseClient } from "@/lib/supabase-server"
import { RoomManagement } from "@/components/dashboard/room-management"

export default async function RoomsPage() {
  const supabase = createServerSupabaseClient()

  // Get all meeting rooms
  const { data: rooms } = await supabase.from("meeting_rooms").select("*").order("name")

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Manage Meeting Rooms</h1>
      <RoomManagement rooms={rooms || []} />
    </div>
  )
}
