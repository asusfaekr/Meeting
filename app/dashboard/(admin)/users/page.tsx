import { createServerSupabaseClient } from "@/lib/supabase-server"
import { UserManagement } from "@/components/dashboard/user-management"

export default async function UsersPage() {
  const supabase = createServerSupabaseClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get all users
  const { data: users } = await supabase.from("users").select("*").order("last_name")

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Manage Users</h1>
      <UserManagement users={users || []} currentUserId={user?.id || ""} />
    </div>
  )
}
