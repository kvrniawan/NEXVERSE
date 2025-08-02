"use client"

import { useState, useEffect } from "react"

interface UserData {
  address: string
  totalEarned: number
  dailyStreak: number
  lastClaimDate: string | null
  energy: number
  lastEnergyUpdate: string
  activities: Array<{
    type: "daily" | "game" | "bridge"
    action: string
    points: number
    timestamp: number
  }>
}

export function useLocalDatabase(address: string | undefined) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)

  // Load user data from server
  const loadUserData = async () => {
    if (!address) return

    setLoading(true)
    try {
      const response = await fetch(`/api/user/${address}`)
      const data = await response.json()
      setUserData(data)
    } catch (error) {
      console.error("Failed to load user data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Save user activity to server
  const saveActivity = async (points: number, activityType: "daily" | "game" | "bridge", action: string) => {
    if (!address) return

    try {
      const response = await fetch(`/api/user/${address}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          points,
          activityType,
          action,
        }),
      })

      const updatedData = await response.json()
      setUserData(updatedData)
      return updatedData
    } catch (error) {
      console.error("Failed to save activity:", error)
    }
  }

  useEffect(() => {
    loadUserData()
  }, [address])

  return {
    userData,
    loading,
    saveActivity,
    refreshData: loadUserData,
  }
}
