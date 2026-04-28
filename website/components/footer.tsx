/**
 * 页脚组件 - Apple 风格极简
 *
 * 数据源：~/Dev/tools/configs/menus/footer.yaml （SSOT）
 *   → menus.py build-website-footer -w → lib/shared-footer.generated.ts
 *
 * 主站独有项（简历下载）保留为本地常量，公共社交链接读 SHARED_FOOTER_LINKS。
 */

import Link from "next/link"
import { FileDown, Github, Linkedin, Mail, File as FileIcon } from "lucide-react"
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

function renderLink(link: SiteFooterLink, key: string) {
  const Icon = link.icon ? ICON_MAP[link.icon] : null
  const cls = "text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors duration-200 flex items-center gap-1.5"
  if (link.external) {
    return (
      <a key={key} href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span>{link.label}</span>
      </a>
    )
  }
  return (
    <Link key={key} href={link.href} className={cls}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span>{link.label}</span>
    </Link>
  )
}

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const copyright = SHARED_FOOTER_BRAND.copyright.replace("{year}", String(currentYear))

  return (
    <footer className="border-t border-[#d2d2d7]">
      <div className="container mx-auto px-6 md:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#86868b] text-sm">{copyright}</p>

          <div className="flex items-center gap-6">
            {SHARED_FOOTER_LINKS.map((link, idx) => renderLink(link, `shared-${idx}`))}
            {/* 主站独有：简历下载 */}
            <a
              href="/zengtianli-cv.pdf"
              download="曾田力-简历.pdf"
              className="text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors duration-200 flex items-center gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5" />
              简历
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
