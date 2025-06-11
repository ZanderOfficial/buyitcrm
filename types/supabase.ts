export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          status: string | null
          notes: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          status?: string | null
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          status?: string | null
          notes?: string | null
          user_id?: string | null
        }
      }
      deals: {
        Row: {
          id: string
          created_at: string
          name: string
          value: number | null
          stage: string
          contact_id: string | null
          notes: string | null
          user_id: string | null
          close_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          value?: number | null
          stage?: string
          contact_id?: string | null
          notes?: string | null
          user_id?: string | null
          close_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          value?: number | null
          stage?: string
          contact_id?: string | null
          notes?: string | null
          user_id?: string | null
          close_date?: string | null
        }
      }
      google_tokens: {
        Row: {
          user_id: string
          access_token: string
          refresh_token: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          user_id: string
          access_token: string
          refresh_token?: string | null
          expires_at: string
          created_at?: string
        }
        Update: {
          user_id?: string
          access_token?: string
          refresh_token?: string | null
          expires_at?: string
          created_at?: string
        }
      }
      daily_time_tracking: {
        Row: {
          id: string
          user_id: string
          date: string
          category: string
          duration_minutes: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          category: string
          duration_minutes: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          category?: string
          duration_minutes?: number
          notes?: string | null
          created_at?: string
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
