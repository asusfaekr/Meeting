import type React from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import Header from "@/components/dashboard/header"
import Sidebar from "@/components/dashboard/sidebar"
import { DateProvider } from "@/contexts/date-context"
import { Suspense } from "react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Update last_login time for the user
  await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", session.user.id)

  return (
    <DateProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4">
            <Suspense fallback={<div className="p-4">Loading...</div>}>{children}</Suspense>
          </main>
        </div>
      </div>
    </DateProvider>
  )
}
