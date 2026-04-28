/**
 * 跨仓 blog 聚合器
 *
 * 在 Next.js build 时（SSG）从 ~/Dev/content/{essays,learn,analysis-hermes-vs-mine,investment/docs}
 * 递归读取 MD 文件，应用「merged.md 优先 + 黑名单 + 自动 tag」策略，输出统一的 BlogPost[]。
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import matter from 'gray-matter'
import yaml from 'js-yaml'
import { execSync } from 'child_process'

import { type ContentCategory, CATEGORY_META } from './content-meta'
export { type ContentCategory, CATEGORY_META } from './content-meta'

// BlogPost / BlogPostDetail 在 content.ts 定义；为避免循环引用，本模块内联最小子集类型
export interface AggregatedPost {
  slug: string
  title: string
  date: string
  author?: string
  excerpt: string
  tags: string[]
  image?: string
  readingTime?: number
  category: ContentCategory
  rawContent: string
}

// ============ 配置 ============

const HOME = process.env.HOME || os.homedir()

interface ExternalSource {
  root: string
  category: ContentCategory
  label: string
}

const EXTERNAL_SOURCES: ExternalSource[] = [
  { root: path.join(HOME, 'Dev/content/essays'),                  category: 'essays',     label: '论文 / 深度文章' },
  { root: path.join(HOME, 'Dev/content/learn'),                   category: 'learn',      label: '学习笔记' },
  { root: path.join(HOME, 'Dev/content/analysis-hermes-vs-mine'), category: 'analysis',   label: '框架分析' },
  { root: path.join(HOME, 'Dev/content/investment/docs'),         category: 'investment', label: '投资笔记' },
]

const BLACKLIST_FILE = path.join(process.cwd(), 'content/.blog-blacklist.yaml')

// 路径关键词 → 自动标签
const PATH_TAG_RULES: Record<string, string[]> = {
  'claude-code':  ['AI', 'LLM', 'Claude'],
  'claude':       ['AI', 'Claude'],
  'mcp':          ['AI', 'MCP'],
  'agent':        ['AI', 'Agent'],
  'ai/':          ['AI'],
  'hsbc':         ['投资', '香港银行'],
  'carry-trade':  ['投资', 'Carry Trade'],
  'ibkr':         ['投资', 'IBKR'],
  'lombard':      ['投资', '银行融资'],
  'forex':        ['投资', '换汇'],
  'fceli':        ['投资', '期权'],
  'dci':          ['投资', '期权'],
  'boxx':         ['投资', 'ETF'],
  'investment':   ['投资'],
  'art/':         ['艺术', 'AI'],
  'hydraulic':    ['水利工程'],
  'theory':       ['理论'],
  'writing':      ['写作'],
  'analysis':     ['框架分析'],
  'hermes':       ['框架分析'],
}

// 章节型文件名识别
const CHAPTER_PATTERN = /^(\d{2}|\d{1,2}|Layer\d+)[-_]/

// 默认跳过的文件名（meta 文档）
const SKIP_FILENAMES = new Set(['CLAUDE.md', 'README.md', 'README_CN.md', 'LICENSE.md'])

// ============ 工具函数 ============

let cachedBlacklist: string[] | null = null

function loadBlacklist(): string[] {
  if (cachedBlacklist !== null) return cachedBlacklist
  try {
    if (!fs.existsSync(BLACKLIST_FILE)) {
      cachedBlacklist = []
      return cachedBlacklist
    }
    const raw = fs.readFileSync(BLACKLIST_FILE, 'utf-8')
    const parsed = yaml.load(raw)
    cachedBlacklist = Array.isArray(parsed) ? parsed.map(String) : []
  } catch (e) {
    console.warn('[aggregator] blacklist 解析失败', e)
    cachedBlacklist = []
  }
  return cachedBlacklist
}

function isBlacklisted(filePath: string): boolean {
  const list = loadBlacklist()
  return list.some(pattern => filePath.includes(pattern))
}

function inferTags(filePath: string): string[] {
  const lower = filePath.toLowerCase()
  const tags = new Set<string>()
  for (const [k, v] of Object.entries(PATH_TAG_RULES)) {
    if (lower.includes(k)) v.forEach(t => tags.add(t))
  }
  return Array.from(tags)
}

function gitDate(filePath: string): string {
  try {
    const out = execSync(
      `git log -1 --format=%ad --date=short -- "${path.basename(filePath)}"`,
      { cwd: path.dirname(filePath), encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim()
    if (out) return out
  } catch {}
  try {
    return new Date(fs.statSync(filePath).mtimeMs).toISOString().slice(0, 10)
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

function extractH1(body: string): string | null {
  for (const line of body.split('\n')) {
    const t = line.trim()
    if (t.startsWith('# ')) return t.slice(2).trim()
  }
  return null
}

function calculateReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length
  return Math.max(1, Math.ceil(chineseChars / 300 + englishWords / 200))
}

function makeExcerpt(body: string, fallback: string = ''): string {
  const cleaned = body
    .replace(/^#+\s+.*$/gm, '')         // 标题
    .replace(/^>\s+.*$/gm, '')          // 引用
    .replace(/^\s*[-*]\s+/gm, '')        // 列表标记
    .replace(/^---[\s\S]*?---\s*/, '')   // frontmatter（应该已剥离，保险）
    .replace(/```[\s\S]*?```/g, '')      // 代码块
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // 图片
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接保留文字
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return fallback
  return cleaned.slice(0, 150) + (cleaned.length > 150 ? '...' : '')
}

