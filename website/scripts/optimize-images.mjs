#!/usr/bin/env node

/**
 * 图片优化脚本
 * 将 public/images 目录下的图片转换为 WebP 格式并压缩
 * 
 * 使用方法：
 * pnpm add -D sharp
 * node scripts/optimize-images.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const INPUT_DIR = path.join(__dirname, '../public/images')
const OUTPUT_DIR = path.join(__dirname, '../public/images/optimized')

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png']

// 优化配置
const OPTIMIZATION_CONFIG = {
  webp: {
    quality: 85,
    effort: 6, // 0-6, 越高压缩越好但越慢
  },
  jpeg: {
    quality: 85,
    progressive: true,
  },
  png: {
    compressionLevel: 9,
    progressive: true,
  },
  // 响应式图片断点
  breakpoints: [640, 768, 1024, 1280, 1920],
}

/**
 * 确保输出目录存在
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

/**
 * 获取所有需要处理的图片文件
 */
function getAllImages(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      getAllImages(filePath, fileList)
    } else {
      const ext = path.extname(file).toLowerCase()
      if (SUPPORTED_FORMATS.includes(ext)) {
        fileList.push(filePath)
      }
    }
  })

  return fileList
}

/**
 * 优化单个图片
 */
async function optimizeImage(inputPath) {
  const relativePath = path.relative(INPUT_DIR, inputPath)
  const outputBasePath = path.join(OUTPUT_DIR, relativePath)
  const outputDir = path.dirname(outputBasePath)
  const baseName = path.basename(inputPath, path.extname(inputPath))

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log(`📸 优化图片: ${relativePath}`)

  try {
    const image = sharp(inputPath)
    const metadata = await image.metadata()

    // 生成 WebP 版本
    const webpPath = path.join(outputDir, `${baseName}.webp`)
    await image
      .webp(OPTIMIZATION_CONFIG.webp)
      .toFile(webpPath)
    
    const webpStat = fs.statSync(webpPath)
    console.log(`  ✅ WebP: ${(webpStat.size / 1024).toFixed(2)} KB`)

    // 生成响应式版本（可选）
    for (const width of OPTIMIZATION_CONFIG.breakpoints) {
      if (width < metadata.width) {
        const responsiveWebpPath = path.join(
          outputDir, 
          `${baseName}-${width}w.webp`
        )
        
        await sharp(inputPath)
          .resize(width)
          .webp(OPTIMIZATION_CONFIG.webp)
          .toFile(responsiveWebpPath)
        
        const stat = fs.statSync(responsiveWebpPath)
        console.log(`  📐 ${width}w: ${(stat.size / 1024).toFixed(2)} KB`)
      }
    }

    // 保留原格式的优化版本
    const ext = path.extname(inputPath).toLowerCase()
    const optimizedOriginalPath = path.join(outputDir, `${baseName}${ext}`)
    
    if (ext === '.jpg' || ext === '.jpeg') {
      await sharp(inputPath)
        .jpeg(OPTIMIZATION_CONFIG.jpeg)
        .toFile(optimizedOriginalPath)
    } else if (ext === '.png') {
      await sharp(inputPath)
        .png(OPTIMIZATION_CONFIG.png)
        .toFile(optimizedOriginalPath)
    }

    const originalSize = fs.statSync(inputPath).size
    const optimizedSize = fs.statSync(optimizedOriginalPath).size
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(2)
    
    console.log(`  💾 原格式优化: ${(optimizedSize / 1024).toFixed(2)} KB (节省 ${savings}%)`)
    console.log('')

  } catch (error) {
    console.error(`  ❌ 优化失败: ${error.message}`)
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始图片优化...\n')

  ensureOutputDir()
  const images = getAllImages(INPUT_DIR)

  console.log(`找到 ${images.length} 张图片需要优化\n`)

  for (const imagePath of images) {
    await optimizeImage(imagePath)
  }

  console.log('✨ 图片优化完成！')
  console.log(`📁 优化后的图片保存在: ${OUTPUT_DIR}`)
  console.log('\n💡 提示：')
  console.log('1. 请检查优化后的图片质量')
  console.log('2. 如果满意，可以替换原图片')
  console.log('3. 记得更新代码中的图片路径为 WebP 格式')
}

// 检查是否安装了 sharp
try {
  await import('sharp')
  main().catch(console.error)
} catch (error) {
  console.error('❌ 请先安装 sharp:')
  console.error('   pnpm add -D sharp')
  process.exit(1)
}

