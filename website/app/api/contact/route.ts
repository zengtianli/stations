import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"

// 验证 schema
const contactSchema = z.object({
  name: z.string().min(2, "姓名至少需要2个字符").max(50, "姓名不能超过50个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  subject: z.string().min(2, "主题至少需要2个字符").max(100, "主题不能超过100个字符"),
  message: z.string().min(5, "消息至少需要5个字符").max(1000, "消息不能超过1000个字符"),
})

// 简单的 rate limiting (内存存储，适合小规模使用)
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 5 // 每小时最多 5 次请求

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  
  // 清理过期的时间戳
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
  
  if (validTimestamps.length >= MAX_REQUESTS) {
    return false
  }
  
  validTimestamps.push(now)
  rateLimitMap.set(ip, validTimestamps)
  
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || "unknown"
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      )
    }

    // 解析请求体
    const body = await request.json()

    // 验证数据
    const validatedData = contactSchema.parse(body)

    // 检查是否配置了 Resend API Key
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured")
      return NextResponse.json(
        { error: "邮件服务未配置，请联系管理员" },
        { status: 500 }
      )
    }

    // 初始化 Resend 客户端（在请求时初始化，避免构建时错误）
    const resend = new Resend(process.env.RESEND_API_KEY)

    // 发送邮件
    const { name, email, subject, message } = validatedData
    const recipientEmail = process.env.CONTACT_EMAIL || "zengtianli1@gmail.com"

    try {
      await resend.emails.send({
        from: "Portfolio Contact Form <onboarding@resend.dev>", // Resend 默认发件地址
        to: recipientEmail,
        replyTo: email, // 设置回复地址为提交者的邮箱
        subject: `[网站留言] ${subject}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
                .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
                .label { font-weight: bold; color: #6b7280; }
                .message-box { background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6; margin-top: 15px; white-space: pre-wrap; }
                .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2 style="margin: 0;">新的网站留言</h2>
                </div>
                <div class="content">
                  <div class="info-row">
                    <span class="label">姓名：</span>
                    <span>${name}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">邮箱：</span>
                    <span><a href="mailto:${email}">${email}</a></span>
                  </div>
                  <div class="info-row">
                    <span class="label">主题：</span>
                    <span>${subject}</span>
                  </div>
                  <div class="message-box">
                    <div class="label" style="margin-bottom: 10px;">消息内容：</div>
                    <div>${message.replace(/\n/g, '<br>')}</div>
                  </div>
                </div>
                <div class="footer">
                  <p>此邮件由网站联系表单自动发送</p>
                  <p>时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
                </div>
              </div>
            </body>
          </html>
        `,
      })

      return NextResponse.json(
        { success: true, message: "消息发送成功" },
        { status: 200 }
      )
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
      return NextResponse.json(
        { error: "邮件发送失败，请稍后再试" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Contact form error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "提交的数据格式不正确", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "服务器错误，请稍后再试" },
      { status: 500 }
    )
  }
}

