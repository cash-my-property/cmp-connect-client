import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';
import GooglePlacesLocationInput from '../../components/common/GooglePlacesLocationInput';
import {
  Building,
  MapPin,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  UserCheck,
  Info,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Classification & Type' },
  { num: 2, label: 'Location' },
  { num: 3, label: 'Specifications & Price' },
  { num: 4, label: 'Amenities' },
  { num: 5, label: 'Photos & Documents' },
  { num: 6, label: 'Review & Submit' }
];

const CATEGORIES = [
  { id: 'RESIDENTIAL', label: 'Residential' },
  { id: 'COMMERCIAL', label: 'Commercial' }
];

const PLANS = [
  { id: 'READY', label: 'Ready' },
  { id: 'OFF_PLAN', label: 'Off-Plan' }
];

// Exact Real Time Offer Property Types:
// Residential Ready: Apartment, Villa, Land
// Residential Off-Plan: Apartment, Villa
// Commercial Ready: Retail, Offices, Building
// Commercial Off-Plan: Retail
const PROPERTY_TYPES_MAP = {
  RESIDENTIAL: {
    READY: [
      { id: 'APARTMENT', label: 'Apartment' },
      { id: 'VILLA', label: 'Villa' },
      { id: 'LAND', label: 'Land' }
    ],
    OFF_PLAN: [
      { id: 'APARTMENT', label: 'Apartment' },
      { id: 'VILLA', label: 'Villa' }
    ]
  },
  COMMERCIAL: {
    READY: [
      { id: 'RETAIL', label: 'Retail' },
      { id: 'OFFICES', label: 'Offices' },
      { id: 'BUILDING', label: 'Building' }
    ],
    OFF_PLAN: [
      { id: 'RETAIL', label: 'Retail' }
    ]
  }
};

const DEFAULT_AMENITIES = {
  RESIDENTIAL: [
    'Balcony',
    'Built in Wardrobes',
    'Central A/C',
    'Covered Parking',
    'Kitchen Appliances',
    'Maids Room',
    'Pets Allowed',
    'Private Garden',
    'Private Pool',
    'Shared Pool',
    'Shared Gym',
    'Security',
    'Concierge',
    'View of Water',
    'Walk-in Closet',
    'Barbecue Area',
    'Childrens Play Area',
    'Study Room'
  ],
  COMMERCIAL: [
    'Networked',
    'Covered Parking',
    'Central A/C',
    'Security',
    'Conference room',
    'Dining in building',
    'Lobby in Building',
    'Shared Gym',
    'Shared Pool',
    'Vastu-compliant',
    'CCTV Security',
    'High-speed Elevators'
  ]
};

// Backend document labels and keys matching RTO options.rules & options.docLabels
const DEFAULT_DOC_LABELS = {
  exclusiveContract: 'Exclusive contract (Form A)',
  propertyTitleDeed: 'Title deed',
  propertyCheque: 'Security cheque',
  propertyTrakheesi: 'Trakheesi / DLD permit',
  passportDocument: "Owner's passport copy",
  propertyUndertakingLetter: 'Undertaking letter',
  propertyFloorPlan: 'Floor plan diagram',
  propertySitePlan: 'Site plan diagram',
  propertyESignature: 'E-signature confirmation',
  propertyEid_Visa: "Owner's Emirates ID / visa",
  companyLicense: 'Company licence',
  statementOfAccount: 'Statement of account',
  OqoodDocument: 'Oqood certificate',
  spaDocument: 'Sale and purchase agreement (SPA)',
  otherDocuments: 'Other documents'
};

// Backend anti-spam contact patterns (email, website link, UAE phone)
const CONTACT_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(https?:\/\/|www\.)\S+/i,
  /(?:\+?971|00971|\b0)[\s-]?(?:5\d|[234679])[\s-]?\d{3}[\s-]?\d{4}\b/
];

const findContactDetail = (text) => {
  if (!text || typeof text !== 'string') return null;
  for (const rx of CONTACT_PATTERNS) {
    const m = text.match(rx);
    if (m) return m[0];
  }
  return null;
};

const cleanContactDetails = (text) => {
  if (!text || typeof text !== 'string') return text;
  let cleaned = text;
  for (const rx of CONTACT_PATTERNS) {
    const globalRx = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : rx.flags + 'g');
    cleaned = cleaned.replace(globalRx, '');
  }
  return cleaned.replace(/\s{2,}/g, ' ').trim();
};

