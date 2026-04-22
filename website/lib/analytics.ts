/**
 * 网站分析和性能监控工具
 */

// Web Vitals 类型定义
export interface WebVitalsMetric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  entries: PerformanceEntry[]
  navigationType: string
}

/**
 * 发送 Web Vitals 指标到分析服务
 */
export function reportWebVitals(metric: WebVitalsMetric) {
  // 在开发环境打印到控制台
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vitals:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    })
  }

  // 发送到 Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  }

  // 可以在这里添加其他分析服务
  // 例如：发送到自己的分析 API
  if (process.env.NEXT_PUBLIC_ANALYTICS_API) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }),
    }).catch(console.error)
  }
}

/**
 * 页面浏览事件
 */
export function trackPageView(url: string, title: string) {
  if (typeof window !== 'undefined') {
    // Google Analytics
    if ((window as any).gtag) {
      ;(window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: url,
        page_title: title,
      })
    }

    // 百度统计
    if ((window as any)._hmt) {
      ;(window as any)._hmt.push(['_trackPageview', url])
    }
  }
}

/**
 * 自定义事件追踪
 */
export function trackEvent(
  eventName: string,
  eventCategory: string,
  eventLabel?: string,
  eventValue?: number
) {
  if (typeof window !== 'undefined') {
    // Google Analytics
    if ((window as any).gtag) {
      ;(window as any).gtag('event', eventName, {
        event_category: eventCategory,
        event_label: eventLabel,
        value: eventValue,
      })
    }

    // 百度统计
    if ((window as any)._hmt) {
      ;(window as any)._hmt.push(['_trackEvent', eventCategory, eventName, eventLabel, eventValue])
    }

    // 开发环境日志
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Event:', {
        name: eventName,
        category: eventCategory,
        label: eventLabel,
        value: eventValue,
      })
    }
  }
}

/**
 * 追踪下载事件
 */
export function trackDownload(fileName: string, fileType: string) {
  trackEvent('download', 'engagement', `${fileType}: ${fileName}`)
}

/**
 * 追踪外部链接点击
 */
export function trackOutboundLink(url: string, label?: string) {
  trackEvent('click', 'outbound_link', label || url)
}

/**
 * 追踪搜索事件
 */
export function trackSearch(searchTerm: string, resultsCount: number) {
  trackEvent('search', 'engagement', searchTerm, resultsCount)
}

/**
 * 追踪表单提交
 */
export function trackFormSubmit(formName: string, success: boolean) {
  trackEvent(
    success ? 'form_submit_success' : 'form_submit_error',
    'engagement',
    formName
  )
}

/**
 * 追踪社交分享
 */
export function trackShare(platform: string, contentType: string, contentTitle: string) {
  trackEvent('share', 'engagement', `${platform}: ${contentType}`, undefined)
}

/**
 * 追踪错误
 */
export function trackError(errorMessage: string, errorStack?: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'exception', {
      description: errorMessage,
      fatal: false,
    })
  }

  // 在开发环境打印详细错误
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', errorMessage, errorStack)
  }
}

/**
 * 追踪用户停留时间
 */
export function trackTimeOnPage(pageName: string, timeInSeconds: number) {
  trackEvent('time_on_page', 'engagement', pageName, timeInSeconds)
}

/**
 * 追踪滚动深度
 */
export function setupScrollTracking() {
  if (typeof window === 'undefined') return

  const depths = [25, 50, 75, 100]
  const trackedDepths = new Set<number>()

  const handleScroll = () => {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY || window.pageYOffset
    const scrollPercentage = ((scrollTop + windowHeight) / documentHeight) * 100

    depths.forEach(depth => {
      if (scrollPercentage >= depth && !trackedDepths.has(depth)) {
        trackedDepths.add(depth)
        trackEvent('scroll', 'engagement', `${depth}%`, depth)
      }
    })
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  return () => window.removeEventListener('scroll', handleScroll)
}

