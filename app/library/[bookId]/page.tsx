'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { Book, Note } from '../types'
import { getProgress, saveProgress, getNotes, saveNote, deleteNote } from '../lib'

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

export default function ReaderPage() {
  const params = useParams()
  const bookId = params.bookId as string

  const [book, setBook] = useState<Book | null>(null)
  const [currentChapterId, setCurrentChapterId] = useState<string>('')
  const [chapterContent, setChapterContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)

  // Notes
  const [notes, setNotes] = useState<Note[]>([])
  const [showNotePanel, setShowNotePanel] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null)

  const contentRef = useRef<HTMLDivElement>(null)

  // Load book
  useEffect(() => {
    if (!bookId) return
    fetch(`/api/library/book?id=${bookId}`)
      .then(res => res.json())
      .then(data => {
        setBook(data)
        // Check saved progress
        const progress = getProgress(bookId)
        const initialChapter = progress?.chapterId || data.chapters?.[0]?.id
        if (initialChapter) {
          setCurrentChapterId(initialChapter)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [bookId])

  // Load chapter content
  useEffect(() => {
    if (!bookId || !currentChapterId) return
    setContentLoading(true)
    fetch(`/api/library/chapter?bookId=${bookId}&chapterId=${currentChapterId}`)
      .then(res => res.json())
      .then(data => {
        setChapterContent(data.content || '')
        setContentLoading(false)
        // Save progress
        saveProgress(bookId, currentChapterId)
        // Load notes for this chapter
        setNotes(getNotes(bookId, currentChapterId))
      })
      .catch(() => {
        setChapterContent('')
        setContentLoading(false)
      })
  }, [bookId, currentChapterId])

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    if (text && text.length > 0) {
      setSelectedText(text)
      const range = selection?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()
      if (rect) {
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        })
      }
    } else {
      setSelectedText('')
      setSelectionPosition(null)
    }
  }, [])

  const handleAddNote = () => {
    if (!selectedText || !noteInput.trim()) return
    const note = saveNote(bookId, currentChapterId, {
      text: noteInput.trim(),
      selectedText,
      chapterId: currentChapterId,
    })
    setNotes(prev => [...prev, note])
    setNoteInput('')
    setSelectedText('')
    setSelectionPosition(null)
    setShowNotePanel(true)
  }

  const handleDeleteNote = (noteId: string) => {
    deleteNote(bookId, currentChapterId, noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  const currentChapterIndex = book?.chapters.findIndex(c => c.id === currentChapterId) ?? -1
  const hasPrev = currentChapterIndex > 0
  const hasNext = book ? currentChapterIndex < book.chapters.length - 1 : false

  if (loading) {
    return (
      <>
        <Nav />
        <main className="min-h-screen bg-white">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-4" />
            <div className="h-96 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        </main>
      </>
    )
  }

  if (!book) {
    return (
      <>
        <Nav />
        <main className="min-h-screen bg-white">
          <div className="max-w-5xl mx-auto px-4 py-8 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h1 className="text-xl font-bold mb-2">找不到这本书</h1>
            <Link href="/library" className="text-blue-600 hover:underline">
              返回图书馆
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white text-black">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link href="/library" className="text-sm text-gray-400 hover:text-black mb-1 inline-block">
                ← 返回书架
              </Link>
              <h1 className="text-2xl font-black tracking-tight">{book.title}</h1>
              <p className="text-gray-400 text-sm">{book.author}</p>
            </div>
            <button
              onClick={() => setShowNotePanel(!showNotePanel)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showNotePanel ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              笔记 ({notes.length})
            </button>
          </div>

          <div className="flex gap-6">
            {/* Sidebar - Chapter List */}
            <aside className="w-64 shrink-0">
              <div className="sticky top-6 border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <span className="text-sm font-bold">目录</span>
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {book.chapters.map((chapter, idx) => (
                    <button
                      key={chapter.id}
                      onClick={() => setCurrentChapterId(chapter.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${
                        currentChapterId === chapter.id
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xs text-gray-400 block mb-0.5">
                        {currentChapterId === chapter.id ? '' : `${idx + 1}.`}
                      </span>
                      <span className="text-sm font-medium">{chapter.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div
                ref={contentRef}
                onMouseUp={handleMouseUp}
                className="bg-gray-50 rounded-xl p-8 min-h-[600px] relative"
              >
                {contentLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${80 + Math.random() * 20}%` }} />
                    ))}
                  </div>
                ) : (
                  <article className="prose prose-gray max-w-none prose-headings:font-black prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-pre:bg-gray-900 prose-pre:text-gray-100">
                    <ReactMarkdown>{chapterContent}</ReactMarkdown>
                  </article>
                )}

                {/* Selection tooltip */}
                {selectedText && selectionPosition && (
                  <div
                    className="fixed z-50 bg-black text-white rounded-lg shadow-xl p-3 transform -translate-x-1/2 -translate-y-full"
                    style={{ left: selectionPosition.x, top: selectionPosition.y }}
                  >
                    <div className="text-xs mb-2 max-w-xs truncate">
                      选中: "{selectedText.slice(0, 50)}{selectedText.length > 50 ? '...' : ''}"
                    </div>
                    <input
                      type="text"
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      placeholder="添加笔记..."
                      className="w-full bg-gray-800 rounded px-2 py-1 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-white"
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddNote}
                        disabled={!noteInput.trim()}
                        className="flex-1 bg-white text-black rounded px-2 py-1 text-xs font-medium disabled:opacity-40"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setSelectedText('')
                          setSelectionPosition(null)
                        }}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chapter navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => hasPrev && setCurrentChapterId(book.chapters[currentChapterIndex - 1].id)}
                  disabled={!hasPrev}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← 上一章
                </button>
                <span className="text-sm text-gray-400">
                  {currentChapterIndex + 1} / {book.chapters.length}
                </span>
                <button
                  onClick={() => hasNext && setCurrentChapterId(book.chapters[currentChapterIndex + 1].id)}
                  disabled={!hasNext}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  下一章 →
                </button>
              </div>
            </div>

            {/* Notes Panel */}
            {showNotePanel && (
              <aside className="w-72 shrink-0">
                <div className="sticky top-6 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-bold">本章笔记</span>
                    <button
                      onClick={() => setShowNotePanel(false)}
                      className="text-gray-400 hover:text-black"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-gray-300">
                        <div className="text-2xl mb-2">📝</div>
                        <div className="text-xs">选中文字添加笔记</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notes.map(note => (
                          <div key={note.id} className="bg-yellow-50 rounded-lg p-3 group relative">
                            <div className="text-xs text-yellow-700 mb-1 italic">
                              "{note.selectedText.slice(0, 60)}{note.selectedText.length > 60 ? '...' : ''}"
                            </div>
                            <div className="text-sm">{note.text}</div>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            >
                              删除
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
