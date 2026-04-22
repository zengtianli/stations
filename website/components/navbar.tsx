"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTrack } from "@/components/track-provider"
import MegaNavbar from "@/components/mega-navbar"

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

  const searchIcon = (
    <Link
      href="/search"
      aria-label="搜索"
      className={cn(
        "p-1.5 rounded-md transition-colors",
        pathname === "/search"
          ? "text-[#1d1d1f]"
          : "text-[#6b7280] hover:text-[#1f2328] hover:bg-black/[0.05]",
      )}
    >
      <Search className="h-4 w-4" />
    </Link>
  )

  // 主站当前高亮：路径匹配 → 主站对应大类
  // /services → home 里的入口 section；其他主站内页仍属 home
  const currentKey = "home"

  return (
    <>
      <MegaNavbar currentKey={currentKey} rightSlot={searchIcon} />
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
