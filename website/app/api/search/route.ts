import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const dbPath = path.join(process.cwd(), 'data', 'search.db');
    const db = new Database(dbPath, { readonly: true });

    const results = db.prepare(`
      SELECT slug, url, title, description, category,
             snippet(search_index, 6, '<mark>', '</mark>', '...', 30) as snippet
      FROM search_index
      WHERE search_index MATCH ?
      ORDER BY rank
      LIMIT 20
    `).all(q + '*');

    db.close();
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ results: [], error: 'Search unavailable' });
  }
}
