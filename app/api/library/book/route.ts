import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const LIBRARY_PATH = process.env.LIBRARY_PATH
  || path.join(process.env.HOME || '', 'Projects', 'dashboard-me-library')

export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('id')
  if (!bookId) {
    return NextResponse.json({ error: 'Missing book id' }, { status: 400 })
  }

  const bookPath = path.join(LIBRARY_PATH, bookId, 'book.json')

  if (!fs.existsSync(bookPath)) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const book = JSON.parse(fs.readFileSync(bookPath, 'utf-8'))
  return NextResponse.json(book)
}
