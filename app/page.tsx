import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import LoginPage from "@/components/auth/login-page"

export default async function Home() {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return <LoginPage />
}
