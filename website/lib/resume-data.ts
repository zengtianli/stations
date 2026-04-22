/**
 * 简历结构化数据
 * 从 resume-materials 提取并结构化的所有简历信息
 * 一次维护，多处使用
 */

// ============ 类型定义 ============

export interface PersonalInfo {
  name: { zh: string; en: string }
  birthDate: string
  nationality: string
  gender: string
  birthPlace: string
  contact: {
    email: string
    phone: string
    wechat: string
    address: string
    zipCode: string
  }
  social: {
    linkedin: string
    github: string
    website: string
  }
  summary: {
    zh: string
    en: string
  }
  tagline: {
    zh: string
    en: string
  }
}

export interface Course {
  name: { zh: string; en: string }
  credits: number
  score: number
  semester: string
  category: 'major' | 'public' | 'elective'
}

export interface Supervisor {
  name: { zh: string; en: string }
  title: { zh: string; en: string }
  position?: string
  affiliation: { zh: string; en: string }
  researchArea: string[]
  achievements?: string[]
}

export interface Education {
  id: string
  degree: { zh: string; en: string }
  institution: { zh: string; en: string }
  school?: { zh: string; en: string }
  major: { zh: string; en: string }
  period: { start: string; end: string }
  location: string
  studentId?: string
  gpa?: number
  weightedAverage?: number
  totalCredits?: number
  courses?: Course[]
  supervisor?: Supervisor
  achievements: string[]
  researchFocus?: string[]
  description?: string
  honors?: string[]
}

export interface WorkProject {
  name: { zh: string; en: string }
  role: { zh: string; en: string }
  period: { start: string; end: string }
  background?: string
  responsibilities: string[]
  achievements: string[]
  technologies?: string[]
}

export interface WorkExperience {
  id: string
  company: { zh: string; en: string }
  position: { zh: string; en: string }
  period: { start: string; end: string }
  department?: { zh: string; en: string }
  location: string
  projects: WorkProject[]
  responsibilities?: string[]
  achievements: string[]
}

export interface Paper {
  id: string
  title: { zh: string; en: string }
  authors: string[]
  journal: { zh: string; en: string }
  year: number | string
  volume?: string
  pages?: string
  doi?: string
  isFirstAuthor: boolean
  abstract?: string
  keywords?: string[]
  citations?: number
}

export interface Patent {
  id: string
  title: { zh: string; en: string }
  patentNumber?: string
  applicationDate?: string
  grantDate?: string
  inventors: string[]
  applicant: string
  abstract?: string
  type: 'invention' | 'utility' | 'design'
}

export interface SoftwareCopyright {
  id: string
  title: { zh: string; en: string }
  registrationNumber: string
  registrationDate: string
  developer: string
  owner: string
  version?: string
  description?: string
}

export interface ResearchOutput {
  papers: Paper[]
  patents: Patent[]
  softwareCopyrights: SoftwareCopyright[]
}

export interface Honor {
  id: string
  title: { zh: string; en: string }
  issuer: { zh: string; en: string }
  date: string
  category: 'scholarship' | 'competition' | 'honor_title' | 'academic' | 'sports'
  level: 'national' | 'provincial' | 'university' | 'department'
  description?: string
  rank?: string
}

export interface Skill {
  name: { zh: string; en: string }
  proficiency: 'expert' | 'proficient' | 'familiar'
  years: number
  description?: string
  projects?: string[]
}

export interface SkillCategory {
  name: { zh: string; en: string }
  skills: Skill[]
}

export interface Language {
  name: string
  level: 'native' | 'fluent' | 'proficient' | 'basic'
  skills: {
    reading: string
    writing: string
    listening: string
    speaking: string
  }
  tests?: {
    name: string
    date: string
    score: string
    details?: Record<string, any>
  }[]
}

export interface Certification {
  name: { zh: string; en: string }
  issuer: string
  date: string
  id?: string
  description?: string
}

export interface SkillSystem {
  professional: SkillCategory[]
  technical: SkillCategory[]
  languages: Language[]
  certifications: Certification[]
}

