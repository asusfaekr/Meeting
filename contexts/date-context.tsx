"use client"

import type React from "react"

import { createContext, useContext, useState, useMemo } from "react"
import { format } from "date-fns"

type DateContextType = {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  formattedDate: string
}

const DateContext = createContext<DateContextType | undefined>(undefined)

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Memoize the formatted date to prevent unnecessary recalculations
  const formattedDate = useMemo(() => {
    return format(selectedDate, "yyyy-MM-dd")
  }, [selectedDate])

  // Custom setter that ensures consistent date handling
  const setDate = (date: Date) => {
    // Create a new date at midnight to avoid timezone issues
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    setSelectedDate(newDate)
  }

  const contextValue = useMemo(
    () => ({
      selectedDate,
      setSelectedDate: setDate,
      formattedDate,
    }),
    [selectedDate, formattedDate],
  )

  return <DateContext.Provider value={contextValue}>{children}</DateContext.Provider>
}

export function useDate() {
  const context = useContext(DateContext)
  if (context === undefined) {
    throw new Error("useDate must be used inside DateProvider")
  }
  return context
}
