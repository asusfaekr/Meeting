"use client"

import { useState, useEffect } from "react"
import { BookingForm } from "@/components/dashboard/booking-form"
import { RoomList } from "@/components/dashboard/room-list"
import { DailySchedule } from "@/components/dashboard/daily-schedule"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

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
  capacity: number
  floor: string
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // 오늘의 예약 정보 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 현재 날짜의 시작과 끝 시간 계산 (KST 기준)
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        startOfDay.setHours(startOfDay.getHours() - 9) // UTC로 변환

        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)
        endOfDay.setHours(endOfDay.getHours() - 9) // UTC로 변환

        console.log("Fetching data for date:", format(selectedDate, "yyyy-MM-dd"))
        console.log("Start of day (UTC):", startOfDay.toISOString())
        console.log("End of day (UTC):", endOfDay.toISOString())

        // 예약 정보 가져오기
        const { data: reservationsData, error: reservationsError } = await supabase
          .from("reservations")
          .select(`
            id,
            room_id,
            title,
            start_time,
            end_time,
            user_id,
            users (
              email,
              first_name,
              last_name
            ),
            meeting_rooms (
              name,
              location,
              capacity
            )
          `)
          .gte("start_time", startOfDay.toISOString())
          .lte("end_time", endOfDay.toISOString())
          .order("start_time", { ascending: true })

        if (reservationsError) {
          console.error("Reservations error:", reservationsError)
          throw reservationsError
        }

        // 회의실 정보 가져오기
        const { data: roomsData, error: roomsError } = await supabase
          .from("meeting_rooms")
          .select(`
            id,
            name,
            capacity,
            location,
            features,
            is_active
          `)
          .eq("is_active", true)
          .order("name", { ascending: true })

        if (roomsError) {
          console.error("Rooms error:", roomsError)
          throw roomsError
        }

        console.log("Fetched reservations:", reservationsData)
        console.log("Fetched rooms:", roomsData)

        setReservations(reservationsData || [])
        setRooms(roomsData || [])

        // 로그 추가
        console.log("Dashboard - Selected Date:", format(selectedDate, "yyyy-MM-dd"))
        console.log("Dashboard - Reservations:", reservationsData?.length || 0)
        console.log("Dashboard - Rooms:", roomsData?.length || 0)
        console.log("Dashboard - Reservation Details:", reservationsData)

      } catch (err) {
        console.error("Error fetching data:", err)
        setError("데이터를 불러오는 중 오류가 발생했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedDate, supabase])

  // 날짜 변경 핸들러
  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  // 시간 변경 핸들러
  const handleTimeChange = (start: string, end: string) => {
    setStartTime(start)
    setEndTime(end)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">회의실 예약 대시보드</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>예약하기</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingForm
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>사용 가능한 회의실</CardTitle>
          </CardHeader>
          <CardContent>
            <RoomList
              rooms={rooms}
              selectedDate={selectedDate}
              startTime={startTime}
              endTime={endTime}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>일일 스케줄</CardTitle>
        </CardHeader>
        <CardContent>
          <DailySchedule
            reservations={reservations}
            rooms={rooms}
            selectedDate={selectedDate}
            dateString={format(selectedDate, "yyyy-MM-dd")}
          />
        </CardContent>
      </Card>
    </div>
  )
}
