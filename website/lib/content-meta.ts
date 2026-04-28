/**
 * 客户端安全的 content 元数据 — 类型与常量
 * 不引入 fs/child_process，可被 'use client' 组件 import
 */

export type ContentCategory = 'local' | 'essays' | 'learn' | 'analysis' | 'investment'

export const CATEGORY_META: Record<ContentCategory, { label: string; color: string }> = {
  local:      { label: '技术',     color: 'bg-blue-100 text-blue-700' },
  essays:     { label: '论文',     color: 'bg-purple-100 text-purple-700' },
  learn:      { label: '学习笔记', color: 'bg-green-100 text-green-700' },
  analysis:   { label: '框架分析', color: 'bg-orange-100 text-orange-700' },
  investment: { label: '投资',     color: 'bg-red-100 text-red-700' },
}
