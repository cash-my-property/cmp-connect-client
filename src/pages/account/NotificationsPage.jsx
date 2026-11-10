import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';

const LIVE_PAGE_LIMIT = 50;

// CRM ke route prefixes — server ka data.url website path bhi ho sakta hai (/real-time-offers/..), wo yahan nahi khulega
const CRM_PREFIXES = ['/rto', '/properties', '/clients', '/transactions', '/growth', '/wallet', '/team', '/members', '/account', '/help', '/activity'];
const isCrmPath = (url) =>
  typeof url === 'string' && CRM_PREFIXES.some((p) => url === p || url.startsWith(`${p}/`) || url.startsWith(`${p}?`));

// type prefix → category label + fallback route
const TYPE_MAP = [
  { prefix: 'LEAD', category: 'Leads', link: '/clients/enquiries' },
  { prefix: 'RTO', category: 'Real Time Offer', link: '/rto/offers' },
  { prefix: 'LISTING', category: 'Listings', link: '/properties' },
  { prefix: 'TRANSACTION', category: 'Transactions', link: '/transactions' },
  { prefix: 'TEAM', category: 'Team', link: '/team/members' },
  { prefix: 'MEMBER', category: 'Team', link: '/team/members' },
  { prefix: 'CREDIT', category: 'Credits', link: '/wallet' }
];

const formatNotifDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

// Backend row → page ka item shape
const mapLiveNotification = (n) => {
  const type = String(n?.type || '').toUpperCase();
  const hit = TYPE_MAP.find((t) => type.startsWith(t.prefix));
  const url = n?.data?.url;
  return {
    id: n.id,
    category: hit?.category || 'General',
    dateTime: formatNotifDate(n.at),
    title: n.title || 'Notification',
    description: n.body || '',
    link: isCrmPath(url) ? url : hit?.link || null,
    unread: !n.read
  };
};

// Live prefs: 5 categories × 2 channels
const PREF_CATEGORIES = [
  { key: 'leads', label: 'Leads & enquiries', hint: 'New enquiries and lead updates.' },
  { key: 'rto', label: 'Real Time Offer', hint: 'Auction starts, bids and results.' },
  { key: 'listings', label: 'Listings', hint: 'Verification, permits and listing status.' },
  { key: 'transactions', label: 'Transactions', hint: 'Deals and payments on your listings.' },
  { key: 'team', label: 'Team', hint: 'Invites, verification and member changes.' }
];
const PREF_CHANNELS = ['push', 'email'];

