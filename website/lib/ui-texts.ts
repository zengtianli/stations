/**
 * UI文案配置文件
 * 统一管理界面中的文案、提示信息、错误信息等
 */

// 加载状态文案
export const loadingTexts = {
  default: "加载中...",
  content: "内容加载中...",
  submitting: "提交中...",
  processing: "处理中...",

  building: "构建中...",
  connecting: "连接中...",
  saving: "保存中...",
  uploading: "上传中...",
  downloading: "下载中...",
  chart: "渲染图表中...",
  diagram: "渲染图表中..."
}

// 错误信息文案
export const errorMessages = {
  // 通用错误
  general: "操作失败，请稍后重试",
  network: "网络连接失败，请检查网络设置", 
  timeout: "请求超时，请稍后重试",
  unauthorized: "没有访问权限",
  notFound: "请求的资源不存在",
  
  // 内容加载错误
  contentLoadFailed: "内容加载失败",
  contentNotFound: "内容未找到",
  contentParseError: "内容解析失败",
  
  // 表单错误
  formValidationError: "表单验证失败，请检查输入",
  formSubmissionError: "表单提交失败，请稍后重试",
  requiredField: "此字段为必填项",
  invalidEmail: "请输入有效的邮箱地址",
  invalidPhone: "请输入有效的电话号码",
  
  // 文件操作错误
  fileNotFound: "文件未找到",
  fileLoadError: "文件加载失败",
  fileParseError: "文件解析失败",
  downloadError: "下载失败，请稍后重试",
  

  
  // 图表渲染错误
  chartRenderError: "图表渲染失败，请检查语法",
  diagramError: "图表渲染失败，请检查语法",
  
  // 工具相关错误
  toolLoadError: "工具内容加载失败",
  toolNotFound: "工具未找到",
  apiError: "API 请求失败"
}

// 成功信息文案
export const successMessages = {
  general: "操作成功",
  saved: "保存成功",
  submitted: "提交成功",
  updated: "更新成功",
  deleted: "删除成功",
  copied: "已复制到剪贴板",
  downloaded: "下载成功",
  
  // 表单相关
  messageSent: "消息已发送",
  contactSuccess: "感谢您的留言，我会尽快回复",
  subscriptionSuccess: "订阅成功"
}

// 操作确认文案
export const confirmMessages = {
  delete: "确认删除此项目吗？",
  clear: "确认清空所有内容吗？",
  reset: "确认重置设置吗？",
  leave: "确认离开此页面吗？未保存的更改将丢失",
  submit: "确认提交吗？"
}

// 按钮文案
export const buttonTexts = {
  // 通用按钮
  ok: "确定",
  cancel: "取消", 
  close: "关闭",
  back: "返回",
  next: "下一步",
  previous: "上一步",
  finish: "完成",
  
  // 操作按钮
  save: "保存",
  submit: "提交",
  send: "发送",
  delete: "删除",
  edit: "编辑",
  copy: "复制",
  share: "分享",
  download: "下载",
  upload: "上传",
  refresh: "刷新",
  retry: "重试",
  
  // 展开/收起
  expand: "展开",
  collapse: "收起",
  showMore: "查看更多",
  showLess: "收起",
  expandDetails: "展开详情",
  collapseDetails: "收起详情",
  
  // 导航按钮
  home: "首页",
  about: "关于",
  projects: "项目",
  research: "研究",
  tools: "工具", 
  resume: "简历",
  contact: "联系",
  
  // 社交媒体
  github: "GitHub",
  linkedin: "LinkedIn",
  wechat: "微信",
  email: "邮箱",
  
  // 文件操作
  downloadPDF: "下载PDF",
  viewDocument: "查看文档",
  openLink: "打开链接"
}

// 占位符文案
export const placeholderTexts = {
  // 表单占位符
  name: "请输入您的姓名",
  email: "请输入您的邮箱",
  phone: "请输入您的电话",
  subject: "请输入消息主题",
  message: "请输入您的消息内容",
  website: "请输入网站地址",
  company: "请输入公司名称"
}

