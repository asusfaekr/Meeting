"use client"

import { useSupabase } from "@/lib/supabase-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { User, Settings, Users } from "lucide-react"
import { useEffect, useState } from "react"

export default function Header() {
  const { supabase, user } = useSupabase()
  const { toast } = useToast()
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if user is admin once
  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const { data } = await supabase.from("users").select("role").eq("id", user.id).single()

          setIsAdmin(data?.role === "admin")
        } catch (error) {
          console.error("Error checking admin status:", error)
        }
      }
    }

    checkAdmin()
  }, [user, supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()

      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      })

      // Use direct navigation for more reliable redirect
      window.location.href = "/"
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleNavigation = (path: string) => {
    window.location.href = path
  }

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold">ASUS Meeting Room Reservation</h1>

      <div className="flex items-center space-x-4">
        {isAdmin && (
          <div className="flex space-x-2 mr-4">
            <Button variant="outline" size="sm" onClick={() => handleNavigation("/dashboard/rooms")}>
              <Settings className="h-4 w-4 mr-2" />
              Rooms
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNavigation("/dashboard/users")}>
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigation("/dashboard/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation("/dashboard/my-reservations")}>
              My Reservations
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation("/dashboard/rooms")}>Manage Rooms</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation("/dashboard/users")}>Manage Users</DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
