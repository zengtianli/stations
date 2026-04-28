import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

// 内容根目录
const contentDirectory = path.join(process.cwd(), 'content');

// 内容类型定义
export interface ContentItem<T = Record<string, any>> {
  metadata: T;
  content: string; // HTML格式的内容
  rawContent: string; // 原始Markdown内容
}

// 我的内容类型
export interface AboutIntroContent {
  title: string;
  subtitle: string;
  description: string; // 描述必须存在
  slogan: string;
  profileImage: string;
}

// 技能内容类型
export interface SkillsContent {
  title: string;
  description?: string;
  categories: SkillCategory[];
}

// 未来展望内容类型
export interface FutureContent {
  title: string;
  description?: string;
  visionPoints: {
    title: string;
    description: string;
    icon?: string;
  }[];
}

// 时间线项目类型
export interface TimelineItem {
  period: string;
  title: string;
  icon: string;
  description: string;
  skills: string[];
  honors: string[];
}

// 时间线内容类型
export interface TimelineContent {
  title: string;
  anchor?: string; // 页面锚点ID
  items: TimelineItem[];
}

// 技能类型
export interface Skill {
  name: string;
  level: number;
  projects?: string[];
}

// 技能分类类型
export interface SkillCategory {
  name: string;
  skills: Skill[];
}

// 项目内容类型
export interface ProjectContent {
  slug: string;
  title: string;
  brief?: string;        // 简要描述（兼容旧格式）
  role: string;
  image?: string;        // 兼容旧格式
  thumbnail?: string;    // 新格式的缩略图
  tags: string[];
  // 新增字段
  period?: string;       // 项目时间段
  category?: string;     // 项目类别
  highlight?: boolean;   // 是否重点项目
  featured?: boolean;    // 是否精选项目
  // 旧格式字段
  background?: string;
  contributions?: string[];
  outcomes?: string[];
}

// 项目概要内容类型
export interface ProjectIndexContent {
  title: string;
  description: string;
}

// 研究页面概要内容类型
export interface ResearchIndexContent {
  title: string;
  description: string;
}

// 软件著作权内容类型
export interface SoftwareCopyright {
  title: string;
  description: string;
  icon: string;
  pdfLink: string;
}

// 软件著作权集合类型
export interface SoftwareCopyrightsContent {
  title: string;
  items: SoftwareCopyright[];
}

// 专利内容类型
export interface Patent {
  title: string;
  inventors: string;
  description: string;
  year: string;
}

// 专利集合类型
export interface PatentsContent {
  title: string;
  items: Patent[];
}

// 论文内容类型
export interface Paper {
  title: string;
  journal: string;
  year: string;
  authors: string;
  abstract: string;
  link?: string;
}

// 论文集合类型
export interface PapersContent {
  title: string;
  items: Paper[];
}

// 奖项内容类型
export interface Award {
  title: string;
  year: string;
  organization: string;
  note?: string;
}

// 奖项集合类型
export interface AwardsContent {
  title: string;
  items: Award[];
}

// 最新动态项目类型
export interface LatestUpdate {
  title: string;
  description: string;
  image: string;
  link: string;
}

// 最新动态集合类型
export interface LatestUpdatesContent {
  title: string;
  items: LatestUpdate[];
}

/**
 * 获取指定内容的元数据和正文
 */
export async function getContent<T = Record<string, any>>(contentPath: string): Promise<ContentItem<T> | null> {
  const fullPath = path.join(contentDirectory, `${contentPath}.md`);
  
  // 检查文件是否存在
  if (!fs.existsSync(fullPath)) {
    console.warn(`内容文件未找到: ${fullPath}`);
    return null;
  }
  
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    // 将Markdown转换为HTML
    const processedContent = await remark()
      .use(remarkGfm)
      .use(html)
      .process(content);
    const contentHtml = processedContent.toString();
    
    return {
      metadata: data as T,
      content: contentHtml,
      rawContent: content,
    };
  } catch (error) {
    console.error(`读取内容文件时出错: ${fullPath}`, error);
    return null;
  }
}

/**
 * 获取目录下所有Markdown内容
 */
export async function getAllContent<T = Record<string, any>>(directory: string): Promise<ContentItem<T>[]> {
  const fullPath = path.join(contentDirectory, directory);
  
  // 检查目录是否存在
  if (!fs.existsSync(fullPath)) {
    console.warn(`目录未找到: ${fullPath}`);
    return [];
  }
  
  try {
    const fileNames = fs.readdirSync(fullPath);
    const mdFiles = fileNames.filter(file => file.endsWith('.md'));
    
    const allContent = await Promise.all(
      mdFiles.map(async (fileName) => {
        const contentPath = path.join(directory, fileName.replace(/\.md$/, ''));
        const content = await getContent<T>(contentPath);
        return content;
      })
    );
    
    return allContent.filter((item): item is ContentItem<T> => item !== null);
  } catch (error) {
    console.error(`读取目录内容时出错: ${fullPath}`, error);
    return [];
  }
}