export interface SportsAchievement {
  id: string
  event: { zh: string; en: string }
  achievement: { zh: string; en: string }
  date: string
  organizer?: { zh: string; en: string }
  level: 'national' | 'provincial' | 'university' | 'department'
  category?: string
}

// ============ 个人信息 ============

export const personalInfo: PersonalInfo = {
  name: { zh: "曾田力", en: "Zeng Tianli" },
  birthDate: "1989-12-13",
  nationality: "中国",
  gender: "男",
  birthPlace: "浙江省",
  contact: {
    email: "zengtianli1@126.com",
    phone: "+86 15957183444",
    wechat: "zengtracy",
    address: "浙江省杭州市",
    zipCode: "310000"
  },
  social: {
    linkedin: "https://www.linkedin.com/in/tianli-zeng-4068a7190/",
    github: "https://github.com/zengtianli",
    website: "https://tianlizeng.cloud"
  },
  summary: {
    zh: "浙江大学水利工程专业硕士（曾为直博生，完成博士级别课程学习），现任浙江省水利水电规划设计院工程师。专注于水利信息化、数字孪生与智慧水利研究，深耕机器学习在水资源管理、水文预测领域的应用。主导多个重点水利工程项目，发表核心期刊论文4篇，获得软件著作权3项、专利1项。",
    en: "Master of Hydraulic Engineering from Zhejiang University (initially enrolled as a direct Ph.D. student, completed doctoral-level coursework), currently serving as an Engineer at Zhejiang Provincial Institute of Hydraulic and Estuary Research. Specialized in Water Resources Informatization, Digital Twin Technology, and Smart Water Conservancy, with extensive expertise in applying machine learning to water resources management and hydrological forecasting. Led multiple key water conservancy projects, published 4 papers in core journals, and obtained 3 software copyrights and 1 patent."
  },
  tagline: {
    zh: "数据驱动水利创新 | AI赋能未来水务",
    en: "Data-Driven Water Innovation | AI-Empowered Future Water Management"
  }
}

// ============ 教育背景 ============

