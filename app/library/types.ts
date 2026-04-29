export interface Chapter {
  id: string
  title: string
  file: string
}

export interface Book {
  id: string
  title: string
  author: string
  cover: string
  description: string
  chapters: Chapter[]
}

export interface Note {
  id: string
  text: string
  selectedText: string
  chapterId: string
  createdAt: string
}

export interface ReadingProgress {
  bookId: string
  chapterId: string
  updatedAt: string
}