/**
 * 获取嵌套YAML格式的内容
 * 适用于包含YAML列表的内容，如timeline
 */
export async function getNestedContent<T = Record<string, any>>(contentPath: string): Promise<T | null> {
  const fullPath = path.join(contentDirectory, `${contentPath}.md`);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`内容文件未找到: ${fullPath}`);
    return null;
  }
  
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);
    
    return data as T;
  } catch (error) {
    console.error(`读取内容文件时出错: ${fullPath}`, error);
    return null;
  }
}

/**
 * 获取项目概要信息
 * 优先从 project-source 读取，回退到旧目录
 */
export async function getProjectIndex(): Promise<ProjectIndexContent | null> {
  // 尝试新路径
  let result = await getNestedContent<ProjectIndexContent>('project-source/_index');
  if (!result) {
    // 回退到旧路径
    result = await getNestedContent<ProjectIndexContent>('projects/_index');
  }
  return result;
}

/**
 * 获取所有项目列表
 * 优先从 project-source 读取，回退到旧目录
 */
export async function getAllProjects(): Promise<ProjectContent[]> {
  try {
    // 优先使用新目录 project-source
    let contentDir = path.join(contentDirectory, 'project-source');
    let basePath = 'project-source';
    
    // 如果新目录不存在，回退到旧目录
    if (!fs.existsSync(contentDir)) {
      contentDir = path.join(contentDirectory, 'projects/items');
      basePath = 'projects/items';
    }
    
    const filenames = fs.readdirSync(contentDir);
    
    const projects = await Promise.all(
      filenames
        .filter(filename => filename.endsWith('.md') && !filename.startsWith('_') && filename !== 'README.md')
        .map(async (filename) => {
          const slug = filename.replace(/\.md$/, '');
          const result = await getContent<ProjectContent>(`${basePath}/${slug}`);
          if (!result?.metadata) return null;
          
          const meta = result.metadata;
          // 确保 slug 存在
          if (!meta.slug) {
            meta.slug = slug;
          }
          return meta;
        })
    );
    
    // 过滤掉空值，按 featured/highlight 排序
    const validProjects = projects.filter((project): project is ProjectContent => project !== null);
    
    // 排序：featured 优先，然后 highlight，其他按字母顺序
    return validProjects.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.highlight && !b.highlight) return -1;
      if (!a.highlight && b.highlight) return 1;
      return (a.title || '').localeCompare(b.title || '');
    });
  } catch (error) {
    console.error('加载项目列表出错:', error);
    return [];
  }
}

/**
 * 获取单个项目内容
 * 优先从 project-source 读取，回退到旧目录
 */
export async function getProjectBySlug(slug: string): Promise<ContentItem<ProjectContent> | null> {
  // 尝试新路径
  let result = await getContent<ProjectContent>(`project-source/${slug}`);
  if (!result) {
    // 回退到旧路径
    result = await getContent<ProjectContent>(`projects/items/${slug}`);
  }
  // 确保 slug 存在
  if (result && !result.metadata.slug) {
    result.metadata.slug = slug;
  }
  return result;
}

/**
 * 获取研究页面概要信息
 */
export async function getResearchIndex(): Promise<ResearchIndexContent | null> {
  return getNestedContent<ResearchIndexContent>('research/_index');
}

/**
 * 获取软件著作权信息
 */
export async function getSoftwareCopyrights(): Promise<SoftwareCopyrightsContent | null> {
  return getNestedContent<SoftwareCopyrightsContent>('research/software-copyrights');
}

/**
 * 获取专利信息
 */
export async function getPatents(): Promise<PatentsContent | null> {
  return getNestedContent<PatentsContent>('research/patents');
}

/**
 * 获取学术论文信息
 */
export async function getAcademicPapers(): Promise<PapersContent | null> {
  return getNestedContent<PapersContent>('research/academic-papers');
}

/**
 * 获取荣誉奖项信息
 */
export async function getAwards(): Promise<AwardsContent | null> {
  return getNestedContent<AwardsContent>('research/awards');
}

/**
 * 获取最新动态信息
 */
export async function getLatestUpdates(): Promise<LatestUpdatesContent | null> {
  return getNestedContent<LatestUpdatesContent>('home/latest-updates');
}

// ============ 博客功能 ============

import { loadExternalPosts, getExternalPostBySlug } from './content-aggregator';
import type { ContentCategory } from './content-meta';

/**
 * 博客文章内容类型
 */
export interface BlogPost {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  author?: string;
  excerpt: string; // 摘要
  tags: string[];
  image?: string;
  readingTime?: number; // 阅读时间（分钟）
  category?: ContentCategory; // 内容来源分类
}

/**
 * 博客文章详情类型
 */
export interface BlogPostDetail extends BlogPost {
  content: string; // HTML格式的内容
  rawContent: string; // 原始Markdown内容
}

export type { ContentCategory } from './content-meta';

/**
 * 计算阅读时间（基于字数，中文按300字/分钟，英文按200词/分钟）
 */
