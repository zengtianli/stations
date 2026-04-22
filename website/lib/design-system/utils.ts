/**
 * 设计系统 - 工具函数
 * 从现有组件中提取的重复逻辑，提供统一的工具函数
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { delays } from "./tokens"

/**
 * 样式类名合并工具 (继承自 lib/utils.ts)
 * 结合 clsx 和 tailwind-merge 的功能
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 智能网格列数计算
 * 基于现有组件中重复的 getGridCols 逻辑提取
 * @param itemCount 项目数量
 * @param strategy 布局策略
 * @returns Tailwind CSS 网格类名
 */
export function getGridColumns(
  itemCount: number,
  strategy: 'optimal' | 'responsive' | 'compact' | 'two-column' | 'three-column' = 'optimal'
): string {
  switch (strategy) {
    case 'optimal':
      // 原有逻辑：根据数量优化布局
      if (itemCount % 3 === 0) return "md:grid-cols-3"
      if (itemCount % 2 === 0) return "md:grid-cols-2"
      return "md:grid-cols-3" // 默认3列
    
    case 'responsive':
      // 响应式：1/2/3列
      return "md:grid-cols-2 lg:grid-cols-3"
    
    case 'compact':
      // 紧密布局：1/3列
      return "md:grid-cols-3"
    
    case 'two-column':
      // 固定2列
      return "md:grid-cols-2"
    
    case 'three-column':
      // 固定3列
      return "md:grid-cols-3"
    
    default:
      return "md:grid-cols-3"
  }
}

/**
 * 完整网格布局类名生成
 * @param itemCount 项目数量
 * @param options 配置选项
 * @returns 完整的网格布局类名
 */
export function getGridLayout(
  itemCount: number,
  options: {
    strategy?: 'optimal' | 'responsive' | 'compact' | 'two-column' | 'three-column'
    gap?: 'sm' | 'md' | 'lg' | 'xl'
    baseColumns?: string
  } = {}
): string {
  const { strategy = 'optimal', gap = 'md', baseColumns = 'grid-cols-1' } = options
  
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }
  
  return cn(
    'grid',
    baseColumns,
    getGridColumns(itemCount, strategy),
    gapClasses[gap]
  )
}

/**
 * 交错动画延迟计算
 * 基于现有组件中的延迟模式提取 (index * baseDelay)
 * @param index 项目索引
 * @param baseDelay 基础延迟值 (ms)
 * @param maxDelay 最大延迟值 (ms)
 * @returns 延迟值 (ms)
 */
export function getStaggerDelay(
  index: number,
  baseDelay: number = delays.stagger.base,
  maxDelay: number = delays.stagger.max
): number {
  const delay = index * baseDelay
  return Math.min(delay, maxDelay)
}

/**
 * 交错动画延迟类名生成
 * 生成 Tailwind CSS delay 类名
 * @param index 项目索引
 * @param baseDelay 基础延迟值 (ms)
 * @param maxDelay 最大延迟值 (ms)
 * @returns Tailwind delay 类名
 */
export function getStaggerDelayClass(
  index: number,
  baseDelay: number = delays.stagger.base,
  maxDelay: number = delays.stagger.max
): string {
  const delayMs = getStaggerDelay(index, baseDelay, maxDelay)
  return `delay-[${delayMs}ms]`
}

/**
 * 动画状态类名生成
 * 基于现有组件中的 inView 条件逻辑提取
 * @param isVisible 是否可见
 * @param animationType 动画类型
 * @param duration 动画持续时间
 * @param easing 缓动函数
 * @returns 动画状态类名
 */
export function getAnimationClasses(
  isVisible: boolean,
  animationType: 'fadeInUp' | 'slideInLeft' | 'slideInRight' | 'scaleIn' | 'fadeIn' = 'fadeInUp',
  duration: string = 'duration-700',
  easing: string = 'ease-out'
): string {
  const baseTransition = `transition-all ${duration} ${easing}`
  
  const animationStates = {
    fadeInUp: {
      hidden: 'opacity-0 translate-y-10',
      visible: 'opacity-100 translate-y-0',
    },
    slideInLeft: {
      hidden: 'opacity-0 -translate-x-10', 
      visible: 'opacity-100 translate-x-0',
    },
    slideInRight: {
      hidden: 'opacity-0 translate-x-10',
      visible: 'opacity-100 translate-x-0',
    },
    scaleIn: {
      hidden: 'opacity-0 scale-95',
      visible: 'opacity-100 scale-100',
    },
    fadeIn: {
      hidden: 'opacity-0',
      visible: 'opacity-100',
    },
  }
  
  const states = animationStates[animationType]
  const stateClass = isVisible ? states.visible : states.hidden
  
  return cn(baseTransition, stateClass)
}

/**
 * 完整动画配置生成 (包含延迟)
 * 结合动画状态和交错延迟的完整解决方案
 * @param isVisible 是否可见
 * @param index 项目索引 (用于计算延迟)
 * @param options 配置选项
 * @returns 完整的动画类名
 */
