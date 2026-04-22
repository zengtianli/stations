/**
 * 统一样式配置
 * 所有组件的动画、过渡、间距等统一在这里定义
 */

// ============ 动画时长 ============
export const DURATION = {
  fast: 150,      // hover 效果、微交互
  normal: 300,    // 常规过渡
  slow: 500,      // 页面级动画、入场效果
} as const

// ============ 过渡类名 ============
export const TRANSITION = {
  /** 快速过渡 - 用于 hover、focus 效果 */
  fast: 'transition-all duration-150 ease-out',
  /** 常规过渡 - 用于大部分交互 */
  normal: 'transition-all duration-300 ease-out',
  /** 慢速过渡 - 用于入场动画 */
  slow: 'transition-all duration-500 ease-out',
  /** 仅颜色过渡 */
  colors: 'transition-colors duration-150 ease-out',
  /** 仅透明度过渡 */
  opacity: 'transition-opacity duration-300 ease-out',
  /** 仅变换过渡 */
  transform: 'transition-transform duration-300 ease-out',
} as const

// ============ 动画延迟间隔 ============
export const STAGGER = {
  fast: 30,       // 快速连续
  normal: 50,     // 常规间隔
  slow: 100,      // 明显间隔
} as const

// ============ 卡片 hover 效果 ============
export const CARD_HOVER = {
  /** 默认 hover 效果 */
  default: 'hover:shadow-lg hover:-translate-y-1',
  /** 轻微 hover 效果 */
  subtle: 'hover:shadow-md',
  /** 强调 hover 效果 */
  emphasis: 'hover:shadow-xl hover:-translate-y-2 hover:border-primary/30',
} as const

// ============ 常用组合类名 ============
export const STYLES = {
  /** 可点击元素的通用样式 */
  clickable: `${TRANSITION.fast} cursor-pointer`,
  
  /** 卡片基础样式 */
  card: `${TRANSITION.normal} ${CARD_HOVER.default}`,
  
  /** 链接样式 */
  link: `${TRANSITION.colors} hover:text-accent`,
  
  /** 按钮通用过渡 */
  button: TRANSITION.fast,
  
  /** 输入框 focus 过渡 */
  input: `${TRANSITION.fast} focus:ring-2 focus:ring-accent/50`,
} as const

// ============ 工具函数 ============

/**
 * 生成 stagger 延迟的 style 对象
 * @param index 元素索引
 * @param interval 间隔毫秒数，默认 50ms
 */
export function staggerDelay(index: number, interval: number = STAGGER.normal): React.CSSProperties {
  return { transitionDelay: `${index * interval}ms` }
}

/**
 * 生成动画延迟的 style 对象
 * @param index 元素索引
 * @param interval 间隔毫秒数，默认 50ms
 */
export function animationDelay(index: number, interval: number = STAGGER.normal): React.CSSProperties {
  return { animationDelay: `${index * interval}ms` }
}

