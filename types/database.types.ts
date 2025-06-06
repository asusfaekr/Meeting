export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          created_at: string
          last_login: string | null
          verified: boolean
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          role?: string
          created_at?: string
          last_login?: string | null
          verified?: boolean
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: string
          created_at?: string
          last_login?: string | null
          verified?: boolean
        }
      }
      meeting_rooms: {
        Row: {
          id: string
          name: string
          capacity: number
          location: string
          features: string[] | null
          is_active: boolean
          created_at: string
          photo_url: string | null
        }
        Insert: {
          id?: string
          name: string
          capacity: number
          location: string
          features?: string[] | null
          is_active?: boolean
          created_at?: string
          photo_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          capacity?: number
          location?: string
          features?: string[] | null
          is_active?: boolean
          created_at?: string
          photo_url?: string | null
        }
      }
      reservations: {
        Row: {
          id: string
          room_id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          attendees: string[] | null
          created_at: string
          updated_at: string
          status: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          attendees?: string[] | null
          created_at?: string
          updated_at?: string
          status?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          attendees?: string[] | null
          created_at?: string
          updated_at?: string
          status?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
