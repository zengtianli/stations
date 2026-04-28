/**
 * SiteFooter — ops-console 站群统一 footer
 *
 * 数据源：~/Dev/tools/configs/menus/footer.yaml （SSOT）
 *   → menus.py build-website-footer -w → lib/shared-footer.generated.ts
 *
 * 视觉与 web-stack/packages/ui/src/shared/site-footer.tsx 对齐（同一 SSOT，同套 lucide icons）
 */

import { File as FileIcon, Github, Linkedin, Mail } from "lucide-react"
import {
  SHARED_FOOTER_BRAND,
  SHARED_FOOTER_LINKS,
  type SiteFooterLink,
} from "@/lib/shared-footer.generated"

const ICON_MAP = {
  github: Github,
  linkedin: Linkedin,
  mail: Mail,
  file: FileIcon,
} as const

function renderLink(link: SiteFooterLink, idx: number) {
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
}

export default function SiteFooter() {
  const year = new Date().getFullYear()
  const copyright = SHARED_FOOTER_BRAND.copyright.replace("{year}", String(year))
  return (
    <footer className="border-t border-[#d2d2d7]">
      <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#86868b] text-sm">{copyright}</p>
          <div className="flex items-center gap-6">
            {SHARED_FOOTER_LINKS.map(renderLink)}
          </div>
        </div>
      </div>
    </footer>
  )
}