export function getAnimationWithStagger(
  isVisible: boolean,
  index: number,
  options: {
    animationType?: 'fadeInUp' | 'slideInLeft' | 'slideInRight' | 'scaleIn' | 'fadeIn'
    baseDelay?: number
    maxDelay?: number
    duration?: string
    easing?: string
  } = {}
): string {
  const {
    animationType = 'fadeInUp',
    baseDelay = delays.stagger.base,
    maxDelay = delays.stagger.max,
    duration = 'duration-700',
    easing = 'ease-out',
  } = options
  
  const animationClasses = getAnimationClasses(isVisible, animationType, duration, easing)
  const delayClass = getStaggerDelayClass(index, baseDelay, maxDelay)
  
  return cn(animationClasses, delayClass)
}

/**
 * 样式变体组合工具
 * 安全地组合多个变体函数的结果
 * @param variants 变体函数结果数组
 * @returns 合并后的类名
 */
export function combineVariants(...variants: (string | undefined | null | false)[]): string {
  return cn(...variants.filter(Boolean))
}

/**
 * 响应式断点检测工具
 * 基于窗口宽度判断当前断点 (客户端使用)
 * @param width 窗口宽度
 * @returns 当前断点
 */
export function getCurrentBreakpoint(width: number): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  if (width >= 1536) return '2xl'
  if (width >= 1280) return 'xl'
  if (width >= 1024) return 'lg'
  if (width >= 768) return 'md'
  if (width >= 640) return 'sm'
  return 'xs'
}

/**
 * 卡片样式预设生成
 * 基于现有组件中常用的卡片样式组合
 * @param variant 卡片变体
 * @param withAnimation 是否包含动画
 * @param animationProps 动画配置
 * @returns 卡片样式类名
 */
export function getCardStyles(
  variant: 'hover' | 'flat' | 'elevated' | 'outline' = 'hover',
  withAnimation: boolean = false,
  animationProps?: {
    isVisible: boolean
    index?: number
    baseDelay?: number
  }
): string {
  // 基础卡片样式
  const baseStyles = {
    hover: "card-hover border-secondary bg-secondary/20",
    flat: "border-secondary bg-secondary/10",
    elevated: "border-secondary bg-secondary/30 shadow-lg", 
    outline: "border-secondary bg-transparent hover:bg-secondary/5",
  }
  
  let classes = baseStyles[variant]
  
  // 添加动画
  if (withAnimation && animationProps) {
    const { isVisible, index = 0, baseDelay = 100 } = animationProps
    const animationClasses = getAnimationWithStagger(isVisible, index, { baseDelay })
    classes = cn(classes, animationClasses)
  }
  
  return classes
}

/**
 * 主题相关的样式工具
 * 处理深色模式和主题切换
 */
export const themeUtils = {
  /**
   * 获取主题感知的颜色类名
   * @param lightClass 浅色模式类名
   * @param darkClass 深色模式类名
   * @returns 主题感知的类名
   */
  themeAware: (lightClass: string, darkClass: string) => `${lightClass} dark:${darkClass}`,
  
  /**
   * 获取主题感知的背景色
   * @param opacity 透明度
   * @returns 主题感知的背景色类名
   */
  themeBg: (opacity: number = 20) => `bg-secondary/${opacity}`,
  
  /**
   * 获取主题感知的边框色
   * @returns 主题感知的边框色类名
   */
  themeBorder: () => 'border-secondary',
}

/**
 * 调试工具
 * 开发环境下的样式调试辅助
 */
export const debugUtils = {
  /**
   * 添加调试边框 (仅在开发环境)
   * @param color 边框颜色
   * @returns 调试边框类名
   */
  debugBorder: (color: 'red' | 'blue' | 'green' | 'yellow' = 'red') => {
    if (process.env.NODE_ENV !== 'development') return ''
    return `border-2 border-${color}-500 border-dashed`
  },
  
  /**
   * 添加调试背景 (仅在开发环境)  
   * @param color 背景颜色
   * @returns 调试背景类名
   */
  debugBg: (color: 'red' | 'blue' | 'green' | 'yellow' = 'red') => {
    if (process.env.NODE_ENV !== 'development') return ''
    return `bg-${color}-100/50`
  },
}

// 导出常用的组合工具
export const stylePresets = {
  // 页面标题样式
  pageTitle: "text-4xl font-bold mb-8 text-center",
  
  // 章节标题样式  
  sectionTitle: "text-2xl font-bold mb-6",
  
  // 卡片内容样式
  cardContent: "p-6",
  
  // 网格容器样式
  gridContainer: "grid grid-cols-1 gap-4",
  
  // 按钮组样式
  buttonGroup: "flex items-center gap-2",
}

/**
 * 类型定义
 */
export type AnimationType = 'fadeInUp' | 'slideInLeft' | 'slideInRight' | 'scaleIn' | 'fadeIn'
export type GridStrategy = 'optimal' | 'responsive' | 'compact' | 'two-column' | 'three-column'
export type CardVariant = 'hover' | 'flat' | 'elevated' | 'outline'
