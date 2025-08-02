import { type NextRequest, NextResponse } from "next/server"
import { getUserData, updateUserPoints } from "@/lib/database"

// GET user data
export async function GET(request: NextRequest, { params }: { params: { address: string } }) {
  try {
    const userData = await getUserData(params.address)
    return NextResponse.json(
      userData || {
        address: params.address,
        totalEarned: 0,
        dailyStreak: 0,
        lastClaimDate: null,
        energy: 100,
        lastEnergyUpdate: new Date().toISOString(),
        activities: [],
      },
    )
  } catch (error) {
    return NextResponse.json({ error: "Failed to load user data" }, { status: 500 })
  }
}

// POST update user data
export async function POST(request: NextRequest, { params }: { params: { address: string } }) {
  try {
    const body = await request.json()
    const { points, activityType, action } = body

    const userData = await updateUserPoints(params.address, points, activityType, action)
    return NextResponse.json(userData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user data" }, { status: 500 })
  }
}
