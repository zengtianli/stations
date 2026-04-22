/**
 * 简历构建器
 * 提供灵活的内容选择和组合功能
 * 支持多种预设模板和自定义组合
 */

import {
  type PersonalInfo,
  type Education,
  type WorkExperience,
  type ResearchOutput,
  type Honor,
  type SportsAchievement,
  type SkillSystem,
  resumeData
} from './resume-data'

// ============ 模块类型定义 ============

export type ResumeModule =
  | 'personalInfo'
  | 'education'              // 教育背景（简化）
  | 'educationDetailed'      // 教育背景（详细-含课程）
  | 'workExperience'         // 工作经历
  | 'researchExperience'     // 科研经历（从教育中提取）
  | 'publications'           // 学术论文
  | 'patents'                // 专利
  | 'softwareCopyrights'     // 软件著作权
  | 'honors'                 // 荣誉奖项（简化）
  | 'honorsDetailed'         // 荣誉奖项（详细-分类）
  | 'skills'                 // 技能（简化）
  | 'skillsDetailed'         // 技能（详细-含年限）
  | 'sportsAchievements'     // 体育成就
  | 'languages'              // 语言能力
  | 'certifications'         // 证书

export type ResumeTemplateId = 'comprehensive' | 'work' | 'academic' | 'sports' | 'custom'

export interface ResumeTemplate {
  id: ResumeTemplateId
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  modules: ResumeModule[]
  order: ResumeModule[]
}

// ============ 简历内容结构 ============

export interface ResumeContent {
  metadata: {
    templateId: ResumeTemplateId
    templateName: { zh: string; en: string }
    generatedAt: string
    version: string
  }
  sections: {
    [K in ResumeModule]?: any
  }
}

// ============ 预设模板定义 ============

export const RESUME_TEMPLATES: Record<ResumeTemplateId, ResumeTemplate> = {
  comprehensive: {
    id: 'comprehensive',
    name: { zh: '综合简历', en: 'Comprehensive Resume' },
    description: {
      zh: '全面展示个人能力、经历和成就，适合综合性展示',
      en: 'Comprehensive display of personal capabilities, experiences and achievements'
    },
    modules: [
      'personalInfo',
      'education',
      'workExperience',
      'publications',
      'patents',
      'softwareCopyrights',
      'honors',
      'skillsDetailed',
      'sportsAchievements',
      'languages'
    ],
    order: [
      'personalInfo',
      'education',
      'workExperience',
      'publications',
      'patents',
      'softwareCopyrights',
      'skillsDetailed',
      'honors',
      'sportsAchievements',
      'languages'
    ]
  },

  work: {
    id: 'work',
    name: { zh: '工作简历', en: 'Work Resume' },
    description: {
      zh: '侧重工作经历和项目经验，适合求职和职业发展',
      en: 'Focus on work experience and projects, ideal for job applications'
    },
    modules: [
      'personalInfo',
      'education',
      'workExperience',
      'skillsDetailed',
      'softwareCopyrights',
      'publications',
      'languages'
    ],
    order: [
      'personalInfo',
      'workExperience',
      'skillsDetailed',
      'education',
      'softwareCopyrights',
      'publications',
      'languages'
    ]
  },

  academic: {
    id: 'academic',
    name: { zh: '学术简历', en: 'Academic CV' },
    description: {
      zh: '侧重教育背景和学术成果，适合申请博士后、学术职位',
      en: 'Focus on education and academic achievements, ideal for postdoc/academic positions'
    },
    modules: [
      'personalInfo',
      'educationDetailed',
      'researchExperience',
      'publications',
      'patents',
      'softwareCopyrights',
      'honorsDetailed',
      'skillsDetailed',
      'languages'
    ],
    order: [
      'personalInfo',
      'educationDetailed',
      'publications',
      'researchExperience',
      'patents',
      'softwareCopyrights',
      'honorsDetailed',
      'skillsDetailed',
      'languages'
    ]
  },

  sports: {
    id: 'sports',
    name: { zh: '体育简历', en: 'Sports Resume' },
    description: {
      zh: '突出体育成就和综合素质，适合特殊场合展示',
      en: 'Highlight sports achievements and comprehensive qualities'
    },
    modules: [
      'personalInfo',
      'sportsAchievements',
      'education',
      'workExperience',
      'skills',
      'honors'
    ],
    order: [
      'personalInfo',
      'sportsAchievements',
      'education',
      'workExperience',
      'skills',
      'honors'
    ]
  },

  custom: {
    id: 'custom',
    name: { zh: '自定义简历', en: 'Custom Resume' },
    description: {
      zh: '根据需求自定义模块组合',
      en: 'Custom module combination based on requirements'
    },
    modules: [],
    order: []
  }
}

