import React, { useState } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Check,
  Building,
  MapPin,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function EditPropertyPage() {
  const { listings, updateListing, team } = useApp();
  const navigate = useNavigate();
  const { id = 'CMP-S-001001' } = useParams();

  // Find listing or fallback to realistic default
  const existingListing = listings?.find((l) => l.id === id) || {
    id: id || 'CMP-S-001001',
    title: 'Full marina view 2 bed in Marina Gate',
    titleArabic: 'شقة غرفتين وصالة بإطلالة مميزة على المارينا',
    description: 'Two bedroom on a high floor of Marina Gate with an unbroken view down the marina, a wide balcony and a renovated kitchen.',
    descriptionArabic: 'شقة رائعة في الطابق المرتفع بإطلالة بانورامية كاملة وتجهيزات حديثة.',
    agent: 'Karim Saleh',
    purpose: 'Buy',
    type: 'Apartment',
    category: 'Residential',
    community: 'Dubai Marina',
    building: 'Marina Gate 1',
    unitNumber: '2404',
    bedrooms: '2',
    bathrooms: '2',
    areaSqft: '1420',
    permitNumber: '0812948192',
    price: '2850000',
    status: 'Live',
    photosCount: 14
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    agent: existingListing.agent || 'Karim Saleh',
    purpose: existingListing.purpose || 'Buy',
    type: existingListing.type || 'Apartment',
    category: existingListing.category || 'Residential',
    title: existingListing.title || '',
    titleArabic: existingListing.titleArabic || '',
    description: existingListing.description || '',
    descriptionArabic: existingListing.descriptionArabic || '',
    community: existingListing.community || 'Dubai Marina',
    building: existingListing.building || 'Marina Gate 1',
    unitNumber: existingListing.unitNumber || '2404',
    bedrooms: existingListing.bedrooms || '2',
    bathrooms: existingListing.bathrooms || '2',
    areaSqft: existingListing.areaSqft || '1420',
    permitNumber: existingListing.permitNumber || '0812948192',
    price: existingListing.price || '2850000',
    photosCount: existingListing.photosCount || 14
  });

  const [amenities, setAmenities] = useState([
    'Balcony',
    'Built in Wardrobes',
    'Central A/C',
    'Covered Parking',
    'Gym / Health Club',
    'Swimming Pool',
    '24/7 Security'
  ]);

  const allAmenities = [
    'Balcony',
    'Built in Wardrobes',
    'Central A/C',
    'Covered Parking',
    'Kitchen Appliances',
    'Pets Allowed',
    'Private Garden',
    'Private Pool',
    'Gym / Health Club',
    'Swimming Pool',
    '24/7 Security',
    'Children Play Area',
    'Sea View',
    'Landmark View'
  ];

  const steps = [
    { num: 1, label: 'Purpose and type' },
    { num: 2, label: 'Location' },
    { num: 3, label: 'Property details' },
    { num: 4, label: 'Amenities' },
    { num: 5, label: 'Price and terms' },
    { num: 6, label: 'Photos and media' },
    { num: 7, label: 'Review and publish' }
  ];

  // Quality calculation matching concept
  const calculateQuality = () => {
    let score = 20;
    if (formData.title.length > 20) score += 15;
    if (formData.description.length >= 120) score += 15;
    if (formData.description.length >= 300) score += 12;
    if (formData.permitNumber.length > 4) score += 15;
    if (formData.areaSqft && Number(formData.areaSqft) > 0) score += 10;
    if (amenities.length >= 5) score += 8;
    if (formData.photosCount >= 10) score += 15;
    return Math.min(100, score);
  };

  const qualityScore = calculateQuality();

  const handleAmenityToggle = (amenity) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const handleSave = () => {
    if (updateListing) {
      updateListing(existingListing.id, formData);
    }
    alert(`Listing ${existingListing.id} changes have been successfully saved.`);
    navigate('/properties');
  };

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
          marginBottom: '18px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, letterSpacing: '-0.02em' }}>
            Edit listing
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            Changes to a live listing show on the website and app as soon as you save them.
          </p>
        </div>

        <div className="row" style={{ gap: '8px' }}>
          <NavLink to="/properties" className="btn btn-outline btn-sm">
            Cancel
          </NavLink>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
            <Save size={14} />
            <span>Save changes</span>
          </button>
        </div>
      </div>

      <div className="wizard-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Step Wizard & Quality Meter */}
        <aside style={{ display: 'grid', gap: '16px' }}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '4px' }}>
            {steps.map((s) => {
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <li key={s.num}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(s.num)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: 'var(--cmp-radius-md)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      textAlign: 'start',
                      background: isActive
                        ? 'var(--cmp-brand-subtle)'
                        : 'transparent',
                      color: isActive
                        ? 'var(--cmp-brand)'
                        : isPast
                        ? 'var(--cmp-text)'
                        : 'var(--cmp-text-muted)'
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
                        background: isActive
                          ? 'var(--cmp-brand)'
                          : isPast
                          ? 'var(--cmp-brand-border)'
                          : 'var(--cmp-surface-sunken)',
                        color: isActive
                          ? 'var(--cmp-text-on-brand)'
                          : isPast
                          ? 'var(--cmp-brand)'
                          : 'var(--cmp-text-faint)'
                      }}
                    >
                      {isPast ? <Check size={12} /> : s.num}
                    </span>
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Quality Score Meter */}
          <div className="card" style={{ padding: '16px' }}>
            <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Listing quality
            </p>
            <p style={{ margin: '6px 0 10px', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
              {qualityScore}
              <span className="faint" style={{ fontSize: '14px', fontWeight: 600 }}>/100</span>
            </p>
            <div style={{ height: '6px', borderRadius: '3px', background: 'var(--cmp-border)', overflow: 'hidden' }}>
              <div style={{ width: `${qualityScore}%`, height: '100%', background: 'var(--cmp-brand)', transition: 'width 0.3s ease' }} />
            </div>
            <ul className="muted" style={{ margin: '14px 0 0', paddingLeft: '16px', display: 'grid', gap: '6px', fontSize: '12px' }}>
              <li>Write a description of 300+ characters <span className="faint">+12</span></li>
              <li>Verify pin on the map <span className="faint">+10</span></li>
              <li>Select at least 5 amenities <span className="faint">+8</span></li>
              <li>Upload a floor plan <span className="faint">+8</span></li>
              <li>Add a video or 360 tour <span className="faint">+7</span></li>
            </ul>
          </div>
        </aside>

        {/* Right Form Step Content */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
            <p className="faint" style={{ margin: 0, fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Editing {existingListing.id} · {existingListing.status || 'Live'}
            </p>
            <span className="badge badge-success">Live on CMP</span>
          </div>

          {/* STEP 1: Purpose & Type */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Purpose and type</h2>
              <div style={{ display: 'grid', gap: '18px' }}>
                <div>
                  <label>Listed under</label>
                  <select
                    value={formData.agent}
                    onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                  >
                    <option value="Karim Saleh">Karim Saleh</option>
                    <option value="Layla Haddad">Layla Haddad</option>
                    <option value="Emma Clarke">Emma Clarke</option>
                    <option value="Arjun Mehta">Arjun Mehta</option>
                  </select>
                  <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                    The agent buyers see on this listing, with their BRN. Enquiries go to them.
                  </p>
                </div>

                <div>
                  <label>Purpose</label>
                  <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {['Buy', 'Rent', 'Commercial Buy', 'Commercial Rent'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="chip"
                        aria-pressed={formData.purpose === p}
                        onClick={() => setFormData({ ...formData, purpose: p })}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label>Property type</label>
                  <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      'Apartment',
                      'Villa',
                      'Townhouse',
                      'Penthouse',
                      'Duplex',
                      'Hotel Apartment',
                      'Residential Plot'
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="chip"
                        aria-pressed={formData.type === t}
                        onClick={() => setFormData({ ...formData, type: t })}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label>Listing title</label>
                  <input
                    maxLength={120}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Upgraded 2 bed with full marina view"
                  />
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: '4px' }}>
                    <span className="faint" style={{ fontSize: '12px' }}>
                      {formData.title.length}/120 characters
                    </span>
                    <span className="faint" style={{ fontSize: '12px' }}>
                      Lead with the unique selling point
                    </span>
                  </div>
                </div>

                <div>
                  <label>Title in Arabic (optional)</label>
                  <input
                    dir="rtl"
                    value={formData.titleArabic}
                    onChange={(e) => setFormData({ ...formData, titleArabic: e.target.value })}
                  />
                </div>

                <div>
                  <label>Description</label>
                  <textarea
                    rows={6}
                    maxLength={8000}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <div className="row" style={{ justifyContent: 'space-between', marginTop: '4px' }}>
                    <span className="faint" style={{ fontSize: '12px' }}>
                      {formData.description.length} characters. Listings over 300 rank higher.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Location</h2>
              <div style={{ display: 'grid', gap: '18px' }}>
                <div className="field-row">
                  <div>
                    <label>City</label>
                    <input type="text" defaultValue="Dubai" disabled style={{ background: 'var(--cmp-surface-sunken)' }} />
                  </div>
                  <div>
                    <label>Community</label>
                    <input
                      type="text"
                      value={formData.community}
                      onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div>
                    <label>Building / Project</label>
                    <input
                      type="text"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Unit number (Private to agency)</label>
                    <input
                      type="text"
                      value={formData.unitNumber}
                      onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Property details */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Property details</h2>
              <div style={{ display: 'grid', gap: '18px' }}>
                <div className="field-row">
                  <div>
                    <label>Bedrooms</label>
                    <select
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    >
                      <option value="Studio">Studio</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5+">5+</option>
                    </select>
                  </div>
                  <div>
                    <label>Bathrooms</label>
                    <select
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4+">4+</option>
                    </select>
                  </div>
                </div>
                <div className="field-row">
                  <div>
                    <label>Area (Sq. Ft.)</label>
                    <input
                      type="number"
                      value={formData.areaSqft}
                      onChange={(e) => setFormData({ ...formData, areaSqft: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>DLD Trakheesi Permit Number</label>
                    <input
                      type="text"
                      value={formData.permitNumber}
                      onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Amenities */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '14px' }}>Amenities</h2>
              <p className="muted" style={{ fontSize: '13.5px', marginBottom: '18px' }}>
                Tick at least 5 amenities to maximize buyer search impressions.
              </p>
              <div className="row" style={{ gap: '10px', flexWrap: 'wrap' }}>
                {allAmenities.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    className="chip"
                    aria-pressed={amenities.includes(amenity)}
                    onClick={() => handleAmenityToggle(amenity)}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Price and terms */}
          {currentStep === 5 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Price and terms</h2>
              <div style={{ display: 'grid', gap: '18px' }}>
                <div>
                  <label>Price in AED</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                    Formatted: AED {Number(formData.price || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Photos and media */}
          {currentStep === 6 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '14px' }}>Photos and media</h2>
              <p className="muted" style={{ fontSize: '13.5px', marginBottom: '18px' }}>
                {formData.photosCount} high-resolution photos currently published.
              </p>
              <div
                style={{
                  border: '2px dashed var(--cmp-border)',
                  borderRadius: '14px',
                  padding: '36px',
                  textAlign: 'center',
                  background: 'var(--cmp-surface-sunken)',
                  display: 'grid',
                  placeItems: 'center',
                  gap: '12px'
                }}
              >
                <ImageIcon size={32} style={{ color: 'var(--cmp-brand)' }} />
                <strong>Drag and drop replacement photos or click to browse</strong>
                <button type="button" className="btn btn-outline btn-sm">
                  Add more photos
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: Review and publish */}
          {currentStep === 7 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '14px' }}>Review and publish</h2>
              <div className="card" style={{ padding: '16px', marginBottom: '18px', background: 'var(--cmp-surface-sunken)' }}>
                <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--cmp-success)' }} />
                  <div>
                    <strong>Listing is complete and compliant with DLD</strong>
                    <p className="muted" style={{ margin: 0, fontSize: '12.5px' }}>
                      Permit {formData.permitNumber} verified on Dubai Land Department.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                <div className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--cmp-border)' }}>
                  <span className="muted">Title:</span>
                  <strong>{formData.title}</strong>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--cmp-border)' }}>
                  <span className="muted">Community & Building:</span>
                  <span>{formData.building}, {formData.community}</span>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--cmp-border)' }}>
                  <span className="muted">Price:</span>
                  <strong>AED {Number(formData.price).toLocaleString()}</strong>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--cmp-border)' }}>
                  <span className="muted">Agent:</span>
                  <span>{formData.agent}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Bottom Controls */}
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
              style={{ opacity: currentStep === 1 ? 0.4 : 1 }}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                <Save size={14} />
                <span>Save and publish</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
