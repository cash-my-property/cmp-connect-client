import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Building, ShieldCheck, Clock, Calendar, CheckCircle, Info } from 'lucide-react';

export default function EnterPropertyPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    propertyType: 'apartment',
    community: 'Dubai Marina',
    building: '',
    unit: '',
    bedrooms: '2',
    bathrooms: '2',
    areaSqft: '',
    permitNumber: '',
    title: '2 bed apartment in Dubai Marina',
    reservePrice: '',
    openingOffer: '',
    startDate: '2026-09-20',
    startTime: '10:00',
    durationDays: '7',
    saleType: 'reservation', // 'binding' | 'reservation'
    buyersFee: '2',
    agent: 'Layla Haddad',
    viewingTime: '',
    viewingList: [],
    moderatorNotes: ''
  });

  const [notice, setNotice] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-update title if not manually changed
      if (['propertyType', 'community', 'bedrooms'].includes(name)) {
        const bedStr = next.bedrooms === '0' ? 'Studio' : `${next.bedrooms} bed`;
        next.title = `${bedStr} ${next.propertyType} in ${next.community}`;
      }
      return next;
    });
  };

  const handleAddViewing = () => {
    if (form.viewingTime.trim()) {
      setForm((prev) => ({
        ...prev,
        viewingList: [...prev.viewingList, prev.viewingTime.trim()],
        viewingTime: ''
      }));
    }
  };

  const handleRemoveViewing = (index) => {
    setForm((prev) => ({
      ...prev,
      viewingList: prev.viewingList.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setNotice('Property submitted for moderator review. You will be redirected to Entries.');
    setTimeout(() => {
      navigate('/rto/entries');
    }, 1800);
  };

  const handleSaveDraft = () => {
    setNotice('Draft saved successfully.');
    setTimeout(() => {
      navigate('/rto/entries');
    }, 1500);
  };

  const openingAmount = Number(form.openingOffer) || 0;
  const chequeAmount = openingAmount > 0 ? (openingAmount * 0.1).toLocaleString() : null;

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px' }}>Enter a property</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px' }}>
          Registered buyers place offers against a clock. The reserve stays private; buyers only see whether it has been met.
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

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', maxWidth: '920px' }}>
        {/* Section 1: The property */}
        <section className="card" style={{ padding: '22px', display: 'grid', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '17px' }}>The property</h2>
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="e-type">Property type</label>
              <select
                id="e-type"
                name="propertyType"
                value={form.propertyType}
                onChange={handleChange}
              >
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="townhouse">Townhouse</option>
                <option value="penthouse">Penthouse</option>
                <option value="compound">Villa Compound</option>
                <option value="duplex">Duplex</option>
                <option value="hotel-apartment">Hotel Apartment</option>
                <option value="residential-plot">Residential Plot</option>
                <option value="residential-floor">Residential Floor</option>
                <option value="residential-building">Residential Building</option>
                <option value="whole-building">Whole Building</option>
                <option value="bulk-rent-unit">Bulk Rent Unit</option>
                <option value="bungalow">Bungalow</option>
                <option value="farm">Farm</option>
                <option value="chalet">Chalet</option>
                <option value="room">Room (Partition)</option>
              </select>
            </div>

            <div>
              <label htmlFor="e-community">Community</label>
              <select
                id="e-community"
                name="community"
                value={form.community}
                onChange={handleChange}
              >
                <option value="Dubai Marina">Dubai Marina</option>
                <option value="Downtown Dubai">Downtown Dubai</option>
                <option value="Palm Jumeirah">Palm Jumeirah</option>
                <option value="Business Bay">Business Bay</option>
                <option value="Jumeirah Village Circle">Jumeirah Village Circle</option>
                <option value="Dubai Hills Estate">Dubai Hills Estate</option>
                <option value="Arabian Ranches">Arabian Ranches</option>
                <option value="Jumeirah Lake Towers">Jumeirah Lake Towers</option>
                <option value="Jumeirah Golf Estates">Jumeirah Golf Estates</option>
                <option value="The Springs">The Springs</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="e-building">Building or project</label>
              <input
                id="e-building"
                name="building"
                placeholder="e.g. Marina Gate II"
                value={form.building}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="e-unit">Unit number</label>
              <input
                id="e-unit"
                name="unit"
                placeholder="e.g. 1404"
                value={form.unit}
                onChange={handleChange}
              />
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                Never shown to buyers.
              </p>
            </div>
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="e-bedrooms">Bedrooms</label>
              <select
                id="e-bedrooms"
                name="bedrooms"
                value={form.bedrooms}
                onChange={handleChange}
              >
                <option value="0">Studio</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
              </select>
            </div>

            <div>
              <label htmlFor="e-bathrooms">Bathrooms</label>
              <select
                id="e-bathrooms"
                name="bathrooms"
                value={form.bathrooms}
                onChange={handleChange}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
              </select>
            </div>

            <div>
              <label htmlFor="e-area">Built-up area in sqft</label>
              <input
                id="e-area"
                name="areaSqft"
                inputMode="numeric"
                placeholder="e.g. 1,450"
                value={form.areaSqft}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="e-permitNumber">DLD permit number</label>
              <input
                id="e-permitNumber"
                name="permitNumber"
                placeholder="DLD-7128394"
                value={form.permitNumber}
                onChange={handleChange}
              />
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                Required before offers can open.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="e-title">Title buyers see</label>
            <input
              id="e-title"
              name="title"
              maxLength={100}
              value={form.title}
              onChange={handleChange}
            />
            <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
              Written for you from the details above. Edit it if you like.
            </p>
          </div>
        </section>

        {/* Section 2: Price */}
        <section className="card" style={{ padding: '22px', display: 'grid', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '17px' }}>Price</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              Reserve and opening offer, with a guide built from comparable sales.
            </p>
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="e-reserve">Reserve price in AED</label>
              <input
                id="e-reserve"
                name="reservePrice"
                inputMode="numeric"
                placeholder="e.g. 2,600,000"
                value={form.reservePrice}
                onChange={handleChange}
              />
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                The lowest the seller accepts. Never shown to buyers.
              </p>
            </div>

            <div>
              <label htmlFor="e-opening">Opening offer in AED</label>
              <input
                id="e-opening"
                name="openingOffer"
                inputMode="numeric"
                placeholder="e.g. 2,100,000"
                value={form.openingOffer}
                onChange={handleChange}
              />
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                A lower opening draws more buyers in.
              </p>
            </div>
          </div>

          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
            Each bidder lodges a security cheque for 10% of the opening offer
            {chequeAmount ? ` (AED ${chequeAmount})` : ''}. Cash My Property takes no deposit.
          </p>
        </section>

        {/* Section 3: Timing and terms */}
        <section className="card" style={{ padding: '22px', display: 'grid', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '17px' }}>Timing and terms</h2>
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="e-startDate">Offers open on</label>
              <input
                id="e-startDate"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="e-startTime">At</label>
              <input
                id="e-startTime"
                name="startTime"
                type="time"
                value={form.startTime}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="e-days">Offers stay open for</label>
              <select
                id="e-days"
                name="durationDays"
                value={form.durationDays}
                onChange={handleChange}
              >
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="10">10 days</option>
                <option value="14">14 days</option>
              </select>
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                Late offers add 2 minutes to the clock.
              </p>
            </div>
          </div>

          <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' }}>
            <legend style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Sale type</legend>

            <label
              className="row"
              style={{
                gap: '10px',
                alignItems: 'flex-start',
                cursor: 'pointer',
                marginBottom: 0,
                padding: '12px',
                borderRadius: 'var(--cmp-radius-md)',
                border: form.saleType === 'binding' ? '1px solid var(--cmp-brand-border)' : '1px solid var(--cmp-border)',
                background: form.saleType === 'binding' ? 'var(--cmp-brand-subtle)' : 'transparent'
              }}
            >
              <input
                type="radio"
                name="saleType"
                value="binding"
                checked={form.saleType === 'binding'}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
              />
              <span>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Binding sale</span>
                <span className="faint" style={{ display: 'block', fontSize: '12px', fontWeight: 400 }}>
                  Contracts exchange the moment offers close, and the winning offer cannot be withdrawn.
                </span>
              </span>
            </label>

            <label
              className="row"
              style={{
                gap: '10px',
                alignItems: 'flex-start',
                cursor: 'pointer',
                marginBottom: 0,
                padding: '12px',
                borderRadius: 'var(--cmp-radius-md)',
                border: form.saleType === 'reservation' ? '1px solid var(--cmp-brand-border)' : '1px solid var(--cmp-border)',
                background: form.saleType === 'reservation' ? 'var(--cmp-brand-subtle)' : 'transparent'
              }}
            >
              <input
                type="radio"
                name="saleType"
                value="reservation"
                checked={form.saleType === 'reservation'}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
              />
              <span>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Reservation sale</span>
                <span className="faint" style={{ display: 'block', fontSize: '12px', fontWeight: 400 }}>
                  The winning buyer takes a 28 day exclusivity period and exchanges within it.
                </span>
              </span>
            </label>
          </fieldset>

          <div className="field-row">
            <div>
              <label htmlFor="e-buyersFee">Buyer's fee %</label>
              <input
                id="e-buyersFee"
                name="buyersFee"
                inputMode="decimal"
                value={form.buyersFee}
                onChange={handleChange}
              />
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                Paid by the winner on top of the closing price.
              </p>
            </div>

            <div>
              <label htmlFor="e-agent">Responsible agent</label>
              <select
                id="e-agent"
                name="agent"
                value={form.agent}
                onChange={handleChange}
              >
                <option value="Layla Haddad">Layla Haddad</option>
                <option value="Karim Saleh">Karim Saleh</option>
                <option value="Emma Clarke">Emma Clarke</option>
                <option value="Arjun Mehta">Arjun Mehta</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 4: Viewings and notes */}
        <section className="card" style={{ padding: '22px', display: 'grid', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '17px' }}>Viewings and notes</h2>
          </div>

          <div>
            <label htmlFor="e-viewing">Open viewing times</label>
            <div className="row" style={{ gap: '8px' }}>
              <input
                id="e-viewing"
                name="viewingTime"
                placeholder="Saturday 10:00 to 12:00"
                value={form.viewingTime}
                onChange={handleChange}
              />
              <button
                type="button"
                className="btn btn-outline"
                disabled={!form.viewingTime.trim()}
                onClick={handleAddViewing}
              >
                Add
              </button>
            </div>
            <p className="faint" style={{ margin: '6px 0 0', fontSize: '12px' }}>
              Optional. Buyers who view are far more likely to register.
            </p>

            {form.viewingList.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {form.viewingList.map((v, i) => (
                  <span
                    key={i}
                    className="chip"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {v}
                    <button
                      type="button"
                      onClick={() => handleRemoveViewing(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="e-notes">Notes for the moderator</label>
            <textarea
              id="e-notes"
              name="moderatorNotes"
              rows={3}
              placeholder="Tenancy, service charge arrears, anything a buyer should know."
              value={form.moderatorNotes}
              onChange={handleChange}
            />
          </div>
        </section>

        {/* Action Buttons */}
        <div className="row" style={{ gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
          <button type="submit" className="btn btn-primary">
            Submit for review
          </button>
          <button type="button" className="btn btn-outline" onClick={handleSaveDraft}>
            Save as draft
          </button>
          <NavLink className="btn btn-ghost" to="/rto/entries">
            Cancel
          </NavLink>
        </div>
      </form>
    </div>
  );
}
