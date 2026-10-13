import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, RefreshCw, CheckCheck, Mail, Phone, Shield, Zap } from 'lucide-react';

const initialNotifications = [
  {
    id: 'n1',
    category: 'Leads, Email leads',
    dateTime: '17 Sep 2026, 09:12 AM',
    title: 'New email lead',
    description: 'Priya Nair asked about CMP-S-001001, Full marina view 2 bed.',
    link: '/clients/enquiries',
    unread: true
  },
  {
    id: 'n2',
    category: 'Listings, Listing Action Tracker',
    dateTime: '16 Sep 2026, 04:20 PM',
    title: 'Daily digest',
    description: '3 listings need attention: 1 missing a permit, 2 not verified.',
    link: '/properties/compliance',
    unread: true
  },
  {
    id: 'n3',
    category: 'Listings, Verification',
    dateTime: '15 Sep 2026, 10:05 AM',
    title: 'Verification approved',
    description: 'CMP-S-001002 is now verified and live on CMP Connect.',
    link: '/properties',
    unread: true
  },
  {
    id: 'n4',
    category: 'Credits, Credits Updates and Alerts',
    dateTime: '14 Sep 2026, 08:30 AM',
    title: 'Low credits',
    description: 'Your balance fell below 2,000 credits.',
    link: '/wallet',
    unread: true
  },
  {
    id: 'n5',
    category: 'Community Spotlight, Community Spotlight',
    dateTime: '12 Sep 2026, 11:40 AM',
    title: 'Spotlight window open',
    description: 'Bidding is open for Dubai Marina, Downtown Dubai and 5 more communities.',
    link: '/growth/spotlight',
    unread: true
  },
  {
    id: 'n6',
    category: 'Users, Agent Verification',
    dateTime: '8 Sep 2026, 03:02 PM',
    title: 'Verification submitted',
    description: 'Verification for agent Arjun Mehta was just submitted.',
    link: '/team/members',
    unread: true
  },
  {
    id: 'n7',
    category: 'Users, Agent Verification',
    dateTime: '8 Sep 2026, 04:17 PM',
    title: 'Verification approved',
    description: 'The verification request for Arjun Mehta has been approved.',
    link: '/team/members',
    unread: true
  },
  {
    id: 'n8',
    category: 'Credits, Credits Updates and Alerts',
    dateTime: '5 Sep 2026, 09:01 AM',
    title: 'Credits expiring',
    description: '2,173 credits will expire in 10 days.',
    link: '/wallet',
    unread: true
  },
  {
    id: 'n9',
    category: 'Credits, Credits Updates and Alerts',
    dateTime: '1 Sep 2026, 03:03 AM',
    title: 'Credits released',
    description: '2,000 credits have been released to your account.',
    link: '/wallet',
    unread: true
  },
  {
    id: 'n10',
    category: 'Top Agent, Top Agent Status',
    dateTime: '30 Aug 2026, 02:45 PM',
    title: 'Top Agent status gained',
    description: 'Karim Saleh is now recognized as an Elite Agent.',
    link: '/team',
    unread: true
  },
  {
    id: 'n11',
    category: 'Contracts, Payments',
    dateTime: '27 Aug 2026, 10:00 AM',
    title: 'Invoice issued',
    description: 'Invoice 148955-06 for AED 4,929.54 is due soon.',
    link: '/wallet/invoices',
    unread: true
  },
  {
    id: 'n12',
    category: 'Settings, Settings',
    dateTime: '22 Aug 2026, 12:12 PM',
    title: 'Watermarks processed',
    description: 'Your agency watermark was applied to 8 listings.',
    link: '/properties/brand-kit',
    unread: true
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'preferences'
  const [notice, setNotice] = useState(null);

  const [prefs, setPrefs] = useState({
    emailLeads: true,
    whatsappLeads: true,
    smsLeads: false,
    permitAlerts: true,
    rtoBids: true,
    creditAlerts: true
  });

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showNotice('All notifications marked as read.');
  };

  const handleRefresh = () => {
    showNotice('Notifications updated.');
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '26px' }}>Notifications</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', maxWidth: '820px' }}>
          Your inbox, and where each kind of alert reaches you.
        </p>
      </div>

      {notice && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: 'var(--cmp-brand-subtle)',
            borderColor: 'var(--cmp-brand-border)',
            color: 'var(--cmp-brand)',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          {notice}
        </div>
      )}

      {/* Segmented Tabs */}
      <div className="segmented" style={{ marginBottom: '18px' }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'inbox'}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox ({unreadCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'preferences'}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>

      {activeTab === 'inbox' ? (
        <section className="card" style={{ padding: '20px' }}>
          <div className="row" style={{ gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={15} />
              <span>Mark all as read</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              aria-label="Refresh"
              onClick={handleRefresh}
              style={{ width: '36px', padding: 0 }}
            >
              <RefreshCw size={15} />
            </button>
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {notifications.map((item) => (
              <li key={item.id} style={{ borderBottom: '1px solid var(--cmp-border)' }}>
                <NavLink
                  to={item.link}
                  style={{
                    display: 'block',
                    padding: '14px 4px',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                    );
                  }}
                >
                  <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                    {item.dateTime} · {item.category}
                    {item.unread && (
                      <span
                        aria-label="Unread"
                        style={{
                          display: 'inline-block',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: 'var(--cmp-accent)',
                          marginInlineStart: '6px',
                          verticalAlign: 'middle'
                        }}
                      />
                    )}
                  </p>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '14.5px' }}>
                    {item.title}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '13.5px', color: 'var(--cmp-text-muted)' }}>
                    {item.description}
                  </p>
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card" style={{ padding: '22px', maxWidth: '640px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 16px' }}>Delivery Preferences</h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <label className="row" style={{ justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Email lead alerts</span>
                <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                  Instant email when an enquiry is lodged.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailLeads}
                onChange={(e) => setPrefs({ ...prefs, emailLeads: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
            </label>

            <label className="row" style={{ justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>WhatsApp client alerts</span>
                <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                  Ping responsible agent on WhatsApp.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.whatsappLeads}
                onChange={(e) => setPrefs({ ...prefs, whatsappLeads: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
            </label>

            <label className="row" style={{ justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>DLD Compliance & Permit reminders</span>
                <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                  Notify before 30-day permit expiry window.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.permitAlerts}
                onChange={(e) => setPrefs({ ...prefs, permitAlerts: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
            </label>

            <label className="row" style={{ justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Real Time Offer bid notifications</span>
                <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                  Alert when a new bid is placed or clock extended.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.rtoBids}
                onChange={(e) => setPrefs({ ...prefs, rtoBids: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
            </label>

            <label className="row" style={{ justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Credit balance & Invoice notifications</span>
                <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                  Alert when credits fall below threshold or expire.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.creditAlerts}
                onChange={(e) => setPrefs({ ...prefs, creditAlerts: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '22px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => showNotice('Notification preferences saved.')}
            >
              Save preferences
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
