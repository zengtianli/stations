"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    tags: "",
    excerpt: "",
    content: "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`上传失败: ${data.error}`)
        return null
      }
      return data.url as string
    } catch {
      alert("上传失败，请重试")
      return null
    } finally {
      setUploading(false)
    }
  }

  const appendToContent = (text: string) => {
    setForm((prev) => ({
      ...prev,
      content: prev.content + (prev.content.endsWith("\n") || prev.content === "" ? "" : "\n") + text,
    }))
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    )
    for (const file of files) {
      const url = await uploadImage(file)
      if (url) {
        appendToContent(`![${file.name}](${url})\n`)
      }
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter((item) => item.type.startsWith("image/"))
    if (imageItems.length === 0) return

    e.preventDefault()
    for (const item of imageItems) {
      const file = item.getAsFile()
      if (!file) continue
      const url = await uploadImage(file)
      if (url) {
        appendToContent(`![image](${url})\n`)
      }
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("请输入标题")
      return
    }
    if (!form.content.trim()) {
      alert("请输入内容")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          excerpt: form.excerpt.trim(),
          date: new Date().toISOString().split("T")[0],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`保存失败: ${data.error}`)
        return
      }
      router.push("/admin")
    } catch {
      alert("保存失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">新建文章</h1>
          <div className="flex gap-3">
            <Link href="/admin">
              <Button variant="outline">取消</Button>
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "发布文章"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Meta fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">文章信息</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="文章标题"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tags">标签（逗号分隔）</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="标签1, 标签2, 标签3"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="excerpt">摘要</Label>
                  <Input
                    id="excerpt"
                    name="excerpt"
                    value={form.excerpt}
                    onChange={handleChange}
                    placeholder="文章摘要（可选）"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                内容（Markdown）
                {uploading && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    图片上传中...
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                onDrop={handleDrop}
                onPaste={handlePaste}
                onDragOver={(e) => e.preventDefault()}
                placeholder="在这里编写 Markdown 内容...&#10;&#10;支持拖拽或粘贴图片自动上传"
                className="min-h-[500px] font-mono text-sm leading-relaxed resize-y"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
