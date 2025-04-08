"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Users, DoorClosed, Calendar, TrendingUp, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface RoomStatistics {
  totalUsers: number
  totalRooms: number
  totalReservations: number
  upcomingReservations: number
  mostPopularRoom: {
    name: string
    count: number
  } | null
  reservationsToday: number
}

export function StatisticsDashboard() {
  const { supabase } = useSupabase()
  const [stats, setStats] = useState<RoomStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStatistics() {
      try {
        setLoading(true)
        setError(null)

        // Get total users
        const { count: totalUsers, error: usersError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })

        if (usersError) throw usersError

        // Get total rooms
        const { count: totalRooms, error: roomsError } = await supabase
          .from("meeting_rooms")
          .select("*", { count: "exact", head: true })

        if (roomsError) throw roomsError

        // Get total reservations
        const { count: totalReservations, error: reservationsError } = await supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })

        if (reservationsError) throw reservationsError

        // Get upcoming reservations
        const now = new Date().toISOString()
        const { count: upcomingReservations, error: upcomingError } = await supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .gte("end_time", now)

        if (upcomingError) throw upcomingError

        // Get reservations today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { count: reservationsToday, error: todayError } = await supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .gte("start_time", today.toISOString())
          .lt("start_time", tomorrow.toISOString())

        if (todayError) throw todayError

        // Get most popular room
        const { data: popularRoomData, error: popularRoomError } = await supabase
          .from("reservations")
          .select(`
            room_id,
            meeting_rooms (name)
          `)
          .order("room_id")

        if (popularRoomError) throw popularRoomError

        // Count reservations per room
        const roomCounts: Record<string, { id: string; name: string; count: number }> = {}

        popularRoomData?.forEach((reservation) => {
          const roomId = reservation.room_id
          const roomName = reservation.meeting_rooms?.name || "Unknown"

          if (!roomCounts[roomId]) {
            roomCounts[roomId] = { id: roomId, name: roomName, count: 0 }
          }

          roomCounts[roomId].count++
        })

        // Find the room with the most reservations
        let mostPopularRoom = null
        let maxCount = 0

        Object.values(roomCounts).forEach((room) => {
          if (room.count > maxCount) {
            mostPopularRoom = { name: room.name, count: room.count }
            maxCount = room.count
          }
        })

        setStats({
          totalUsers: totalUsers || 0,
          totalRooms: totalRooms || 0,
          totalReservations: totalReservations || 0,
          upcomingReservations: upcomingReservations || 0,
          mostPopularRoom,
          reservationsToday: reservationsToday || 0,
        })
      } catch (error: any) {
        console.error("Error fetching statistics:", error)
        setError(error.message || "Failed to load statistics")
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [supabase])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats?.totalUsers}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meeting Rooms</CardTitle>
          <DoorClosed className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats?.totalRooms}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats?.totalReservations}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Reservations</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats?.upcomingReservations}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Reservations</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats?.reservationsToday}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Popular Room</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : stats?.mostPopularRoom ? (
            <div>
              <div className="text-2xl font-bold">{stats.mostPopularRoom.name}</div>
              <p className="text-xs text-muted-foreground">{stats.mostPopularRoom.count} reservations</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No reservations yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
