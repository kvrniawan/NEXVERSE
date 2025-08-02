import { NextResponse } from "next/server"
import { loadUsersData } from "@/lib/database"

export async function GET() {
  try {
    const allUsers = await loadUsersData()

    const leaderboard = Object.values(allUsers)
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, 100) // Top 100 users
      .map((user, index) => ({
        rank: index + 1,
        address: user.address,
        points: user.totalEarned,
        dailyStreak: user.dailyStreak,
      }))

    return NextResponse.json(leaderboard)
  } catch (error) {
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 })
  }
}
