"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ITEMS } from "@/lib/menu.generated"

export default function SectionNav() {
  const pathname = usePathname()
  return (
    <div className="sticky top-11 z-40 bg-white/70 backdrop-blur-xl border-b border-black/5">
      <div className="max-w-[1500px] mx-auto px-5 py-2 flex gap-1 text-[13px] font-medium">
        {ITEMS.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "px-3 py-1.5 rounded-md transition",
                active
                  ? "bg-[#1f2328] text-white"
                  : "text-[#6b7280] hover:bg-black/5 hover:text-[#1f2328]"
              )}
            >
              {it.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
