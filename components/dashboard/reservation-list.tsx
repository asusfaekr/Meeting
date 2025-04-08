"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, parseISO, isPast } from "date-fns"
import { Calendar, Clock, MapPin, Trash2 } from "lucide-react"

interface Reservation {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  attendees: string[] | null
  meeting_rooms: {
    name: string
    location: string
  }
}

interface ReservationListProps {
  reservations: Reservation[]
}

export function ReservationList({ reservations }: ReservationListProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Filter reservations into upcoming and past
  const now = new Date()
  const upcomingReservations = reservations.filter((res) => !isPast(parseISO(res.end_time)))
  const pastReservations = reservations.filter((res) => isPast(parseISO(res.end_time)))

  const handleDelete = async () => {
    if (!reservationToDelete) return

    setLoading(true)

    try {
      const { error } = await supabase.from("reservations").delete().eq("id", reservationToDelete)

      if (error) throw error

      toast({
        title: "Reservation cancelled",
        description: "Your reservation has been cancelled successfully",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error cancelling reservation",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setReservationToDelete(null)
    }
  }

  const confirmDelete = (id: string) => {
    setReservationToDelete(id)
    setDeleteDialogOpen(true)
  }

  const renderReservationCard = (reservation: Reservation) => (
    <Card key={reservation.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg mb-2">{reservation.title}</h3>

            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {format(parseISO(reservation.start_time), "EEEE, MMMM d, yyyy")}
              </div>

              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {format(parseISO(reservation.start_time), "h:mm a")} -{format(parseISO(reservation.end_time), "h:mm a")}
              </div>

              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {reservation.meeting_rooms.name} ({reservation.meeting_rooms.location})
              </div>
            </div>

            {reservation.description && (
              <div className="mt-4 text-sm">
                <p className="font-medium">Description:</p>
                <p className="text-gray-700">{reservation.description}</p>
              </div>
            )}

            {reservation.attendees && reservation.attendees.length > 0 && (
              <div className="mt-4 text-sm">
                <p className="font-medium">Attendees:</p>
                <p className="text-gray-700">{reservation.attendees.join(", ")}</p>
              </div>
            )}
          </div>

          {!isPast(parseISO(reservation.end_time)) && (
            <Button variant="ghost" size="icon" onClick={() => confirmDelete(reservation.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming ({upcomingReservations.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastReservations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingReservations.length > 0 ? (
            upcomingReservations.map(renderReservationCard)
          ) : (
            <div className="text-center py-8 text-gray-500">You have no upcoming reservations</div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastReservations.length > 0 ? (
            pastReservations.map(renderReservationCard)
          ) : (
            <div className="text-center py-8 text-gray-500">You have no past reservations</div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Cancelling..." : "Yes, Cancel Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