export const educationHistory: Education[] = [
  {
    id: "phd-zju",
    degree: { zh: "直博研究生", en: "Direct Ph.D. Student" },
    institution: { zh: "浙江大学", en: "Zhejiang University" },
    school: { zh: "海洋学院", en: "College of Ocean Science and Engineering" },
    major: { zh: "港口、海岸及近海工程", en: "Port, Coastal and Offshore Engineering" },
    period: { start: "2013-09", end: "2020" },
    location: "杭州, 浙江省, 中国",
    studentId: "11334007",
    weightedAverage: 88.9,
    totalCredits: 32.0,
    supervisor: {
      name: { zh: "孙志林", en: "Sun Zhilin" },
      title: { zh: "教授、博士生导师", en: "Professor, Ph.D. Supervisor" },
      position: "浙江大学海洋学院港口海岸与近海工程研究所所长",
      affiliation: { zh: "浙江大学海洋学院", en: "College of Ocean Science and Engineering, Zhejiang University" },
      researchArea: ["河口海岸数值模拟", "港口航道工程", "水沙动力学"],
      achievements: [
        "浙江省科学技术进步一等奖（排名第1）",
        "浙江省优秀教师（2019年）",
        "发表SCI/EI论文50余篇",
        "主持国家自然科学基金重大研究计划重点项目"
      ]
    },
    courses: [
      { name: { zh: "高等工程流体力学", en: "Advanced Engineering Fluid Mechanics" }, credits: 2.0, score: 96, semester: "2013秋季", category: "major" },
      { name: { zh: "优化理论与方法", en: "Optimization Theory and Methods" }, credits: 2.0, score: 95, semester: "2013冬季", category: "major" },
      { name: { zh: "河口学", en: "Estuarine Science" }, credits: 2.0, score: 95, semester: "2013春季", category: "major" },
      { name: { zh: "计算流体力学", en: "Computational Fluid Dynamics" }, credits: 2.0, score: 94, semester: "2013冬季", category: "major" },
      { name: { zh: "高等渗流体力学", en: "Advanced Seepage Fluid Mechanics" }, credits: 2.0, score: 93, semester: "2013秋季", category: "major" },
      { name: { zh: "固液二相流理论", en: "Solid-Liquid Two-Phase Flow Theory" }, credits: 2.0, score: 92, semester: "2013秋季", category: "major" },
      { name: { zh: "随机海浪及海洋结构物", en: "Stochastic Waves and Ocean Structures" }, credits: 2.0, score: 91, semester: "2013春季", category: "major" },
      { name: { zh: "专业外语（博士）", en: "Professional English (Doctoral)" }, credits: 1.0, score: 91, semester: "2013秋季", category: "major" },
      { name: { zh: "物理海洋学", en: "Physical Oceanography" }, credits: 2.0, score: 87, semester: "2013秋季", category: "major" },
      { name: { zh: "数值分析", en: "Numerical Analysis" }, credits: 2.0, score: 85, semester: "2013秋季", category: "major" },
      { name: { zh: "工程弹塑性力学", en: "Engineering Elastoplastic Mechanics" }, credits: 2.0, score: 83, semester: "2013春季", category: "major" },
      { name: { zh: "高等水波工程分析", en: "Advanced Water Wave Engineering Analysis" }, credits: 2.0, score: 82, semester: "2013春季", category: "major" },
      { name: { zh: "海岸环境学", en: "Coastal Environmental Science" }, credits: 2.0, score: 82, semester: "2013冬季", category: "major" },
    ],
    achievements: [
      "完成博士级别全部课程学习",
      "加权平均分88.9分/100",
      "发表核心期刊论文2篇",
      "获得国家留学基金委公派留学奖学金"
    ],
    researchFocus: ["河口海岸数值模拟", "泥沙输移", "水动力学"],
    description: "在博士阶段完成了博士级别的全部课程学习，从事河口海岸数值模拟研究，并赴美国克拉克森大学进行国家公派联合培养。相关研究成果已发表于《水利学报》等核心期刊及ASCE国际会议。"
  },
  {
    id: "joint-clarkson",
    degree: { zh: "联合培养博士", en: "Joint Ph.D. Training" },
    institution: { zh: "美国克拉克森大学", en: "Clarkson University" },
    school: { zh: "土木与环境工程系", en: "Department of Civil and Environmental Engineering" },
    major: { zh: "水利工程", en: "Hydraulic Engineering" },
    period: { start: "2016-08", end: "2018-01" },
    location: "Potsdam, New York, USA",
    supervisor: {
      name: { zh: "吴伟明", en: "Weiming Wu" },
      title: { zh: "教授", en: "Professor" },
      affiliation: { zh: "克拉克森大学土木与环境工程系", en: "Department of Civil and Environmental Engineering, Clarkson University" },
      researchArea: ["明渠水流与泥沙输移数值模拟", "河流动力学", "计算水力学"]
    },
    achievements: [
      "获得国家留学基金委公派留学奖学金",
      "发表ASCE会议论文1篇",
      "在ASCE环境水资源大会上进行学术报告"
    ],
    researchFocus: ["明渠水流数值模拟", "泥沙输移", "物理模型"],
    description: "获《国家留学基金委公派留学奖学金》支持。研究成果《A Depth Averaged 2D Physically Based Model of Cohesive Dam/Levee Breach Processes》被ASCE环境水资源大会收录并进行报告。"
  },
  {
    id: "master-zju",
    degree: { zh: "硕士研究生", en: "Master" },
    institution: { zh: "浙江大学", en: "Zhejiang University" },
    school: { zh: "建筑工程学院", en: "College of Civil Engineering and Architecture" },
    major: { zh: "水利工程", en: "Hydraulic Engineering" },
    period: { start: "2021-09", end: "2023-09" },
    location: "杭州, 浙江省, 中国",
    supervisor: {
      name: { zh: "许月萍", en: "Xu Yueping" },
      title: { zh: "教授、博士生导师", en: "Professor, Ph.D. Supervisor" },
      affiliation: { zh: "浙江大学建筑工程学院", en: "College of Civil Engineering and Architecture, Zhejiang University" },
      researchArea: ["水资源管理", "水文预测", "机器学习应用"]
    },
    achievements: [
      "发表核心期刊论文2篇",
      "获得三好研究生、优秀研究生荣誉",
      "硕士论文成果发表于权威期刊"
    ],
    researchFocus: ["水资源可持续利用", "用水量预测", "LSTM深度学习", "时间序列分析"],
    description: "核心研究项目：浙江省用水量变化及水资源可持续利用评价指标体系研究。应用Mann-Kendall检验、Theil-Sen方法和信息熵方法分析用水结构时空变化。基于LSTM深度学习构建多因子用水量预测模型，对比ARIMA、LSTM和Informer模型在日尺度用水量预测的表现。"
  },
  {
    id: "bachelor-zju",
    degree: { zh: "本科", en: "Bachelor" },
    institution: { zh: "浙江大学", en: "Zhejiang University" },
    major: { zh: "水资源与海洋工程", en: "Water Resources and Ocean Engineering" },
    period: { start: "2009-09", end: "2013-06" },
    location: "杭州, 浙江省, 中国",
    gpa: 3.65,
    achievements: [
      "GPA 3.65/4.0（专业排名2/22）",
      "优秀学生一等奖学金",
      "坤和奖学金二等奖",
      "三好学生",
      "优秀学生干部"
    ],
    description: "系统学习水利工程基础理论与专业知识，掌握水文学、水力学等核心课程。"
  }
]