function rewriteImagePaths(body: string, _category: ContentCategory, _slug: string, _sourceFile: string): string {
  // Phase 4.5 图片 pipeline 在 scripts/copy-content-assets.ts 实现，
  // 这里负责把 MD 里相对图片路径改写成 /blog-assets/<category>/<slug>/<filename>
  return body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, src) => {
    if (/^(https?:|\/|data:)/i.test(src)) return m
    const filename = path.basename(src)
    return `![${alt}](/blog-assets/${_category}/${_slug}/${filename})`
  })
}

// ============ 章节聚合 ============

function findMergedAncestors(roots: string[]): Set<string> {
  // 找出所有含 merged.md 的目录，记录这些目录路径（绝对）
  const has = new Set<string>()
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    if (entries.some(e => e.isFile() && e.name === 'merged.md')) {
      has.add(dir)
    }
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.')) walk(path.join(dir, e.name))
    }
  }
  roots.forEach(walk)
  return has
}

function isUnderMergedDir(filePath: string, mergedDirs: Set<string>): boolean {
  // 文件本身是 merged.md 不算 under
  if (path.basename(filePath) === 'merged.md') return false
  for (const d of mergedDirs) {
    const rel = path.relative(d, filePath)
    if (!rel.startsWith('..') && !path.isAbsolute(rel)) return true
  }
  return false
}

// ============ 主聚合逻辑 ============

interface RawPost {
  category: ContentCategory
  source: ExternalSource
  filePath: string
  slug: string
  meta: Record<string, any>
  body: string
}

function makeSlug(source: ExternalSource, filePath: string): string {
  const rel = path.relative(source.root, filePath).replace(/\.md$/, '')
  // 把路径里的中文/特殊字符保留，slash 换 dash
  return `${source.category}-${rel.replace(/\//g, '-').replace(/\s+/g, '-')}`
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = []
  if (!fs.existsSync(dir)) return out
  function walk(d: string) {
    const entries = fs.readdirSync(d, { withFileTypes: true })
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name.startsWith('_')) continue
      const full = path.join(d, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.isFile() && e.name.endsWith('.md')) out.push(full)
    }
  }
  walk(dir)
  return out
}

function loadRawPosts(): RawPost[] {
  const mergedDirs = findMergedAncestors(EXTERNAL_SOURCES.map(s => s.root))
  const raws: RawPost[] = []

  for (const source of EXTERNAL_SOURCES) {
    const files = walkMarkdown(source.root)
    for (const filePath of files) {
      const basename = path.basename(filePath)
      if (SKIP_FILENAMES.has(basename)) continue
      if (isBlacklisted(filePath)) continue
      if (isUnderMergedDir(filePath, mergedDirs)) continue

      let raw: string
      try {
        raw = fs.readFileSync(filePath, 'utf-8')
      } catch {
        continue
      }
      const { data: meta, content: body } = matter(raw)

      // 显式排除
      if (meta?.public === false || meta?.draft === true) continue

      raws.push({
        category: source.category,
        source,
        filePath,
        slug: makeSlug(source, filePath),
        meta,
        body,
      })
    }
  }
  return raws
}

function rawToBlogPost(raw: RawPost): AggregatedPost {
  const { meta, body, filePath, slug, category } = raw

  const title = meta.title || extractH1(body) || path.basename(filePath, '.md')
  const date = meta.date ? String(meta.date).slice(0, 10) : gitDate(filePath)
  const tags = Array.isArray(meta.tags) && meta.tags.length > 0
    ? meta.tags.map(String)
    : inferTags(filePath)
  const excerpt = meta.excerpt || meta.abstract || makeExcerpt(body, title)

  // 图片路径改写
  const rewrittenBody = rewriteImagePaths(body, category, slug, filePath)

  return {
    slug,
    title: String(title),
    date,
    author: meta.author,
    excerpt,
    tags,
    image: meta.image,
    readingTime: calculateReadingTime(rewrittenBody),
    category,
    rawContent: rewrittenBody,
  }
}

// ============ 公开 API ============

let _cache: AggregatedPost[] | null = null

export function loadExternalPosts(): AggregatedPost[] {
  if (_cache) return _cache
  const raws = loadRawPosts()
  _cache = raws.map(rawToBlogPost).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return _cache
}

export function getExternalPostBySlug(slug: string): AggregatedPost | null {
  return loadExternalPosts().find(p => p.slug === slug) || null
}

export function listExternalSources(): ExternalSource[] {
  return EXTERNAL_SOURCES
}

