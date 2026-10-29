import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import {
  Plus,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';

function formatDurationMs(ms) {
  if (ms == null || ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

function formatDeskClock(lot, nowMs) {
  const deskStatus = lot.deskStatus;
  const auction = lot.auction || {};

  if (deskStatus === 'SCHEDULED') {
    if (auction.startTime) {
      const diff = new Date(auction.startTime).getTime() - nowMs;
      if (diff > 0) {
        return `Opens in ${formatDurationMs(diff)}`;
      }
      return 'Opening soon';
    }
    return 'Opens soon';
  }

  if (deskStatus === 'PAUSED') {
    const rem = auction.remainingMs;
    if (rem != null && rem > 0) {
      return `Frozen, ${formatDurationMs(rem)} left`;
    }
    return 'Frozen';
  }

  // LIVE or ENDING: live countdown to auction.endTime
  if (auction.endTime) {
    const diff = new Date(auction.endTime).getTime() - nowMs;
    if (diff > 0) {
      return formatDurationMs(diff);
    }
    return 'Closing';
  }

  if (auction.remainingMs != null && auction.remainingMs > 0) {
    return formatDurationMs(auction.remainingMs);
  }

  return lot.clock || 'Live';
}

function getDeskStatusMeta(deskStatus, fallbackStatus) {
  switch (deskStatus) {
    case 'ENDING':
      return { label: 'Closing now', color: 'var(--cmp-danger)' };
    case 'LIVE':
      return { label: 'Offers open', color: 'var(--cmp-success)' };
    case 'PAUSED':
      return { label: 'Paused by CMP', color: 'var(--cmp-warning)' };
    case 'SCHEDULED':
      return { label: 'Opens soon', color: 'var(--cmp-text-faint)' };
    default:
      if (fallbackStatus === 'Closing now') {
        return { label: 'Closing now', color: 'var(--cmp-danger)' };
      }
      if (fallbackStatus === 'Offers open' || fallbackStatus === 'Live') {
        return { label: 'Offers open', color: 'var(--cmp-success)' };
      }
      if (fallbackStatus === 'Paused by CMP') {
        return { label: 'Paused by CMP', color: 'var(--cmp-warning)' };
      }
      return { label: fallbackStatus || 'Opens soon', color: 'var(--cmp-text-faint)' };
  }
}

export default function LiveDeskPage() {
  const { rtoLots, isLiveData, authToken, can } = useApp();
  const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('cmp_connect_auth_token') : null);
  const [deskStats, setDeskStats] = useState(null);
  const [liveLots, setLiveLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [selectedLiveBids, setSelectedLiveBids] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // 1-second local clock ticker for smooth countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDesk = useCallback(async (silent = false) => {
    if (!isLiveData) return;
    if (!silent) setLoading(true);
    try {
      const res = await cmpConnectApi.getRtoDesk(token);
      const payload = res?.data || res || {};
      const stats = payload.stats || null;
      const rawLots = Array.isArray(payload.lots) ? payload.lots : [];

      const mappedLots = rawLots.map((item) => {
        const propId = item.propertyId || item.id || item._id;
        const auction = item.auction || {};
        const statusMeta = getDeskStatusMeta(item.deskStatus);
        // Keep null when highestOffer is explicitly null (0 offers placed)
        const resolvedHighestOffer =
          item.highestOffer !== undefined
            ? item.highestOffer
            : (auction.offers > 0 ? auction.currentHighestBid : null);

        return {
          id: propId,
          propertyId: propId,
          rtoRef: item.rtoRef || propId,
          title: item.title || 'Untitled Property',
          community: item.location || 'Dubai',
          coverImage: item.coverImage || null,
          agent: item.agent?.fullName || item.listedBy?.fullName || 'Agency Agent',
          deskStatus: item.deskStatus || 'LIVE',
          status: statusMeta.label,
          statusColor: statusMeta.color,
          auction,
          startingPrice: auction.startPrice ?? item.startingPrice ?? 0,
          highestOffer: resolvedHighestOffer,
          offersCount: auction.offers ?? 0,
          clockExtendedCount: auction.extensionCount ?? 0,
          approvedBuyers: item.approvedBuyers ?? 0,
          buyersWaitingForCmp: item.buyersWaitingForCmp ?? 0,
          history: []
        };
      });

      setDeskStats(stats);
      setLiveLots(mappedLots);
      setSelectedLotId((prev) => {
        if (prev && mappedLots.some((l) => l.id === prev)) return prev;
        return mappedLots[0]?.id || null;
      });
    } catch {
      // Preserve current desk state on transient error
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isLiveData, token]);

  // Initial fetch + 30-second auto-reload as specified in Section 13.4
  useEffect(() => {
    if (isLiveData) {
      fetchDesk(false);
      const pollInterval = setInterval(() => {
        fetchDesk(true);
      }, 30000);
      return () => clearInterval(pollInterval);
    } else if (rtoLots.length > 0 && !selectedLotId) {
      setSelectedLotId(rtoLots[0].id);
    }
  }, [isLiveData, fetchDesk, rtoLots, selectedLotId]);

  const lots = isLiveData
    ? liveLots
    : rtoLots.map((l) => {
        const meta = getDeskStatusMeta(l.deskStatus, l.status);
        return {
          ...l,
          propertyId: l.id,
          rtoRef: l.id,
          status: meta.label,
          statusColor: meta.color,
          startingPrice: l.openingOffer || l.reservePrice || 2000000,
          approvedBuyers: l.biddersCount || 0,
          buyersWaitingForCmp: 0,
          clockExtendedCount: l.clockExtendedCount || 0
        };
      });

  const selectedLot = lots.find((l) => l.id === selectedLotId) || lots[0] || null;

  // Fetch offer history for selected row & refresh every 30s alongside desk
  const fetchSelectedBids = useCallback(async (propId) => {
    if (!isLiveData || !propId) return;
    try {
      const res = await cmpConnectApi.getRtoPropertyBids(propId, token);
      setSelectedLiveBids(res?.data || res);
    } catch {
      // Keep previous bids on error
    }
  }, [isLiveData, token]);

  useEffect(() => {
    if (!isLiveData || !selectedLot?.id) {
      setSelectedLiveBids(null);
      return;
    }
    fetchSelectedBids(selectedLot.id);
    const bidsTimer = setInterval(() => {
      fetchSelectedBids(selectedLot.id);
    }, 30000);
    return () => clearInterval(bidsTimer);
  }, [isLiveData, selectedLot?.id, fetchSelectedBids]);

  const selectedOffersHistory = isLiveData
    ? (selectedLiveBids?.offers || []).map((o, i) => ({
        buyer: o.buyer || `Buyer ${i + 1}`,
        amount: o.amount || 0,
        time: o.at
          ? new Date(o.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : ''
      }))
    : selectedLot?.history || [];

  // Derived stats for the 4 stat tiles (Section 13.4)
  const takingOffersCount = isLiveData
    ? deskStats?.takingOffers ?? lots.filter((l) => l.deskStatus === 'LIVE' || l.deskStatus === 'ENDING').length
    : lots.filter((l) => l.status === 'Offers open' || l.status === 'Closing now' || l.status === 'Live').length;

  const onDeskTotal = isLiveData
    ? deskStats?.onDesk ?? lots.length
    : lots.length;

  const offersPlacedCount = isLiveData
    ? deskStats?.offersPlaced ?? lots.reduce((acc, curr) => acc + (curr.offersCount || 0), 0)
    : lots.reduce((acc, curr) => acc + (curr.offersCount || 0), 0);

  const withOffersCount = isLiveData
    ? deskStats?.withOffers ?? lots.filter((l) => (l.deskStatus === 'LIVE' || l.deskStatus === 'ENDING') && (l.offersCount || 0) > 0).length
    : lots.filter((l) => (l.offersCount || 0) > 0).length;

  const buyersWaitingForCmpCount = isLiveData
    ? deskStats?.buyersWaitingForCmp ?? 0
    : 2;

  const approvedBuyersTotal = isLiveData
    ? deskStats?.approvedBuyers ?? 0
    : lots.reduce((acc, curr) => acc + (curr.approvedBuyers || 0), 0);

  const selectedRegisteredBuyers = isLiveData
    ? selectedLot?.approvedBuyers ?? selectedLiveBids?.bidders?.length ?? 0
    : selectedLot?.approvedBuyers || 0;

  return (
    <div>
      {/* Top Header */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="cmp-live-dot" /> Real Time Offer desk
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            Every property of yours taking instant buyer offers against a live countdown clock. Late offers in the final 5 minutes add 10 minutes to the clock.
          </p>
        </div>

        <div className="row" style={{ gap: '8px' }}>
          {isLiveData && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                fetchDesk(false);
                if (selectedLot?.id) fetchSelectedBids(selectedLot.id);
              }}
              disabled={loading}
            >
              <RefreshCw size={14} />
              <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          )}
          {can('listings.create') && (
            <NavLink to="/rto/new" className="btn btn-accent btn-sm">
              <Plus size={15} />
              <span>Enter a property</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* 4 Stat Tiles (Section 13.4) */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Taking offers now
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            {takingOffersCount}
          </p>
          <p className="faint" style={{ margin: '2px 0 0', fontSize: '12px' }}>
            {onDeskTotal} on the desk in total
          </p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Offers placed
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            {offersPlacedCount}
          </p>
          <p className="faint" style={{ margin: '2px 0 0', fontSize: '12px' }}>
            across lots on the desk
          </p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            With offers
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            {withOffersCount} of {takingOffersCount}
          </p>
          <p className="faint" style={{ margin: '2px 0 0', fontSize: '12px' }}>
            active lots with ≥ 1 offer
          </p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Buyers waiting for CMP
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            {buyersWaitingForCmpCount}
          </p>
          <p className="faint" style={{ margin: '2px 0 0', fontSize: '12px' }}>
            {approvedBuyersTotal} approved buyers on desk
          </p>
        </div>
      </div>

      {/* Main Layout: Lots Table + Live Inspection Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        {/* Table of Lots */}
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Property</th>
                <th>Status</th>
                <th>Highest offer</th>
                <th>Offers</th>
                <th>Clock</th>
              </tr>
            </thead>
            <tbody>
              {lots.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }} className="muted">
                      No active auctions on the desk
                    </p>
                    <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                      {isLiveData
                        ? 'Approved and scheduled Real Time Offer properties will appear here automatically.'
                        : 'Properties will appear here once entered.'}
                    </p>
                  </td>
                </tr>
              ) : (
                lots.map((lot) => {
                  const isSelected = lot.id === selectedLot?.id;
                  const clockDisplay = isLiveData ? formatDeskClock(lot, nowMs) : lot.clock;
                  return (
                    <tr
                      key={lot.id}
                      onClick={() => setSelectedLotId(lot.id)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'var(--cmp-brand-subtle)' : 'transparent'
                      }}
                    >
                      <td style={{ minWidth: '200px' }}>
                        <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                          {lot.coverImage && (
                            <img
                              src={lot.coverImage}
                              alt={lot.title}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '6px',
                                objectFit: 'cover',
                                flexShrink: 0,
                                background: 'var(--cmp-surface-sunken)'
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: isSelected ? 'var(--cmp-brand)' : 'inherit' }}>
                              {lot.title}
                            </div>
                            <span className="faint" style={{ fontSize: '12px' }}>
                              {lot.rtoRef} · {lot.community}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="row" style={{ gap: '6px', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: lot.statusColor || 'var(--cmp-text-faint)'
                            }}
                          />
                          {lot.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {lot.highestOffer != null && lot.highestOffer > 0
                          ? `AED ${Number(lot.highestOffer).toLocaleString()}`
                          : 'No offers yet'}
                      </td>
                      <td>{lot.offersCount ?? 0}</td>
                      <td className="muted" style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {clockDisplay}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Side Panel (Selected Row) */}
        {!selectedLot ? (
          <aside className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <p className="muted" style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>No property selected</p>
            <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
              {isLiveData ? 'Approved Real Time Offer properties will appear here.' : 'Select a property from the table.'}
            </p>
          </aside>
        ) : (
          <aside className="card" style={{ padding: '20px' }}>
            {selectedLot.coverImage && (
              <img
                src={selectedLot.coverImage}
                alt={selectedLot.title}
                style={{
                  width: '100%',
                  height: '130px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  background: 'var(--cmp-surface-sunken)'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <span className="faint" style={{ fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
              {selectedLot.rtoRef}
            </span>
            <h2 style={{ fontSize: '18px', marginTop: '4px' }}>{selectedLot.title}</h2>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
              {selectedLot.community} · {selectedLot.agent}
            </p>

            {/* Highest Offer Highlight Card */}
            <div
              style={{
                marginTop: '16px',
                padding: '14px 16px',
                borderRadius: 'var(--cmp-radius-md)',
                background: 'var(--cmp-brand-subtle)',
                border: '1px solid var(--cmp-brand-border)'
              }}
            >
              <p className="muted" style={{ margin: 0, fontSize: '12px' }}>Highest offer</p>
              <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
                {selectedLot.highestOffer != null && selectedLot.highestOffer > 0
                  ? `AED ${Number(selectedLot.highestOffer).toLocaleString()}`
                  : 'No offers yet'}
              </p>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: '12px' }}>
                Starting price AED {Number(selectedLot.startingPrice || 0).toLocaleString()}
              </p>
            </div>

            {/* Metrics List */}
            <dl style={{ display: 'grid', gap: '8px', margin: '16px 0 0', fontSize: '13px' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <dt className="muted">Registered buyers</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>{selectedRegisteredBuyers}</dd>
              </div>
              {selectedLot.buyersWaitingForCmp > 0 && (
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <dt className="muted">Buyers waiting for CMP</dt>
                  <dd style={{ margin: 0, fontWeight: 700 }}>{selectedLot.buyersWaitingForCmp}</dd>
                </div>
              )}
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <dt className="muted">Clock extended</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>{selectedLot.clockExtendedCount || 0} times</dd>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <dt className="muted">Clock</dt>
                <dd style={{ margin: 0, fontWeight: 700, color: 'var(--cmp-brand)' }}>
                  {isLiveData ? formatDeskClock(selectedLot, nowMs) : selectedLot.clock}
                </dd>
              </div>
            </dl>

            {/* Offer History */}
            <h3 style={{ fontSize: '14px', marginTop: '20px', marginBottom: '8px' }}>
              Offer history ({selectedOffersHistory.length})
            </h3>
            {selectedOffersHistory.length === 0 ? (
              <p className="faint" style={{ fontSize: '12.5px', margin: '8px 0' }}>
                No buyer offers placed yet.
              </p>
            ) : (
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {selectedOffersHistory.map((h, idx) => (
                  <li
                    key={idx}
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      fontSize: '12.5px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: idx === 0 ? 'var(--cmp-surface-sunken)' : 'transparent'
                    }}
                  >
                    <span className="muted">{h.buyer}</span>
                    <span style={{ fontWeight: 700 }}>AED {Number(h.amount).toLocaleString()}</span>
                    <span className="faint">{h.time}</span>
                  </li>
                ))}
              </ol>
            )}

            <div style={{ marginTop: '18px' }}>
              <NavLink
                to={`/rto/${selectedLot.propertyId || selectedLot.id}`}
                className="btn btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>View the full entry</span>
                <ArrowUpRight size={14} />
              </NavLink>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
