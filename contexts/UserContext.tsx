"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"

interface UserContextType {
  user: User | null
  loading: boolean
  setUserData: (userData: any) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface Props {
  children: ReactNode
}

export const UserProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const setUserData = (userData: any) => {
    // This function can be used to update user data if needed
    console.log("Setting user data:", userData)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })
  }, [])

  const value: UserContextType = { user, loading, setUserData }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
