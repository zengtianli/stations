/**
 * 设计系统 - 设计令牌 (Design Tokens)
 * 统一管理所有设计相关的数值常量，确保一致性
 */

/**
 * 间距系统
 * 基于 Tailwind CSS 的间距系统，用于组件内外边距
 */
export const spacing = {
  // 基础间距
  xs: '0.25rem',  // 1
  sm: '0.5rem',   // 2  
  md: '0.75rem',  // 3
  lg: '1rem',     // 4
  xl: '1.5rem',   // 6
  '2xl': '2rem',  // 8
  '3xl': '3rem',  // 12
  '4xl': '4rem',  // 16
  
  // 组件间距
  section: '4rem',      // 16 - 页面section间距
  component: '1.5rem',  // 6 - 组件间距
  element: '1rem',      // 4 - 元素间距
  tight: '0.5rem',      // 2 - 紧密间距
} as const

/**
 * 圆角系统
 * 统一的边框圆角数值
 */
export const radius = {
  none: '0',
  sm: '0.125rem',    // 2px
  md: '0.375rem',    // 6px - 默认
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  full: '9999px',    // 完全圆形
} as const

/**
 * 阴影系统  
 * 统一的阴影效果
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  
  // 特殊阴影
  glow: '0 0 25px rgba(100, 255, 218, 0.3)', // accent 色彩光晕
  card: '0 4px 6px -1px rgb(0 0 0 / 0.1)', // 卡片阴影
} as const

/**
 * 动画时长系统
 * 基于现有组件中的动画时长提取
 */
export const durations = {
  // 基础时长
  instant: '0ms',
  fast: '150ms',     // 快速交互
  normal: '300ms',   // 常规交互
  slow: '500ms',     // 较慢动画
  slower: '700ms',   // 进入动画 (最常用)
  slowest: '1000ms', // 复杂动画
  
  // 语义化时长
  hover: '150ms',     // 悬浮效果
  click: '100ms',     // 点击反馈
  fade: '300ms',      // 淡入淡出
  slide: '500ms',     // 滑动效果
  entrance: '700ms',  // 入场动画
  loading: '1000ms',  // 加载动画
} as const

/**
 * 延迟系统
 * 用于交错动画和时序控制
 */
export const delays = {
  // 基础延迟 (基于现有组件中的交错延迟模式)
  none: '0ms',
  xs: '50ms',
  sm: '100ms',   // 最常用的基础延迟
  md: '200ms',   // 中等延迟  
  lg: '300ms',
  xl: '400ms',
  '2xl': '500ms',
  '3xl': '600ms',
  '4xl': '700ms',
  '5xl': '800ms',
  
  // 交错延迟计算
  stagger: {
    base: 100,    // 基础延迟 100ms
    increment: 100, // 每项递增 100ms
    max: 800,     // 最大延迟 800ms
  }
} as const

/**
 * 缓动函数
 * CSS 过渡缓动效果
 */
export const easing = {
  // 标准缓动
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out', // 最常用，基于现有组件
  easeInOut: 'ease-in-out',
  
  // 自定义缓动 (基于 cubic-bezier)
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',      // 平滑过渡
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // 弹性效果
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',       // 锐利过渡
} as const

/**
 * 断点系统
 * 响应式设计断点
 */
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',  // 平板
  lg: '1024px', // 桌面
  xl: '1280px', // 大桌面
  '2xl': '1536px', // 超大桌面
} as const

/**
 * Z-index 层级系统
 * 统一管理层叠顺序
 */
export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
  max: 9999,
} as const

/**
 * 网格系统
 * 基于现有组件中的网格布局模式
 */
export const grid = {
  // 列数配置
  columns: {
    auto: 'repeat(auto-fit, minmax(300px, 1fr))',
    responsive: {
      sm: 1,   // 移动端 1 列
      md: 2,   // 平板 2 列  
      lg: 3,   // 桌面 3 列
    },
    compact: {
      sm: 1,   // 移动端 1 列
      md: 3,   // 平板及以上 3 列
    }
  },
  
  // 间隙配置
  gaps: {
    sm: '0.75rem',  // 3
    md: '1rem',     // 4 - 默认
    lg: '1.5rem',   // 6
    xl: '2rem',     // 8
  },
  
  // 最小列宽
  minColumnWidth: {
    sm: '250px',
    md: '300px',    // 默认
    lg: '350px',
  }
} as const

/**
 * 字体系统
 * 统一的字体配置
 */
export const typography = {
  // 字体族
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  
  // 字体大小 (基于现有组件中的标题层级)
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px - h1 标题
  },
  
  // 行高
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
  
  // 字重
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
} as const

/**
 * 动画预设
 * 常用动画组合配置
 */
export const animations = {
  // 入场动画 (基于现有组件模式)
  fadeInUp: {
    duration: durations.entrance,
    easing: easing.easeOut,
    from: 'opacity-0 translate-y-10',
    to: 'opacity-100 translate-y-0',
  },
  
  slideInLeft: {
    duration: durations.entrance, 
    easing: easing.easeOut,
    from: 'opacity-0 -translate-x-10',
    to: 'opacity-100 translate-x-0',
  },
  
  slideInRight: {
    duration: durations.entrance,
    easing: easing.easeOut,
    from: 'opacity-0 translate-x-10', 
    to: 'opacity-100 translate-x-0',
  },
  
  scaleIn: {
    duration: durations.slow,
    easing: easing.easeOut,
    from: 'opacity-0 scale-95',
    to: 'opacity-100 scale-100',
  },
  
  // 交互动画
  hover: {
    duration: durations.hover,
    easing: easing.easeOut,
  },
  
  // 加载动画
  loading: {
    duration: durations.loading,
    easing: easing.linear,
  }
} as const

// 导出所有令牌的类型
export type SpacingToken = keyof typeof spacing
export type RadiusToken = keyof typeof radius  
export type ShadowToken = keyof typeof shadows
export type DurationToken = keyof typeof durations
export type DelayToken = keyof typeof delays
export type EasingToken = keyof typeof easing