function calculateReadingTime(content: string): number {
  // 统计中文字符数
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  // 统计英文单词数
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  
  // 计算阅读时间（中文300字/分钟，英文200词/分钟）
  const chineseTime = chineseChars / 300;
  const englishTime = englishWords / 200;
  
  const totalMinutes = Math.ceil(chineseTime + englishTime);
  return Math.max(1, totalMinutes); // 至少1分钟
}

/**
 * 加载本地 content/blog/ 下的 MDX 文章（原 9 篇）
 */
async function loadLocalBlogPosts(): Promise<BlogPost[]> {
  try {
    const blogDir = path.join(contentDirectory, 'blog');
    if (!fs.existsSync(blogDir)) {
      console.warn('博客目录不存在，返回空数组');
      return [];
    }
    const filenames = fs.readdirSync(blogDir);
    return filenames
      .filter(filename => filename.endsWith('.md'))
      .map((filename) => {
        const slug = filename.replace(/\.md$/, '');
        const fullPath = path.join(blogDir, filename);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);
        return {
          slug,
          title: data.title || slug,
          date: data.date || new Date().toISOString().split('T')[0],
          author: data.author,
          excerpt: data.excerpt || content.slice(0, 150).replace(/\n/g, ' ') + '...',
          tags: data.tags || [],
          image: data.image,
          readingTime: calculateReadingTime(content),
          category: 'local' as const,
        } as BlogPost;
      });
  } catch (error) {
    console.error('加载本地博客文章列表出错:', error);
    return [];
  }
}

/**
 * 获取所有博客文章列表（本地 + 跨仓聚合）
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const local = await loadLocalBlogPosts();
  const external = loadExternalPosts().map(p => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    author: p.author,
    excerpt: p.excerpt,
    tags: p.tags,
    image: p.image,
    readingTime: p.readingTime,
    category: p.category,
  } as BlogPost));
  return [...local, ...external].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * 根据 slug 获取单篇博客文章（先查本地，再查跨仓 cache）
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  // 1. 本地 content/blog/<slug>.md
  try {
    const fullPath = path.join(contentDirectory, 'blog', `${slug}.md`);
    if (fs.existsSync(fullPath)) {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      const processedContent = await remark().use(html).process(content);
      return {
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString().split('T')[0],
        author: data.author,
        excerpt: data.excerpt || content.slice(0, 150).replace(/\n/g, ' ') + '...',
        tags: data.tags || [],
        image: data.image,
        readingTime: calculateReadingTime(content),
        category: 'local',
        content: processedContent.toString(),
        rawContent: content,
      };
    }
  } catch (error) {
    console.error(`读取本地博客文章出错: ${slug}`, error);
  }

  // 2. 跨仓 cache
  const external = getExternalPostBySlug(slug);
  if (external) {
    return {
      slug: external.slug,
      title: external.title,
      date: external.date,
      author: external.author,
      excerpt: external.excerpt,
      tags: external.tags,
      image: external.image,
      readingTime: external.readingTime,
      category: external.category,
      content: '',
      rawContent: external.rawContent,
    };
  }

  console.warn(`博客文章未找到: ${slug}`);
  return null;
}

/**
 * 获取所有博客标签
 */
export async function getAllBlogTags(): Promise<string[]> {
  const posts = await getAllBlogPosts();
  const tagsSet = new Set<string>();
  
  posts.forEach(post => {
    post.tags.forEach(tag => tagsSet.add(tag));
  });
  
  return Array.from(tagsSet).sort();
}

/**
 * 根据标签获取博客文章
 */
export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => post.tags.includes(tag));
}

// ============ Track-aware 查询 ============

import { type Track, TRACK_BLOG_TAGS } from './track';

/**
 * 获取指定 track 的项目列表
 * 项目 frontmatter 中的 tracks 字段控制可见性和覆盖
 */
export async function getAllProjectsForTrack(track: Track): Promise<ProjectContent[]> {
  const all = await getAllProjects();
  return all
    .map(p => {
      const trackData = (p as any).tracks;
      if (!trackData) return p; // 无 tracks 字段 → 所有方向都显示
      const overrides = trackData[track];
      if (!overrides) return null; // 有 tracks 但不包含当前 track → 不显示
      return { ...p, ...overrides };
    })
    .filter((p): p is ProjectContent => p !== null)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.highlight && !b.highlight) return -1;
      if (!a.highlight && b.highlight) return 1;
      return (a.title || '').localeCompare(b.title || '');
    });
}

/**
 * 获取指定 track 的博客列表
 * 按 TRACK_BLOG_TAGS 过滤，无匹配 tag 的文章在所有 track 都显示
 */
export async function getBlogPostsForTrack(track: Track): Promise<BlogPost[]> {
  const all = await getAllBlogPosts();
  const trackTags = TRACK_BLOG_TAGS[track];
  if (!trackTags?.length) return all;

  const allTrackTags = Object.values(TRACK_BLOG_TAGS).flat();
  return all.filter(post =>
    post.tags.some(t => trackTags.includes(t)) ||
    !post.tags.some(t => allTrackTags.includes(t))
  );
}