// ============ 工作经历 ============

export const workExperience: WorkExperience[] = [
  {
    id: "zhejiang-hydraulic-institute",
    company: { zh: "浙江省水利水电规划设计院", en: "Zhejiang Provincial Institute of Hydraulic and Estuary Research" },
    position: { zh: "工程师", en: "Engineer" },
    period: { start: "2023-10", end: "present" },
    department: { zh: "规划与数字业务事业部", en: "Planning and Digital Business Division" },
    location: "杭州, 浙江省, 中国",
    projects: [
      {
        name: { zh: "数字孪生浙东引水工程", en: "Digital Twin Zhedong Water Diversion Project" },
        role: { zh: "技术骨干", en: "Technical Backbone" },
        period: { start: "2024-10", end: "present" },
        background: "浙东引水工程是浙江省重要的跨流域调水工程，面临水资源调度优化、水质安全保障等挑战。",
        responsibilities: [
          "负责降雨特征分析与预测模型开发，采用深度学习算法提高预测精度",
          "设计多源数据融合架构，整合气象、水文、水质等数据",
          "开发可视化决策支持系统，提供直观的数据展示与分析工具",
          "优化模型参数，提高预测准确性与计算效率"
        ],
        achievements: [
          "实现15天水资源态势精准预测，平均误差控制在5%以内",
          "开发的数据融合方法提高了模型稳定性，减少了异常值影响",
          "可视化决策系统显著提升了管理效率，获得用户高度评价",
          "相关技术方法已在多个水利工程中推广应用"
        ],
        technologies: ["LSTM", "深度学习", "数据融合", "可视化", "Next.js", "React"]
      },
      {
        name: { zh: "绍兴水资源承载力评价项目", en: "Shaoxing Water Resources Carrying Capacity Assessment Project" },
        role: { zh: "技术负责人", en: "Technical Leader" },
        period: { start: "2024-04", end: "2024-12" },
        background: "绍兴市经济快速发展，水资源需求不断增长，亟需科学评估区域水资源承载能力。",
        responsibilities: [
          "主导项目整体规划与技术方案设计",
          "构建多维度水资源承载力评价指标体系",
          "开发基于AHP、CRITIC、TOPSIS的综合评价模型",
          "设计并实现水资源承载力评价软件系统"
        ],
        achievements: [
          "成功获得软件著作权《浙水设计水资源承载力模型软件》",
          "评价结果为绍兴市水资源规划提供了科学依据",
          "开发的评价方法被省水利厅采纳，在多个地区推广应用",
          "相关研究成果发表于核心期刊"
        ],
        technologies: ["AHP", "CRITIC", "TOPSIS", "Python", "多准则决策"]
      },
      {
        name: { zh: "钱塘江岸线规划项目", en: "Qiantang River Shoreline Planning Project" },
        role: { zh: "技术负责人", en: "Technical Leader" },
        period: { start: "2023-12", end: "2024-12" },
        background: "钱塘江岸线资源珍贵，面临开发与保护的双重压力。",
        responsibilities: [
          "负责技术路线设计与关键技术攻关",
          "开发基于GIS的岸线资源评价方法",
          "构建岸线分级分类技术体系",
          "设计岸线管理信息系统架构与功能"
        ],
        achievements: [
          "建立了钱塘江岸线资源数据库，包含空间与属性数据",
          "开发的岸线分级分类方法被纳入地方标准",
          "岸线管理信息系统显著提升了管理效率与决策水平",
          "项目成果为钱塘江岸线保护与利用规划提供了技术支撑"
        ],
        technologies: ["GIS", "ArcGIS", "空间分析", "数据库", "Web开发"]
      }
    ],
    achievements: [
      "主导/参与3个重点水利工程项目",
      "发表核心期刊论文4篇",
      "获得软件著作权3项",
      "获得专利1项"
    ]
  }
]

