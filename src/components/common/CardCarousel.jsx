import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { imageUrls } from '../../utils/imageUrl';
import './cardCarousel.css';

const MAX_DOTS = 5;

/**
 * Card ke andar photos ka carousel — left/right arrows, dots, swipe, keyboard.
 * Parent (card ki photo area) pe className "cc-host" lagao taa ke hover pe arrows dikhen.
 *
 * @param {{ images: string[], alt?: string, bottomOffset?: number }} props
 *   bottomOffset — dots / counter ko neeche wale banner (e.g. "Attention required") se upar rakhne ke liye
 */
export default function CardCarousel({ images = [], alt = '', bottomOffset = 10 }) {
  // Strings ya { url / watermarkedUrl } — dono chalte hain; duplicate URLs hata do
  const list = [...new Set(imageUrls(images))];
  const [failed, setFailed] = useState(() => new Set());
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(() => new Set([0, 1]));
  const swipe = useRef(null);
  const moved = useRef(false);
  const count = list.length;
  const i = Math.min(index, Math.max(count - 1, 0));

  const go = (n) => {
    const next = Math.max(0, Math.min(count - 1, n));
    setIndex(next);
    // Lazy: current + agli photo hi load karo
    setLoaded((prev) => (prev.has(next) && prev.has(next + 1) ? prev : new Set([...prev, next, next + 1])));
  };

  // Arrow click card ka link / edit page nahi kholta
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  const onPointerDown = (e) => { swipe.current = { x: e.clientX, y: e.clientY }; moved.current = false; };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || count < 2) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      moved.current = true;
      go(dx < 0 ? i + 1 : i - 1);
    }
  };
  // Swipe ke baad wala click link na khole
  const onClickCapture = (e) => { if (moved.current) { stop(e); moved.current = false; } };

  if (!count) return null;

  // Dots: 5 se zyada photos pe sliding window
  const start = count <= MAX_DOTS ? 0 : Math.min(Math.max(i - 2, 0), count - MAX_DOTS);
  const dots = Array.from({ length: Math.min(count, MAX_DOTS) }, (_, k) => start + k);

  return (
    <div
      className="cc"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onClickCapture={onClickCapture}
      onKeyDown={(e) => {
        if (count < 2) return;
        if (e.key === 'ArrowLeft') { stop(e); go(i - 1); }
        if (e.key === 'ArrowRight') { stop(e); go(i + 1); }
      }}
    >
      <div className="cc-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {list.map((src, k) => (
          <div className="cc-slide" key={`${src}-${k}`} aria-hidden={k !== i}>
            {loaded.has(k) && (failed.has(src)
              ? <span className="cc-broken"><ImageOff size={22} /></span>
              : (
                <img
                  src={src}
                  alt={k === 0 ? alt : `${alt} — photo ${k + 1}`}
                  loading={k === 0 ? 'eager' : 'lazy'}
                  draggable="false"
                  onError={() => setFailed((prev) => new Set([...prev, src]))}
                />
              ))}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" className="cc-arrow prev" aria-label="Previous photo" disabled={i === 0} onClick={(e) => { stop(e); go(i - 1); }}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="cc-arrow next" aria-label="Next photo" disabled={i === count - 1} onClick={(e) => { stop(e); go(i + 1); }}>
            <ChevronRight size={18} />
          </button>
          <div className="cc-dots" style={{ bottom: bottomOffset }} aria-hidden="true">
            {dots.map((d) => (
              <span
                key={d}
                className={`cc-dot${d === i ? ' active' : ''}${count > MAX_DOTS && (d === start || d === start + MAX_DOTS - 1) && d !== i && d !== 0 && d !== count - 1 ? ' small' : ''}`}
              />
            ))}
          </div>
          <span className="cc-count" style={{ bottom: bottomOffset - 1 }} aria-live="polite">{i + 1}/{count}</span>
        </>
      )}
    </div>
  );
}
