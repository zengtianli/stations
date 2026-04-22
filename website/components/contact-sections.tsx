/**
 * 联系页组件集合
 * 包含：联系表单、联系方式
 */

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { contactConfig, ContactItem } from "@/lib/profile-config"

// ============== 联系表单 ==============
const contactFormSchema = z.object({
  name: z.string().min(2, "姓名至少需要2个字符").max(50, "姓名不能超过50个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  subject: z.string().min(2, "主题至少需要2个字符").max(100, "主题不能超过100个字符"),
  message: z.string().min(5, "消息至少需要5个字符").max(1000, "消息不能超过1000个字符"),
})

type ContactFormData = z.infer<typeof contactFormSchema>
type SubmitStatus = "idle" | "loading" | "success" | "error"

export function ContactForm() {
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setSubmitStatus("loading")
    setErrorMessage("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "发送失败，请稍后再试")

      setSubmitStatus("success")
      reset()
      setTimeout(() => setSubmitStatus("idle"), 3000)
    } catch (error) {
      setSubmitStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "发送失败，请稍后再试")
      setTimeout(() => { setSubmitStatus("idle"); setErrorMessage("") }, 5000)
    }
  }

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">发送消息</h2>
        <p className="text-muted-foreground">填写下方表单，我会尽快回复您</p>
      </div>

      <Card className="max-w-2xl mx-auto border-secondary">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input id="name" placeholder="请输入您的姓名" {...register("name")} disabled={submitStatus === "loading"} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱 *</Label>
              <Input id="email" type="email" placeholder="your.email@example.com" {...register("email")} disabled={submitStatus === "loading"} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">主题 *</Label>
              <Input id="subject" placeholder="关于..." {...register("subject")} disabled={submitStatus === "loading"} />
              {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">消息 *</Label>
              <Textarea id="message" placeholder="请输入您的消息..." rows={6} {...register("message")} disabled={submitStatus === "loading"} />
              {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
            </div>

            <div className="flex flex-col items-center space-y-4">
              <Button type="submit" size="lg" disabled={submitStatus === "loading" || submitStatus === "success"} className="w-full sm:w-auto min-w-[200px]">
                {submitStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitStatus === "success" && <CheckCircle2 className="mr-2 h-4 w-4" />}
                {submitStatus === "loading" ? "发送中..." : submitStatus === "success" ? "发送成功" : "发送消息"}
              </Button>

              {submitStatus === "success" && (
                <div className="flex items-center text-green-500 text-sm">
                  <CheckCircle2 className="mr-2 h-4 w-4" />感谢您的消息！我会尽快回复。
                </div>
              )}
              {submitStatus === "error" && (
                <div className="flex items-center text-destructive text-sm">
                  <XCircle className="mr-2 h-4 w-4" />{errorMessage}
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

// ============== 联系方式 ==============
export function ContactInfo() {
  const renderContent = (item: ContactItem) => {
    const baseClasses = "text-muted-foreground hover:text-accent transition-colors underline"
    switch (item.type) {
      case "email":
        return <a href={item.href} className={baseClasses}>{item.content}</a>
      case "phone":
        return <a href={item.href} className={baseClasses}>{item.content}</a>
      case "link":
        return <Link href={item.href!} target="_blank" rel="noopener noreferrer" className={baseClasses}>{item.content}</Link>
      default:
        return <p className="text-muted-foreground">{item.content}</p>
    }
  }

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">{contactConfig.title}</h2>
        <p className="text-muted-foreground">{contactConfig.description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contactConfig.contacts.map((item: ContactItem, index: number) => (
          <Card key={index} className="text-center border-secondary bg-secondary/10 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                <item.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              {renderContent(item)}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

