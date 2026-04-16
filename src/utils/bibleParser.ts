import type { BibleContent } from '../types'

const CACHE_KEY = 'bible_content_v2'
const CACHE_DATE_KEY = 'bible_cache_date_v2'

function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export async function fetchBibleContent(): Promise<BibleContent> {
  const today = getTodayString()

  // 같은 날이면 캐시 사용
  const cachedDate = localStorage.getItem(CACHE_DATE_KEY)
  const cachedContent = localStorage.getItem(CACHE_KEY)
  if (cachedDate === today && cachedContent) {
    try {
      return JSON.parse(cachedContent) as BibleContent
    } catch {
      // 캐시 파싱 실패 시 새로 가져오기
    }
  }

  const response = await fetch('/api/bible-today')
  if (!response.ok) throw new Error('성경 내용을 불러오지 못했어요')

  const data = await response.json()

  const content: BibleContent = {
    title: data.title ?? '청소년 매일성경',
    reference: [data.bibleName, data.reference].filter(Boolean).join(' '),
    date: data.date ?? today,
    verses: Array.isArray(data.verses) ? data.verses : [],
    commentary: data.commentary ?? '',
    questions: Array.isArray(data.questions) ? data.questions : [],
    commentaryImages: Array.isArray(data.commentaryImages) ? data.commentaryImages : [],
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify(content))
  localStorage.setItem(CACHE_DATE_KEY, today)

  return content
}