// ============ 学术成果 ============

export const researchOutput: ResearchOutput = {
  papers: [
    {
      id: "paper-1",
      title: {
        zh: "浙东引水工程受水区降雨趋势与多尺度变异性",
        en: "Rainfall Trends and Multi-scale Variability in the Water Receiving Area of Eastern Zhejiang Water Diversion Project"
      },
      authors: ["曾田力", "左晓霞", "杨彧", "戴欢", "吴木红", "钟吕斌", "陈舒阳"],
      journal: { zh: "水电能源科学", en: "Hydroelectric Energy Science" },
      year: 2025,
      isFirstAuthor: true,
      abstract: "分析浙东引水工程受水区的降雨趋势和多尺度变异性特征。"
    },
    {
      id: "paper-2",
      title: {
        zh: "基于主要驱动因子筛选法和深度学习算法的浙江省动态需水预测",
        en: "Dynamic Water Demand Prediction in Zhejiang Province Based on Main Driver Screening and Deep Learning Algorithms"
      },
      authors: ["许月萍", "曾田力", "等"],
      journal: { zh: "水利学报", en: "Journal of Hydraulic Engineering" },
      year: 2024,
      isFirstAuthor: false
    },
    {
      id: "paper-3",
      title: {
        zh: "考虑侧向出沙的河网非均匀沙输移",
        en: "Non-uniform Sediment Transport in River Networks Considering Lateral Sediment Outflow"
      },
      authors: ["孙志林", "杨恩尚", "曾田力", "祝丽丽"],
      journal: { zh: "水利学报", en: "Journal of Hydraulic Engineering" },
      year: 2016,
      isFirstAuthor: false
    },
    {
      id: "paper-4",
      title: {
        zh: "基于机器学习的用水量预测研究",
        en: "Water Consumption Prediction Based on Machine Learning"
      },
      authors: ["曾田力", "等"],
      journal: { zh: "水科学进展", en: "Advances in Water Science" },
      year: 2023,
      isFirstAuthor: true
    }
  ],
  patents: [
    {
      id: "patent-1",
      title: {
        zh: "一种基于LSTM的用水量预测方法",
        en: "A Water Consumption Prediction Method Based on LSTM"
      },
      inventors: ["曾田力", "等"],
      applicant: "浙江省水利水电规划设计院",
      type: "invention",
      abstract: "本发明提出了一种基于LSTM深度学习的用水量预测方法，能够有效提高预测精度。"
    }
  ],
  softwareCopyrights: [
    {
      id: "software-1",
      title: {
        zh: "浙水设计-水资源优化调度模型软件",
        en: "Zheshuai Design - Water Resources Optimal Dispatching Model Software"
      },
      registrationNumber: "2024SR0000000",
      registrationDate: "2024-06",
      developer: "曾田力等",
      owner: "浙江省水利水电规划设计院",
      version: "V1.0"
    },
    {
      id: "software-2",
      title: {
        zh: "浙水设计-水资源承载力模型软件",
        en: "Zheshuai Design - Water Resources Carrying Capacity Model Software"
      },
      registrationNumber: "2024SR0000001",
      registrationDate: "2024-08",
      developer: "曾田力等",
      owner: "浙江省水利水电规划设计院",
      version: "V1.0"
    },
    {
      id: "software-3",
      title: {
        zh: "浙水设计-岸线管理信息系统",
        en: "Zheshuai Design - Shoreline Management Information System"
      },
      registrationNumber: "2024SR0000002",
      registrationDate: "2024-10",
      developer: "曾田力等",
      owner: "浙江省水利水电规划设计院",
      version: "V1.0"
    }
  ]
}