// missing key = true (backend {} bhi bhej sakta hai)
const normalisePrefs = (raw) => {
  const out = {};
  PREF_CHANNELS.forEach((ch) => {
    out[ch] = {};
    PREF_CATEGORIES.forEach(({ key }) => {
      out[ch][key] = raw?.[ch]?.[key] !== false;
    });
  });
  return out;
};

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
  const { isLiveData, authToken } = useApp();
  const navigate = useNavigate();
  const [mockNotifications, setMockNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'preferences'
  const [notice, setNotice] = useState(null);

  // Live inbox state
  const [liveItems, setLiveItems] = useState([]);
  const [liveUnread, setLiveUnread] = useState(0);
  const [livePage, setLivePage] = useState(1);
  const [livePages, setLivePages] = useState(1);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);

  // Live prefs state
  const [livePrefs, setLivePrefs] = useState(() => normalisePrefs({}));
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsError, setPrefsError] = useState(null);

  const notifications = isLiveData ? liveItems : mockNotifications;
  const setNotifications = isLiveData ? setLiveItems : setMockNotifications;

  // page=1 → replace, warna append (Load more)
  const loadLive = useCallback(async (page = 1) => {
    if (!authToken) return;
    setLiveLoading(true);
    setLiveError(null);
    try {
      const res = await cmpConnectApi.listNotifications({ page, limit: LIVE_PAGE_LIMIT }, authToken);
      const rows = (Array.isArray(res?.data) ? res.data : []).map(mapLiveNotification);
      setLiveItems((prev) => (page === 1 ? rows : [...prev, ...rows]));
      setLiveUnread(Number(res?.unread) || 0);
      setLivePage(Number(res?.pagination?.page) || page);
      setLivePages(Number(res?.pagination?.pages) || 1);
    } catch (err) {
      setLiveError(err?.message || 'Could not load notifications.');
    } finally {
      setLiveLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (isLiveData) loadLive(1);
  }, [isLiveData, loadLive]);

  // Prefs tab khule tab load karo (live only)
  useEffect(() => {
    if (!isLiveData || !authToken || activeTab !== 'preferences') return undefined;
    let cancelled = false;
    setPrefsLoading(true);
    setPrefsError(null);
    cmpConnectApi.getNotificationPreferences(authToken)
      .then((res) => {
        if (!cancelled) setLivePrefs(normalisePrefs(res?.data));
      })
      .catch((err) => {
        if (!cancelled) setPrefsError(err?.message || 'Could not load preferences.');
      })
      .finally(() => {
        if (!cancelled) setPrefsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isLiveData, authToken, activeTab]);

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

  const handleMarkAllRead = async () => {
    if (!isLiveData) {
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      showNotice('All notifications marked as read.');
      return;
    }
    const snapshot = liveItems;
    const prevUnread = liveUnread;
    setLiveItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    setLiveUnread(0);
    try {
      await cmpConnectApi.markAllNotificationsRead(authToken);
      window.dispatchEvent(new Event('cmp:notifications-changed'));
      showNotice('All notifications marked as read.');
    } catch (err) {
      setLiveItems(snapshot);
      setLiveUnread(prevUnread);
      showNotice(err?.message || 'Could not mark notifications as read.');
    }
  };

  const handleRefresh = async () => {
    if (!isLiveData) {
      showNotice('Notifications updated.');
      return;
    }
    await loadLive(1);
  };

  // Live click: optimistic read, phir link ho to navigate
  const handleLiveClick = (item) => {
    if (item.unread) {
      setLiveItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)));
      setLiveUnread((c) => Math.max(0, c - 1));
      cmpConnectApi.markNotificationRead(item.id, authToken)
        .then(() => window.dispatchEvent(new Event('cmp:notifications-changed')))
        .catch(() => {
          setLiveItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, unread: true } : n)));
          setLiveUnread((c) => c + 1);
        });
    }
    if (item.link) navigate(item.link);
  };

  const toggleLivePref = (channel, key, value) => {
    setLivePrefs((prev) => ({ ...prev, [channel]: { ...prev[channel], [key]: value } }));
  };

  const handleSaveLivePrefs = async () => {
    setPrefsSaving(true);
    setPrefsError(null);
    try {
      const res = await cmpConnectApi.setNotificationPreferences(
        { push: livePrefs.push, email: livePrefs.email },
        authToken
      );
      if (res?.data) setLivePrefs(normalisePrefs(res.data));
      showNotice(res?.message || 'Preferences saved.');
    } catch (err) {
      setPrefsError(err?.message || 'Could not save preferences.');
    } finally {
      setPrefsSaving(false);
    }
  };

  const unreadCount = isLiveData ? liveUnread : notifications.filter((n) => n.unread).length;

  // Ek row ka andar wala content (mock NavLink aur live button dono mein same)
  const renderItemBody = (item) => (
    <>
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
      {item.description && (
        <p style={{ margin: '2px 0 0', fontSize: '13.5px', color: 'var(--cmp-text-muted)' }}>
          {item.description}
        </p>
      )}
    </>
  );

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
              disabled={isLiveData && liveLoading}
              style={{ width: '36px', padding: 0 }}
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {isLiveData && liveError && (
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--cmp-danger)' }}>{liveError}</p>
          )}

          {isLiveData && !liveLoading && !liveError && liveItems.length === 0 && (
            <div className="muted" style={{ textAlign: 'center', padding: '36px 12px', fontSize: '14px' }}>
              No notifications yet. You're all caught up.
            </div>
          )}

          {isLiveData && liveLoading && liveItems.length === 0 && (
            <div className="muted" style={{ textAlign: 'center', padding: '36px 12px', fontSize: '14px' }}>
              Loading notifications…
            </div>
          )}

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {notifications.map((item) => (
              <li key={item.id} style={{ borderBottom: '1px solid var(--cmp-border)' }}>
                {isLiveData ? (
                  <button
                    type="button"
                    onClick={() => handleLiveClick(item)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '14px 4px',
                      textAlign: 'start',
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      font: 'inherit',
                      cursor: item.link || item.unread ? 'pointer' : 'default'
                    }}
                  >
                    {renderItemBody(item)}
                  </button>
                ) : (
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
                  {renderItemBody(item)}
                </NavLink>
                )}
              </li>
            ))}
          </ul>

          {isLiveData && livePages > livePage && (
            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => loadLive(livePage + 1)}
                disabled={liveLoading}
              >
                {liveLoading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </section>
      ) : isLiveData ? (
        <section className="card" style={{ padding: '22px', maxWidth: '640px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 6px' }}>Delivery Preferences</h2>
          <p className="faint" style={{ margin: '0 0 16px', fontSize: '12.5px' }}>
            Choose which alerts reach you as push notifications and by email.
          </p>

          {prefsLoading ? (
            <div className="muted" style={{ fontSize: '14px', padding: '12px 0' }}>Loading preferences…</div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="row" style={{ justifyContent: 'flex-end', gap: '18px', margin: 0 }}>
                <span className="faint" style={{ fontSize: '12px', fontWeight: 700, width: '44px', textAlign: 'center' }}>Push</span>
                <span className="faint" style={{ fontSize: '12px', fontWeight: 700, width: '44px', textAlign: 'center' }}>Email</span>
              </div>
              {PREF_CATEGORIES.map((cat) => (
                <div key={cat.key} className="row" style={{ justifyContent: 'space-between', margin: 0 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{cat.label}</span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {cat.hint}
                    </span>
                  </div>
                  <div className="row" style={{ gap: '18px' }}>
                    {PREF_CHANNELS.map((ch) => (
                      <span key={ch} style={{ width: '44px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          aria-label={`${cat.label} ${ch}`}
                          checked={livePrefs[ch][cat.key]}
                          onChange={(e) => toggleLivePref(ch, cat.key, e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {prefsError && (
            <p style={{ margin: '14px 0 0', fontSize: '13px', color: 'var(--cmp-danger)' }}>{prefsError}</p>
          )}

          <div style={{ marginTop: '22px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveLivePrefs}
              disabled={prefsSaving || prefsLoading}
            >
              {prefsSaving ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
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
