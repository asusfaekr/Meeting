import { createServerSupabaseClient } from "@/lib/supabase-server"
import { StatisticsDashboard } from "@/components/dashboard/statistics-dashboard"
import { redirect } from "next/navigation"

export default async function StatisticsPage() {
  const supabase = createServerSupabaseClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Check if user is admin
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  // Only admins can access statistics
  if (userData?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">System Statistics</h1>
      <StatisticsDashboard />
    </div>
  )
}