// ============ 荣誉奖项 ============

export const honors: Honor[] = [
  {
    id: "honor-csc",
    title: { zh: "国家留学基金委公派留学奖学金", en: "China Scholarship Council (CSC) Scholarship for Study Abroad" },
    issuer: { zh: "国家留学基金管理委员会", en: "China Scholarship Council" },
    date: "2016",
    category: "scholarship",
    level: "national",
    description: "获得国家公派留学资格，赴美国克拉克森大学联合培养博士研究生"
  },
  {
    id: "honor-merit-grad-1",
    title: { zh: "三好研究生", en: "Merit Graduate Student" },
    issuer: { zh: "浙江大学", en: "Zhejiang University" },
    date: "2014-12",
    category: "academic",
    level: "university"
  },
  {
    id: "honor-merit-grad-2",
    title: { zh: "三好研究生", en: "Merit Graduate Student" },
    issuer: { zh: "浙江大学", en: "Zhejiang University" },
    date: "2022-12",
    category: "academic",
    level: "university"
  },
  {
    id: "honor-outstanding-grad-1",
    title: { zh: "优秀研究生", en: "Outstanding Graduate Student" },
    issuer: { zh: "浙江大学", en: "Zhejiang University" },
    date: "2014-12",
    category: "academic",
    level: "university"
  },
  {
    id: "honor-outstanding-grad-2",
    title: { zh: "优秀研究生", en: "Outstanding Graduate Student" },
    issuer: { zh: "浙江大学", en: "Zhejiang University" },
    date: "2015-12",
    category: "academic",
    level: "university"
  },
  {
    id: "honor-merit-student",
    title: { zh: "浙江大学三好学生", en: "Zhejiang University Merit Student" },
    issuer: { zh: "浙江大学", en: "Zhejiang University" },
    date: "2012-12",
    category: "academic",
    level: "university"
  },
  {
    id: "honor-student-leader",
    title: { zh: "浙江大学优秀学生干部", en: "Zhejiang University Outstanding Student Leader" },
    issuer: { zh: "浙江大学", en: "Zhejiang University" },
    date: "2012-12",
    category: "honor_title",
    level: "university"
  },
  {
    id: "honor-league-member",
    title: { zh: "浙江大学优秀团员", en: "Zhejiang University Outstanding League Member" },
    issuer: { zh: "浙江大学", en: "Zhejiang University" },
    date: "2012-05",
    category: "honor_title",
    level: "university"
  },
  {
    id: "honor-league-cadre",
    title: { zh: "浙江大学优秀团干部", en: "Zhejiang University Outstanding League Cadre" },
    issuer: { zh: "浙江大学", en: "Zhejiang University" },
    date: "2013-05",
    category: "honor_title",
    level: "university"
  },
  {
    id: "honor-sports-star",
    title: { zh: '浙江省水利厅"体育之星"', en: '"Sports Star" of Zhejiang Provincial Department of Water Resources' },
    issuer: { zh: "浙江省水利厅", en: "Zhejiang Provincial Department of Water Resources" },
    date: "2024",
    category: "sports",
    level: "provincial",
    description: "在各类体育竞赛中表现突出，为单位争得荣誉"
  }
]

