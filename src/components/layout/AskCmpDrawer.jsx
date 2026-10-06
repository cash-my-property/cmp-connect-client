import React, { useState } from 'react';
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

export default function AskCmpDrawer() {
  const { isAssistantOpen, setIsAssistantOpen } = useApp();
  const [messages, setMessages] = useState([
    {
      sender: 'cmp',
      text: 'Salam Layla! I am your CMP Connect Assistant. How can I assist your agency today?'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  const quickPrompts = [
    'How do I lift my listing quality score to 90+?',
    'What happens when a Real Time Offer clock ends?',
    'How do I renew an expired DLD permit?',
    'Explain the 10% bidder security cheque policy.'
  ];

  const handleSend = (userText) => {
    const textToSend = userText || inputVal;
    if (!textToSend.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMsgs);
    setInputVal('');

    setTimeout(() => {
      let botResponse =
        "I'm here to help you navigate Cash My Property's agency portal! Check the Compliance tab for permit issues or the Live Desk for auction management.";

      const lower = textToSend.toLowerCase();
      if (lower.includes('quality') || lower.includes('score')) {
        botResponse =
          'To achieve a 90+ Quality Score: upload at least 8 high-res photos, write a 300+ word description, add a verified DLD permit number, pin the exact building on the map, and specify the built-up area.';
      } else if (lower.includes('clock') || lower.includes('real time') || lower.includes('offer')) {
        botResponse =
          'When the Real Time Offer clock reaches zero: if the highest bid is above the reserve price, the property is marked as Sold! For Reservation sales, the winning buyer has 28 days of exclusivity to exchange contracts.';
      } else if (lower.includes('permit') || lower.includes('dld')) {
        botResponse =
          'Under Dubai Land Department regulations, an active Trakheesi permit is mandatory for all advertising. Head to Properties > Compliance to upload renewal documents or update your RERA Form A.';
      } else if (lower.includes('cheque')) {
        botResponse =
          'Every registered bidder lodges a 10% security cheque before being permitted to place offers. If they do not win, their cheque must be returned within 48 hours via Real Time Offer > Cheques.';
      }

      setMessages((prev) => [...prev, { sender: 'cmp', text: botResponse }]);
    }, 450);
  };

  return (
    <>
      {/* Launcher Button */}
      <button
        type="button"
        className="assistant-launcher"
        onClick={() => setIsAssistantOpen(true)}
        aria-label="Ask CMP Assistant"
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
              {messages.map((m, idx) => (
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
                placeholder="Ask about properties, permits, bids…"
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
