import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const LIBRARY_PATH = process.env.LIBRARY_PATH
  || path.join(process.env.HOME || '', 'Projects', 'dashboard-me-library')

export async function GET() {
  const books: object[] = []

  if (!fs.existsSync(LIBRARY_PATH)) {
    return NextResponse.json(books)
  }

  const dirs = fs.readdirSync(LIBRARY_PATH, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))

  for (const dir of dirs) {
    const bookPath = path.join(LIBRARY_PATH, dir.name, 'book.json')
    if (fs.existsSync(bookPath)) {
      const book = JSON.parse(fs.readFileSync(bookPath, 'utf-8'))
      books.push(book)
    }
  }

  return NextResponse.json(books)
}
