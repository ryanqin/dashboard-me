import { Note, ReadingProgress } from './types'

// LocalStorage helpers — book + chapter content lives in markdown files served
// by the /api/library/* routes; only reading state is persisted in the browser.

const PROGRESS_KEY = (bookId: string) => `library_progress_${bookId}`
const NOTES_KEY = (bookId: string, chapterId: string) => `library_notes_${bookId}_${chapterId}`

export function getProgress(bookId: string): ReadingProgress | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(PROGRESS_KEY(bookId))
  return raw ? JSON.parse(raw) : null
}

export function saveProgress(bookId: string, chapterId: string): void {
  if (typeof window === 'undefined') return
  const progress: ReadingProgress = {
    bookId,
    chapterId,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(PROGRESS_KEY(bookId), JSON.stringify(progress))
}

export function getNotes(bookId: string, chapterId: string): Note[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(NOTES_KEY(bookId, chapterId))
  return raw ? JSON.parse(raw) : []
}

export function saveNote(bookId: string, chapterId: string, note: Omit<Note, 'id' | 'createdAt'>): Note {
  const notes = getNotes(bookId, chapterId)
  const newNote: Note = {
    ...note,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  notes.push(newNote)
  localStorage.setItem(NOTES_KEY(bookId, chapterId), JSON.stringify(notes))
  return newNote
}

export function deleteNote(bookId: string, chapterId: string, noteId: string): void {
  const notes = getNotes(bookId, chapterId).filter(n => n.id !== noteId)
  localStorage.setItem(NOTES_KEY(bookId, chapterId), JSON.stringify(notes))
}
