/**
 * 简历整体布局组件
 * 提供专业的简历排版，支持打印友好样式
 */

'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResumeLayoutProps {
  children: ReactNode
  className?: string
  printFriendly?: boolean
}

export default function ResumeLayout({ children, className, printFriendly = true }: ResumeLayoutProps) {
  return (
    <div
      className={cn(
        "max-w-[210mm] mx-auto bg-white text-gray-900 p-8 md:p-12",
        printFriendly && "print:p-8 print:shadow-none",
        className
      )}
    >
      {children}
      
      {/* 打印样式 */}
      {printFriendly && (
        <style jsx global>{`
          @media print {
            body {
              background: white;
            }
            @page {
              size: A4;
              margin: 0;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
            }
            a {
              text-decoration: none;
              color: inherit;
            }
          }
        `}</style>
      )}
    </div>
  )
}

/**
 * 简历节标题组件
 */
interface ResumeSectionProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function ResumeSection({ title, icon, children, className }: ResumeSectionProps) {
  return (
    <section className={cn("mb-8 print:mb-6", className)}>
      <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-gray-800">
        {icon && <span className="text-xl print:text-lg">{icon}</span>}
        <h2 className="text-2xl print:text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

/**
 * 简历子标题组件
 */
interface ResumeSubsectionProps {
  title: string
  subtitle?: string
  period?: string
  location?: string
  children?: ReactNode
  className?: string
}

export function ResumeSubsection({ 
  title, 
  subtitle, 
  period, 
  location, 
  children, 
  className 
}: ResumeSubsectionProps) {
  return (
    <div className={cn("mb-6 print:mb-4 last:mb-0", className)}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg print:text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm print:text-xs text-gray-700 mt-1">{subtitle}</p>
          )}
        </div>
        {period && (
          <span className="text-sm print:text-xs text-gray-600 ml-4 whitespace-nowrap">
            {period}
          </span>
        )}
      </div>
      {location && (
        <p className="text-sm print:text-xs text-gray-600 mb-2">📍 {location}</p>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

