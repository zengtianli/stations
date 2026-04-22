/**
 * SEO 配置文件
 * 统一管理网站的 SEO 元数据
 */

export const siteConfig = {
  name: "曾田力",
  title: "曾田力 - 水利工程师 | 数据驱动水利创新",
  description: "曾田力，浙江大学水利工程专业出身，融合水利工程专业智慧与前沿信息技术，致力于通过数据分析、智能模型及软件系统研发，解决复杂水资源挑战。",
  url: "https://tianlizeng.cloud",
  ogImage: "/images/og-image.svg", // SVG格式的OG图片（浏览器会自动渲染）
  keywords: [
    "曾田力",
    "水利工程",
    "浙江大学",
    "水资源管理",
    "数字孪生",
    "智慧水利",
    "数据分析",
    "机器学习",
    "LSTM",
    "深度学习",
    "水文模拟",
    "水资源规划",
  ],
  author: {
    name: "曾田力",
    email: "zengtianli1@126.com",
    url: "https://tianlizeng.cloud",
  },
  creator: "曾田力",
  publisher: "曾田力",
  locale: "zh-CN",
  type: "website",
}

export const openGraph = {
  type: "website" as const,
  locale: "zh_CN",
  url: siteConfig.url,
  title: siteConfig.title,
  description: siteConfig.description,
  siteName: siteConfig.name,
  images: [
    {
      url: siteConfig.ogImage,
      width: 1200,
      height: 630,
      alt: siteConfig.name,
    },
  ],
}

export const twitter = {
  card: "summary_large_image" as const,
  title: siteConfig.title,
  description: siteConfig.description,
  images: [siteConfig.ogImage],
  // creator: "@你的Twitter用户名", // 如果有 Twitter 账号可以添加
}

/**
 * 生成结构化数据（Schema.org JSON-LD）
 */
export function generatePersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "曾田力",
    jobTitle: "水利工程师",
    worksFor: {
      "@type": "Organization",
      name: "浙江省水利水电规划设计院",
    },
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "浙江大学",
    },
    email: "zengtianli1@126.com",
    url: siteConfig.url,
    sameAs: [
      "https://www.linkedin.com/in/tianli-zeng-4068a7190/",
      "https://github.com/zengtianli",
    ],
  }
}

/**
 * 生成网站结构化数据
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
    },
  }
}