// ============ 模块提取函数 ============

/**
 * 提取个人信息
 */
function extractPersonalInfo(): PersonalInfo {
  return resumeData.personalInfo
}

/**
 * 提取教育背景（简化版）
 */
function extractEducation(): Education[] {
  return resumeData.educationHistory.map(edu => ({
    ...edu,
    courses: undefined, // 简化版不包含课程
  }))
}

/**
 * 提取教育背景（详细版-含课程）
 */
function extractEducationDetailed(): Education[] {
  return resumeData.educationHistory
}

/**
 * 提取科研经历（从教育经历中提取）
 */
function extractResearchExperience() {
  return resumeData.educationHistory
    .filter(edu => edu.researchFocus && edu.researchFocus.length > 0)
    .map(edu => ({
      id: edu.id,
      institution: edu.institution,
      period: edu.period,
      supervisor: edu.supervisor,
      researchFocus: edu.researchFocus,
      achievements: edu.achievements,
      description: edu.description
    }))
}

/**
 * 提取工作经历
 */
function extractWorkExperience(): WorkExperience[] {
  return resumeData.workExperience
}

/**
 * 提取学术论文
 */
function extractPublications() {
  return resumeData.researchOutput.papers
}

/**
 * 提取专利
 */
function extractPatents() {
  return resumeData.researchOutput.patents
}

/**
 * 提取软件著作权
 */
function extractSoftwareCopyrights() {
  return resumeData.researchOutput.softwareCopyrights
}

/**
 * 提取荣誉奖项（简化版）
 */
function extractHonors(): Honor[] {
  return resumeData.honors
}

/**
 * 提取荣誉奖项（详细版-分类）
 */
function extractHonorsDetailed() {
  const categories = {
    scholarship: [] as Honor[],
    academic: [] as Honor[],
    competition: [] as Honor[],
    honor_title: [] as Honor[],
    sports: [] as Honor[]
  }

  resumeData.honors.forEach(honor => {
    categories[honor.category].push(honor)
  })

  return {
    categories: [
      { name: { zh: '学术奖励与奖学金', en: 'Academic Awards & Scholarships' }, items: [...categories.scholarship, ...categories.academic] },
      { name: { zh: '竞赛获奖', en: 'Competition Awards' }, items: categories.competition },
      { name: { zh: '荣誉称号', en: 'Honor Titles' }, items: categories.honor_title },
      { name: { zh: '体育成就', en: 'Sports Achievements' }, items: categories.sports }
    ].filter(cat => cat.items.length > 0)
  }
}

/**
 * 提取技能（简化版）
 */
function extractSkills() {
  return {
    professional: resumeData.skillSystem.professional.map(category => ({
      name: category.name,
      skills: category.skills.map(skill => ({
        name: skill.name,
        proficiency: skill.proficiency
      }))
    })),
    technical: resumeData.skillSystem.technical.map(category => ({
      name: category.name,
      skills: category.skills.map(skill => ({
        name: skill.name,
        proficiency: skill.proficiency
      }))
    }))
  }
}

/**
 * 提取技能（详细版）
 */
function extractSkillsDetailed(): SkillSystem {
  return resumeData.skillSystem
}

/**
 * 提取体育成就
 */
function extractSportsAchievements(): SportsAchievement[] {
  return resumeData.sportsAchievements
}

/**
 * 提取语言能力
 */
function extractLanguages() {
  return resumeData.skillSystem.languages
}

/**
 * 提取证书
 */
function extractCertifications() {
  return resumeData.skillSystem.certifications
}

// ============ 模块提取器映射 ============