export default function EnterPropertyPage() {
  const navigate = useNavigate();
  const { isLiveData, authToken, can, account } = useApp();

  const [currentStep, setCurrentStep] = useState(1);
  const [options, setOptions] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState(null);

  const [stepError, setStepError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    propertyCategory: 'RESIDENTIAL',
    propertyPlan: 'READY',
    propertyType: 'APARTMENT',
    propertyTitle: '',
    propertyTitleAr: '',
    propertyDescription: '',
    propertyDescriptionAr: '',
    propertyLocation: 'Dubai Marina, Dubai',
    propertyLatitude: 25.08,
    propertyLongitude: 55.14,
    propertyPrice: '', // Auction starting price
    propertyArea: '',
    propertyAreaUnit: 'sqft',
    propertyBedrooms: '2',
    propertyWashrooms: '2',
    propertyBuiltUpArea: '',
    trakheesiNumber: '',
    emiratesIdExpiry: '',
    propertyAmenities: [],
    propertyImages: [],
    documents: {},
    listedBy: ''
  });

  // Fetch RTO options and rules
  useEffect(() => {
    async function loadOptions() {
      if (!isLiveData || !authToken) return;
      setIsLoadingOptions(true);
      try {
        const res = await cmpConnectApi.getRtoOptions(authToken);
        if (res?.data) {
          setOptions(res.data);
        }
      } catch (err) {
        console.warn('[RTO options error, using fallback]', err);
      } finally {
        setIsLoadingOptions(false);
      }
    }
    loadOptions();
  }, [isLiveData, authToken]);

  // Fetch active team members if user has assign permission
  useEffect(() => {
    async function loadMembers() {
      if (!isLiveData || !authToken || !can('listings.assign')) return;
      try {
        const res = await cmpConnectApi.listMembers({ status: 'ACTIVE', limit: 100 }, authToken);
        if (Array.isArray(res?.data)) {
          setActiveMembers(res.data);
        }
      } catch (err) {
        console.warn('[RTO load members error]', err);
      }
    }
    loadMembers();
  }, [isLiveData, authToken, can]);

  // Available types for selected category and plan (matching listings)
  const availableTypes = useMemo(() => {
    const list = PROPERTY_TYPES_MAP[formData.propertyCategory]?.[formData.propertyPlan];
    return list || [{ id: 'APARTMENT', label: 'Apartment' }];
  }, [formData.propertyCategory, formData.propertyPlan]);

  // Ensure valid property type when category/plan changes
  useEffect(() => {
    const validIds = availableTypes.map((t) => t.id);
    if (!validIds.includes(formData.propertyType)) {
      setFormData((prev) => ({ ...prev, propertyType: validIds[0] || 'APARTMENT' }));
    }
  }, [availableTypes, formData.propertyType]);

  // Conditional fields
  const showBedrooms = ['APARTMENT', 'VILLA'].includes(formData.propertyType);
  const showBuiltUpArea = ['VILLA', 'BUILDING'].includes(formData.propertyType);

  // Available amenities
  const availableAmenities = useMemo(() => {
    if (options?.amenities?.[formData.propertyCategory]) {
      return options.amenities[formData.propertyCategory];
    }
    return DEFAULT_AMENITIES[formData.propertyCategory] || DEFAULT_AMENITIES.RESIDENTIAL;
  }, [options, formData.propertyCategory]);

  const docLabels = options?.docLabels || DEFAULT_DOC_LABELS;

  // Active legal documents required & optional dynamically matching backend RTO rules for current category, plan & type
  const activeDocumentsList = useMemo(() => {
    const typeRule = options?.rules?.[formData.propertyCategory]?.[formData.propertyPlan]?.[formData.propertyType];
    if (typeRule) {
      const req = (typeRule.requiredDocs || []).map((k) => ({
        key: k,
        label: docLabels[k] || k,
        required: true
      }));
      const opt = (typeRule.optionalDocs || []).filter((k) => k !== 'otherDocuments').map((k) => ({
        key: k,
        label: docLabels[k] || k,
        required: false
      }));
      return [...req, ...opt];
    }

    // Default compliant list for Ready Apartment / Villa
    const isOffPlan = formData.propertyPlan === 'OFF_PLAN';
    const isLand = formData.propertyType === 'LAND';
    const isCommercial = formData.propertyCategory === 'COMMERCIAL';

    if (isOffPlan) {
      return [
        { key: 'exclusiveContract', label: 'Exclusive contract (Form A)', required: true },
        { key: 'OqoodDocument', label: 'Oqood certificate', required: true },
        { key: 'propertyCheque', label: 'Security cheque', required: true },
        { key: 'propertyTrakheesi', label: 'Trakheesi / DLD permit', required: true },
        { key: 'passportDocument', label: "Owner's passport copy", required: true },
        { key: 'propertyUndertakingLetter', label: 'Undertaking letter', required: true },
        { key: 'spaDocument', label: 'Sale and purchase agreement (SPA)', required: true },
        { key: 'statementOfAccount', label: 'Statement of account', required: true },
        { key: 'propertyFloorPlan', label: 'Floor plan diagram', required: true },
        { key: 'propertyESignature', label: 'E-signature confirmation', required: true }
      ];
    }

    return [
      { key: 'exclusiveContract', label: 'Exclusive contract (Form A)', required: true },
      { key: 'propertyTitleDeed', label: 'Title deed', required: true },
      { key: 'propertyCheque', label: 'Security cheque', required: true },
      { key: 'propertyTrakheesi', label: 'Trakheesi / DLD permit', required: true },
      { key: 'passportDocument', label: "Owner's passport copy", required: true },
      { key: 'propertyUndertakingLetter', label: 'Undertaking letter', required: true },
      ...(!isLand && !isCommercial ? [{ key: 'propertyFloorPlan', label: 'Floor plan diagram', required: true }] : []),
      { key: 'propertyESignature', label: 'E-signature confirmation', required: true },
      { key: 'propertyEid_Visa', label: "Owner's Emirates ID / visa", required: false }
    ];
  }, [options, formData.propertyCategory, formData.propertyPlan, formData.propertyType, docLabels]);

  // Eligible agents with BRN for agency accounts
  const brnEligibleMembers = useMemo(() => {
    return activeMembers.filter((m) => Boolean(m.compliance?.brn));
  }, [activeMembers]);

  // Toggle amenity
  const handleToggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.propertyAmenities.includes(amenity);
      const next = exists
        ? prev.propertyAmenities.filter((a) => a !== amenity)
        : [...prev.propertyAmenities, amenity];
      return { ...prev, propertyAmenities: next };
    });
  };

  // Cloudinary Direct Upload for Photos
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingImage(true);
    setStepError(null);

    try {
      const sigRes = await cmpConnectApi.getRtoUploadSignature('', authToken);
      const sig = sigRes?.data?.images || sigRes?.data;
      if (!sig || !sig.signature) throw new Error('Could not obtain upload signature.');

      const uploads = files.map((file) => cmpConnectApi.uploadRtoFileToCloudinary(file, sig));
      const results = await Promise.all(uploads);

      const newPhotos = results.map((r) => ({ url: r.url, public_id: r.public_id }));
      setFormData((prev) => ({
        ...prev,
        propertyImages: [...prev.propertyImages, ...newPhotos]
      }));
      setSuccessBanner(`${results.length} photo(s) uploaded successfully.`);
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err) {
      console.error('[RTO Photo upload error]', err);
      setStepError(err.message || 'Image upload to Cloudinary failed.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      propertyImages: prev.propertyImages.filter((_, i) => i !== index)
    }));
  };

  // Cloudinary Direct Upload for Legal Documents
  const handleDocUpload = async (e, docKey) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocKey(docKey);
    setStepError(null);

    try {
      const sigRes = await cmpConnectApi.getRtoUploadSignature('', authToken);
      const sig = sigRes?.data?.docs || sigRes?.data;
      if (!sig || !sig.signature) throw new Error('Could not obtain doc upload signature from CMP server.');

      const result = await cmpConnectApi.uploadRtoFileToCloudinary(file, sig);
      setFormData((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docKey]: {
            url: result.url,
            public_id: result.public_id,
            fileName: file.name
          }
        }
      }));
      setSuccessBanner(`Document uploaded: ${file.name}`);
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err) {
      console.error('[RTO Doc upload error]', err);
      setStepError(err.message || 'Document upload to Cloudinary failed. Check your network or session.');
    } finally {
      setUploadingDocKey(null);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (docKey) => {
    setFormData((prev) => {
      const next = { ...prev.documents };
      delete next[docKey];
      return { ...prev, documents: next };
    });
  };

  // Auto-fill valid Cloudinary signed documents for testing
  const handleAutoFillSampleDocs = async () => {
    setStepError(null);
    setIsSubmitting(true);
    try {
      const sigRes = await cmpConnectApi.getRtoUploadSignature('', authToken);
      const sig = sigRes?.data?.docs || sigRes?.data?.images || sigRes?.data;
      if (!sig || !sig.folder) {
        throw new Error('Please ensure you are logged into CMP Connect.');
      }
      const folder = sig.folder;
      const cloud = sig.cloudName || 'dxdcohcc3';

      const sampleDocs = {};
      activeDocumentsList.forEach((d) => {
        sampleDocs[d.key] = {
          url: `https://res.cloudinary.com/${cloud}/${folder}/${d.key}.pdf`,
          public_id: `${folder}/${d.key}`,
          fileName: `${d.label || d.key}.pdf`
        };
      });

      const samplePhotos = Array(8).fill(null).map((_, i) => ({
        url: `https://res.cloudinary.com/${cloud}/${folder}/photo_${i + 1}.jpg`,
        public_id: `${folder}/photo_${i + 1}`
      }));

      setFormData((prev) => ({
        ...prev,
        propertyImages: prev.propertyImages.length >= 8 ? prev.propertyImages : samplePhotos,
        documents: { ...prev.documents, ...sampleDocs }
      }));
      setSuccessBanner('All required legal documents & photos attached with Cloudinary paths!');
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (e) {
      console.error(e);
      setStepError(e.message || 'Auto-fill failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    setStepError(null);

    // Validate Step 1
    if (currentStep === 1) {
      if (!formData.propertyTitle.trim()) {
        setStepError('Property title is required.');
        return;
      }
      const titleContact = findContactDetail(formData.propertyTitle);
      if (titleContact) {
        setStepError(`Property title cannot contain contact details ("${titleContact}"). Buyers contact you through CMP.`);
        return;
      }
      if (!formData.propertyDescription.trim()) {
        setStepError('Property description is required.');
        return;
      }
      const descContact = findContactDetail(formData.propertyDescription);
      if (descContact) {
        setStepError(`Description cannot contain contact details ("${descContact}"). Please remove phone numbers, emails, or websites, or click "Auto-remove contact info".`);
        return;
      }
      if (can('listings.assign') && account?.accountType === 'AGENCY' && !account?.compliance?.brn && !account?.brn && !formData.listedBy) {
        setStepError('As an administrator without a registered broker licence (BRN), you must choose an assigned agent.');
        return;
      }
    }

    // Validate Step 2
    if (currentStep === 2) {
      if (!formData.propertyLocation.trim()) {
        setStepError('Property location is required. Please select a verified community or address.');
        return;
      }
    }

    // Validate Step 3
    if (currentStep === 3) {
      const price = Number(formData.propertyPrice);
      if (!price || price <= 0) {
        setStepError('Starting auction price in AED is required.');
        return;
      }
      const area = Number(formData.propertyArea);
      if (!area || area <= 0) {
        setStepError('Property area in sqft is required.');
        return;
      }
      if (!formData.trakheesiNumber.trim()) {
        setStepError('Trakheesi permit number is required for DLD compliance.');
        return;
      }
      if (!formData.emiratesIdExpiry) {
        setStepError('Owner Emirates ID expiry date is required.');
        return;
      }
    }

    // Validate Step 5
    if (currentStep === 5) {
      const typeRule = options?.rules?.[formData.propertyCategory]?.[formData.propertyPlan]?.[formData.propertyType];
      const minPhotos = typeRule?.images?.min || (formData.propertyType === 'LAND' ? 2 : (['RETAIL', 'OFFICES'].includes(formData.propertyType) ? 5 : 8));

      if (formData.propertyImages.length < minPhotos) {
        setStepError(`Please upload at least ${minPhotos} high-resolution photos (currently ${formData.propertyImages.length} uploaded).`);
        return;
      }
      const missingRequiredDoc = activeDocumentsList.find(
        (d) => d.required && !formData.documents[d.key]?.url
      );
      if (missingRequiredDoc) {
        setStepError(`Mandatory legal document missing: ${missingRequiredDoc.label}.`);
        return;
      }
    }

    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Form Submission
  const handleSubmitProperty = async () => {
    setStepError(null);

    const titleContact = findContactDetail(formData.propertyTitle);
    if (titleContact) {
      setStepError(`Property title cannot contain contact details ("${titleContact}"). Buyers contact you through CMP.`);
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const descContact = findContactDetail(formData.propertyDescription);
    if (descContact) {
      setStepError(`Description cannot contain contact details ("${descContact}"). Buyers contact you through CMP.`);
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        propertyCategory: formData.propertyCategory,
        propertyPlan: formData.propertyPlan,
        propertyType: formData.propertyType,
        propertyTitle: formData.propertyTitle.trim(),
        propertyDescription: formData.propertyDescription.trim(),
        propertyLocation: formData.propertyLocation.trim(),
        propertyLatitude: Number(formData.propertyLatitude) || 25.08,
        propertyLongitude: Number(formData.propertyLongitude) || 55.14,
        propertyPrice: Number(formData.propertyPrice),
        propertyArea: Number(formData.propertyArea),
        propertyAreaUnit: 'sqft',
        propertyBedrooms: showBedrooms ? String(formData.propertyBedrooms) : undefined,
        propertyWashrooms: showBedrooms ? String(formData.propertyWashrooms) : undefined,
        propertyBuiltUpArea: showBuiltUpArea && formData.propertyBuiltUpArea ? Number(formData.propertyBuiltUpArea) : null,
        trakheesiNumber: formData.trakheesiNumber.trim(),
        emiratesIdExpiry: formData.emiratesIdExpiry,
        propertyAmenities: formData.propertyAmenities,
        propertyImages: formData.propertyImages,
        documents: formData.documents,
        listedBy: can('listings.assign') && formData.listedBy ? formData.listedBy : undefined
      };

      await cmpConnectApi.createRtoProperty(payload, authToken);
      alert('Property successfully entered into Real Time Offer! It is now with CMP for moderation review.');
      navigate('/rto');
    } catch (err) {
      console.error('[RTO submit error]', err);
      const msg = err.message || 'Submission failed. Please check your network connection.';
      setStepError(msg);

      // If backend reports contact details in title or description, navigate back to Step 1
      if (msg.toLowerCase().includes('title') || msg.toLowerCase().includes('description') || msg.toLowerCase().includes('contact details')) {
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: '20px' }}>
        <div className="row" style={{ gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
          <NavLink to="/rto" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} />
            <span>Back to Entries</span>
          </NavLink>
        </div>
        <h1 style={{ fontSize: '26px', margin: 0, fontWeight: 800 }}>Enter a property for Real Time Offer</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px' }}>
          Step-by-step compliant entry wizard for 7-day CMP-managed real-time auctions.
        </p>
      </div>

      {/* Global Alerts */}
      {stepError && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            background: 'var(--cmp-danger-subtle)',
            border: '1px solid var(--cmp-danger)',
            color: 'var(--cmp-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{stepError}</span>
        </div>
      )}

      {successBanner && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            background: 'var(--cmp-brand-subtle)',
            border: '1px solid var(--cmp-brand)',
            color: 'var(--cmp-brand)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{successBanner}</span>
        </div>
      )}

      {/* Main 2-Column Wizard Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Left Sidebar: Step Indicators */}
        <aside style={{ display: 'grid', gap: '16px' }}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '4px' }}>
            {STEPS.map((st) => {
              const isActive = currentStep === st.num;
              const isDone = currentStep > st.num;

              return (
                <li key={st.num}>
                  <button
                    type="button"
                    onClick={() => {
                      if (st.num < currentStep) {
                        setCurrentStep(st.num);
                        setStepError(null);
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: 'var(--cmp-radius-md)',
                      border: 'none',
                      cursor: st.num <= currentStep ? 'pointer' : 'default',
                      opacity: st.num > currentStep ? 0.6 : 1,
                      font: 'inherit',
                      fontSize: '13.5px',
                      textAlign: 'start',
                      background: isActive ? 'var(--cmp-brand-subtle)' : 'transparent',
                      color: isActive ? 'var(--cmp-brand)' : isDone ? 'var(--cmp-text)' : 'var(--cmp-text-muted)',
                      fontWeight: isActive ? 700 : isDone ? 600 : 500
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: isActive
                          ? 'var(--cmp-brand)'
                          : isDone
                          ? 'var(--cmp-success)'
                          : 'var(--cmp-border)',
                        color: isActive || isDone ? '#fff' : 'inherit',
                        flexShrink: 0
                      }}
                    >
                      {isDone ? <Check size={13} strokeWidth={3} /> : st.num}
                    </span>
                    <span>{st.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Quick Guidance Card */}
          <div className="card" style={{ padding: '16px' }}>
            <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
              Auction Rules
            </span>
            <p className="muted" style={{ margin: '8px 0 0', fontSize: '12.5px', lineHeight: '1.5' }}>
              • CMP reviews legal prospectus before scheduling.
              <br />
              • Auction runs for <strong>7 days</strong> with automatic 10m extension on late bids.
              <br />
              • All buyer offers are fully binding and verified.
            </p>
          </div>
        </aside>

        {/* Right Column: Active Step Card */}
        <div className="card" style={{ padding: '28px' }}>
          {/* STEP 1: Classification & Type */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                1. Property Classification & Type
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Select property category, status and type matching Dubai Land Department standard classification.
              </p>

              {/* Category */}
              <div style={{ marginBottom: '18px' }}>
                <label className="field-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Category *
                </label>
                <div className="row" style={{ gap: '8px' }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className="chip"
                      aria-pressed={formData.propertyCategory === cat.id}
                      style={{
                        padding: '8px 16px',
                        fontWeight: formData.propertyCategory === cat.id ? 700 : 500
                      }}
                      onClick={() => {
                        const newCat = cat.id;
                        const validTypes = PROPERTY_TYPES_MAP[newCat]?.[formData.propertyPlan] || [];
                        setFormData((prev) => ({
                          ...prev,
                          propertyCategory: newCat,
                          propertyType: validTypes.some((t) => t.id === prev.propertyType)
                            ? prev.propertyType
                            : (validTypes[0]?.id || 'APARTMENT')
                        }));
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Completion Status */}
              <div style={{ marginBottom: '20px' }}>
                <label className="field-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Completion Status *
                </label>
                <div className="row" style={{ gap: '8px' }}>
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      className="chip"
                      aria-pressed={formData.propertyPlan === plan.id}
                      style={{
                        padding: '8px 16px',
                        fontWeight: formData.propertyPlan === plan.id ? 700 : 500
                      }}
                      onClick={() => {
                        const newPlan = plan.id;
                        const validTypes = PROPERTY_TYPES_MAP[formData.propertyCategory]?.[newPlan] || [];
                        setFormData((prev) => ({
                          ...prev,
                          propertyPlan: newPlan,
                          propertyType: validTypes.some((t) => t.id === prev.propertyType)
                            ? prev.propertyType
                            : (validTypes[0]?.id || 'APARTMENT')
                        }));
                      }}
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type Grid */}
              <div style={{ marginBottom: '24px' }}>
                <label className="field-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Property Type * ({availableTypes.length} available)
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '8px'
                  }}
                >
                  {availableTypes.map((type) => {
                    const isSelected = formData.propertyType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        className="chip"
                        aria-pressed={isSelected}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          justifyContent: 'center',
                          fontSize: '12.5px',
                          fontWeight: isSelected ? 700 : 500,
                          background: isSelected ? 'var(--cmp-brand-subtle)' : undefined,
                          borderColor: isSelected ? 'var(--cmp-brand)' : undefined,
                          color: isSelected ? 'var(--cmp-brand)' : undefined
                        }}
                        onClick={() => setFormData((prev) => ({ ...prev, propertyType: type.id }))}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--cmp-border)', paddingTop: '20px' }}>
                <div>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label className="field-label" style={{ fontWeight: 600 }}>Property Title (English) *</label>
                    <span className="faint" style={{ fontSize: '11px' }}>{formData.propertyTitle.length}/100</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Marina view 2 bed in Marina Gate"
                    value={formData.propertyTitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, propertyTitle: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  />
                  <span className="faint" style={{ fontSize: '11.5px', display: 'block', marginTop: '3px' }}>
                    No phone numbers, emails, or company URLs allowed in title.
                  </span>
                  {findContactDetail(formData.propertyTitle) && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#ef4444' }}>
                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                        <span>
                          Contact detail detected: <strong>"{findContactDetail(formData.propertyTitle)}"</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        style={{ borderColor: '#ef4444', color: '#ef4444', flexShrink: 0 }}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            propertyTitle: cleanContactDetails(prev.propertyTitle)
                          }));
                          setStepError(null);
                        }}
                      >
                        <Sparkles size={12} style={{ marginRight: '4px' }} />
                        Auto-remove
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label className="field-label" style={{ fontWeight: 600 }}>Description (English) *</label>
                    <span className="faint" style={{ fontSize: '11px' }}>{formData.propertyDescription.length}/4000</span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    maxLength={4000}
                    placeholder="Detail the layout, views, finish quality, and highlights for prospective buyers…"
                    value={formData.propertyDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, propertyDescription: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  />
                  <span className="faint" style={{ fontSize: '11.5px', display: 'block', marginTop: '3px' }}>
                    Do not include phone numbers, emails, or company websites. Buyers contact and place bids directly through CMP.
                  </span>
                  {findContactDetail(formData.propertyDescription) && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ef4444' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>
                          Contact info detected: <strong>"{findContactDetail(formData.propertyDescription)}"</strong>. Remove phone/email/links to comply with CMP policy.
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        style={{ borderColor: '#ef4444', color: '#ef4444', flexShrink: 0 }}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            propertyDescription: cleanContactDetails(prev.propertyDescription)
                          }));
                          setStepError(null);
                        }}
                      >
                        <Sparkles size={12} style={{ marginRight: '4px' }} />
                        Auto-remove contact info
                      </button>
                    </div>
                  )}
                </div>

                {/* Assigned Agent (with listings.assign permission) */}
                {can('listings.assign') && (
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Assigned Listing Agent *
                    </label>
                    <select
                      value={formData.listedBy}
                      onChange={(e) => setFormData((prev) => ({ ...prev, listedBy: e.target.value }))}
                      style={{ width: '100%', fontSize: '13.5px' }}
                    >
                      <option value="">Select licensed agent (BRN required)</option>
                      {brnEligibleMembers.map((m) => (
                        <option key={m._id || m.id} value={m._id || m.id}>
                          {m.fullName || m.name} (BRN: {m.compliance?.brn || 'Verified'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                2. Property Location
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Enter the building, sub-community, or area. Google Places will pinpoint exact coordinates.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label className="field-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Search Community or Building *
                </label>
                <GooglePlacesLocationInput
                  value={formData.propertyLocation}
                  onChange={(val) => setFormData((prev) => ({ ...prev, propertyLocation: val }))}
                  onSelectPlace={(place) => {
                    setFormData((prev) => ({
                      ...prev,
                      propertyLocation: place.formattedAddress || place.name || prev.propertyLocation,
                      propertyLatitude: place.latitude || prev.propertyLatitude,
                      propertyLongitude: place.longitude || prev.propertyLongitude
                    }));
                  }}
                />
              </div>

              <div className="card" style={{ padding: '16px', background: 'var(--cmp-surface-subtle)' }}>
                <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                  <MapPin size={20} color="var(--cmp-brand)" />
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Selected Coordinates</span>
                    <p className="muted" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>
                      Latitude: {formData.propertyLatitude} · Longitude: {formData.propertyLongitude}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Specifications & Price */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                3. Specifications & Auction Price
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Enter starting auction price and physical specifications.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Starting Auction Price (AED) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 2000000"
                    value={formData.propertyPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, propertyPrice: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  />
                  <span className="faint" style={{ fontSize: '11.5px', display: 'block', marginTop: '3px' }}>
                    The auction starts at this exact price. No reserve or guide price.
                  </span>
                </div>

                <div>
                  <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Property Area (sqft) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 1420"
                    value={formData.propertyArea}
                    onChange={(e) => setFormData((prev) => ({ ...prev, propertyArea: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              {/* Conditional Built-up Area */}
              {showBuiltUpArea && (
                <div style={{ marginBottom: '18px' }}>
                  <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Built-up Area (sqft)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2100"
                    value={formData.propertyBuiltUpArea}
                    onChange={(e) => setFormData((prev) => ({ ...prev, propertyBuiltUpArea: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  />
                </div>
              )}

              {/* Conditional Bedrooms & Washrooms */}
              {showBedrooms && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Bedrooms *
                    </label>
                    <select
                      value={formData.propertyBedrooms}
                      onChange={(e) => setFormData((prev) => ({ ...prev, propertyBedrooms: e.target.value }))}
                      style={{ width: '100%', fontSize: '13.5px' }}
                    >
                      <option value="Studio">Studio</option>
                      {['1', '2', '3', '4', '5', '6', '7+'].map((num) => (
                        <option key={num} value={num}>{num} Bedrooms</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Washrooms *
                    </label>
                    <select
                      value={formData.propertyWashrooms}
                      onChange={(e) => setFormData((prev) => ({ ...prev, propertyWashrooms: e.target.value }))}
                      style={{ width: '100%', fontSize: '13.5px' }}
                    >
                      {['1', '2', '3', '4', '5', '6+'].map((num) => (
                        <option key={num} value={num}>{num} Washrooms</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Regulatory Compliance fields */}
              <div style={{ borderTop: '1px solid var(--cmp-border)', paddingTop: '18px', marginTop: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Regulatory Compliance</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Trakheesi Permit Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 7134567890"
                      value={formData.trakheesiNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, trakheesiNumber: e.target.value }))}
                      style={{ width: '100%', fontSize: '13.5px' }}
                    />
                  </div>

                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Owner Emirates ID Expiry *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.emiratesIdExpiry}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emiratesIdExpiry: e.target.value }))}
                      style={{ width: '100%', fontSize: '13.5px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Amenities */}
          {currentStep === 4 && (
            <div>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', margin: '0 0 2px', fontWeight: 700 }}>4. Property Amenities</h2>
                  <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
                    Select features and amenities available with the property.
                  </p>
                </div>
                <span className="badge badge-accent" style={{ fontWeight: 700 }}>
                  {formData.propertyAmenities.length} selected
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '8px'
                }}
              >
                {availableAmenities.map((amenity) => {
                  const isChecked = formData.propertyAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      className="chip"
                      aria-pressed={isChecked}
                      style={{
                        padding: '9px 12px',
                        justifyContent: 'flex-start',
                        fontSize: '12.5px',
                        fontWeight: isChecked ? 700 : 500,
                        background: isChecked ? 'var(--cmp-brand-subtle)' : undefined,
                        borderColor: isChecked ? 'var(--cmp-brand)' : undefined,
                        color: isChecked ? 'var(--cmp-brand)' : undefined
                      }}
                      onClick={() => handleToggleAmenity(amenity)}
                    >
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: isChecked ? '1px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                          background: isChecked ? 'var(--cmp-brand)' : 'transparent',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff',
                          marginRight: '6px',
                          flexShrink: 0
                        }}
                      >
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Photos & Documents */}
          {currentStep === 5 && (
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                5. Photos & Legal Documents
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Upload at least 8 high-resolution photos and required ownership documents for CMP moderation.
              </p>

              {/* Photos Upload Section */}
              <div style={{ marginBottom: '28px' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="field-label" style={{ fontWeight: 700 }}>
                    Photos ({formData.propertyImages.length}/25, Min 8 required) *
                  </label>
                  <label className="btn btn-outline btn-sm" style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer' }}>
                    {uploadingImage ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                    <span>{uploadingImage ? 'Uploading…' : 'Add Photos'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {formData.propertyImages.length === 0 ? (
                  <div
                    style={{
                      border: '2px dashed var(--cmp-border)',
                      borderRadius: '8px',
                      padding: '36px 16px',
                      textAlign: 'center',
                      background: 'var(--cmp-surface-subtle)'
                    }}
                  >
                    <ImageIcon size={32} className="faint" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600 }}>No photos uploaded yet</p>
                    <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                      PNG, JPG up to 5MB each. Minimum 8 required.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '10px'
                    }}
                  >
                    {formData.propertyImages.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          height: '90px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: '#000',
                          border: '1px solid var(--cmp-border)'
                        }}
                      >
                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Legal Documents Section */}
              <div style={{ borderTop: '1px solid var(--cmp-border)', paddingTop: '20px' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Legal & Verification Documents</h3>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={handleAutoFillSampleDocs}
                    style={{ borderColor: 'var(--cmp-brand)', color: 'var(--cmp-brand)' }}
                  >
                    <Sparkles size={12} style={{ marginRight: '4px' }} />
                    Auto-fill sample documents (testing)
                  </button>
                </div>
                <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px' }}>
                  CMP compliance team inspects each document before launching the 7-day bidding window.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeDocumentsList.map((doc) => {
                    const uploaded = formData.documents[doc.key];
                    const isUploadingThis = uploadingDocKey === doc.key;

                    return (
                      <div
                        key={doc.key}
                        className="row"
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          background: 'var(--cmp-surface-subtle)',
                          borderRadius: '8px',
                          border: uploaded ? '1px solid var(--cmp-success-border, #10B981)' : '1px solid var(--cmp-border)'
                        }}
                      >
                        <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                          <FileText size={18} style={{ color: uploaded ? 'var(--cmp-success)' : 'var(--cmp-text-faint)' }} />
                          <div>
                            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
                              {doc.label} {doc.required && <span style={{ color: 'var(--cmp-danger)' }}>*</span>}
                            </span>
                            {uploaded ? (
                              <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--cmp-success)', fontWeight: 600 }}>
                                ✓ Attached: {uploaded.fileName}
                              </span>
                            ) : (
                              <span className="faint" style={{ display: 'block', fontSize: '11.5px' }}>
                                PDF or image (Max 10MB)
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          {uploaded ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--cmp-danger)' }}
                              onClick={() => handleRemoveDoc(doc.key)}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          ) : (
                            <label className="btn btn-outline btn-sm" style={{ cursor: isUploadingThis ? 'not-allowed' : 'pointer' }}>
                              {isUploadingThis ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
                              <span>{isUploadingThis ? 'Uploading…' : 'Upload'}</span>
                              <input
                                type="file"
                                accept=".pdf,image/jpeg,image/png"
                                onChange={(e) => handleDocUpload(e, doc.key)}
                                disabled={isUploadingThis}
                                style={{ display: 'none' }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Submit */}
          {currentStep === 6 && (
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                6. Review & Submit Property
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Review all submitted specifications and legal attachments before final submission to CMP moderation.
              </p>

              {/* Prospectus Review Card */}
              <div
                className="card"
                style={{
                  padding: '20px',
                  background: 'var(--cmp-surface-subtle)',
                  marginBottom: '20px'
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span className="badge badge-neutral" style={{ fontSize: '11px', marginBottom: '6px' }}>
                      {formData.propertyCategory} · {formData.propertyPlan} · {formData.propertyType}
                    </span>
                    <h3 style={{ fontSize: '18px', margin: '4px 0 2px', fontWeight: 800 }}>{formData.propertyTitle}</h3>
                    <p className="muted" style={{ margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> {formData.propertyLocation}
                    </p>
                  </div>

                  <div style={{ textAlign: 'end' }}>
                    <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800 }}>Starting Price</span>
                    <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
                      AED {Number(formData.propertyPrice).toLocaleString('en-US')}
                    </p>
                  </div>
                </div>

                {/* Specs Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '12px',
                    padding: '12px 0',
                    borderTop: '1px solid var(--cmp-border)',
                    borderBottom: '1px solid var(--cmp-border)',
                    marginBottom: '14px'
                  }}
                >
                  <div>
                    <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Area</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '13.5px' }}>{formData.propertyArea} sqft</p>
                  </div>

                  {showBedrooms && (
                    <div>
                      <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Beds / Baths</span>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '13.5px' }}>
                        {formData.propertyBedrooms} beds · {formData.propertyWashrooms} baths
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Trakheesi #</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '13.5px' }}>{formData.trakheesiNumber}</p>
                  </div>

                  <div>
                    <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Photos</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '13.5px' }}>{formData.propertyImages.length} attached</p>
                  </div>
                </div>

                {/* Description Preview */}
                <div style={{ marginBottom: '14px' }}>
                  <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Description
                  </span>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {formData.propertyDescription}
                  </p>
                </div>

                {/* Verified Attachments */}
                <div>
                  <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Attached Documents ({Object.keys(formData.documents).length})
                  </span>
                  <div className="row" style={{ gap: '6px', flexWrap: 'wrap' }}>
                    {Object.entries(formData.documents).map(([k, d]) => (
                      <span key={k} className="chip" style={{ fontSize: '11.5px', color: 'var(--cmp-success)' }}>
                        ✓ {d.fileName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Contact Warning if detected */}
              {(findContactDetail(formData.propertyTitle) || findContactDetail(formData.propertyDescription)) && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#ef4444' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>
                      Direct contact details detected: <strong>"{findContactDetail(formData.propertyTitle) || findContactDetail(formData.propertyDescription)}"</strong>. CMP policy requires removing phone numbers, emails, and website links.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ borderColor: '#ef4444', color: '#ef4444', flexShrink: 0 }}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        propertyTitle: cleanContactDetails(prev.propertyTitle),
                        propertyDescription: cleanContactDetails(prev.propertyDescription)
                      }));
                      setStepError(null);
                    }}
                  >
                    <Sparkles size={14} style={{ marginRight: '4px' }} />
                    Auto-remove contact info
                  </button>
                </div>
              )}

              {/* Ready to Submit Banner */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'var(--cmp-brand-subtle)',
                  border: '1px solid var(--cmp-brand-border)',
                  marginBottom: '20px'
                }}
              >
                <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                  <Sparkles size={20} color="var(--cmp-brand)" />
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
                      Ready for CMP Moderation
                    </span>
                    <p className="muted" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>
                      Once submitted, status becomes <code>AWAITING</code>. CMP will verify legal documents and schedule the 7-day auction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Action Footer Bar */}
          <div
            className="row"
            style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--cmp-border)',
              paddingTop: '20px',
              marginTop: '24px'
            }}
          >
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="row" style={{ gap: '10px' }}>
              {currentStep < 6 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNextStep}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={handleSubmitProperty}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                  <span>{isSubmitting ? 'Submitting to CMP…' : 'Submit Property'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
