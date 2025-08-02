"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Gift,
  Clock,
  Activity,
  Star,
  Zap,
  ArrowRight,
  Calendar,
  Gamepad2,
  ArrowLeftRight,
} from "lucide-react";

interface ActivityItem {
  type: "daily" | "game" | "bridge";
  action: string;
  points: number;
  time: string;
  timestamp: number;
}

interface UserStats {
  totalPoints: number;
  dailyStreak: number;
  rank: number;
  lastClaimDate: string | null;
  activities: ActivityItem[];
}

export function Dashboard() {
  const { address } = useAccount();
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    dailyStreak: 0,
    rank: 0,
    lastClaimDate: null,
    activities: [],
  });
  const [canClaim, setCanClaim] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [leaderboard, setLeaderboard] = useState<
    Array<{ rank: number; address: string; points: number }>
  >([]);

  // Load user data from localStorage
  useEffect(() => {
    if (address) {
      loadUserData();
      loadLeaderboard();
    }
  }, [address]);

  // Check daily claim status and update countdown
  useEffect(() => {
    if (userStats.lastClaimDate && address) {
      const timer = setInterval(() => {
        const now = new Date();
        const lastClaim = new Date(userStats.lastClaimDate!);
        const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
        const diff = nextClaim.getTime() - now.getTime();

        if (diff <= 0) {
          setCanClaim(true);
          setCountdown("");
        } else {
          setCanClaim(false);
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCanClaim(true);
    }
  }, [userStats.lastClaimDate, address]);

  const loadUserData = () => {
    if (!address) return;

    // Load total points from game
    const totalEarnedKey = `total_earned_${address}`;
    const savedTotalEarned = localStorage.getItem(totalEarnedKey) || "0";

    // Load daily claim data
    const claimKey = `daily_claim_${address}`;
    const savedClaimTime = localStorage.getItem(claimKey);

    // Load activities
    const activitiesKey = `activities_${address}`;
    const savedActivities = localStorage.getItem(activitiesKey);
    const activities = savedActivities ? JSON.parse(savedActivities) : [];

    // Calculate daily streak
    const dailyStreak = calculateDailyStreak(activities);

    // Calculate total points (game points + daily claims + bridge rewards)
    const gamePoints = Number.parseInt(savedTotalEarned, 10);
    const dailyClaimPoints = activities
      .filter((a: ActivityItem) => a.type === "daily")
      .reduce((sum: number, a: ActivityItem) => sum + a.points, 0);
    const bridgePoints = activities
      .filter((a: ActivityItem) => a.type === "bridge")
      .reduce((sum: number, a: ActivityItem) => sum + a.points, 0);

    const totalPoints = gamePoints + dailyClaimPoints + bridgePoints;

    setUserStats({
      totalPoints,
      dailyStreak,
      rank: 0, // Will be calculated in leaderboard
      lastClaimDate: savedClaimTime,
      activities: activities.slice(-5), // Show last 5 activities
    });
  };

  const calculateDailyStreak = (activities: ActivityItem[]) => {
    const dailyClaims = activities
      .filter((a) => a.type === "daily")
      .sort((a, b) => b.timestamp - a.timestamp);

    if (dailyClaims.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(dailyClaims[0].timestamp);

    for (let i = 1; i < dailyClaims.length; i++) {
      const prevDate = new Date(dailyClaims[i].timestamp);
      const dayDiff = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        streak++;
        currentDate = prevDate;
      } else {
        break;
      }
    }

    return streak;
  };

  const loadLeaderboard = () => {
    // Get all users' total points from localStorage
    const users: Array<{ address: string; points: number }> = [];

    // Scan localStorage for all user data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("total_earned_")) {
        const userAddress = key.replace("total_earned_", "");
        const gamePoints = Number.parseInt(
          localStorage.getItem(key) || "0",
          10
        );

        // Get additional points from activities
        const activitiesKey = `activities_${userAddress}`;
        const savedActivities = localStorage.getItem(activitiesKey);
        const activities = savedActivities ? JSON.parse(savedActivities) : [];

        const additionalPoints = activities.reduce(
          (sum: number, a: ActivityItem) => sum + a.points,
          0
        );
        const totalPoints = gamePoints + additionalPoints;

        if (totalPoints > 0) {
          users.push({
            address: userAddress,
            points: totalPoints,
          });
        }
      }
    }

    // Sort by points and create leaderboard
    users.sort((a, b) => b.points - a.points);

    const leaderboardData = users.slice(0, 10).map((user, index) => ({
      rank: index + 1,
      address:
        user.address === address
          ? `${user.address.slice(0, 6)}...${user.address.slice(-4)} (You)`
          : `${user.address.slice(0, 6)}...${user.address.slice(-4)}`,
      points: user.points,
    }));

    // Add current user if not in top 10
    const currentUserRank = users.findIndex((u) => u.address === address) + 1;
    if (currentUserRank > 10 && address) {
      leaderboardData.push({
        rank: currentUserRank,
        address: `${address.slice(0, 6)}...${address.slice(-4)} (You)`,
        points: userStats.totalPoints,
      });
    }

    setLeaderboard(leaderboardData);

    // Update user rank
    setUserStats((prev) => ({
      ...prev,
      rank: currentUserRank || 0,
    }));
  };

  const addActivity = (
    type: "daily" | "game" | "bridge",
    action: string,
    points: number
  ) => {
    if (!address) return;

    const newActivity: ActivityItem = {
      type,
      action,
      points,
      time: getRelativeTime(new Date()),
      timestamp: Date.now(),
    };

    const activitiesKey = `activities_${address}`;
    const savedActivities = localStorage.getItem(activitiesKey);
    const activities = savedActivities ? JSON.parse(savedActivities) : [];

    activities.push(newActivity);
    localStorage.setItem(activitiesKey, JSON.stringify(activities));

    // Reload user data
    loadUserData();
    loadLeaderboard();
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const handleDailyClaim = () => {
    if (canClaim && address) {
      const now = new Date();
      const points = 50;

      // Update localStorage
      const claimKey = `daily_claim_${address}`;
      localStorage.setItem(claimKey, now.toISOString());

      // Add activity
      addActivity("daily", "Daily Check-in Claimed", points);

      // Update state
      setUserStats((prev) => ({
        ...prev,
        totalPoints: prev.totalPoints + points,
        lastClaimDate: now.toISOString(),
        dailyStreak: prev.dailyStreak + 1,
      }));

      setCanClaim(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "daily":
        return <Gift className="w-4 h-4 text-purple-400" />;
      case "game":
        return <Gamepad2 className="w-4 h-4 text-green-400" />;
      case "bridge":
        return <ArrowLeftRight className="w-4 h-4 text-blue-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "daily":
        return "bg-purple-400";
      case "game":
        return "bg-green-400";
      case "bridge":
        return "bg-blue-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 space-y-6 pb-24">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Welcome to Nex Verse
        </h1>
        <p className="text-gray-400">
          Earn NEX tokens through gaming and cross-chain activities
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900/50 neon-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Points
            </CardTitle>
            <Star className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {userStats.totalPoints.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {userStats.activities.length > 0
                ? `+${userStats.activities[0]?.points || 0} from last activity`
                : "Start playing to earn points!"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 neon-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Daily Streak
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {userStats.dailyStreak} Days
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {userStats.dailyStreak > 0
                ? "Keep it up!"
                : "Start your streak today!"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 neon-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Rank
            </CardTitle>
            <Trophy className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {userStats.rank > 0 ? `#${userStats.rank}` : "--"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {userStats.rank > 0
                ? `${userStats.rank <= 10 ? "Top 10!" : "Keep climbing!"}`
                : "Play to get ranked!"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Check-in */}
      <Card className="bg-gray-900/50 neon-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="w-5 h-5 text-purple-400" />
            <span>Daily NEX Bonus</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Claim your daily NEX bonus
              </p>
              <p className="text-lg font-semibold text-purple-400">
                +50 Points
              </p>
              {userStats.lastClaimDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Last claimed:{" "}
                  {new Date(userStats.lastClaimDate).toLocaleDateString()} at{" "}
                  {new Date(userStats.lastClaimDate).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="text-right">
              {!canClaim && countdown && (
                <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Next claim in {countdown}</span>
                </div>
              )}
              <Button
                onClick={handleDailyClaim}
                disabled={!canClaim}
                className={`${
                  canClaim
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 neon-glow"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {canClaim ? "Claim Daily Bonus" : "Already Claimed"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-gray-900/50 neon-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userStats.activities.length > 0 ? (
              userStats.activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                >
                  <div className="flex items-center space-x-3">
                    {getActivityIcon(activity.type)}
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-gray-700 text-green-400"
                  >
                    +{activity.points}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">
                  Start playing to see your activities here!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="bg-gray-900/50 neon-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>NEX Verse Leaderboard</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-purple-400 hover:text-purple-300"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.map((user, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    user.address.includes("(You)")
                      ? "bg-purple-500/10 border border-purple-500/30"
                      : "bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        user.rank === 1
                          ? "bg-yellow-500 text-black"
                          : user.rank === 2
                          ? "bg-gray-400 text-black"
                          : user.rank === 3
                          ? "bg-orange-500 text-black"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {user.rank}
                    </div>
                    <span className="text-sm font-medium">{user.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold">
                      {user.points.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No players yet</p>
                <p className="text-sm">
                  Be the first to earn points and claim the top spot!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
