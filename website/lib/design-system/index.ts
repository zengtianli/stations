/**
 * 设计系统 - 统一导出
 * 提供设计系统的所有功能和配置
 */

// 样式变体
export {
  cardVariants,
  animationVariants,
  gridVariants,
  buttonVariants,
  iconVariants,
  textVariants,
} from './variants'

// 设计令牌
export {
  spacing,
  radius,
  shadows,
  durations,
  delays,
  easing,
  breakpoints,
  zIndex,
  grid,
  typography,
  animations,
  type SpacingToken,
  type RadiusToken,
  type ShadowToken,
  type DurationToken,
  type DelayToken,
  type EasingToken,
} from './tokens'

// 工具函数
export {
  cn,
  getGridColumns,
  getGridLayout,
  getStaggerDelay,
  getStaggerDelayClass,
  getAnimationClasses,
  getAnimationWithStagger,
  combineVariants,
  getCurrentBreakpoint,
  getCardStyles,
  themeUtils,
  debugUtils,
  stylePresets,
  type AnimationType,
  type GridStrategy,
  type CardVariant,
} from './utils'

// 便捷导出 - 最常用的功能
export {
  // 最常用的工具函数
  cn as clsx,
  getGridColumns as gridCols,
  getAnimationWithStagger as animateStagger,
  getCardStyles as cardStyles,
} from './utils'

// 最常用的令牌别名
export { durations as duration } from './tokens'
export { delays as delay } from './tokens'
export { spacing as space } from './tokens'

// 预设组合 (Ready-to-use combinations)
export const designSystem = {
  // 常用的卡片预设
  cards: {
    hover: "card-hover border-secondary bg-secondary/20",
    flat: "border-secondary bg-secondary/10", 
    elevated: "border-secondary bg-secondary/30 shadow-lg",
  },
  
  // 常用的动画预设
  animations: {
    fadeInUp: "opacity-100 translate-y-0 transition-all duration-700 ease-out",
    slideInLeft: "opacity-100 translate-x-0 transition-all duration-700 ease-out",
    slideInRight: "opacity-100 translate-x-0 transition-all duration-700 ease-out",
  },
  
  // 常用的网格预设
  grids: {
    responsive: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
    compact: "grid grid-cols-1 md:grid-cols-3 gap-4",
    two: "grid grid-cols-1 md:grid-cols-2 gap-4",
  },
  
  // 常用的文本样式
  typography: {
    pageTitle: "text-4xl font-bold mb-8 text-center",
    sectionTitle: "text-2xl font-bold mb-6",
    cardTitle: "text-lg font-bold mb-1",
    muted: "text-sm text-muted-foreground",
  },
}