const moduleExtractors: Record<ResumeModule, () => any> = {
  personalInfo: extractPersonalInfo,
  education: extractEducation,
  educationDetailed: extractEducationDetailed,
  workExperience: extractWorkExperience,
  researchExperience: extractResearchExperience,
  publications: extractPublications,
  patents: extractPatents,
  softwareCopyrights: extractSoftwareCopyrights,
  honors: extractHonors,
  honorsDetailed: extractHonorsDetailed,
  skills: extractSkills,
  skillsDetailed: extractSkillsDetailed,
  sportsAchievements: extractSportsAchievements,
  languages: extractLanguages,
  certifications: extractCertifications
}

// ============ 构建器核心函数 ============

/**
 * 根据模板构建简历
 */
export function buildResume(templateId: ResumeTemplateId): ResumeContent {
  const template = RESUME_TEMPLATES[templateId]

  if (!template) {
    throw new Error(`Template ${templateId} not found`)
  }

  const sections: Record<string, any> = {}

  // 按照模板定义的顺序提取模块
  template.order.forEach(moduleId => {
    const extractor = moduleExtractors[moduleId]
    if (extractor) {
      sections[moduleId] = extractor()
    }
  })

  return {
    metadata: {
      templateId: template.id,
      templateName: template.name,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    },
    sections
  }
}

/**
 * 根据自定义模块列表构建简历
 */
export function buildCustomResume(modules: ResumeModule[]): ResumeContent {
  const sections: Record<string, any> = {}

  modules.forEach(moduleId => {
    const extractor = moduleExtractors[moduleId]
    if (extractor) {
      sections[moduleId] = extractor()
    }
  })

  return {
    metadata: {
      templateId: 'custom',
      templateName: RESUME_TEMPLATES.custom.name,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    },
    sections
  }
}

/**
 * 获取指定模板
 */
export function getResumeTemplate(templateId: ResumeTemplateId): ResumeTemplate {
  const template = RESUME_TEMPLATES[templateId]
  if (!template) {
    throw new Error(`Template ${templateId} not found`)
  }
  return template
}

/**
 * 获取所有可用模板
 */
export function getAllTemplates(): ResumeTemplate[] {
  return Object.values(RESUME_TEMPLATES).filter(t => t.id !== 'custom')
}

/**
 * 选择特定模块组合
 */
export function selectModules(modules: ResumeModule[]): Record<string, any> {
  const sections: Record<string, any> = {}

  modules.forEach(moduleId => {
    const extractor = moduleExtractors[moduleId]
    if (extractor) {
      sections[moduleId] = extractor()
    }
  })

  return sections
}

// ============ 辅助函数 ============

/**
 * 获取模块的显示名称
 */
export function getModuleDisplayName(moduleId: ResumeModule): { zh: string; en: string } {
  const displayNames: Record<ResumeModule, { zh: string; en: string }> = {
    personalInfo: { zh: '个人信息', en: 'Personal Information' },
    education: { zh: '教育背景', en: 'Education' },
    educationDetailed: { zh: '教育背景（详细）', en: 'Education (Detailed)' },
    workExperience: { zh: '工作经历', en: 'Work Experience' },
    researchExperience: { zh: '科研经历', en: 'Research Experience' },
    publications: { zh: '学术论文', en: 'Publications' },
    patents: { zh: '专利', en: 'Patents' },
    softwareCopyrights: { zh: '软件著作权', en: 'Software Copyrights' },
    honors: { zh: '荣誉奖项', en: 'Honors & Awards' },
    honorsDetailed: { zh: '荣誉奖项（详细）', en: 'Honors & Awards (Detailed)' },
    skills: { zh: '技能', en: 'Skills' },
    skillsDetailed: { zh: '技能（详细）', en: 'Skills (Detailed)' },
    sportsAchievements: { zh: '体育成就', en: 'Sports Achievements' },
    languages: { zh: '语言能力', en: 'Languages' },
    certifications: { zh: '证书', en: 'Certifications' }
  }

  return displayNames[moduleId] || { zh: moduleId, en: moduleId }
}

/**
 * 验证模块ID是否有效
 */
export function isValidModule(moduleId: string): moduleId is ResumeModule {
  return moduleId in moduleExtractors
}

/**
 * 获取所有可用模块
 */
export function getAllModules(): ResumeModule[] {
  return Object.keys(moduleExtractors) as ResumeModule[]
}

export default {
  buildResume,
  buildCustomResume,
  getResumeTemplate,
  getAllTemplates,
  selectModules,
  getModuleDisplayName,
  isValidModule,
  getAllModules,
  RESUME_TEMPLATES
}









