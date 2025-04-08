"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, parseISO } from "date-fns"

interface Room {
  id: string
  name: string
}

interface Reservation {
  id: string
  room_id: string
  title: string
  start_time: string
  end_time: string
  meeting_rooms: {
    name: string
  }
  users: {
    first_name: string
    last_name: string
  }
}

interface DailyScheduleProps {
  reservations: Reservation[]
  rooms: Room[]
  selectedDate: Date
  dateString: string
}

export function DailySchedule({ reservations, rooms, selectedDate, dateString }: DailyScheduleProps) {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  // Business hours from 8:00 to 18:00
  const hours = useMemo(() => Array.from({ length: 11 }, (_, i) => i + 8), [])

  // Calculate position and width for a reservation bar
  const getReservationStyle = (reservation: Reservation) => {
    const startTime = parseISO(reservation.start_time)
    const endTime = parseISO(reservation.end_time)

    const startHour = startTime.getHours() + startTime.getMinutes() / 60
    const endHour = endTime.getHours() + endTime.getMinutes() / 60

    const startPosition = ((startHour - 8) / 10) * 100
    const width = ((endHour - startHour) / 10) * 100

    return {
      left: `${startPosition}%`,
      width: `${width}%`,
    }
  }

  // Memoize room reservations to improve performance
  const roomReservationsMap = useMemo(() => {
    const map = new Map<string, Reservation[]>()

    rooms.forEach((room) => {
      const roomReservations = reservations.filter((res) => res.room_id === room.id)
      map.set(room.id, roomReservations)
    })

    return map
  }, [rooms, reservations])

  // Format the date for display, using the dateString to avoid timezone issues
  const displayDate = useMemo(() => {
    const date = new Date(`${dateString}T00:00:00`)
    return format(date, "EEEE, MMMM d, yyyy")
  }, [dateString])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule for {displayDate}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Time indicators */}
          <div className="flex border-b mb-2">
            <div className="w-32"></div>
            <div className="flex-1 flex">
              {hours.map((hour) => (
                <div key={hour} className="flex-1 text-center text-xs text-gray-500">
                  {hour}:00
                </div>
              ))}
            </div>
          </div>

          {/* Room rows */}
          {rooms.map((room) => {
            const roomReservations = roomReservationsMap.get(room.id) || []

            return (
              <div key={room.id} className="flex items-center h-12 mb-2">
                <div className="w-32 font-medium truncate pr-2">{room.name}</div>
                <div className="flex-1 relative h-8 bg-gray-100 rounded">
                  {/* Time grid lines */}
                  {hours.map((hour, index) => (
                    <div
                      key={hour}
                      className={`absolute top-0 bottom-0 w-px bg-gray-300 ${index === 0 ? "left-0" : ""}`}
                      style={{ left: `${(index / 10) * 100}%` }}
                    />
                  ))}

                  <TooltipProvider>
                    {roomReservations.map((reservation) => (
                      <Tooltip key={reservation.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute h-full bg-blue-500 rounded cursor-pointer z-10"
                            style={getReservationStyle(reservation)}
                            onClick={() => setSelectedReservation(reservation)}
                          >
                            <div className="h-full w-full overflow-hidden text-white text-xs px-2 flex items-center">
                              {reservation.title}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">{reservation.title}</p>
                            <p className="text-xs">
                              {format(parseISO(reservation.start_time), "h:mm a")} -
                              {format(parseISO(reservation.end_time), "h:mm a")}
                            </p>
                            <p className="text-xs">
                              Booked by: {reservation.users.first_name} {reservation.users.last_name}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </div>
            )
          })}

          {/* No reservations message */}
          {reservations.length === 0 && (
            <div className="text-center py-8 text-gray-500">No reservations for this date</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
