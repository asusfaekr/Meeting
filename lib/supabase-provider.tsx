"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database.types"
import { useToast } from "@/hooks/use-toast"

type SupabaseContext = {
  supabase: SupabaseClient<Database>
  user: any | null
  refreshSession: () => Promise<void>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient<Database>())
  const [user, setUser] = useState<any>(null)
  const authCheckDone = useRef(false)
  const { toast } = useToast()

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      if (data?.session) {
        setUser(data.session.user)
        return data.session.user
      } else {
        setUser(null)
        // If on a protected page, redirect to login
        if (window.location.pathname.startsWith("/dashboard")) {
          toast({
            title: "Session expired",
            description: "Please log in again to continue",
          })
          window.location.href = "/"
        }
        return null
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
      return null
    }
  }

  // Only check auth once on initial load
  useEffect(() => {
    if (!authCheckDone.current) {
      const checkUser = async () => {
        try {
          const { data } = await supabase.auth.getSession()
          if (data?.session) {
            setUser(data.session.user)
          }
        } catch (error) {
          console.error("Error checking session:", error)
        } finally {
          authCheckDone.current = true
        }
      }

      checkUser()

      // Set up auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user)
        } else if (event === "SIGNED_OUT") {
          setUser(null)
          // If on a protected page, redirect to login
          if (window.location.pathname.startsWith("/dashboard")) {
            window.location.href = "/"
          }
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user)
        }
      })

      // Set up a periodic session refresh
      const intervalId = setInterval(refreshSession, 5 * 60 * 1000) // Refresh every 5 minutes

      return () => {
        subscription.unsubscribe()
        clearInterval(intervalId)
      }
    }
  }, [supabase, toast])

  const contextValue = {
    supabase,
    user,
    refreshSession,
  }

  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}
