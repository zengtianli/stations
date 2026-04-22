"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PostItem {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
}

export default function AdminPage() {
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/posts")
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (err) {
      console.error("Failed to fetch posts:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`确定要删除文章 "${title}" 吗？此操作不可撤销。`)) {
      return
    }

    setDeleting(slug)
    try {
      const res = await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" })
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.slug !== slug))
      } else {
        const data = await res.json()
        alert(`删除失败: ${data.error}`)
      }
    } catch (err) {
      console.error("Failed to delete:", err)
      alert("删除失败，请重试")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">博客管理</h1>
            <p className="text-muted-foreground mt-1">
              共 {posts.length} 篇文章
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="outline">返回网站</Button>
            </Link>
            <Link href="/admin/new">
              <Button>新建文章</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            加载中...
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              暂无文章，点击右上角新建第一篇吧。
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">文章列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {posts.map((post) => (
                  <div
                    key={post.slug}
                    className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm text-muted-foreground font-mono">
                          {post.date}
                        </span>
                        <Link
                          href={`/admin/edit/${post.slug}`}
                          className="font-medium hover:underline truncate"
                        >
                          {post.title}
                        </Link>
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/admin/edit/${post.slug}`}>
                        <Button variant="outline" size="sm">
                          编辑
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleting === post.slug}
                        onClick={() => handleDelete(post.slug, post.title)}
                      >
                        {deleting === post.slug ? "删除中..." : "删除"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
