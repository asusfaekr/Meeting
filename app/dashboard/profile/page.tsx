import { createServerSupabaseClient } from "@/lib/supabase-server"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient()

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      // Still render the page, but let the client-side component handle the error
      return (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight mb-6">Your Profile</h1>
          <ProfileForm user={null} />
        </div>
      )
    }

    if (!user) {
      redirect("/")
    }

    // Get user profile data
    const { data: userData, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (profileError) {
      console.error("Profile error:", profileError)
      // Still render the page with the user from auth
      const initialUserData = {
        email: user.email || "",
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        role: "user", // Default role
      }

      return (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight mb-6">Your Profile</h1>
          <ProfileForm user={null} initialUserData={initialUserData} />
        </div>
      )
    }

    // Prepare initial user data to avoid loading state
    const initialUserData = userData
      ? {
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
        }
      : undefined

    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Your Profile</h1>
        <ProfileForm user={userData || null} initialUserData={initialUserData} />
      </div>
    )
  } catch (error) {
    console.error("Unexpected error:", error)

    // Render the page with error handling on the client side
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Your Profile</h1>
        <ProfileForm user={null} />
      </div>
    )
  }
}
