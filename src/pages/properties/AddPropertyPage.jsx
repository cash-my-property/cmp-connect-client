import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Check,
  Building,
  MapPin,
  FileText,
  DollarSign,
  Image,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export default function AddPropertyPage() {
  const { addListing, team } = useApp();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    agent: 'Layla Haddad',
    purpose: 'Sale',
    type: 'Apartment',
    category: 'Residential',
    title: '',
    titleArabic: '',
    description: '',
    descriptionArabic: '',
    community: 'Dubai Marina',
    building: '',
    unitNumber: '',
    bedrooms: '2',
    bathrooms: '2',
    areaSqft: '',
    permitNumber: '',
    price: '',
    photosCount: 8
  });

  const steps = [
    { num: 1, label: 'Purpose and type' },
    { num: 2, label: 'Location' },
    { num: 3, label: 'Property details' },
    { num: 4, label: 'Amenities' },
    { num: 5, label: 'Price and terms' },
    { num: 6, label: 'Photos and media' },
    { num: 7, label: 'Review and publish' }
  ];

  // Calculate live quality score
  const calculateQuality = () => {
    let score = 20;
    if (formData.title.length > 10) score += 15;
    if (formData.description.length > 50) score += 15;
    if (formData.permitNumber.length > 4) score += 20;
    if (formData.areaSqft && Number(formData.areaSqft) > 0) score += 15;
    if (formData.photosCount >= 6) score += 15;
    return Math.min(100, score);
  };

  const qualityScore = calculateQuality();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProp = {
      id: `CMP-S-00${Math.floor(Math.random() * 8999 + 1000)}`,
      title: formData.title || `${formData.bedrooms} bed ${formData.type} in ${formData.community}`,
      community: `${formData.community}, Dubai`,
      purpose: formData.purpose,
      type: formData.type,
      category: formData.category,
      beds: Number(formData.bedrooms) || 2,
      baths: Number(formData.bathrooms) || 2,
      areaSqft: Number(formData.areaSqft) || 1200,
      price: Number(formData.price) || 2500000,
      priceLabel: `AED ${(Number(formData.price) / 1000000).toFixed(2)}M`,
      leads: 0,
      views: 0,
      qualityScore,
      status: 'Live',
      agent: formData.agent,
      agentInitials: formData.agent
        .split(' ')
        .map((n) => n[0])
        .join(''),
      permitNumber: formData.permitNumber || 'DLD-991044',
      permitStatus: 'Valid',
      image:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=70',
      attentionCount: 0
    };
    addListing(newProp);
    navigate('/properties');
  };

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '24px' }}>Add a property</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
          Step-by-step listing creation. Real-time validation against Dubai Land Department compliance rules.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Left Sidebar: Step Indicators & Live Quality Meter */}
        <aside style={{ display: 'grid', gap: '16px' }}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '4px' }}>
            {steps.map((st) => (
              <li key={st.num}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(st.num)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: 'var(--cmp-radius-md)',
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: '13px',
                    textAlign: 'start',
                    background:
                      currentStep === st.num
                        ? 'var(--cmp-brand-subtle)'
                        : 'transparent',
                    color:
                      currentStep === st.num
                        ? 'var(--cmp-brand)'
                        : 'var(--cmp-text-muted)',
                    fontWeight: currentStep === st.num ? 700 : 500
                  }}
                >
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      fontSize: '11px',
                      fontWeight: 700,
                      background:
                        currentStep === st.num
                          ? 'var(--cmp-brand)'
                          : currentStep > st.num
                          ? 'var(--cmp-success)'
                          : 'var(--cmp-border)',
                      color:
                        currentStep === st.num || currentStep > st.num
                          ? '#FFFFFF'
                          : 'var(--cmp-text-faint)'
                    }}
                  >
                    {currentStep > st.num ? <Check size={12} /> : st.num}
                  </span>
                  <span>{st.label}</span>
                </button>
              </li>
            ))}
          </ol>

          {/* Live Listing Quality Card */}
          <div className="card" style={{ padding: '16px' }}>
            <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Listing quality
            </p>
            <p style={{ margin: '6px 0 10px', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
              {qualityScore}
              <span className="faint" style={{ fontSize: '14px', fontWeight: 600 }}>/100</span>
            </p>
            <div style={{ height: '6px', borderRadius: '3px', background: 'var(--cmp-border)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${qualityScore}%`,
                  height: '100%',
                  background: 'var(--cmp-brand)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            <ul className="muted" style={{ margin: '12px 0 0', paddingLeft: '16px', display: 'grid', gap: '6px', fontSize: '12px' }}>
              <li>Add at least 8 photos <span className="faint">+20</span></li>
              <li>Description of 300+ chars <span className="faint">+15</span></li>
              <li>Add valid DLD permit <span className="faint">+20</span></li>
              <li>Pin location on map <span className="faint">+15</span></li>
              <li>Enter built-up area <span className="faint">+15</span></li>
            </ul>
          </div>
        </aside>

        {/* Wizard Form Area */}
        <div className="card" style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit}>
            {/* Step 1 */}
            {currentStep === 1 && (
              <div style={{ display: 'grid', gap: '18px' }}>
                <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px' }}>
                  Purpose and type
                </h2>

                <div>
                  <label>Responsible Agent</label>
                  <select
                    value={formData.agent}
                    onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                  >
                    {team.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Purpose</label>
                  <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {['Buy', 'Rent', 'Commercial Buy', 'Commercial Rent'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`chip ${formData.purpose === p ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, purpose: p })}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label>Property Type</label>
                  <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Duplex', 'Hotel Apartment'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`chip ${formData.type === t ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, type: t })}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label>Listing Title</label>
                  <input
                    placeholder="e.g. Upgraded 2 bed with full marina view"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                    {formData.title.length}/120 characters. Lead with key selling features.
                  </p>
                </div>

                <div>
                  <label>Description</label>
                  <textarea
                    rows={5}
                    placeholder="Describe the layout, condition, view, amenities and inclusions…"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <div style={{ display: 'grid', gap: '18px' }}>
                <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px' }}>
                  Location & Building
                </h2>

                <div>
                  <label>Community</label>
                  <select
                    value={formData.community}
                    onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                  >
                    {[
                      'Dubai Marina',
                      'Downtown Dubai',
                      'Palm Jumeirah',
                      'Business Bay',
                      'Dubai Hills Estate',
                      'Arabian Ranches',
                      'Jumeirah Lake Towers'
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label>Building / Project Name</label>
                    <input
                      placeholder="e.g. Marina Gate Tower 1"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Unit Number (Confidential)</label>
                    <input
                      placeholder="e.g. 1402"
                      value={formData.unitNumber}
                      onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    />
                    <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                      Never disclosed publicly to buyers.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <div style={{ display: 'grid', gap: '18px' }}>
                <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px' }}>
                  Property details & Compliance
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <label>Bedrooms</label>
                    <select
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    >
                      {['0', '1', '2', '3', '4', '5', '6+'].map((b) => (
                        <option key={b} value={b}>
                          {b === '0' ? 'Studio' : b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Bathrooms</label>
                    <select
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    >
                      {['1', '2', '3', '4', '5+'].map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Built-up Area (sqft)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1340"
                      value={formData.areaSqft}
                      onChange={(e) => setFormData({ ...formData, areaSqft: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label>Dubai Land Department (DLD) Permit Number</label>
                  <input
                    placeholder="e.g. DLD-7128394"
                    value={formData.permitNumber}
                    onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                  />
                  <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                    Mandatory for advertising under RERA / DLD Trakheesi regulations.
                  </p>
                </div>
              </div>
            )}

            {/* Steps 4, 5, 6, 7 combined or simplified */}
            {currentStep >= 4 && (
              <div style={{ display: 'grid', gap: '18px' }}>
                <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px' }}>
                  {currentStep === 4
                    ? 'Amenities'
                    : currentStep === 5
                    ? 'Price & Financial Terms'
                    : currentStep === 6
                    ? 'Photos & Media'
                    : 'Review & Publish'}
                </h2>

                {currentStep === 4 && (
                  <div>
                    <label>Select Amenities</label>
                    <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        'Balcony',
                        'Built-in Wardrobes',
                        'Central A/C',
                        'Covered Parking',
                        'Gymnasium',
                        'Swimming Pool',
                        'Security 24/7',
                        'View of Landmark'
                      ].map((am) => (
                        <button key={am} type="button" className="chip active">
                          <Check size={12} /> {am}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div style={{ display: 'grid', gap: '14px' }}>
                    <div>
                      <label>Asking Price (AED)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2850000"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 6 && (
                  <div>
                    <label>Listing Photos</label>
                    <p className="muted" style={{ fontSize: '13px' }}>
                      Photos will automatically receive your agency watermark as configured in Brand Kit.
                    </p>
                    <div
                      style={{
                        padding: '40px',
                        border: '2px dashed var(--cmp-border)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        background: 'var(--cmp-surface-sunken)'
                      }}
                    >
                      <Image size={32} style={{ color: 'var(--cmp-brand)', marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>Drag & drop 8+ photos here</p>
                      <span className="faint" style={{ fontSize: '12px' }}>PNG, JPG or WebP up to 20MB</span>
                    </div>
                  </div>
                )}

                {currentStep === 7 && (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <p className="muted" style={{ fontSize: '14px' }}>
                      Ready to publish your listing to Cash My Property and sync to portals!
                    </p>
                    <div className="card" style={{ padding: '16px', background: 'var(--cmp-surface-sunken)' }}>
                      <strong>{formData.title || 'Untitled Property'}</strong>
                      <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                        {formData.community} · {formData.purpose} · {formData.type}
                      </p>
                      <p style={{ margin: '8px 0 0', fontWeight: 700, color: 'var(--cmp-brand)' }}>
                        AED {Number(formData.price || 2850000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div
              className="row"
              style={{
                justifyContent: 'space-between',
                marginTop: '28px',
                paddingTop: '18px',
                borderTop: '1px solid var(--cmp-border)'
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>

              {currentStep < 7 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
                >
                  <span>Continue</span>
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button type="submit" className="btn btn-accent">
                  <Check size={16} />
                  <span>Publish property</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
