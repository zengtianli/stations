/**
 * 页脚组件 - Apple 风格极简
 */

import Link from "next/link"
import { FileDown, Github, Linkedin, Mail } from "lucide-react"
import { footerConfig } from "@/lib/profile-config"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[#d2d2d7]">
      <div className="container mx-auto px-6 md:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#86868b] text-sm">
            © {currentYear} {footerConfig.copyright.name}
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="/contact"
              className="text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors duration-200 flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" />
              联系
            </Link>
            <a
              href="/zengtianli-cv.pdf"
              download="曾田力-简历.pdf"
              className="text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors duration-200 flex items-center gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5" />
              简历
            </a>
            {footerConfig.links.filter(l => l.external).map((link, index) => {
              const Icon = link.icon === "Linkedin" ? Linkedin : Github
              return (
                <Link
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#86868b] hover:text-[#1d1d1f] transition-colors duration-200"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
