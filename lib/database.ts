import fs from "fs/promises"
import path from "path"

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

const DB_PATH = path.join(process.cwd(), "data", "users.json")

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Load all users data
export async function loadUsersData(): Promise<Record<string, UserData>> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(DB_PATH, "utf-8")
    return JSON.parse(data)
  } catch {
    return {}
  }
}

// Save all users data
export async function saveUsersData(data: Record<string, UserData>) {
  await ensureDataDir()
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2))
}

// Get user data
export async function getUserData(address: string): Promise<UserData | null> {
  const allData = await loadUsersData()
  return allData[address] || null
}

// Save user data
export async function saveUserData(address: string, userData: UserData) {
  const allData = await loadUsersData()
  allData[address] = userData
  await saveUsersData(allData)
}

// Update user points
export async function updateUserPoints(
  address: string,
  points: number,
  activityType: "daily" | "game" | "bridge",
  action: string,
) {
  const userData = (await getUserData(address)) || {
    address,
    totalEarned: 0,
    dailyStreak: 0,
    lastClaimDate: null,
    energy: 100,
    lastEnergyUpdate: new Date().toISOString(),
    activities: [],
  }

  userData.totalEarned += points
  userData.activities.push({
    type: activityType,
    action,
    points,
    timestamp: Date.now(),
  })

  await saveUserData(address, userData)
  return userData
}
