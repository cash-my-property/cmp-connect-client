import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Search, User, Phone, Mail, Building, X, Check } from 'lucide-react';

const initialContacts = [
  {
    id: 'ct-1',
    name: 'Rashid Al Nuaimi',
    phone: '+971 50 491 8820',
    email: 'rashid@nuaimi.ae',
    source: 'Walk-in',
    notes: 'Looking for 3BR penthouse or villa in Palm Jumeirah. Budget ~15M AED.',
    agent: 'Layla Haddad',
    addedDate: '16 Sep 2026'
  },
  {
    id: 'ct-2',
    name: 'Elena Rostova',
    phone: '+971 52 331 9088',
    email: 'elena@rostova.com',
    source: 'Referral',
    notes: 'Referred by Marcus. Relocating family to Dubai Hills Estate by November.',
    agent: 'Emma Clarke',
    addedDate: '14 Sep 2026'
  },
  {
    id: 'ct-3',
    name: 'Vikram Seth',
    phone: '+971 55 881 2341',
    email: 'vikram@sethgroup.com',
    source: 'Office call',
    notes: 'Commercial investor inquiring about full floors in Business Bay.',
    agent: 'Karim Saleh',
    addedDate: '12 Sep 2026'
  }
];

export default function ContactsPage() {
  const { isLiveData } = useApp();
  const [contacts, setContacts] = useState(isLiveData ? [] : initialContacts);

  useEffect(() => {
    setContacts(isLiveData ? [] : initialContacts);
  }, [isLiveData]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Walk-in',
    agent: 'Layla Haddad',
    notes: ''
  });

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCreateLead = (e) => {
    e.preventDefault();
    if (!newLeadForm.name.trim()) return;

    const newContact = {
      id: `ct-${Date.now()}`,
      name: newLeadForm.name.trim(),
      phone: newLeadForm.phone.trim() || '—',
      email: newLeadForm.email.trim() || '—',
      source: newLeadForm.source,
      notes: newLeadForm.notes.trim() || 'No notes added.',
      agent: newLeadForm.agent,
      addedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    setContacts([newContact, ...contacts]);
    setIsModalOpen(false);
    setNewLeadForm({
      name: '',
      phone: '',
      email: '',
      source: 'Walk-in',
      agent: 'Layla Haddad',
      notes: ''
    });
    showNotice(`Contact ${newContact.name} added successfully.`);
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesAgent = selectedAgent === 'All' || c.agent === selectedAgent;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q);
      return matchesAgent && matchesSearch;
    });
  }, [contacts, selectedAgent, searchQuery]);

  return (
    <div>
      {/* Title */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '18px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px' }}>Contacts</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', maxWidth: '820px' }}>
            Walk-ins, referrals and calls to the office that didn’t come through a listing.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>New lead</span>
        </button>
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

      {/* Search and Filters */}
      <div className="row" style={{ gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '340px' }}>
          <Search
            size={16}
            className="faint"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          />
          <input
            id="regular-search"
            placeholder="Search by lead name, phone number or email"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px', width: '100%', fontSize: '13px' }}
          />
        </div>

        <div style={{ width: '200px' }}>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            style={{ height: '40px', width: '100%', fontSize: '13px' }}
          >
            <option value="All">Any agent</option>
            <option value="Layla Haddad">Layla Haddad</option>
            <option value="Karim Saleh">Karim Saleh</option>
            <option value="Emma Clarke">Emma Clarke</option>
            <option value="Arjun Mehta">Arjun Mehta</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredContacts.length === 0 ? (
        <div className="card" style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: '56px 16px', gap: '14px' }}>
          <svg width="150" height="150" viewBox="0 0 170 170" aria-hidden="true">
            <circle cx="85" cy="85" r="82" fill="var(--cmp-surface-sunken)" />
            <g fill="var(--cmp-surface)" stroke="var(--cmp-text-faint)" strokeWidth="2.5">
              <rect x="52" y="44" width="36" height="82" />
              <rect x="88" y="62" width="30" height="64" />
              <rect x="34" y="84" width="18" height="42" />
              <path d="M60 56h6m8 0h6M96 64h6m6 0h4" />
              <path d="M60 68h6m8 0h6M96 76h6m6 0h4" />
              <path d="M60 80h6m8 0h6M96 88h6m6 0h4" />
            </g>
          </svg>
          <h2 style={{ fontSize: '20px', margin: 0 }}>Your leads live here</h2>
          <p className="muted" style={{ margin: 0, maxWidth: '520px', fontSize: '14px' }}>
            Add walk-ins, referrals and office calls so every enquiry is tracked in one place.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            Add your first lead
          </button>
        </div>
      ) : (
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Source</th>
                <th>Agent</th>
                <th>Requirement / Notes</th>
                <th>Added</th>
                <th style={{ textAlign: 'end' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td style={{ minWidth: '220px' }}>
                    <span style={{ fontWeight: 600 }}>{contact.name}</span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {contact.phone} · {contact.email}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{contact.source}</span>
                  </td>
                  <td>{contact.agent}</td>
                  <td style={{ maxWidth: '300px', fontSize: '13px' }} className="muted">
                    {contact.notes}
                  </td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {contact.addedDate}
                  </td>
                  <td>
                    <div className="row" style={{ gap: '6px', justifyContent: 'flex-end' }}>
                      <a href={`tel:${contact.phone}`} className="btn btn-outline btn-sm">
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Lead Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              background: 'var(--cmp-surface)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Add New Lead</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label>Lead name *</label>
                <input
                  required
                  placeholder="e.g. Tariq Mansoor"
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  style={{ width: '100%', height: '38px', fontSize: '13.5px' }}
                />
              </div>

              <div className="field-row">
                <div>
                  <label>Phone number</label>
                  <input
                    placeholder="+971 50 000 0000"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    style={{ width: '100%', height: '38px', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label>Email address</label>
                  <input
                    type="email"
                    placeholder="name@example.ae"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    style={{ width: '100%', height: '38px', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div className="field-row">
                <div>
                  <label>Lead source</label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    style={{ width: '100%', height: '38px', fontSize: '13.5px' }}
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="Referral">Referral</option>
                    <option value="Office call">Office call</option>
                    <option value="Website inquiry">Website inquiry</option>
                  </select>
                </div>
                <div>
                  <label>Assigned agent</label>
                  <select
                    value={newLeadForm.agent}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, agent: e.target.value })}
                    style={{ width: '100%', height: '38px', fontSize: '13.5px' }}
                  >
                    <option value="Layla Haddad">Layla Haddad</option>
                    <option value="Karim Saleh">Karim Saleh</option>
                    <option value="Emma Clarke">Emma Clarke</option>
                    <option value="Arjun Mehta">Arjun Mehta</option>
                  </select>
                </div>
              </div>

              <div>
                <label>Notes / Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Budget, communities of interest, bedrooms, timing..."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  style={{ width: '100%', fontSize: '13.5px' }}
                />
              </div>

              <div className="row" style={{ gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
