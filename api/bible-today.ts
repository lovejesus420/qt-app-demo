import type { VercelRequest, VercelResponse } from '@vercel/node'
import https from 'https'

const HOST = 'sum.su.or.kr'
const PORT = 8888
const QT_TYPE = 'QT2' // 청소년 매일성경
const BIBLE_ATTACH_BASE = `https://${HOST}:${PORT}/Bible_Attach/${QT_TYPE}`

/** 자체 서명 인증서 허용 Agent */
const agent = new https.Agent({ rejectUnauthorized: false })

function postJson(path: string, body: Record<string, string>): Promise<unknown> {
  const payload = JSON.stringify(body).replace(/"/g, "'")
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: HOST,
      port: PORT,
      path,
      method: 'POST',
      agent,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: `https://${HOST}:${PORT}/bible/today`,
      },
    }

    const chunks: Buffer[] = []
    const req = https.request(options, (res) => {
      res.on('data', (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')))
        } catch (e) {
          reject(new Error('JSON 파싱 실패'))
        }
      })
    })

    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('요청 시간 초과')) })
    req.write(payload)
    req.end()
  })
}

function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  const date = (req.query.date as string) || getTodayString()

  try {
    // 1. 제목·날짜·bibleType 가져오기
    const top = await postJson('/Ajax/Bible/BodyTop', { qt_ty: QT_TYPE, Base_de: date }) as Record<string, unknown>

    const bibleType = String(top.Bible_type ?? '2')
    const rawTitle = String(top.Front_book_nm ?? '청소년 매일성경').replace(/<br\s*\/?>/gi, ' ').trim()
    const reference = String(top.Bible_chapter ?? '') // e.g. "24:28 - 24:49"
    const bibleName = String(top.Bible_name ?? '')    // e.g. "창세기(Genesis)"

    // 2. 성경 본문 구절 가져오기
    const versesRaw = await postJson('/Ajax/Bible/BodyBible', { qt_ty: QT_TYPE, Base_de: date }) as Array<Record<string, unknown>>

    const verses = (Array.isArray(versesRaw) ? versesRaw : []).map((v) => ({
      num: String(v.Verse ?? ''),
      text: String(v.Bible_Cn ?? ''),
    }))

    // 3. 해석 가져오기 (청소년은 이미지 타입)
    const cont = await postJson('/Ajax/Bible/BodyBibleCont', {
      qt_ty: QT_TYPE,
      Base_de: date,
      Bibletype: bibleType,
    }) as Record<string, unknown>

    let commentary = ''
    const questions: string[] = []
    const commentaryImages: string[] = []

    if (bibleType === '1') {
      // 텍스트 해석
      if (cont.Qt_Brf) commentary += String(cont.Qt_Brf) + '\n\n'
      for (const key of ['Qt_a1', 'Qt_a2', 'Qt_a3', 'Qt_a4'] as const) {
        const qKey = key.replace('_a', '_q') + '_str'
        if (cont[qKey]) questions.push(String(cont[qKey]))
        if (cont[key]) commentary += String(cont[key]) + '\n\n'
      }
      commentary = commentary.trim()
    } else {
      // 이미지 해석 (청소년 매일성경)
      for (const key of ['Qt_a1', 'Qt_a2', 'Qt_a3', 'Qt_a4'] as const) {
        const val = cont[key]
        if (val && String(val).trim()) {
          commentaryImages.push(`${BIBLE_ATTACH_BASE}/${String(val).trim()}`)
        }
      }
    }

    res.status(200).json({
      title: rawTitle,
      bibleName,
      reference,
      date,
      verses,
      commentary,
      questions,
      commentaryImages,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    console.error('bible-today error:', message)
    res.status(500).json({ error: '말씀을 불러오지 못했습니다', detail: message })
  }
}
