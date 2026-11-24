import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Expand, X, ImageOff } from 'lucide-react';
import { imageUrl } from '../../utils/imageUrl';
import './propertyGallery.css';

/**
 * Property photo gallery: main stage (blurred backdrop, no black bars), arrows,
 * counter, swipe + keyboard, thumbnails strip and a fullscreen viewer.
 *
 * @param {{ images: Array<{url: string, caption?: string}>, title?: string, index?: number, onIndexChange?: (i:number)=>void }} props
 */
export default function PropertyGallery({ images = [], title = 'Property', index, onIndexChange }) {
  const list = (images || [])
    .map((img) => ({ url: imageUrl(img), caption: typeof img === 'object' ? img?.caption || '' : '' }))
    .filter((img) => img.url);
  // Jo photos load nahi huin — unki jagah placeholder
  const [failed, setFailed] = useState(() => new Set());
  const markFailed = (url) => setFailed((prev) => (prev.has(url) ? prev : new Set([...prev, url])));
  const [inner, setInner] = useState(0);
  const current = Math.min(Math.max(index ?? inner, 0), Math.max(list.length - 1, 0));
  const [open, setOpen] = useState(false);
  const thumbsRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const swipe = useRef(null);

  const go = useCallback((i) => {
    if (!list.length) return;
    const next = (i + list.length) % list.length;
    setInner(next);
    onIndexChange?.(next);
  }, [list.length, onIndexChange]);
  const prev = useCallback(() => go(current - 1), [go, current]);
  const next = useCallback(() => go(current + 1), [go, current]);

  // Active thumbnail hamesha nazar mein
  useEffect(() => {
    const strip = thumbsRef.current;
    const el = strip?.children?.[current];
    if (!strip || !el) return;
    const left = el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [current]);

  // Thumbnail strip ke edges pe fade (aur bhi photos hain)
  const updateEdges = useCallback(() => {
    const s = thumbsRef.current;
    if (!s) return;
    setEdges({ left: s.scrollLeft > 4, right: s.scrollLeft + s.clientWidth < s.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges, list.length]);

  // Fullscreen: keyboard + body scroll lock
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, prev, next]);

  // Swipe (touch / pen)
  const onPointerDown = (e) => { swipe.current = { x: e.clientX, y: e.clientY, t: Date.now() }; };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return false;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) && Date.now() - s.t < 700) {
      if (dx < 0) next(); else prev();
      return true;
    }
    return false;
  };

  if (!list.length) {
    return (
      <div className="pg-empty">
        <div>
          <ImageOff size={22} style={{ display: 'block', margin: '0 auto 6px' }} />
          No photos yet
        </div>
      </div>
    );
  }

  const img = list[current];
  const multi = list.length > 1;

  const thumbs = (cls = 'pg-thumbs', withRef = true) => (
    <div
      className={cls}
      ref={withRef ? thumbsRef : undefined}
      onScroll={withRef ? updateEdges : undefined}
      role="tablist"
      aria-label="Photos"
    >
      {list.map((im, i) => (
        <button
          key={`${im.url}-${i}`}
          type="button"
          className="pg-thumb"
          role="tab"
          aria-current={i === current ? 'true' : undefined}
          aria-selected={i === current}
          aria-label={`Photo ${i + 1} of ${list.length}`}
          onClick={() => go(i)}
        >
          {failed.has(im.url)
            ? <span className="pg-thumb-broken"><ImageOff size={16} /></span>
            : <img src={im.url} alt="" loading="lazy" draggable="false" onError={() => markFailed(im.url)} />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="pg">
      <div
        className="pg-stage"
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label={`${title} photos`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
          if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
          if (e.key === 'Enter') setOpen(true);
        }}
        onPointerDown={onPointerDown}
        onPointerUp={(e) => { if (!onPointerUp(e) && e.target.tagName === 'IMG') setOpen(true); }}
      >
        {failed.has(img.url) ? (
          <div className="pg-broken">
            <ImageOff size={26} style={{ margin: '0 auto' }} />
            <span>This photo couldn’t load</span>
          </div>
        ) : (
          <>
            <div className="pg-backdrop" style={{ backgroundImage: `url("${img.url}")` }} aria-hidden="true" />
            <img key={img.url} className="pg-main" src={img.url} alt={img.caption || `${title} — photo ${current + 1}`} draggable="false" onError={() => markFailed(img.url)} />
          </>
        )}

        {img.caption && <span className="pg-chip pg-caption">{img.caption}</span>}
        {multi && (
          <>
            <button type="button" className="pg-nav prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); prev(); }} onPointerUp={(e) => e.stopPropagation()}>
              <ChevronLeft size={20} />
            </button>
            <button type="button" className="pg-nav next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); next(); }} onPointerUp={(e) => e.stopPropagation()}>
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <span className="pg-chip pg-count" aria-live="polite">{current + 1} / {list.length}</span>
        <button type="button" className="pg-chip pg-expand" onClick={() => setOpen(true)} onPointerUp={(e) => e.stopPropagation()} aria-label="View photos full screen">
          <Expand size={14} /> {multi ? 'View all' : 'Full screen'}
        </button>
      </div>

      {multi && (
        <div className="pg-thumbs-wrap" data-more-left={edges.left ? 'true' : undefined} data-more-right={edges.right ? 'true' : undefined}>
          {thumbs()}
        </div>
      )}

      {open && createPortal(
        <div className="pg-lightbox" role="dialog" aria-modal="true" aria-label={`${title} photos`} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="pg-lb-top">
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title} · {current + 1} / {list.length}{img.caption ? ` · ${img.caption}` : ''}
            </span>
            <button type="button" className="pg-lb-close" aria-label="Close" onClick={() => setOpen(false)} autoFocus>
              <X size={20} />
            </button>
          </div>
          <div
            className="pg-lb-stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            {failed.has(img.url)
              ? <div className="pg-broken"><ImageOff size={30} style={{ margin: '0 auto' }} /><span>This photo couldn’t load</span></div>
              : <img key={img.url} src={img.url} alt={img.caption || `${title} — photo ${current + 1}`} draggable="false" onError={() => markFailed(img.url)} />}
            {multi && (
              <>
                <button type="button" className="pg-nav prev" aria-label="Previous photo" onClick={prev}><ChevronLeft size={22} /></button>
                <button type="button" className="pg-nav next" aria-label="Next photo" onClick={next}><ChevronRight size={22} /></button>
              </>
            )}
          </div>
          {multi && thumbs('pg-lb-thumbs', false)}
        </div>,
        document.body
      )}
    </div>
  );
}
