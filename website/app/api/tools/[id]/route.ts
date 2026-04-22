import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 验证 ID 参数
    if (!id) {
      return NextResponse.json(
        { error: '缺少工具 ID 参数' },
        { status: 400 }
      )
    }

    // 定义支持的工具 ID 和对应的文件名
    const toolFiles: Record<string, string> = {
      'execute': 'execute.md',
      'neovim': 'neovim.md', 
      'zsh': 'zsh.md'
    }

    // 检查工具 ID 是否有效
    if (!toolFiles[id]) {
      return NextResponse.json(
        { error: `工具 '${id}' 不存在` },
        { status: 404 }
      )
    }

    // 构建文件路径
    const filePath = path.join(process.cwd(), 'content', 'tools', toolFiles[id])
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `工具文档文件不存在: ${toolFiles[id]}` },
        { status: 404 }
      )
    }

    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // 返回内容
    return NextResponse.json({
      id,
      filename: toolFiles[id],
      content,
      length: content.length
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