// ============ 体育成就 ============

export const sportsAchievements: SportsAchievement[] = [
  {
    id: "sports-1",
    event: { zh: '浙江大学"建工杯"研究生新生篮球赛', en: 'Zhejiang University "Jiangong Cup" Graduate Basketball Championship' },
    achievement: { zh: "MVP", en: "MVP" },
    date: "2013-03",
    organizer: { zh: "浙江大学建筑工程学院", en: "College of Civil Engineering and Architecture, Zhejiang University" },
    level: "university",
    category: "篮球"
  },
  {
    id: "sports-2",
    event: { zh: "浙江大学篮球赛", en: "Zhejiang University Basketball Championship" },
    achievement: { zh: "第二名", en: "2nd Place" },
    date: "2013",
    organizer: { zh: "浙江大学", en: "Zhejiang University" },
    level: "university",
    category: "篮球"
  },
  {
    id: "sports-3",
    event: { zh: '浙江大学研究生体育文化节"Vazyme杯"篮球赛', en: 'Zhejiang University Graduate Sports Festival "Vazyme Cup" Basketball Championship' },
    achievement: { zh: "季军", en: "3rd Place" },
    date: "2015-12",
    organizer: { zh: "浙江大学", en: "Zhejiang University" },
    level: "university",
    category: "篮球"
  },
  {
    id: "sports-4",
    event: { zh: "浙江省大学生物理创新竞赛", en: "Zhejiang Province College Physics Innovation Competition" },
    achievement: { zh: "三等奖", en: "3rd Prize" },
    date: "2010-12",
    organizer: { zh: "浙江省教育厅", en: "Zhejiang Provincial Department of Education" },
    level: "provincial",
    category: "竞赛"
  }
]

// ============ 技能体系 ============

