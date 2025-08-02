"use client";

import { BarChart3, ArrowLeftRight, Gamepad2 } from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "bridge", label: "Swap", icon: ArrowLeftRight },
    { id: "game", label: "Game", icon: Gamepad2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur-sm border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-around py-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? "text-purple-400 bg-purple-500/10 neon-glow"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
