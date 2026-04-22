import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"

const blogDir = path.join(process.cwd(), "content/blog")

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// GET /api/admin/posts — List all blog posts
export async function GET() {
  try {
    await fs.mkdir(blogDir, { recursive: true })
    const files = await fs.readdir(blogDir)
    const mdFiles = files.filter((f) => f.endsWith(".md"))

    const posts = await Promise.all(
      mdFiles.map(async (filename) => {
        const slug = filename.replace(/\.md$/, "")
        const content = await fs.readFile(path.join(blogDir, filename), "utf8")
        const { data } = matter(content)
        return {
          slug,
          title: data.title || slug,
          date: data.date || "",
          excerpt: data.excerpt || "",
          tags: data.tags || [],
        }
      })
    )

    // Sort by date descending
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Error listing posts:", error)
    return NextResponse.json({ error: "Failed to list posts" }, { status: 500 })
  }
}

// POST /api/admin/posts — Create new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, tags, excerpt, date } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    const slug = generateSlug(title)
    const filePath = path.join(blogDir, `${slug}.md`)

    // Check if file already exists
    try {
      await fs.access(filePath)
      return NextResponse.json(
        { error: `Post with slug "${slug}" already exists` },
        { status: 409 }
      )
    } catch {
      // File doesn't exist, good to proceed
    }

    const frontmatter = {
      title,
      date: date || new Date().toISOString().split("T")[0],
      excerpt: excerpt || "",
      tags: tags || [],
      published: true,
    }

    const fileContent = matter.stringify(content, frontmatter)

    await fs.mkdir(blogDir, { recursive: true })
    await fs.writeFile(filePath, fileContent, "utf8")

    return NextResponse.json({ slug, success: true })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
