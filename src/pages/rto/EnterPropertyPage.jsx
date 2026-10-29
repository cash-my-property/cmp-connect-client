import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';
import GooglePlacesLocationInput from '../../components/common/GooglePlacesLocationInput';
import {
  MapPin,
  FileText,
  Image as ImageIcon,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Save,
  X
} from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Classification & Type' },
  { num: 2, label: 'Location' },
  { num: 3, label: 'Details' },
  { num: 4, label: 'Amenities' },
  { num: 5, label: 'Price and timing' },
  { num: 6, label: 'Photos and documents' },
  { num: 7, label: 'Review & Submit' }
];

const CATEGORIES = [
  { id: 'RESIDENTIAL', label: 'Residential' },
  { id: 'COMMERCIAL', label: 'Commercial' }
];

const PLANS = [
  { id: 'READY', label: 'Ready' },
  { id: 'OFF_PLAN', label: 'Off-Plan' }
];

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
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const initialPropertyId = routeId || searchParams.get('id') || null;

  const { isLiveData, authToken, can, account } = useApp();
  const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('cmp_connect_auth_token') : null);

  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [rtoRef, setRtoRef] = useState(null);
  const [propertyStatus, setPropertyStatus] = useState('DRAFT');
  const [serverCan, setServerCan] = useState({ edit: true, submit: true, delete: false });
  const [serverSubmitIssues, setServerSubmitIssues] = useState(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [options, setOptions] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(Boolean(initialPropertyId));
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState(null);

  const [stepError, setStepError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  const defaultOpenDate = useMemo(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    return d.toISOString().slice(0, 10);
  }, []);

  const [formData, setFormData] = useState({
    propertyCategory: 'RESIDENTIAL',
    propertyPlan: 'READY',
    propertyType: 'APARTMENT',
    propertyTitle: '',
    propertyDescription: '',
    propertyLocation: 'Dubai Marina, Dubai',
    propertyLatitude: 25.08,
    propertyLongitude: 55.14,
    propertyPrice: '',
    propertyArea: '',
    propertyAreaUnit: 'sqft',
    propertyBedrooms: '2',
    propertyWashrooms: '2',
    propertyBuiltUpArea: '',
    trakheesiNumber: '',
    emiratesIdExpiry: '',
    auctionOpenDate: defaultOpenDate,
    auctionOpenTime: '10:00',
    auctionDurationDays: 7,
    propertyAmenities: [],
    propertyImages: [],
    documents: {},
    listedBy: ''
  });

  // Sync detail response into state
  const applyDetailToState = useCallback((p) => {
    if (!p) return;
    if (p.id || p._id) setPropertyId(p.id || p._id);
    if (p.rtoRef || p.reference) setRtoRef(p.rtoRef || p.reference);
    if (p.status) setPropertyStatus(p.status);
    if (p.can) setServerCan(p.can);
    if (Array.isArray(p.submitIssues)) setServerSubmitIssues(p.submitIssues);

    const rawStart = p.schedule?.startAt || p.auctionStartAt || p.auction?.startTime || '';
    let openDate = defaultOpenDate;
    let openTime = '10:00';
    if (rawStart) {
      const dt = new Date(rawStart);
      if (!isNaN(dt.getTime())) {
        openDate = dt.toISOString().slice(0, 10);
        openTime = dt.toTimeString().slice(0, 5);
      }
    }

    // Normalize documents array or object into { [key]: { url, public_id, fileName } }
    const docsMap = {};
    if (Array.isArray(p.documents)) {
      p.documents.forEach((d) => {
        if (d && d.key && d.url) {
          docsMap[d.key] = {
            url: d.url,
            public_id: d.public_id || '',
            fileName: d.fileName || d.label || d.key
          };
        }
      });
    } else if (p.documents && typeof p.documents === 'object') {
      Object.entries(p.documents).forEach(([k, d]) => {
        if (d && d.url) {
          docsMap[k] = {
            url: d.url,
            public_id: d.public_id || '',
            fileName: d.fileName || k
          };
        }
      });
    }

    const imagesArr = Array.isArray(p.images)
      ? p.images
      : Array.isArray(p.propertyImages)
      ? p.propertyImages
      : [];

    setFormData((prev) => ({
      ...prev,
      propertyCategory: p.category || p.propertyCategory || prev.propertyCategory,
      propertyPlan: p.plan || p.propertyPlan || prev.propertyPlan,
      propertyType: p.type || p.propertyType || prev.propertyType,
      propertyTitle: p.title ?? p.propertyTitle ?? prev.propertyTitle,
      propertyDescription: p.description ?? p.propertyDescription ?? prev.propertyDescription,
      propertyLocation: p.location ?? p.propertyLocation ?? prev.propertyLocation,
      propertyLatitude: p.coordinates?.latitude ?? p.propertyLatitude ?? prev.propertyLatitude,
      propertyLongitude: p.coordinates?.longitude ?? p.propertyLongitude ?? prev.propertyLongitude,
      propertyPrice: p.startingPrice ?? p.propertyPrice ?? prev.propertyPrice,
      propertyArea: p.area ?? p.propertyArea ?? prev.propertyArea,
      propertyAreaUnit: p.areaUnit || p.propertyAreaUnit || prev.propertyAreaUnit,
      propertyBedrooms: p.bedrooms ?? p.propertyBedrooms ?? prev.propertyBedrooms,
      propertyWashrooms: p.washrooms ?? p.propertyWashrooms ?? prev.propertyWashrooms,
      propertyBuiltUpArea: p.builtUpArea ?? p.propertyBuiltUpArea ?? prev.propertyBuiltUpArea,
      trakheesiNumber: p.trakheesiNumber ?? prev.trakheesiNumber,
      emiratesIdExpiry: p.emiratesIdExpiry ? String(p.emiratesIdExpiry).slice(0, 10) : prev.emiratesIdExpiry,
      auctionOpenDate: openDate,
      auctionOpenTime: openTime,
      auctionDurationDays: p.schedule?.durationDays || p.auctionDurationDays || prev.auctionDurationDays,
      propertyAmenities: Array.isArray(p.amenities)
        ? p.amenities
        : Array.isArray(p.propertyAmenities)
        ? p.propertyAmenities
        : prev.propertyAmenities,
      propertyImages: imagesArr.length > 0 ? imagesArr.map((img) => ({ url: img.url, public_id: img.public_id })) : prev.propertyImages,
      documents: Object.keys(docsMap).length > 0 ? docsMap : prev.documents,
      listedBy: p.listedBy?.id || p.listedBy?._id || (typeof p.listedBy === 'string' ? p.listedBy : prev.listedBy)
    }));
  }, [defaultOpenDate]);

  // Load existing draft/property if editing
  useEffect(() => {
    if (!initialPropertyId || !isLiveData || !token) {
      setIsLoadingInitial(false);
      return;
    }
    let active = true;
    setIsLoadingInitial(true);
    cmpConnectApi
      .getRtoProperty(initialPropertyId, token)
      .then((res) => {
        if (!active) return;
        if (res?.data) {
          applyDetailToState(res.data);
        }
      })
      .catch((err) => {
        if (!active) return;
        setStepError(err.message || 'Could not load property draft.');
      })
      .finally(() => {
        if (active) setIsLoadingInitial(false);
      });
    return () => {
      active = false;
    };
  }, [initialPropertyId, isLiveData, token, applyDetailToState]);

  // Fetch RTO options and rules
  useEffect(() => {
    async function loadOptions() {
      if (!isLiveData || !token) return;
      try {
        const res = await cmpConnectApi.getRtoOptions(token);
        if (res?.data) {
          setOptions(res.data);
          if (res.data.auctionDays && !initialPropertyId) {
            setFormData((prev) => ({ ...prev, auctionDurationDays: res.data.auctionDays }));
          }
        }
      } catch (err) {
        console.warn('[RTO options error, using fallback]', err);
      }
    }
    loadOptions();
  }, [isLiveData, token, initialPropertyId]);

  // Fetch active team members if user has assign permission
  useEffect(() => {
    async function loadMembers() {
      if (!isLiveData || !token || !can('listings.assign')) return;
      try {
        const res = await cmpConnectApi.listMembers({ status: 'ACTIVE', limit: 100 }, token);
        if (Array.isArray(res?.data)) {
          setActiveMembers(res.data);
        }
      } catch (err) {
        console.warn('[RTO load members error]', err);
      }
    }
    loadMembers();
  }, [isLiveData, token, can]);

  // Available types for selected category and plan
  const availableTypes = useMemo(() => {
    const ruleTypes = options?.rules?.[formData.propertyCategory]?.[formData.propertyPlan];
    if (ruleTypes && typeof ruleTypes === 'object') {
      const typeLabels = options?.typeLabels || {};
      return Object.keys(ruleTypes).map((k) => ({
        id: k,
        label: typeLabels[k] || k.charAt(0) + k.slice(1).toLowerCase()
      }));
    }
    const list = PROPERTY_TYPES_MAP[formData.propertyCategory]?.[formData.propertyPlan];
    return list || [{ id: 'APARTMENT', label: 'Apartment' }];
  }, [options, formData.propertyCategory, formData.propertyPlan]);

  useEffect(() => {
    const validIds = availableTypes.map((t) => t.id);
    if (!validIds.includes(formData.propertyType)) {
      setFormData((prev) => ({ ...prev, propertyType: validIds[0] || 'APARTMENT' }));
    }
  }, [availableTypes, formData.propertyType]);

  const showBedrooms = ['APARTMENT', 'VILLA'].includes(formData.propertyType);
  const showBuiltUpArea = ['VILLA', 'LAND', 'BUILDING'].includes(formData.propertyType);
  const durationOptions = options?.durationDays || [3, 7, 10, 14];

  const availableAmenities = useMemo(() => {
    if (options?.amenities?.[formData.propertyCategory]) {
      return options.amenities[formData.propertyCategory];
    }
    return DEFAULT_AMENITIES[formData.propertyCategory] || DEFAULT_AMENITIES.RESIDENTIAL;
  }, [options, formData.propertyCategory]);

  const docLabels = options?.docLabels || DEFAULT_DOC_LABELS;

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

  const brnEligibleMembers = useMemo(() => {
    return activeMembers.filter((m) => Boolean(m.compliance?.brn));
  }, [activeMembers]);

  // Compute local submitIssues (used when serverSubmitIssues is not yet populated or to keep instant feedback)
  const computedSubmitIssues = useMemo(() => {
    const issues = [];
    if (!formData.propertyTitle.trim()) {
      issues.push({ step: 1, field: 'propertyTitle', message: 'Add a property title.' });
    } else if (findContactDetail(formData.propertyTitle)) {
      issues.push({ step: 1, field: 'propertyTitle', message: 'Remove contact details from the title.' });
    }
    if (!formData.propertyDescription.trim()) {
      issues.push({ step: 1, field: 'propertyDescription', message: 'Add a property description.' });
    } else if (findContactDetail(formData.propertyDescription)) {
      issues.push({ step: 1, field: 'propertyDescription', message: 'Remove contact details from the description.' });
    }
    if (!formData.propertyLocation.trim()) {
      issues.push({ step: 2, field: 'propertyLocation', message: 'Select the property location.' });
    }
    if (!Number(formData.propertyArea) || Number(formData.propertyArea) <= 0) {
      issues.push({ step: 3, field: 'propertyArea', message: 'Enter the property area.' });
    }
    if (showBuiltUpArea && (!Number(formData.propertyBuiltUpArea) || Number(formData.propertyBuiltUpArea) <= 0)) {
      issues.push({ step: 3, field: 'propertyBuiltUpArea', message: 'Enter the built-up area.' });
    }
    if (!formData.trakheesiNumber.trim()) {
      issues.push({ step: 3, field: 'trakheesiNumber', message: 'Enter the Trakheesi / DLD permit number.' });
    }
    if (!formData.emiratesIdExpiry) {
      issues.push({ step: 3, field: 'emiratesIdExpiry', message: "Enter the owner's Emirates ID expiry date." });
    }
    if (!Number(formData.propertyPrice) || Number(formData.propertyPrice) <= 0) {
      issues.push({ step: 5, field: 'propertyPrice', message: 'Enter the starting price in AED.' });
    }
    if (!formData.auctionOpenDate || !formData.auctionOpenTime) {
      issues.push({ step: 5, field: 'auctionStartAt', message: 'Choose when offers open (date and time).' });
    } else {
      const startIso = `${formData.auctionOpenDate}T${formData.auctionOpenTime}:00+04:00`;
      if (new Date(startIso).getTime() <= Date.now()) {
        issues.push({ step: 5, field: 'auctionStartAt', message: '"Offers open on" must be in the future.' });
      }
    }

    const typeRule = options?.rules?.[formData.propertyCategory]?.[formData.propertyPlan]?.[formData.propertyType];
    const minPhotos = typeRule?.images?.min || (formData.propertyType === 'LAND' ? 2 : ['RETAIL', 'OFFICES'].includes(formData.propertyType) ? 5 : 8);
    if (formData.propertyImages.length < minPhotos) {
      issues.push({
        step: 6,
        field: 'propertyImages',
        message: `Add at least ${minPhotos} photos (${formData.propertyImages.length} added).`
      });
    }
    activeDocumentsList.forEach((doc) => {
      if (doc.required && !formData.documents[doc.key]?.url) {
        issues.push({
          step: 6,
          field: `documents.${doc.key}`,
          message: `Upload ${doc.label}.`
        });
      }
    });

    return issues;
  }, [formData, showBuiltUpArea, options, activeDocumentsList]);

  const activeSubmitIssues = serverSubmitIssues && serverSubmitIssues.length > 0 ? serverSubmitIssues : computedSubmitIssues;

  const handleToggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.propertyAmenities.includes(amenity);
      const next = exists
        ? prev.propertyAmenities.filter((a) => a !== amenity)
        : [...prev.propertyAmenities, amenity];
      return { ...prev, propertyAmenities: next };
    });
  };

  // Build payload for a specific step (Section 13.1)
  const buildStepPayload = (stepNum) => {
    if (stepNum === 1) {
      const p = {
        propertyCategory: formData.propertyCategory,
        propertyPlan: formData.propertyPlan,
        propertyType: formData.propertyType,
        propertyTitle: formData.propertyTitle.trim(),
        propertyDescription: formData.propertyDescription.trim()
      };
      if (can('listings.assign') && formData.listedBy) {
        p.listedBy = formData.listedBy;
      }
      return p;
    }
    if (stepNum === 2) {
      return {
        propertyLocation: formData.propertyLocation.trim(),
        propertyLatitude: Number(formData.propertyLatitude) || 25.08,
        propertyLongitude: Number(formData.propertyLongitude) || 55.14
      };
    }
    if (stepNum === 3) {
      const p = {
        propertyArea: formData.propertyArea ? Number(formData.propertyArea) : undefined,
        propertyAreaUnit: formData.propertyAreaUnit || 'sqft',
        trakheesiNumber: formData.trakheesiNumber.trim() || undefined,
        emiratesIdExpiry: formData.emiratesIdExpiry || undefined
      };
      if (showBedrooms) {
        p.propertyBedrooms = String(formData.propertyBedrooms);
        p.propertyWashrooms = String(formData.propertyWashrooms);
      }
      if (showBuiltUpArea && formData.propertyBuiltUpArea) {
        p.propertyBuiltUpArea = Number(formData.propertyBuiltUpArea);
      }
      return p;
    }
    if (stepNum === 4) {
      return {
        propertyAmenities: formData.propertyAmenities
      };
    }
    if (stepNum === 5) {
      const p = {};
      if (formData.propertyPrice) p.propertyPrice = Number(formData.propertyPrice);
      if (formData.auctionOpenDate && formData.auctionOpenTime) {
        p.auctionStartAt = `${formData.auctionOpenDate}T${formData.auctionOpenTime}:00+04:00`;
      }
      if (formData.auctionDurationDays) {
        p.auctionDurationDays = Number(formData.auctionDurationDays);
      }
      return p;
    }
    if (stepNum === 6) {
      return {
        propertyImages: formData.propertyImages,
        documents: formData.documents
      };
    }
    return {};
  };

  // Save current step to server (Step 1: POST /rto/properties -> DRAFT; Steps 2-6: PATCH /rto/properties/:id)
  const saveStepToServer = async (stepNum) => {
    if (!isLiveData || !token) return true;
    const stepPayload = buildStepPayload(stepNum);

    setIsSavingStep(true);
    try {
      if (stepNum === 1 && !propertyId) {
        const res = await cmpConnectApi.createRtoProperty(stepPayload, token);
        if (res?.data) {
          applyDetailToState(res.data);
          const newId = res.data.id || res.data._id;
          if (newId) {
            window.history.replaceState(null, '', `/rto/${newId}/edit`);
          }
        }
        return true;
      } else if (propertyId) {
        const res = await cmpConnectApi.updateRtoProperty(propertyId, stepPayload, token);
        if (res?.data) {
          applyDetailToState(res.data);
        }
        return true;
      }
      return true;
    } catch (err) {
      // If the backend is still running the older single-submit schema on POST /rto/properties (where Step 1 alone returns 400 for missing price/images),
      // allow proceeding locally in the wizard so final Submit can send the full payload!
      const msg = err.message || '';
      const isLegacyFullCreateValidation =
        stepNum === 1 &&
        !propertyId &&
        err.status === 400 &&
        (msg.includes('propertyLocation') || msg.includes('propertyPrice') || msg.includes('propertyImages') || msg.includes('required'));

      if (isLegacyFullCreateValidation) {
        return true;
      }
      setStepError(msg || 'Could not save step.');
      return false;
    } finally {
      setIsSavingStep(false);
    }
  };

  // Cloudinary Direct Upload for Photos
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingImage(true);
    setStepError(null);

    try {
      const sigRes = await cmpConnectApi.getRtoUploadSignature(propertyId || '', token);
      const sig = sigRes?.data?.images || sigRes?.data;
      if (!sig || !sig.signature) throw new Error('Could not obtain upload signature.');

      const uploads = files.map((file) => cmpConnectApi.uploadRtoFileToCloudinary(file, sig));
      const results = await Promise.all(uploads);

      const newPhotos = results.map((r) => ({ url: r.url, public_id: r.public_id }));
      setFormData((prev) => ({
        ...prev,
        propertyImages: [...prev.propertyImages, ...newPhotos]
      }));
      setSuccessBanner(`${results.length} photo(s) uploaded.`);
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err) {
      setStepError(err.message || 'Image upload failed.');
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
      const sigRes = await cmpConnectApi.getRtoUploadSignature(propertyId || '', token);
      const sig = sigRes?.data?.docs || sigRes?.data;
      if (!sig || !sig.signature) throw new Error('Could not obtain document upload signature.');

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
      setStepError(err.message || 'Document upload failed.');
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
    setIsSavingStep(true);
    try {
      const sigRes = await cmpConnectApi.getRtoUploadSignature(propertyId || '', token);
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
      setSuccessBanner('Sample legal documents & photos attached!');
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (e) {
      setStepError(e.message || 'Auto-fill failed.');
    } finally {
      setIsSavingStep(false);
    }
  };

  // Validate Step 1 required fields + anti-contact rules before creating/updating draft
  const validateStepBeforeSave = (stepNum) => {
    if (stepNum === 1) {
      if (!formData.propertyTitle.trim()) {
        setStepError('Property title is required.');
        return false;
      }
      const titleContact = findContactDetail(formData.propertyTitle);
      if (titleContact) {
        setStepError(`Property title cannot contain contact details ("${titleContact}").`);
        return false;
      }
      if (!formData.propertyDescription.trim()) {
        setStepError('Property description is required.');
        return false;
      }
      const descContact = findContactDetail(formData.propertyDescription);
      if (descContact) {
        setStepError(`Description cannot contain contact details ("${descContact}").`);
        return false;
      }
      if (can('listings.assign') && account?.accountType === 'AGENCY' && !account?.compliance?.brn && !account?.brn && !formData.listedBy) {
        setStepError('As an administrator without a BRN, please select an assigned listing agent.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = async () => {
    setStepError(null);
    if (!validateStepBeforeSave(currentStep)) return;

    const ok = await saveStepToServer(currentStep);
    if (!ok) return;

    if (currentStep < 7) {
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

  // Save draft button
  const handleSaveDraft = async () => {
    setStepError(null);
    if (!validateStepBeforeSave(currentStep)) return;
    const ok = await saveStepToServer(currentStep);
    if (ok) {
      setSuccessBanner('Draft saved.');
      setTimeout(() => setSuccessBanner(null), 2500);
    }
  };

  // Delete draft button (DELETE /rto/properties/:id)
  const handleDeleteDraft = async () => {
    if (!propertyId) {
      navigate('/rto');
      return;
    }
    if (!window.confirm('Delete this draft property?')) return;
    setIsSubmitting(true);
    setStepError(null);
    try {
      await cmpConnectApi.deleteRtoProperty(propertyId, token);
      navigate('/rto');
    } catch (err) {
      setStepError(err.message || 'Failed to delete draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final Submit (POST /rto/properties/:id/submit, with fallback if propertyId was not yet created)
  const handleSubmitProperty = async () => {
    setStepError(null);

    if (activeSubmitIssues.length > 0) {
      setStepError(`Finish the property before submitting: ${activeSubmitIssues[0].message}`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (propertyId) {
        // Save all latest fields first, then call POST /rto/properties/:id/submit
        const auctionStartAt = `${formData.auctionOpenDate}T${formData.auctionOpenTime || '10:00'}:00+04:00`;
        await cmpConnectApi.updateRtoProperty(
          propertyId,
          {
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
            propertyAreaUnit: formData.propertyAreaUnit || 'sqft',
            propertyBedrooms: showBedrooms ? String(formData.propertyBedrooms) : undefined,
            propertyWashrooms: showBedrooms ? String(formData.propertyWashrooms) : undefined,
            propertyBuiltUpArea: showBuiltUpArea && formData.propertyBuiltUpArea ? Number(formData.propertyBuiltUpArea) : null,
            trakheesiNumber: formData.trakheesiNumber.trim(),
            emiratesIdExpiry: formData.emiratesIdExpiry,
            propertyAmenities: formData.propertyAmenities,
            propertyImages: formData.propertyImages,
            documents: formData.documents,
            auctionStartAt,
            auctionDurationDays: Number(formData.auctionDurationDays) || 7
          },
          token
        );

        const res = await cmpConnectApi.submitRtoProperty(propertyId, token);
        const serverMsg = res?.message || (can('listings.approve') ? 'Sent to CMP for review.' : 'Sent to your agency for approval.');
        alert(serverMsg);
        navigate(`/rto/${propertyId}`);
      } else {
        // Fallback when backend has not yet created a draft ID in Step 1
        const auctionStartAt = `${formData.auctionOpenDate}T${formData.auctionOpenTime || '10:00'}:00+04:00`;
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
          propertyAreaUnit: formData.propertyAreaUnit || 'sqft',
          propertyBedrooms: showBedrooms ? String(formData.propertyBedrooms) : undefined,
          propertyWashrooms: showBedrooms ? String(formData.propertyWashrooms) : undefined,
          propertyBuiltUpArea: showBuiltUpArea && formData.propertyBuiltUpArea ? Number(formData.propertyBuiltUpArea) : null,
          trakheesiNumber: formData.trakheesiNumber.trim(),
          emiratesIdExpiry: formData.emiratesIdExpiry,
          propertyAmenities: formData.propertyAmenities,
          propertyImages: formData.propertyImages,
          documents: formData.documents,
          auctionStartAt,
          auctionDurationDays: Number(formData.auctionDurationDays) || 7,
          listedBy: can('listings.assign') && formData.listedBy ? formData.listedBy : undefined
        };

        const res = await cmpConnectApi.createRtoProperty(payload, token);
        const createdId = res?.data?.id || res?.data?._id;
        // If create returned a DRAFT on the new backend, immediately call submit!
        if (createdId && res?.data?.status === 'DRAFT') {
          const subRes = await cmpConnectApi.submitRtoProperty(createdId, token);
          alert(subRes?.message || 'Property submitted.');
          navigate(`/rto/${createdId}`);
          return;
        }
        const serverMsg = res?.message || (can('listings.approve') ? 'Sent to CMP for review.' : 'Sent to your agency for approval.');
        alert(serverMsg);
        navigate(createdId ? `/rto/${createdId}` : '/rto');
      }
    } catch (err) {
      const msg = err.message || 'Submission failed.';
      setStepError(msg);
      if (msg.toLowerCase().includes('title') || msg.toLowerCase().includes('description') || msg.toLowerCase().includes('contact details')) {
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <div style={{ padding: '64px 0', textAlign: 'center' }}>
        <Loader2 size={28} className="spin faint" style={{ margin: '0 auto 12px' }} />
        <p className="muted" style={{ fontSize: '14px' }}>Loading Real Time Offer property draft…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="row" style={{ gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
            <NavLink to="/rto" className="btn btn-ghost btn-sm">
              <ArrowLeft size={16} />
              <span>Back to Entries</span>
            </NavLink>
            {rtoRef && (
              <span className="badge badge-neutral" style={{ fontSize: '11.5px', fontWeight: 700 }}>
                {rtoRef} · {propertyStatus}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '26px', margin: 0, fontWeight: 800 }}>
            {propertyId ? 'Continue Real Time Offer Entry' : 'Enter a property for Real Time Offer'}
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px' }}>
            Step-by-step wizard — Step 1 creates a draft, every step saves automatically, and Review checks completeness before submitting.
          </p>
        </div>

        <div className="row" style={{ gap: '8px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleSaveDraft}
            disabled={isSavingStep || isSubmitting}
          >
            {isSavingStep ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
            <span>{isSavingStep ? 'Saving…' : 'Save draft'}</span>
          </button>

          {propertyId && serverCan?.delete && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ borderColor: 'var(--cmp-danger)', color: 'var(--cmp-danger)' }}
              onClick={handleDeleteDraft}
              disabled={isSubmitting}
            >
              <Trash2 size={14} />
              <span>Delete draft</span>
            </button>
          )}
        </div>
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
              const canJump = Boolean(propertyId) || st.num <= currentStep;

              return (
                <li key={st.num}>
                  <button
                    type="button"
                    onClick={() => {
                      if (canJump) {
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
                      cursor: canJump ? 'pointer' : 'default',
                      opacity: canJump ? 1 : 0.6,
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
              • Step 1 saves a draft; every step updates with PATCH.
              <br />
              • Agent entries go to your agency for approval first; Owner/Admin entries go straight to CMP.
              <br />
              • Late offers add 10 minutes to the clock.
            </p>
          </div>
        </aside>

        {/* Right Column: Active Step Card */}
        <div className="card" style={{ padding: '28px' }}>
          {/* STEP 1: Classification & Type */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                1. Classification, Type & Description
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Select property category, plan and type, then add the title and description to create your draft.
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
                            : validTypes[0]?.id || 'APARTMENT'
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
                            : validTypes[0]?.id || 'APARTMENT'
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
                    No phone numbers, emails, or website URLs allowed.
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
                          Contact info detected: <strong>"{findContactDetail(formData.propertyDescription)}"</strong>
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

                {can('listings.assign') && (
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Listed under (Agent) *
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
                2. Location
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Enter the building, sub-community, or area.
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

          {/* STEP 3: Details */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                3. Details & Regulatory Permits
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Enter area, rooms, Trakheesi permit and owner Emirates ID expiry.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Property Area *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1420"
                    value={formData.propertyArea}
                    onChange={(e) => setFormData((prev) => ({ ...prev, propertyArea: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  />
                </div>
                <div>
                  <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Area Unit *
                  </label>
                  <select
                    value={formData.propertyAreaUnit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, propertyAreaUnit: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  >
                    <option value="sqft">sqft</option>
                    <option value="sqm">sqm</option>
                  </select>
                </div>
              </div>

              {showBuiltUpArea && (
                <div style={{ marginBottom: '18px' }}>
                  <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Built-up Area (sqft) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 2100"
                    value={formData.propertyBuiltUpArea}
                    onChange={(e) => setFormData((prev) => ({ ...prev, propertyBuiltUpArea: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  />
                </div>
              )}

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Trakheesi Permit Number *
                  </label>
                  <input
                    type="text"
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
                    value={formData.emiratesIdExpiry}
                    onChange={(e) => setFormData((prev) => ({ ...prev, emiratesIdExpiry: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Amenities */}
          {currentStep === 4 && (
            <div>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', margin: '0 0 2px', fontWeight: 700 }}>4. Amenities</h2>
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

          {/* STEP 5: Price and timing */}
          {currentStep === 5 && (
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                5. Price and timing
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Set the starting auction price and choose when offers open and how long they stay open.
              </p>

              <div style={{ marginBottom: '22px' }}>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Starting Price (AED) *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 2000000"
                  value={formData.propertyPrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, propertyPrice: e.target.value }))}
                  style={{ width: '100%', maxWidth: '360px', fontSize: '14px' }}
                />
                <span className="faint" style={{ fontSize: '11.5px', display: 'block', marginTop: '4px' }}>
                  The auction starts at this exact price. No reserve price, no guide price, no buyer&apos;s fee.
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--cmp-border)', paddingTop: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Timing and terms</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Offers open on *
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={formData.auctionOpenDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, auctionOpenDate: e.target.value }))}
                      style={{ width: '100%', fontSize: '13.5px' }}
                    />
                  </div>

                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      At (Dubai time, +04:00) *
                    </label>
                    <input
                      type="time"
                      value={formData.auctionOpenTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, auctionOpenTime: e.target.value }))}
                      style={{ width: '100%', fontSize: '13.5px' }}
                    />
                  </div>

                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Offers stay open for *
                    </label>
                    <select
                      value={formData.auctionDurationDays}
                      onChange={(e) => setFormData((prev) => ({ ...prev, auctionDurationDays: Number(e.target.value) }))}
                      style={{ width: '100%', fontSize: '13.5px' }}
                    >
                      {durationOptions.map((days) => (
                        <option key={days} value={days}>
                          {days} days
                        </option>
                      ))}
                    </select>
                    <span className="faint" style={{ fontSize: '11.5px', display: 'block', marginTop: '4px' }}>
                      Late offers add 10 minutes to the clock.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Photos and documents */}
          {currentStep === 6 && (
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                6. Photos and documents
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Upload high-resolution photos and required legal documents.
              </p>

              {/* Photos Upload Section */}
              <div style={{ marginBottom: '28px' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="field-label" style={{ fontWeight: 700 }}>
                    Photos ({formData.propertyImages.length}/25) *
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
                      PNG, JPG, WEBP up to 5MB each.
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
                  Required documents depend on the selected property category, plan and type.
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
                                PDF or image (Max 5MB)
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

          {/* STEP 7: Review & Submit */}
          {currentStep === 7 && (
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 700 }}>
                7. Review & Submit
              </h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '13.5px' }}>
                Check any remaining items below before submitting your Real Time Offer entry.
              </p>

              {/* Submit Issues Checklist (Section 13.1 item 3) */}
              {activeSubmitIssues.length > 0 && (
                <div
                  className="card"
                  style={{
                    padding: '16px 20px',
                    marginBottom: '20px',
                    background: 'var(--cmp-danger-subtle)',
                    borderColor: 'var(--cmp-danger-border)'
                  }}
                >
                  <div className="row" style={{ gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <AlertCircle size={18} color="var(--cmp-danger)" />
                    <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--cmp-danger)' }}>
                      Finish the property before submitting ({activeSubmitIssues.length} remaining)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeSubmitIssues.map((iss, i) => (
                      <div
                        key={i}
                        className="row"
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'var(--cmp-surface)',
                          borderRadius: '6px',
                          border: '1px solid var(--cmp-border)'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>
                          Step {iss.step || 1}: {iss.message}
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--cmp-brand)', fontWeight: 700 }}
                          onClick={() => {
                            setCurrentStep(iss.step || 1);
                            setStepError(null);
                          }}
                        >
                          Go to Step {iss.step || 1} →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    <h3 style={{ fontSize: '18px', margin: '4px 0 2px', fontWeight: 800 }}>
                      {formData.propertyTitle || 'Untitled Property'}
                    </h3>
                    <p className="muted" style={{ margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> {formData.propertyLocation || '—'}
                    </p>
                  </div>

                  <div style={{ textAlign: 'end' }}>
                    <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800 }}>Starting Price</span>
                    <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
                      {formData.propertyPrice ? `AED ${Number(formData.propertyPrice).toLocaleString('en-US')}` : '—'}
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
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '13.5px' }}>
                      {formData.propertyArea || '—'} {formData.propertyAreaUnit}
                    </p>
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
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '13.5px' }}>{formData.trakheesiNumber || '—'}</p>
                  </div>

                  <div>
                    <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Offers Open On</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '13.5px' }}>
                      {formData.auctionOpenDate} at {formData.auctionOpenTime}
                    </p>
                  </div>

                  <div>
                    <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Duration</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '13.5px' }}>{formData.auctionDurationDays} days</p>
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
                    {formData.propertyDescription || '—'}
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
                      {can('listings.approve') ? 'Submits straight to CMP Review' : 'Submits for Agency Approval'}
                    </span>
                    <p className="muted" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>
                      {can('listings.approve')
                        ? 'As an agency approver, your entry goes straight to CMP review (AWAITING) and starts at the scheduled time once approved.'
                        : 'Your entry will first be sent to your agency for approval (AGENCY_REVIEW). Once approved by your agency, CMP reviews and runs the auction.'}
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
                  disabled={isSavingStep || isSubmitting}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="row" style={{ gap: '10px' }}>
              {currentStep < 7 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNextStep}
                  disabled={isSavingStep}
                >
                  {isSavingStep ? <Loader2 size={16} className="spin" /> : null}
                  <span>{isSavingStep ? 'Saving…' : 'Save & Continue'}</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={handleSubmitProperty}
                  disabled={isSubmitting || activeSubmitIssues.length > 0}
                >
                  {isSubmitting ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                  <span>{isSubmitting ? 'Submitting…' : 'Submit Property'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
