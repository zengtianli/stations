import type { ReactNode } from "react"
import { FileDown, Github, Linkedin, Mail } from "lucide-react"
import { cn } from "../lib/utils"

export interface SiteFooterLink {
  label: string
  href: string
  icon?: "github" | "linkedin" | "mail" | "file"
  external?: boolean
}

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

const DEFAULT_LINKS: SiteFooterLink[] = [
  { label: "联系", href: "https://tianlizeng.cloud/contact", icon: "mail", external: true },
  { label: "GitHub", href: "https://github.com/zengtianli", icon: "github", external: true },
]

export function SiteFooter({
  copyright,
  links = DEFAULT_LINKS,
  rightSlot,
  className,
}: SiteFooterProps) {
  const year = new Date().getFullYear()
  const copy = copyright ?? `© ${year} 曾田力`

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