export const skillSystem: SkillSystem = {
  professional: [
    {
      name: { zh: "水利工程专业技能", en: "Hydraulic Engineering Skills" },
      skills: [
        {
          name: { zh: "水资源管理与规划", en: "Water Resources Management and Planning" },
          proficiency: "expert",
          years: 5,
          description: "水资源承载力评价、水资源优化调度、区域水资源规划"
        },
        {
          name: { zh: "水文预测与模拟", en: "Hydrological Forecasting and Simulation" },
          proficiency: "expert",
          years: 5,
          description: "降雨特征分析、径流预测、水文模型构建"
        },
        {
          name: { zh: "数字孪生与智慧水利", en: "Digital Twin and Smart Water Conservancy" },
          proficiency: "expert",
          years: 3,
          description: "数字孪生系统设计、智能决策支持、多源数据融合"
        },
        {
          name: { zh: "河网水动力模拟", en: "River Network Hydrodynamic Simulation" },
          proficiency: "proficient",
          years: 5,
          description: "河网水流模拟、泥沙输移计算、水动力耦合模型"
        }
      ]
    },
    {
      name: { zh: "机器学习与数据科学", en: "Machine Learning and Data Science" },
      skills: [
        {
          name: { zh: "LSTM深度学习", en: "LSTM Deep Learning" },
          proficiency: "expert",
          years: 3,
          description: "用水量预测、降雨预测、时间序列分析"
        },
        {
          name: { zh: "时间序列分析", en: "Time Series Analysis" },
          proficiency: "expert",
          years: 5,
          description: "Mann-Kendall检验、Sen's斜率估计、ARIMA、Informer"
        },
        {
          name: { zh: "多准则决策方法", en: "Multi-Criteria Decision Making" },
          proficiency: "expert",
          years: 3,
          description: "AHP、CRITIC、TOPSIS综合评价"
        }
      ]
    },
    {
      name: { zh: "地理信息系统", en: "Geographic Information System" },
      skills: [
        {
          name: { zh: "ArcGIS", en: "ArcGIS" },
          proficiency: "expert",
          years: 5,
          description: "空间分析、岸线规划、资源评价"
        },
        {
          name: { zh: "空间分析方法", en: "Spatial Analysis Methods" },
          proficiency: "expert",
          years: 5,
          description: "缓冲区分析、叠加分析、网络分析"
        }
      ]
    }
  ],
  technical: [
    {
      name: { zh: "编程语言", en: "Programming Languages" },
      skills: [
        {
          name: { zh: "Python", en: "Python" },
          proficiency: "expert",
          years: 5,
          description: "数据分析、机器学习、Web开发、自动化脚本",
          projects: ["数字孪生浙东引水工程", "水资源承载力评价"]
        },
        {
          name: { zh: "TypeScript/JavaScript", en: "TypeScript/JavaScript" },
          proficiency: "proficient",
          years: 3,
          description: "Web前端开发、全栈开发",
          projects: ["个人网站", "岸线管理信息系统"]
        },
        {
          name: { zh: "Fortran", en: "Fortran" },
          proficiency: "proficient",
          years: 5,
          description: "数值计算、水文模型开发"
        }
      ]
    },
    {
      name: { zh: "Web开发", en: "Web Development" },
      skills: [
        {
          name: { zh: "React/Next.js", en: "React/Next.js" },
          proficiency: "expert",
          years: 2,
          description: "前端框架、SSR、全栈开发"
        },
        {
          name: { zh: "Tailwind CSS", en: "Tailwind CSS" },
          proficiency: "expert",
          years: 2,
          description: "CSS框架、响应式设计"
        },
        {
          name: { zh: "Node.js", en: "Node.js" },
          proficiency: "proficient",
          years: 2,
          description: "后端开发、API开发"
        }
      ]
    },
    {
      name: { zh: "数据库", en: "Database" },
      skills: [
        {
          name: { zh: "PostgreSQL", en: "PostgreSQL" },
          proficiency: "proficient",
          years: 5,
          description: "关系型数据库、空间数据库（PostGIS）"
        },
        {
          name: { zh: "MySQL", en: "MySQL" },
          proficiency: "proficient",
          years: 5,
          description: "关系型数据库"
        }
      ]
    },
    {
      name: { zh: "开发工具", en: "Development Tools" },
      skills: [
        {
          name: { zh: "Git/GitHub", en: "Git/GitHub" },
          proficiency: "expert",
          years: 5,
          description: "版本控制、代码协作"
        },
        {
          name: { zh: "Neovim", en: "Neovim" },
          proficiency: "expert",
          years: 4,
          description: "高效文本编辑、配置定制化"
        },
        {
          name: { zh: "Docker", en: "Docker" },
          proficiency: "proficient",
          years: 3,
          description: "容器化部署"
        }
      ]
    }
  ],
  languages: [
    {
      name: "中文",
      level: "native",
      skills: {
        reading: "母语水平",
        writing: "母语水平",
        listening: "母语水平",
        speaking: "母语水平"
      }
    },
    {
      name: "English",
      level: "proficient",
      skills: {
        reading: "精通 - 能够阅读专业英文文献",
        writing: "精通 - 能够撰写英文学术论文",
        listening: "熟练 - 能够理解学术讲座和日常对话",
        speaking: "熟练 - 能够进行学术交流和日常对话"
      },
      tests: [
        {
          name: "TOEFL iBT",
          date: "2015-10",
          score: "94/120",
          details: {
            reading: 30,
            listening: 22,
            speaking: 19,
            writing: 23
          }
        }
      ]
    }
  ],
  certifications: []
}

// ============ 导出汇总 ============

export const resumeData = {
  personalInfo,
  educationHistory,
  workExperience,
  researchOutput,
  honors,
  sportsAchievements,
  skillSystem
}

export default resumeData


