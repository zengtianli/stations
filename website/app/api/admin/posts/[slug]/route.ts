import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"

const blogDir = path.join(process.cwd(), "content/blog")

// GET /api/admin/posts/[slug] — Get post content
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const filePath = path.join(blogDir, `${slug}.md`)
    const fileContent = await fs.readFile(filePath, "utf8")
    const { data, content } = matter(fileContent)

    return NextResponse.json({
      slug,
      title: data.title || slug,
      date: data.date || "",
      excerpt: data.excerpt || "",
      tags: data.tags || [],
      image: data.image || "",
      published: data.published !== false,
      content: content.trim(),
    })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "ENOENT") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    console.error("Error reading post:", error)
    return NextResponse.json({ error: "Failed to read post" }, { status: 500 })
  }
}

// PUT /api/admin/posts/[slug] — Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const filePath = path.join(blogDir, `${slug}.md`)
    const body = await request.json()
    const { title, content, tags, excerpt, date, image } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // Verify file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const frontmatter: Record<string, unknown> = {
      title,
      date: date || new Date().toISOString().split("T")[0],
      excerpt: excerpt || "",
      tags: tags || [],
      published: true,
    }

    if (image) {
      frontmatter.image = image
    }

    const fileContent = matter.stringify(content, frontmatter)
    await fs.writeFile(filePath, fileContent, "utf8")

    return NextResponse.json({ slug, success: true })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

// DELETE /api/admin/posts/[slug] — Delete post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const filePath = path.join(blogDir, `${slug}.md`)

    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    await fs.unlink(filePath)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
