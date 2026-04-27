"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTrack } from "@/components/track-provider"
import MegaNavbar from "@/components/mega-navbar"
import { SearchTrigger } from "@/components/search-trigger"

const TRACK_LINE_COLORS: Record<string, string> = {
  hydro: "bg-blue-400",
  ai: "bg-purple-400",
  devtools: "bg-emerald-400",
  indie: "bg-amber-400",
}

export default function Navbar() {
  const pathname = usePathname()
  const { activeDirection } = useTrack()
  const showTrackLine = pathname !== "/" && activeDirection

  // 主站默认高亮 home（mega-navbar 自动按 path 决定）
  const currentKey = "home"

  return (
    <>
      <MegaNavbar currentKey={currentKey} rightSlot={<SearchTrigger />} />
      {showTrackLine && (
        <div
          className={cn(
            "fixed top-16 inset-x-0 h-[2px] z-[9998] transition-all duration-500",
            TRACK_LINE_COLORS[activeDirection] || "bg-gray-200",
          )}
        />
      )}
    </>
  )
}
