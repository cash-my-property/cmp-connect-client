import React, { useState } from 'react';
import { Phone, MessageSquare, Send, CheckCheck, Search } from 'lucide-react';

const initialConversations = [
  {
    id: 'conv-1',
    name: 'Priya Nair',
    role: 'Buyer',
    propertyRef: 'CMP-S-001001',
    propertyTitle: 'Full marina view 2 bed in Marina Gate',
    phone: '+971 55 210 4477',
    unreadCount: 0,
    time: '09:48',
    lastMessage: 'Also, what is the service charge per year?',
    messages: [
      { id: 'm1', sender: 'client', text: 'Hi, is the Marina Gate two bed still available?', time: '09:31' },
      { id: 'm2', sender: 'agent', text: 'Hi Priya, yes it is. Vacant on transfer, so keys on the day the deed moves.', time: '09:36' },
      { id: 'm3', sender: 'client', text: 'Great. Could I see it on Saturday morning?', time: '09:46' },
      { id: 'm4', sender: 'client', text: 'Also, what is the service charge per year?', time: '09:48' }
    ]
  },
  {
    id: 'conv-2',
    name: 'Marcus Ihle',
    role: 'Buyer',
    propertyRef: 'CMP-S-001004',
    propertyTitle: 'Duplex penthouse on the Palm',
    phone: '+971 52 880 1120',
    unreadCount: 1,
    time: '09:12',
    lastMessage: 'Is the furniture included in the asking price, or negotiable separately?',
    messages: [
      { id: 'm1', sender: 'client', text: 'Good morning, saw the duplex penthouse listing.', time: '08:50' },
      { id: 'm2', sender: 'client', text: 'Is the furniture included in the asking price, or negotiable separately?', time: '09:12' }
    ]
  },
  {
    id: 'conv-3',
    name: 'Aisha Rahman',
    role: 'Investor',
    propertyRef: 'CMP-S-001002',
    propertyTitle: 'Downtown modern apartment',
    phone: '+971 50 123 9988',
    unreadCount: 0,
    time: 'Yesterday',
    lastMessage: 'Thanks, that works for me as an investor.',
    messages: [
      { id: 'm1', sender: 'agent', text: 'Projected net ROI on this unit is around 7.2% based on current rental rates in the tower.', time: 'Yesterday 14:10' },
      { id: 'm2', sender: 'client', text: 'Thanks, that works for me as an investor.', time: 'Yesterday 14:22' }
    ]
  },
  {
    id: 'conv-4',
    name: 'Tom Whitfield',
    role: 'Buyer',
    propertyRef: 'CMP-S-001005',
    propertyTitle: 'Arabian Ranches family villa',
    phone: '+971 56 443 2190',
    unreadCount: 0,
    time: 'Tuesday',
    lastMessage: 'You: Thursday at 5pm is booked. I will meet you at the Maple 2 gate.',
    messages: [
      { id: 'm1', sender: 'client', text: 'Can we do a viewing Thursday evening after 5?', time: 'Tuesday 11:00' },
      { id: 'm2', sender: 'agent', text: 'Thursday at 5pm is booked. I will meet you at the Maple 2 gate.', time: 'Tuesday 11:15' }
    ]
  },
  {
    id: 'conv-5',
    name: 'Nadia Karimi',
    role: 'Tenant',
    propertyRef: 'CMP-R-002003',
    propertyTitle: 'Upgraded 3 bed in JLT',
    phone: '+971 50 771 8833',
    unreadCount: 0,
    time: 'Monday',
    lastMessage: 'You: Four is preferred, but six is possible with a slightly higher rent.',
    messages: [
      { id: 'm1', sender: 'client', text: 'Would the landlord consider 6 cheques instead of 4?', time: 'Monday 16:04' },
      { id: 'm2', sender: 'agent', text: 'I have asked. Four is preferred, but six is possible with a slightly higher rent.', time: 'Monday 16:45' }
    ]
  }
];

