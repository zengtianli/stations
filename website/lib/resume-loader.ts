/**
 * 简历内容加载器
 * 从 content/resume-source/ 读取总部同步的 Markdown 文件
 * 
 * 设计原则：简单直接，一个文件搞定所有读取
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// 简历源目录（软链接到总部）
const RESUME_SOURCE_DIR = path.join(process.cwd(), 'content/resume-source')

// ============ 类型定义 ============

/** 项目模块（有 frontmatter） */
export interface ProjectModule {
  id: string
  category: string  // 数字孪生, 水资源规划 等
  title: string
  period: string
  role: string
  keywords: string[]
  workload?: string
  highlight: boolean
  content: string           // 完整 Markdown 内容
  technicalDesc?: string    // 技术向描述
  solutionDesc?: string     // 方案向描述
}

/** 学术成果（有 frontmatter） */
export interface Publication {
  id: string
  type: 'paper' | 'patent' | 'software'
  title: string
  year: number | string
  journal?: string
  authorOrder?: string
  status?: string
  content: string
}

/** 技能模块（纯 Markdown） */
export interface SkillModule {
  id: string
  name: string  // 水利专业, 数据科学 等
  content: string
}

/** 简历版本（已渲染的 Markdown） */
export interface ResumeVersion {
  id: string
  name: string  // 综合版, 售前方案版 等
  content: string
}

/** 完整简历数据 */
export interface ResumeData {
  personal: string        // 个人信息 Markdown
  education: string       // 教育经历 Markdown
  projects: ProjectModule[]
  skills: SkillModule[]
  publications: Publication[]
  honors: string          // 荣誉汇总 Markdown
  research: string[]      // 科研经历 Markdown 列表
}

// ============ 工具函数 ============

/** 检查目录是否存在 */
function dirExists(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()
  } catch {
    return false
  }
}

/** 检查文件是否存在 */
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

/** 读取 Markdown 文件（带 frontmatter） */
function readMarkdownWithFrontmatter(filePath: string): { data: Record<string, any>; content: string } | null {
  if (!fileExists(filePath)) {
    console.warn(`文件不存在: ${filePath}`)
    return null
  }
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)
    return { data, content }
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error)
    return null
  }
}

/** 读取纯 Markdown 文件 */
function readMarkdown(filePath: string): string | null {
  if (!fileExists(filePath)) {
    console.warn(`文件不存在: ${filePath}`)
    return null
  }
  
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error)
    return null
  }
}

/** 递归获取目录下所有 .md 文件 */
function getAllMarkdownFiles(dirPath: string): string[] {
  if (!dirExists(dirPath)) {
    return []
  }
  
  const files: string[] = []
  
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('README')) {
        files.push(fullPath)
      }
    }
  }
  
  walk(dirPath)
  return files
}

