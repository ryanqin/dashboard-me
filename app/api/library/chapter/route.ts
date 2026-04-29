import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const LIBRARY_PATH = process.env.LIBRARY_PATH
  || path.join(process.env.HOME || '', 'Projects', 'dashboard-me-library')

export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('bookId')
  const chapterId = req.nextUrl.searchParams.get('chapterId')

  if (!bookId || !chapterId) {
    return NextResponse.json({ error: 'Missing bookId or chapterId' }, { status: 400 })
  }

  const bookPath = path.join(LIBRARY_PATH, bookId, 'book.json')
  if (!fs.existsSync(bookPath)) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const book = JSON.parse(fs.readFileSync(bookPath, 'utf-8'))
  const chapter = book.chapters?.find((c: { id: string }) => c.id === chapterId)

  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  // Defend against path traversal — chapter file must resolve inside the book dir.
  const bookDir = path.resolve(LIBRARY_PATH, bookId)
  const chapterPath = path.resolve(bookDir, chapter.file)
  if (!chapterPath.startsWith(bookDir + path.sep)) {
    return NextResponse.json({ error: 'Invalid chapter path' }, { status: 400 })
  }
  if (!fs.existsSync(chapterPath)) {
    return NextResponse.json({ error: 'Chapter file not found' }, { status: 404 })
  }

  const content = fs.readFileSync(chapterPath, 'utf-8')
  return NextResponse.json({ content })
}
