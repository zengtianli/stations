import type { ReactNode } from "react"
import { FileDown, Github, Linkedin, Mail } from "lucide-react"
import {
  SHARED_FOOTER_BRAND,
  SHARED_FOOTER_LINKS,
  type SiteFooterLink,
} from "@tlz/menu-ssot"
import { cn } from "../lib/utils"

export type { SiteFooterLink }

export interface SiteFooterProps {
  copyright?: string
  links?: SiteFooterLink[]
  /** Slot rendered to the right after built-in links (for custom badges). */
  rightSlot?: ReactNode
  className?: string
}

const ICON_MAP = {
  github: Github,
  linkedin: Linkedin,
  mail: Mail,
  file: FileDown,
} as const

export function SiteFooter({
  copyright,
  links = SHARED_FOOTER_LINKS,
  rightSlot,
  className,
}: SiteFooterProps) {
  const year = new Date().getFullYear()
  const copy =
    copyright ?? SHARED_FOOTER_BRAND.copyright.replace("{year}", String(year))

  return (
    <footer className={cn("border-t border-[#d2d2d7]", className)}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#86868b] text-sm">{copy}</p>
          <div className="flex items-center gap-6">
            {links.map((link, idx) => {
              const Icon = link.icon ? ICON_MAP[link.icon] : null
              return (
                <a
                  key={`${link.href}-${idx}`}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors duration-200 flex items-center gap-1.5"
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span>{link.label}</span>
                </a>
              )
            })}
            {rightSlot}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