/** 从文件路径提取 ID（不含扩展名） */
function extractId(filePath: string, baseDir: string): string {
  const relativePath = path.relative(baseDir, filePath)
  return relativePath.replace(/\.md$/, '').replace(/\//g, '-')
}

/** 从 Markdown 内容中提取特定 section */
function extractSection(content: string, sectionName: string): string | undefined {
  const regex = new RegExp(`## ${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n---\\s*\\n|$)`, 'i')
  const match = content.match(regex)
  return match ? match[1].trim() : undefined
}

// ============ 主要加载函数 ============

/**
 * 加载所有项目模块
 */
export async function loadProjects(): Promise<ProjectModule[]> {
  const projectsDir = path.join(RESUME_SOURCE_DIR, '_项目模块')
  const files = getAllMarkdownFiles(projectsDir)
  
  const projects: ProjectModule[] = []
  
  for (const filePath of files) {
    const result = readMarkdownWithFrontmatter(filePath)
    if (!result) continue
    
    const { data, content } = result
    const relativePath = path.relative(projectsDir, filePath)
    const category = path.dirname(relativePath)
    
    projects.push({
      id: extractId(filePath, projectsDir),
      category: category === '.' ? '其他' : category,
      title: data.title || path.basename(filePath, '.md'),
      period: data.period || '',
      role: data.role || '',
      keywords: data.keywords || [],
      workload: data.workload,
      highlight: data.highlight || false,
      content,
      technicalDesc: extractSection(content, '技术向描述'),
      solutionDesc: extractSection(content, '方案向描述'),
    })
  }
  
  // 按 highlight 和 period 排序（重点项目优先，最新项目优先）
  return projects.sort((a, b) => {
    if (a.highlight !== b.highlight) return b.highlight ? 1 : -1
    return b.period.localeCompare(a.period)
  })
}

/**
 * 加载所有学术成果
 */
export async function loadPublications(): Promise<Publication[]> {
  const publicationsDir = path.join(RESUME_SOURCE_DIR, '_学术成果')
  const publications: Publication[] = []
  
  // 论文
  const papersDir = path.join(publicationsDir, '论文')
  for (const filePath of getAllMarkdownFiles(papersDir)) {
    const result = readMarkdownWithFrontmatter(filePath)
    if (!result) continue
    
    publications.push({
      id: extractId(filePath, publicationsDir),
      type: 'paper',
      title: result.data.title || path.basename(filePath, '.md'),
      year: result.data.year || '',
      journal: result.data.journal,
      authorOrder: result.data.author_order,
      status: result.data.status,
      content: result.content,
    })
  }
  
  // 专利
  const patentsDir = path.join(publicationsDir, '专利')
  for (const filePath of getAllMarkdownFiles(patentsDir)) {
    const result = readMarkdownWithFrontmatter(filePath)
    if (!result) continue
    
    publications.push({
      id: extractId(filePath, publicationsDir),
      type: 'patent',
      title: result.data.title || path.basename(filePath, '.md'),
      year: result.data.year || '',
      status: result.data.status,
      content: result.content,
    })
  }
  
  // 软著
  const softwareDir = path.join(publicationsDir, '软著')
  for (const filePath of getAllMarkdownFiles(softwareDir)) {
    const result = readMarkdownWithFrontmatter(filePath)
    if (!result) continue
    
    publications.push({
      id: extractId(filePath, publicationsDir),
      type: 'software',
      title: result.data.title || path.basename(filePath, '.md'),
      year: result.data.year || '',
      status: result.data.status,
      content: result.content,
    })
  }
  
  // 按年份排序（最新优先）
  return publications.sort((a, b) => {
    const yearA = typeof a.year === 'number' ? a.year : parseInt(a.year) || 0
    const yearB = typeof b.year === 'number' ? b.year : parseInt(b.year) || 0
    return yearB - yearA
  })
}

/**
 * 加载所有技能模块
 */
export async function loadSkills(): Promise<SkillModule[]> {
  const skillsDir = path.join(RESUME_SOURCE_DIR, '_技能模块')
  const files = getAllMarkdownFiles(skillsDir)
  
  return files.map(filePath => {
    const content = readMarkdown(filePath) || ''
    const fileName = path.basename(filePath, '.md')
    
    return {
      id: fileName,
      name: fileName,
      content,
    }
  })
}

/**
 * 加载个人信息
 */
export async function loadPersonalInfo(): Promise<string> {
  const filePath = path.join(RESUME_SOURCE_DIR, '_基础信息/个人信息.md')
  return readMarkdown(filePath) || ''
}

/**
 * 加载教育经历
 */
export async function loadEducation(): Promise<string> {
  const filePath = path.join(RESUME_SOURCE_DIR, '_基础信息/教育经历.md')
  return readMarkdown(filePath) || ''
}

/**
 * 加载荣誉奖项
 */
export async function loadHonors(): Promise<string> {
  const filePath = path.join(RESUME_SOURCE_DIR, '_荣誉奖项/荣誉汇总.md')
  return readMarkdown(filePath) || ''
}

/**
 * 加载科研经历
 */
export async function loadResearch(): Promise<string[]> {
  const researchDir = path.join(RESUME_SOURCE_DIR, '_科研经历')
  const files = getAllMarkdownFiles(researchDir)
  
  return files.map(filePath => readMarkdown(filePath) || '').filter(Boolean)
}

/**
 * 加载简历版本配置
 */
export async function loadResumeVersions(): Promise<ResumeVersion[]> {
  const versionsDir = path.join(RESUME_SOURCE_DIR, '_生成简历')
  const files = getAllMarkdownFiles(versionsDir)
  
  return files.map(filePath => {
    const content = readMarkdown(filePath) || ''
    const fileName = path.basename(filePath, '.md')
    
    return {
      id: fileName,
      name: fileName,
      content,
    }
  })
}

/**
 * 加载指定版本的简历内容
 */
export async function loadResumeVersion(versionId: string): Promise<ResumeVersion | null> {
  const filePath = path.join(RESUME_SOURCE_DIR, '_生成简历', `${versionId}.md`)
  const content = readMarkdown(filePath)
  
  if (!content) return null
  
  return {
    id: versionId,
    name: versionId,
    content,
  }
}

/**
 * 一次性加载所有简历数据（便捷方法）
 */
export async function loadAllResumeData(): Promise<ResumeData> {
  const [personal, education, projects, skills, publications, honors, research] = await Promise.all([
    loadPersonalInfo(),
    loadEducation(),
    loadProjects(),
    loadSkills(),
    loadPublications(),
    loadHonors(),
    loadResearch(),
  ])
  
  return {
    personal,
    education,
    projects,
    skills,
    publications,
    honors,
    research,
  }
}

/**
 * 获取重点项目（highlight: true）
 */
export async function loadHighlightProjects(): Promise<ProjectModule[]> {
  const projects = await loadProjects()
  return projects.filter(p => p.highlight)
}

/**
 * 按分类获取项目
 */
export async function loadProjectsByCategory(category: string): Promise<ProjectModule[]> {
  const projects = await loadProjects()
  return projects.filter(p => p.category === category)
}

/**
 * 获取所有项目分类
 */
export async function getProjectCategories(): Promise<string[]> {
  const projects = await loadProjects()
  const categories = new Set(projects.map(p => p.category))
  return Array.from(categories)
}

// ============ 调试/开发用 ============

/**
 * 检查简历源目录是否存在
 */
export function checkResumeSourceExists(): boolean {
  return dirExists(RESUME_SOURCE_DIR)
}

/**
 * 获取简历源目录路径
 */
export function getResumeSourcePath(): string {
  return RESUME_SOURCE_DIR
}

