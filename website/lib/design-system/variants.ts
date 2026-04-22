/**
 * 设计系统 - 样式变体
 * 统一管理所有组件的样式变体，提高一致性和可维护性
 */

import { cva } from "class-variance-authority"

/**
 * 卡片样式变体
 * 基于现有组件中的 card-hover 等样式模式提取
 */
export const cardVariants = cva(
  // 基础样式
  "rounded-lg border transition-all duration-300",
  {
    variants: {
      variant: {
        // 悬浮效果卡片 (最常用，从 card-hover 提取)
        hover: "border-secondary bg-secondary/20 card-hover",
        // 平面卡片
        flat: "border-secondary bg-secondary/10",
        // 高亮卡片  
        elevated: "border-secondary bg-secondary/30 shadow-lg card-hover",
        // 边框卡片
        outline: "border-secondary bg-transparent hover:bg-secondary/5 card-hover",
        // 渐变卡片
        gradient: "border-secondary bg-gradient-to-br from-secondary/20 to-secondary/10 card-hover",
      },
      padding: {
        sm: "p-4",
        md: "p-6", 
        lg: "p-8",
      },
      shadow: {
        none: "",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
      }
    },
    defaultVariants: {
      variant: "hover",
      padding: "md",
      shadow: "none",
    },
  }
)

/**
 * 动画变体
 * 基于现有组件中的 inView 动画模式提取
 */
export const animationVariants = cva(
  // 基础过渡样式
  "transition-all ease-out",
  {
    variants: {
      type: {
        // 从下方淡入 (最常用模式)
        fadeInUp: "duration-700",
        // 从左侧滑入
        slideInLeft: "duration-700",
        // 从右侧滑入  
        slideInRight: "duration-700",
        // 缩放淡入
        scaleIn: "duration-500",
        // 快速淡入
        fadeIn: "duration-300",
      },
      state: {
        // 隐藏状态
        hidden: "opacity-0 translate-y-10",
        hiddenLeft: "opacity-0 -translate-x-10", 
        hiddenRight: "opacity-0 translate-x-10",
        hiddenScale: "opacity-0 scale-95",
        // 显示状态  
        visible: "opacity-100 translate-y-0",
        visibleX: "opacity-100 translate-x-0",
        visibleScale: "opacity-100 scale-100",
      }
    },
    defaultVariants: {
      type: "fadeInUp",
      state: "hidden",
    },
    compoundVariants: [
      // 组合变体：从下方淡入
      {
        type: "fadeInUp",
        state: "visible",
        class: "opacity-100 translate-y-0",
      },
      // 组合变体：从左侧滑入
      {
        type: "slideInLeft", 
        state: "visible",
        class: "opacity-100 translate-x-0",
      },
      // 组合变体：从右侧滑入
      {
        type: "slideInRight",
        state: "visible", 
        class: "opacity-100 translate-x-0",
      },
      // 组合变体：缩放淡入
      {
        type: "scaleIn",
        state: "visible",
        class: "opacity-100 scale-100",
      },
    ]
  }
)

/**
 * 网格布局变体
 * 基于现有组件中重复的网格布局逻辑提取
 */
export const gridVariants = cva(
  "grid gap-4",
  {
    variants: {
      columns: {
        // 响应式网格 (1/2/3列)
        responsive: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        // 紧密网格 (1/3列)
        compact: "grid-cols-1 md:grid-cols-3", 
        // 两列网格
        two: "grid-cols-1 md:grid-cols-2",
        // 三列网格
        three: "grid-cols-1 md:grid-cols-3",
        // 四列网格
        four: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        // 自适应网格
        auto: "grid-cols-[repeat(auto-fit,minmax(300px,1fr))]",
      },
      gap: {
        sm: "gap-3",
        md: "gap-4",
        lg: "gap-6", 
        xl: "gap-8",
      }
    },
    defaultVariants: {
      columns: "responsive",
      gap: "md",
    },
  }
)

/**
 * 按钮样式变体扩展
 * 扩展 shadcn/ui 的按钮样式
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // 新增变体
        accent: "bg-accent text-accent-foreground hover:bg-accent/80",
        gradient: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8", 
        icon: "h-10 w-10",
        xs: "h-8 rounded-md px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * 图标容器变体
 * 统一图标样式和尺寸
 */
export const iconVariants = cva(
  "flex items-center justify-center rounded-full shrink-0 transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "bg-accent/15 text-accent border border-accent/20 hover:bg-accent/25",
        muted: "bg-muted/50 text-muted-foreground border border-border/50 hover:bg-muted",
        primary: "bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25",
        secondary: "bg-secondary/70 text-secondary-foreground border border-border hover:bg-secondary",
        outline: "border-2 border-accent/30 text-accent bg-transparent hover:bg-accent/10",
      },
      size: {
        sm: "w-9 h-9 [&>svg]:w-4 [&>svg]:h-4",
        md: "w-11 h-11 [&>svg]:w-5 [&>svg]:h-5", 
        lg: "w-14 h-14 [&>svg]:w-7 [&>svg]:h-7",
        xl: "w-18 h-18 [&>svg]:w-9 [&>svg]:h-9",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

/**
 * 文本样式变体
 * 统一标题和文本样式
 */
export const textVariants = cva("", {
  variants: {
    variant: {
      h1: "text-4xl font-bold",
      h2: "text-2xl font-bold", 
      h3: "text-lg font-bold",
      h4: "text-base font-bold",
      body: "text-base",
      small: "text-sm",
      muted: "text-sm text-muted-foreground",
      accent: "text-accent font-medium",
    }
  }
})
