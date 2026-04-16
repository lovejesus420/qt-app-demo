import { useState, useRef } from 'react'

interface Props {
  images: string[]
  initialIndex: number
  onClose: () => void
}

function getDistance(touches: React.TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

export default function ImageGalleryViewer({ images, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })

  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const lastTapRef = useRef<number>(0)

  function resetZoom() {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }

  function goTo(next: number) {
    setIndex(next)
    resetZoom()
  }

  function onTouchStart(e: React.TouchEvent) {
    e.stopPropagation()

    if (e.touches.length === 2) {
      pinchRef.current = { startDist: getDistance(e.touches), startScale: scale }
      dragRef.current = null
      swipeStartRef.current = null
    } else if (e.touches.length === 1) {
      const t = e.touches[0]
      swipeStartRef.current = { x: t.clientX, y: t.clientY }
      dragRef.current = { x: t.clientX, y: t.clientY }

      // 더블탭
      const now = Date.now()
      if (now - lastTapRef.current < 300) {
        scale > 1 ? resetZoom() : setScale(2.5)
        lastTapRef.current = 0
        return
      }
      lastTapRef.current = now
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (e.touches.length === 2 && pinchRef.current) {
      const newDist = getDistance(e.touches)
      const newScale = Math.max(1, Math.min(5, pinchRef.current.startScale * (newDist / pinchRef.current.startDist)))
      setScale(newScale)
    } else if (e.touches.length === 1 && scale > 1 && dragRef.current) {
      // 줌인 상태에서 패닝
      const dx = e.touches[0].clientX - dragRef.current.x
      const dy = e.touches[0].clientY - dragRef.current.y
      setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    // scale === 1 일 때는 swipe 감지를 위해 자연스럽게 흘려보냄
  }

  function onTouchEnd(e: React.TouchEvent) {
    e.stopPropagation()

    if (e.touches.length < 2) pinchRef.current = null

    if (e.touches.length === 0) {
      // scale 1 상태에서 좌우 스와이프 → 이미지 이동
      if (scale <= 1 && swipeStartRef.current) {
        const dx = e.changedTouches[0].clientX - swipeStartRef.current.x
        const dy = e.changedTouches[0].clientY - swipeStartRef.current.y
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0 && index < images.length - 1) goTo(index + 1)
          else if (dx > 0 && index > 0) goTo(index - 1)
        }
      }

      dragRef.current = null
      swipeStartRef.current = null
      if (scale < 1.05) resetZoom()
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#000', zIndex: 3000,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* 상단 헤더: 뒤로가기 + 페이지 표시 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
      }}>
        {/* 뒤로가기 화살표 */}
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#fff',
            cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '16px', fontWeight: 600,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          해석
        </button>

        {/* 페이지 표시 */}
        {images.length > 1 && (
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>
            {index + 1} / {images.length}
          </div>
        )}

        {/* 우측 여백 균형 */}
        <div style={{ width: '72px' }} />
      </div>

      {/* 이미지 영역 */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'none', overflow: 'hidden',
        }}
      >
        <img
          key={index}
          src={images[index]}
          alt={`해석 ${index + 1}`}
          draggable={false}
          style={{
            maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transformOrigin: 'center center',
            transition: pinchRef.current ? 'none' : 'transform 0.15s ease',
            userSelect: 'none', WebkitUserSelect: 'none',
          }}
        />
      </div>

      {/* 하단 도트 인디케이터 */}
      {images.length > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '8px',
          paddingBottom: '20px', paddingTop: '12px',
        }}>
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === index ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === index ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {/* 스와이프/핀치 힌트 */}
      {scale <= 1 && (
        <div style={{
          position: 'absolute',
          bottom: images.length > 1 ? '52px' : '20px',
          left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.35)', fontSize: '11px', whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {images.length > 1 ? '← 스와이프로 이동 →  ·  핀치로 확대' : '핀치로 확대 · 더블탭으로 2.5배'}
        </div>
      )}
    </div>
  )
}
