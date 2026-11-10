import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';
import { Bell, X, ArrowRight } from 'lucide-react';

// Server ka data.url website path bhi ho sakta hai → sirf CRM routes pe navigate
const CRM_PREFIXES = ['/rto', '/properties', '/clients', '/transactions', '/growth', '/wallet', '/team', '/members', '/account', '/help', '/activity'];
const isCrmPath = (url) =>
  typeof url === 'string' && CRM_PREFIXES.some((p) => url === p || url.startsWith(`${p}/`) || url.startsWith(`${p}?`));
const TYPE_LINKS = [
  ['LEAD', '/clients/enquiries'],
  ['RTO', '/rto/offers'],
  ['LISTING', '/properties'],
  ['TRANSACTION', '/transactions'],
  ['TEAM', '/team/members'],
  ['MEMBER', '/team/members'],
  ['CREDIT', '/wallet']
];
const linkFor = (n) => {
  if (isCrmPath(n?.data?.url)) return n.data.url;
  const type = String(n?.type || '').toUpperCase();
  return TYPE_LINKS.find(([p]) => type.startsWith(p))?.[1] || null;
};
const formatAt = (iso) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};
// HubBar badge ko refresh karne ka signal
const emitChanged = () => window.dispatchEvent(new Event('cmp:notifications-changed'));

export default function NotificationsDrawer() {
  const { isNotificationsOpen, setIsNotificationsOpen, needsYou, dismissNeedsYou, isLiveData, authToken } = useApp();
  const navigate = useNavigate();

  // Live: latest 10 bell notifications (drawer khulte hi fetch)
  const [liveItems, setLiveItems] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [liveUnread, setLiveUnread] = useState(0);

  useEffect(() => {
    if (!isLiveData || !authToken || !isNotificationsOpen) return undefined;
    let cancelled = false;
    setLiveLoading(true);
    setLiveError(null);
    cmpConnectApi.listNotifications({ page: 1, limit: 10 }, authToken)
      .then((res) => {
        if (cancelled) return;
        setLiveItems(Array.isArray(res?.data) ? res.data : []);
        setLiveUnread(Number(res?.unread) || 0);
      })
      .catch((err) => {
        if (!cancelled) setLiveError(err?.message || 'Could not load notifications.');
      })
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });
    return () => { cancelled = true; };
  }, [isLiveData, authToken, isNotificationsOpen]);

  if (!isNotificationsOpen) return null;

  const handleAction = (item) => {
    setIsNotificationsOpen(false);
    navigate(item.actionUrl);
  };

  // Live click: optimistic read, phir link pe jao
  const handleLiveClick = (n) => {
    if (!n.read) {
      setLiveItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setLiveUnread((c) => Math.max(0, c - 1));
      cmpConnectApi.markNotificationRead(n.id, authToken)
        .then(emitChanged)
        .catch(() => {
          setLiveItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
          setLiveUnread((c) => c + 1);
        });
    }
    const link = linkFor(n);
    if (link) {
      setIsNotificationsOpen(false);
      navigate(link);
    }
  };

  const handleViewAll = () => {
    setIsNotificationsOpen(false);
    navigate('/account/notifications');
  };


  return (
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
      onClick={() => setIsNotificationsOpen(false)}
    >
      <div
        style={{
          width: 'min(440px, 100vw)',
          height: '100%',
          background: 'var(--cmp-surface-raised)',
          boxShadow: 'var(--cmp-shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--cmp-border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--cmp-border)'
          }}
        >
          <div className="row" style={{ gap: '10px' }}>
            <Bell size={20} style={{ color: 'var(--cmp-brand)' }} />
            <h2 style={{ fontSize: '17px' }}>{isLiveData ? 'Notifications' : 'Urgent Action Feed'}</h2>
            <span className="count-badge">{isLiveData ? liveUnread : needsYou.length}</span>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setIsNotificationsOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {isLiveData ? (
            <>
              {liveError && (
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--cmp-danger)' }}>{liveError}</p>
              )}
              {liveLoading && liveItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }} className="muted">
                  Loading notifications…
                </div>
              ) : !liveError && liveItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }} className="muted">
                  You're all caught up! No notifications yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {liveItems.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className="card"
                      onClick={() => handleLiveClick(n)}
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        textAlign: 'start',
                        width: '100%',
                        font: 'inherit',
                        color: 'inherit',
                        cursor: 'pointer',
                        borderLeft: `4px solid ${n.read ? 'var(--cmp-border)' : 'var(--cmp-brand)'}`
                      }}
                    >
                      <span className="muted" style={{ fontSize: '11.5px' }}>
                        {formatAt(n.at)}
                        {!n.read && (
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
                      </span>
                      <strong style={{ fontSize: '13.5px', display: 'block' }}>{n.title}</strong>
                      {n.body && (
                        <span className="muted" style={{ fontSize: '12.5px' }}>{n.body}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : needsYou.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }} className="muted">
              You're all caught up! No urgent tasks waiting.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {needsYou.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    borderLeft: `4px solid ${
                      item.severity === 'Now'
                        ? 'var(--cmp-danger)'
                        : item.severity === 'Soon'
                        ? 'var(--cmp-warning)'
                        : 'var(--cmp-brand)'
                    }`
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color:
                          item.severity === 'Now'
                            ? 'var(--cmp-danger)'
                            : item.severity === 'Soon'
                            ? 'var(--cmp-warning)'
                            : 'var(--cmp-brand)'
                      }}
                    >
                      {item.severity}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0 6px', height: '24px' }}
                      onClick={() => dismissNeedsYou(item.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                  <div>
                    <strong style={{ fontSize: '13.5px', display: 'block' }}>
                      {item.title}
                    </strong>
                    <span className="muted" style={{ fontSize: '12.5px' }}>
                      {item.subtitle}
                    </span>
                  </div>
                  <div className="row" style={{ justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleAction(item)}
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isLiveData && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--cmp-border)' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleViewAll}
            >
              <span>View all</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