export default function MessagesPage() {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0].id);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeConv = conversations.find((c) => c.id === selectedId) || conversations[0];

  const handleSelectConv = (id) => {
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const newMessage = {
      id: `m-${Date.now()}`,
      sender: 'agent',
      text,
      time: 'Just now'
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              lastMessage: `You: ${text}`,
              time: 'Just now',
              messages: [...c.messages, newMessage]
            }
          : c
      )
    );
    setInputText('');
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.propertyRef.toLowerCase().includes(q) ||
      c.propertyTitle.toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const quickChips = [
    'Yes, it is still available.',
    'Can I send you similar properties?',
    'I will send the floor plan shortly.',
    'The service charge is AED 18 per sq ft.'
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px' }}>Messages</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px' }}>
          Chats with buyers and tenants about your listings, newest first.
        </p>
      </div>

      <div className="card inbox-grid" style={{ minHeight: '600px', display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 2fr)' }}>
        {/* Left Column: Conversations List */}
        <div className="inbox-list" style={{ borderRight: '1px solid var(--cmp-border)' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--cmp-border)' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                className="faint"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
              <input
                placeholder="Search name or reference"
                aria-label="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: '38px', paddingLeft: '32px', width: '100%', fontSize: '13px' }}
              />
            </div>
            <p className="faint" style={{ margin: '8px 2px 0', fontSize: '12px' }}>
              {totalUnread} unread
            </p>
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {filteredConversations.map((c) => {
              const isSelected = c.id === activeConv.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectConv(c.id)}
                    aria-current={isSelected}
                    style={{
                      width: '100%',
                      textAlign: 'start',
                      border: 'none',
                      cursor: 'pointer',
                      font: 'inherit',
                      padding: '12px 14px',
                      display: 'grid',
                      gap: '3px',
                      borderBottom: '1px solid var(--cmp-border)',
                      background: isSelected ? 'var(--cmp-brand-subtle)' : 'transparent',
                      color: 'var(--cmp-text)'
                    }}
                  >
                    <span className="row" style={{ justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontWeight: c.unreadCount > 0 ? 800 : 600, fontSize: '14px' }}>
                        {c.name}
                      </span>
                      <span className="faint" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {c.time}
                      </span>
                    </span>
                    <span className="faint" style={{ fontSize: '12px' }}>
                      {c.propertyRef}
                    </span>
                    <span className="row" style={{ justifyContent: 'space-between', gap: '8px' }}>
                      <span
                        className="muted"
                        style={{
                          fontSize: '13px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: c.unreadCount > 0 ? 700 : 400
                        }}
                      >
                        {c.lastMessage}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="badge badge-accent" style={{ minWidth: '20px', justifyContent: 'center' }}>
                          {c.unreadCount}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Column: Chat Thread */}
        <div className="inbox-thread" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Thread Header */}
          <div
            className="row"
            style={{
              justifyContent: 'space-between',
              gap: '12px',
              padding: '14px 18px',
              borderBottom: '1px solid var(--cmp-border)',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>
                {activeConv.name}{' '}
                <span className="badge badge-neutral" style={{ marginInlineStart: '6px' }}>
                  {activeConv.role}
                </span>
              </p>
              <p className="muted" style={{ margin: '3px 0 0', fontSize: '13px' }}>
                {activeConv.propertyRef} · {activeConv.propertyTitle}
              </p>
            </div>
            <div className="row" style={{ gap: '6px' }}>
              <a href={`tel:${activeConv.phone}`} className="btn btn-outline btn-sm">
                <Phone size={14} />
                <span>Call</span>
              </a>
              <a
                href={`https://wa.me/${activeConv.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(activeConv.name)}%2C%20about%20${activeConv.propertyRef}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
              >
                <MessageSquare size={14} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px',
              display: 'grid',
              gap: '10px',
              alignContent: 'start',
              maxHeight: '440px'
            }}
          >
            {activeConv.messages.map((m) => {
              const isAgent = m.sender === 'agent';
              return (
                <div
                  key={m.id}
                  style={{
                    justifySelf: isAgent ? 'end' : 'start',
                    maxWidth: '78%',
                    padding: '10px 14px',
                    borderRadius: 'var(--cmp-radius-lg)',
                    background: isAgent ? 'var(--cmp-brand)' : 'var(--cmp-surface-sunken)',
                    color: isAgent ? 'var(--cmp-text-on-brand)' : 'var(--cmp-text)',
                    border: isAgent ? 'none' : '1px solid var(--cmp-border)'
                  }}
                >
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
                    {m.text}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.8, textAlign: isAgent ? 'end' : 'start' }}>
                    {m.time}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick Replies & Reply Form */}
          <div style={{ padding: '14px', borderTop: '1px solid var(--cmp-border)' }}>
            <div className="row" style={{ gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chip"
                  onClick={() => handleSendMessage(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="row"
              style={{ gap: '8px' }}
            >
              <input
                placeholder={`Reply to ${activeConv.name}…`}
                aria-label="Message"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ height: '40px', flex: 1, fontSize: '13.5px' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!inputText.trim()}
                style={{ opacity: inputText.trim() ? 1 : 0.6 }}
              >
                <Send size={15} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
