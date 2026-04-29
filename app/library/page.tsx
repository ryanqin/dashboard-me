'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Book } from './types'
import { getProgress } from './lib'

function Nav() {
  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-6">
      <span className="font-black text-lg tracking-tight">⚡ 个人面板</span>
      <div className="flex gap-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-black transition-colors">首页</Link>
        <Link href="/hardwork" className="hover:text-black transition-colors">苦功夫</Link>
        <Link href="/jobs" className="hover:text-black transition-colors">求职</Link>
        <Link href="/coding" className="hover:text-black transition-colors">刷题</Link>
        <Link href="/health" className="hover:text-black transition-colors">健康</Link>
        <Link href="/sculpt" className="hover:text-black transition-colors">塑型</Link>
        <Link href="/library" className="font-medium text-black">图书馆</Link>
        <Link href="/profile" className="hover:text-black transition-colors">档案</Link>
      </div>
    </nav>
  )
}

function BookCard({ book }: { book: Book }) {
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    const p = getProgress(book.id)
    if (p && book.chapters.length > 0) {
      const idx = book.chapters.findIndex(c => c.id === p.chapterId)
      setProgress(idx >= 0 ? Math.round(((idx + 1) / book.chapters.length) * 100) : 0)
    }
  }, [book])

  return (
    <Link
      href={`/library/${book.id}`}
      className="group block border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 hover:shadow-lg transition-all"
    >
      {/* Cover */}
      <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {book.cover && (book.cover.startsWith('/') || book.cover.startsWith('http')) ? (
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl opacity-70">{book.cover || '📚'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-bold text-lg leading-tight mb-1 group-hover:underline">
            {book.title}
          </h3>
          <p className="text-sm text-white/80">{book.author}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 bg-white">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-400">阅读进度</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  )
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/library/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white text-black">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight">图书馆</h1>
            <p className="text-gray-400 text-sm mt-0.5">我的虚拟书架</p>
          </div>

          {/* Book Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-20 text-gray-300">
              <div className="text-5xl mb-4">📚</div>
              <div className="text-sm">书架空空，快去添加书籍吧</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {books.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