// 标签和标题文案
export const labelTexts = {
  // 表单标签
  name: "姓名",
  email: "邮箱", 
  phone: "电话",
  subject: "主题",
  message: "内容",
  website: "网站",
  company: "公司",
  
  // 内容标签
  title: "标题",
  description: "描述",
  content: "内容",
  author: "作者",
  date: "日期",
  category: "分类",
  tags: "标签",
  
  // 状态标签
  published: "已发布",
  draft: "草稿",
  archived: "已归档",
  featured: "精选",
  new: "新",
  updated: "已更新"
}

// 时间相关文案
export const timeTexts = {
  justNow: "刚刚",
  minutesAgo: (minutes: number) => `${minutes}分钟前`,
  hoursAgo: (hours: number) => `${hours}小时前`,
  daysAgo: (days: number) => `${days}天前`,
  weeksAgo: (weeks: number) => `${weeks}周前`,
  monthsAgo: (months: number) => `${months}个月前`,
  yearsAgo: (years: number) => `${years}年前`,
  
  // 日期格式
  today: "今天",
  yesterday: "昨天",
  tomorrow: "明天",
  thisWeek: "本周",
  lastWeek: "上周",
  thisMonth: "本月",
  lastMonth: "上月"
}

// 数据统计文案
export const statsTexts = {
  total: "总计",
  count: "数量",
  views: "浏览",
  likes: "喜欢", 
  shares: "分享",
  downloads: "下载",
  
  // 项目统计
  totalProjects: (count: number) => `共 ${count} 个项目`,
  totalTools: (count: number) => `共 ${count} 个工具`,
  totalPapers: (count: number) => `共 ${count} 篇论文`,
  totalAwards: (count: number) => `共 ${count} 个奖项`,
  
  // 无数据状态
  noData: "暂无数据",
  noResults: "没有结果",
  empty: "内容为空"
}

// 页面标题文案
export const pageTitles = {
  home: "首页",
  about: "关于我",
  projects: "项目案例", 
  research: "学术与成果",
  tools: "开发工具",
  resume: "简历中心",
  contact: "联系方式",

  notFound: "页面未找到"
}

// SEO相关文案
export const seoTexts = {
  defaultTitle: "曾田力 - 数据驱动水利创新 | AI赋能未来水务",
  defaultDescription: "融合水利工程专业智慧与前沿信息技术，致力于通过数据分析、智能模型及软件系统研发，解决复杂水资源挑战，驱动行业变革。",
  
  // 页面描述
  homeDescription: "曾田力个人网站，展示水利工程与信息技术融合的创新实践",
  aboutDescription: "了解曾田力的专业背景、技能专长和发展历程",
  projectsDescription: "查看曾田力参与的水利工程项目和技术解决方案",
  researchDescription: "浏览曾田力的学术论文、专利发明和研究成果",
  toolsDescription: "探索曾田力开发的开源工具和软件项目",
  contactDescription: "联系曾田力，探讨合作机会和技术交流"
}

// 辅助功能文案
export const a11yTexts = {
  // 屏幕阅读器文本
  skip: "跳到主要内容",
  menu: "主菜单",

  close: "关闭",
  open: "打开",
  
  // 图片替代文本
  profilePhoto: "曾田力个人照片",
  projectImage: "项目展示图片",
  logoImage: "网站标志",
  
  // 链接描述
  externalLink: "外部链接，在新窗口打开",
  downloadLink: "下载文件",
  emailLink: "发送邮件",
  phoneLink: "拨打电话"
}

// 导出所有配置的统一接口
export const uiTexts = {
  loading: loadingTexts,
  error: errorMessages,
  success: successMessages,
  confirm: confirmMessages,
  button: buttonTexts,
  placeholder: placeholderTexts,
  label: labelTexts,
  time: timeTexts,
  stats: statsTexts,
  page: pageTitles,
  seo: seoTexts,
  a11y: a11yTexts
}

// 类型导出
export type LoadingTexts = typeof loadingTexts
export type ErrorMessages = typeof errorMessages  
export type SuccessMessages = typeof successMessages
export type ConfirmMessages = typeof confirmMessages
export type ButtonTexts = typeof buttonTexts
export type PlaceholderTexts = typeof placeholderTexts
export type LabelTexts = typeof labelTexts
export type TimeTexts = typeof timeTexts
export type StatsTexts = typeof statsTexts
export type PageTitles = typeof pageTitles
export type SEOTexts = typeof seoTexts
export type A11yTexts = typeof a11yTexts
export type UITexts = typeof uiTexts
