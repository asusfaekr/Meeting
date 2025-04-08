"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
}

interface ProfileFormProps {
  user: User | null
  initialUserData?: {
    email: string
    first_name: string
    last_name: string
    role: string
  }
}

export function ProfileForm({ user, initialUserData }: ProfileFormProps) {
  const { supabase, user: authUser } = useSupabase()
  const { toast } = useToast()

  const [firstName, setFirstName] = useState(initialUserData?.first_name || user?.first_name || "")
  const [lastName, setLastName] = useState(initialUserData?.last_name || user?.last_name || "")
  const [email, setEmail] = useState(initialUserData?.email || user?.email || "")
  const [role, setRole] = useState(initialUserData?.role || user?.role || "user")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(!user && !initialUserData)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch user data if not provided
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user && !initialUserData) {
        setIsLoading(true)
        setError(null)

        try {
          // First try to get the user from the context
          let userId = authUser?.id

          // If not available, try to get it from the auth API
          if (!userId) {
            const {
              data: { user: currentUser },
            } = await supabase.auth.getUser()
            userId = currentUser?.id
          }

          if (!userId) {
            throw new Error("User not authenticated")
          }

          const { data: userData, error } = await supabase.from("users").select("*").eq("id", userId).single()

          if (error) throw error

          if (userData) {
            setFirstName(userData.first_name)
            setLastName(userData.last_name)
            setEmail(userData.email)
            setRole(userData.role)
          } else {
            throw new Error("User data not found")
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error)
          setError(error.message || "Could not load your profile data")
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchUserData()
  }, [supabase, user, initialUserData, authUser, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        throw new Error("User not authenticated")
      }

      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      })

      if (authError) throw authError

      // Update user in our database
      const { error: dbError } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", currentUser.id)

      if (dbError) throw dbError

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error: any) {
      setError(error.message || "Error updating profile")
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "New password and confirmation must match",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      setError(error.message || "Error changing password")
      toast({
        title: "Error changing password",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading user data...</p>
      </div>
    )
  }

  if (error && !user && !initialUserData) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading profile</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" size="sm" className="mt-2" onClick={handleRetry}>
          Try Again
        </Button>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center space-x-2">
                <Input id="email" value={email} disabled className="bg-gray-50" />
                <Badge variant="outline">{role}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Changing Password..." : "Change Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
