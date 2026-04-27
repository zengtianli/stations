import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const ALLOWED_ORIGIN_RE = /^https:\/\/([a-z0-9-]+\.)?tianlizeng\.cloud$/;

function corsHeaders(origin: string | null): Record<string, string> {
  if (origin && ALLOWED_ORIGIN_RE.test(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }
  return {};
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export async function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] }, { headers });
  }

  try {
    const dbPath = path.join(process.cwd(), 'data', 'search.db');
    const db = new Database(dbPath, { readonly: true });

    const results = db.prepare(`
      SELECT slug, url, title, description, category, site,
             snippet(search_index, 6, '<mark>', '</mark>', '...', 30) as snippet
      FROM search_index
      WHERE search_index MATCH ?
      ORDER BY rank
      LIMIT 20
    `).all(q + '*');

    db.close();
    return NextResponse.json({ results }, { headers });
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return NextResponse.json({ results: [], error: msg }, { headers });
  }
}
