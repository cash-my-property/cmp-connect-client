import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  X,
  Send,
  Building,
  Radio,
  FileCheck,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const LAUNCHER_POS_KEY = 'cmp_askcmp_launcher_pos';
const DRAG_THRESHOLD = 5; // px of movement before a press counts as a drag
const EDGE_GAP = 8; // keep this far from the window edges

export default function AskCmpDrawer() {
  const { isAssistantOpen, setIsAssistantOpen, account, isLiveData } = useApp();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');

  // Greeting follows the signed-in user (account loads after mount, so it is derived, not stored)
  const firstName = (account?.fullName || account?.firstName || '').trim().split(' ')[0] || (isLiveData ? '' : 'Layla');
  const greeting = {
    sender: 'cmp',
    text: `Salam${firstName ? ` ${firstName}` : ''}! I am your CMP Connect Assistant. How can I assist your agency today?`
  };
  const thread = [greeting, ...messages];

  // ── Movable launcher ────────────────────────────────────────────────
  // Position is kept as distance from the right / bottom edges so it stays in place on resize,
  // and is remembered per browser.
  const launcherRef = useRef(null);
  const dragRef = useRef(null); // { startX, startY, right, bottom, moved }
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [launcherPos, setLauncherPos] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LAUNCHER_POS_KEY) || 'null');
      return saved && Number.isFinite(saved.right) && Number.isFinite(saved.bottom) ? saved : null;
    } catch {
      return null;
    }
  });

  const clampPos = useCallback((right, bottom) => {
    const el = launcherRef.current;
    const w = el?.offsetWidth || 120;
    const h = el?.offsetHeight || 44;
    return {
      right: Math.min(Math.max(EDGE_GAP, right), window.innerWidth - w - EDGE_GAP),
      bottom: Math.min(Math.max(EDGE_GAP, bottom), window.innerHeight - h - EDGE_GAP)
    };
  }, []);

  // Keep it on screen when the window shrinks
  useEffect(() => {
    if (!launcherPos) return undefined;
    const onResize = () => setLauncherPos((p) => (p ? clampPos(p.right, p.bottom) : p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [launcherPos, clampPos]);

  const handleLauncherPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const rect = launcherRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      right: window.innerWidth - rect.right,
      bottom: window.innerHeight - rect.bottom,
      moved: false
    };
    launcherRef.current.setPointerCapture?.(e.pointerId);
  };

  const handleLauncherPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return; // a click, not a drag (yet)
    d.moved = true;
    setIsDragging(true);
    setLauncherPos(clampPos(d.right - dx, d.bottom - dy));
  };

  const handleLauncherPointerUp = (e) => {
    const d = dragRef.current;
    dragRef.current = null;
    launcherRef.current?.releasePointerCapture?.(e.pointerId);
    if (!d?.moved) return;
    setIsDragging(false);
    suppressClickRef.current = true; // the click that follows a drag must not open the chat
    setLauncherPos((p) => {
      try {
        if (p) localStorage.setItem(LAUNCHER_POS_KEY, JSON.stringify(p));
      } catch {
        /* storage blocked: position just isn't remembered */
      }
      return p;
    });
  };

  const handleLauncherClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setIsAssistantOpen(true);
  };

  const resetLauncherPos = () => {
    setLauncherPos(null);
    try {
      localStorage.removeItem(LAUNCHER_POS_KEY);
    } catch {
      /* ignore */
    }
  };

  const quickPrompts = [
    'How do I lift my listing quality score to 90+?',
    'What happens when a Real-Time Offer clock ends?',
    'How do I renew an expired DLD permit?',
    'Explain the 10% buyer security cheque policy.'
  ];

  const handleSend = (userText) => {
    const textToSend = userText || inputVal;
    if (!textToSend.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMsgs);
    setInputVal('');

    setTimeout(() => {
      let botResponse =
        "I'm here to help you navigate Cash My Property's agency portal! Check the Compliance tab for permit issues or the Live Desk to manage Real-Time Offers.";

      const lower = textToSend.toLowerCase();
      if (lower.includes('quality') || lower.includes('score')) {
        botResponse =
          'To achieve a 90+ Quality Score: upload at least 8 high-res photos, write a 300+ word description, add a verified DLD permit number, pin the exact building on the map, and specify the built-up area.';
      } else if (lower.includes('clock') || lower.includes('real time') || lower.includes('real-time') || lower.includes('offer')) {
        botResponse =
          'When the Real-Time Offer clock reaches zero: if the highest offer is above the reserve price, the property is marked as Sold! For Reservation sales, the winning buyer has 28 days of exclusivity to exchange contracts.';
      } else if (lower.includes('permit') || lower.includes('dld')) {
        botResponse =
          'Under Dubai Land Department regulations, an active Trakheesi permit is mandatory for all advertising. Head to Properties > Compliance to upload renewal documents or update your RERA Form A.';
      } else if (lower.includes('cheque')) {
        botResponse =
          'Every registered buyer lodges a 10% security cheque before being permitted to make offers. If they do not win, their cheque must be returned within 48 hours via Real-Time Offer > Offers.';
      }

      setMessages((prev) => [...prev, { sender: 'cmp', text: botResponse }]);
    }, 450);
  };

  return (
    <>
      {/* Launcher Button — drag with mouse / touch to move it off content; a plain click opens the chat */}
      <button
        ref={launcherRef}
        type="button"
        className={`assistant-launcher${isDragging ? ' is-dragging' : ''}`}
        style={launcherPos ? { right: launcherPos.right, bottom: launcherPos.bottom } : undefined}
        onPointerDown={handleLauncherPointerDown}
        onPointerMove={handleLauncherPointerMove}
        onPointerUp={handleLauncherPointerUp}
        onPointerCancel={handleLauncherPointerUp}
        onDoubleClick={resetLauncherPos}
        onClick={handleLauncherClick}
        aria-label="Ask CMP Assistant (drag to move, double-click to reset position)"
        title="Drag to move · Double-click to reset"
      >
        <Sparkles size={17} style={{ color: 'var(--cmp-accent)' }} />
        <span>Ask CMP</span>
      </button>

      {/* Drawer */}
      {isAssistantOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setIsAssistantOpen(false)}
        >
          <div
            style={{
              width: 'min(450px, 100vw)',
              height: '100%',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid var(--cmp-border)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="row"
              style={{
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--cmp-border)',
                background: 'var(--cmp-surface)'
              }}
            >
              <div className="row" style={{ gap: '10px' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--cmp-brand-subtle)',
                    color: 'var(--cmp-brand)'
                  }}
                >
                  <Sparkles size={18} />
                </span>
                <div>
                  <h2 style={{ fontSize: '16px' }}>CMP Agency Assistant</h2>
                  <p className="faint" style={{ margin: 0, fontSize: '11.5px' }}>
                    Always active for portal advice & DLD rules
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setIsAssistantOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {thread.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    fontSize: '13.5px',
                    lineHeight: '1.45',
                    background:
                      m.sender === 'user'
                        ? 'var(--cmp-brand)'
                        : 'var(--cmp-surface-sunken)',
                    color:
                      m.sender === 'user'
                        ? 'var(--cmp-text-on-brand)'
                        : 'var(--cmp-text)',
                    border:
                      m.sender === 'user'
                        ? 'none'
                        : '1px solid var(--cmp-border)'
                  }}
                >
                  {m.text}
                </div>
              ))}

              {/* Quick Prompts */}
              <div style={{ marginTop: 'auto', paddingTop: '14px' }}>
                <p className="faint" style={{ margin: '0 0 8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Frequently Asked Questions
                </p>
                <div style={{ display: 'grid', gap: '6px' }}>
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--cmp-border)',
                        background: 'var(--cmp-surface)',
                        color: 'var(--cmp-text)',
                        fontSize: '12.5px',
                        textAlign: 'start',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => handleSend(prompt)}
                    >
                      <span>{prompt}</span>
                      <ArrowRight size={12} className="faint" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--cmp-border)',
                display: 'flex',
                gap: '8px',
                background: 'var(--cmp-surface)'
              }}
            >
              <input
                type="text"
                placeholder="Ask about properties, permits, offers…"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{ height: '38px' }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ width: '40px', padding: 0 }}
                disabled={!inputVal.trim()}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
