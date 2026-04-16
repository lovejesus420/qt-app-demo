export interface UserProfile {
  uid: string
  username: string
  createdAt: number
  isAdmin?: boolean
}

export interface QTAnswer {
  text: string
  isPublic: boolean
}

export interface QTEntry {
  id: string
  userId: string
  username: string
  date: string // YYYY-MM-DD
  q1: QTAnswer // 마음을 다해 묵상했나요 (항상 공개)
  q2: QTAnswer // 해석 질문 답
  q3: QTAnswer // 개인적 느낀점
  submittedAt: number
}

export interface Comment {
  id: string
  entryId: string
  userId: string
  username: string
  text: string
  createdAt: number
}

export interface BibleVerse {
  num: string
  text: string
}

export interface BibleContent {
  title: string
  reference: string
  date: string
  verses: BibleVerse[]
  commentary: string
  questions: string[]
  /** 청소년 매일성경 해석 이미지 URL 목록 */
  commentaryImages: string[]
}
