"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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

interface Room {
  id: string
  name: string
}

interface DailyScheduleProps {
  reservations: Reservation[]
  rooms: Room[]
  selectedDate: Date
  dateString: string
}

export function DailySchedule({ reservations, rooms, selectedDate, dateString }: DailyScheduleProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // 시간 그리드 생성 (8:00 AM - 6:00 PM)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      if (hour !== 18) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`)
      }
    }
    return slots
  }, [])

  // 예약된 시간의 위치와 너비 계산
  const getReservationStyle = (reservation: Reservation) => {
    const startTime = new Date(reservation.start_time)
    const endTime = new Date(reservation.end_time)
    
    // KST로 변환 (UTC+9)
    startTime.setHours(startTime.getHours() + 9)
    endTime.setHours(endTime.getHours() + 9)
    
    const startHour = startTime.getHours()
    const startMinute = startTime.getMinutes()
    const endHour = endTime.getHours()
    const endMinute = endTime.getMinutes()
    
    console.log("Calculating style for reservation:", {
      id: reservation.id,
      start: `${startHour}:${startMinute}`,
      end: `${endHour}:${endMinute}`
    })
    
    const startPosition = ((startHour - 8) * 2 + (startMinute / 30)) * 50
    const endPosition = ((endHour - 8) * 2 + (endMinute / 30)) * 50
    const width = endPosition - startPosition
    
    return {
      left: `${startPosition}px`,
      width: `${width}px`,
    }
  }

  // 로그 추가
  console.log("Daily Schedule - Selected Date:", format(selectedDate, "yyyy-MM-dd"))
  console.log("Daily Schedule - Reservations:", reservations.length)
  console.log("Daily Schedule - Rooms:", rooms.length)
  console.log("Daily Schedule - Reservation Details:", reservations)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="relative">
      {/* 시간 그리드 */}
      <div className="grid grid-cols-[100px_1fr] gap-4">
        <div className="space-y-2">
          {timeSlots.map((time) => (
            <div key={time} className="h-[50px] text-sm text-gray-500">
              {time}
            </div>
          ))}
        </div>
        
        {/* 회의실 목록과 예약 표시 */}
        <div className="relative">
          {rooms.map((room) => {
            const roomReservations = reservations.filter((r) => r.room_id === room.id)
            console.log(`Room ${room.name} has ${roomReservations.length} reservations`)
            
            return (
              <div key={room.id} className="h-[50px] border-b">
                <div className="relative h-full">
                  {roomReservations.map((reservation) => (
                    <TooltipProvider key={reservation.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-0 h-full bg-blue-500/20 border border-blue-500 rounded cursor-pointer hover:bg-blue-500/30"
                            style={getReservationStyle(reservation)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{reservation.title}</p>
                          <p className="text-sm text-gray-500">
                            {reservation.users?.first_name} {reservation.users?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(reservation.start_time), "HH:mm")} -{" "}
                            {format(new Date(reservation.end_time), "HH:mm")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
