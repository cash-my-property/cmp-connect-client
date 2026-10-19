import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';
import GooglePlacesLocationInput from '../../components/common/GooglePlacesLocationInput';
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
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Loader2,
  Trash2,
  Upload,
  ExternalLink,
  ShieldCheck,
  Send,
  XCircle,
  Archive,
  RotateCcw,
  UserCheck
} from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Purpose and type' },
  { num: 2, label: 'Location' },
  { num: 3, label: 'Property details' },
  { num: 4, label: 'Amenities' },
  { num: 5, label: 'Price and terms' },
  { num: 6, label: 'Photos and media' },
  { num: 7, label: 'Review and publish' }
];

export default function EditPropertyPage() {
  const { listings: mockListings, isLiveData, authToken, can, account } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [listingData, setListingData] = useState(null);
  const [options, setOptions] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    listingPurpose: 'SALE',
    propertyCategory: 'RESIDENTIAL',
    propertyPlan: 'READY',
    propertyType: 'APARTMENT',
    propertyTitle: '',
    propertyTitleAr: '',
    propertyDescription: '',
    propertyDescriptionAr: '',
    listedBy: '',

    propertyLocation: '',
    propertyLatitude: 25.08,
    propertyLongitude: 55.14,

    propertyArea: '',
    propertyAreaUnit: 'sqft',
    propertyBuiltUpArea: '',
    propertyBedrooms: '2',
    propertyBathrooms: '2',
    unitNumber: '',
    parkingSpaces: '1',
    furnishingStatus: 'SEMI',
    availability: 'Vacant',
    referenceNumber: '',

    propertyAmenities: [],

    propertyPrice: '',
    downPayment: '',
    rentalPeriod: 'PER_YEAR',
    permitNumber: '',

    propertyImages: [],
    videoUrl: '',
    virtualTourUrl: '',
    documents: {},
    otherDocuments: []
  });

  // Rejection modal
  const [rejectModal, setRejectModal] = useState({ isOpen: false, reason: '' });

  // Load listing & options on mount
  const loadListingDetails = useCallback(async () => {
    if (!isLiveData || !authToken || !id) {
      // Mock Fallback
      const found = mockListings?.find((l) => l.id === id) || {
        id: id || 'CMP-S-001001',
        title: 'Full marina view 2 bed in Marina Gate',
        description: 'Two bedroom on a high floor of Marina Gate with unbroken marina views.',
        community: 'Dubai Marina',
        purpose: 'Sale',
        type: 'Apartment',
        category: 'Residential',
        price: '2850000',
        areaSqft: '1420',
        beds: 2,
        baths: 2,
        permitNumber: '0812948192',
        status: 'Live',
        qualityScore: 92
      };
      setListingData({
        ...found,
        can: { edit: true, submit: true, publish: true, unpublish: true, archive: true }
      });
      setFormData((prev) => ({
        ...prev,
        propertyTitle: found.title,
        propertyDescription: found.description,
        propertyLocation: found.community,
        propertyPrice: found.price,
        propertyArea: found.areaSqft,
        propertyBedrooms: String(found.beds || 2),
        propertyBathrooms: String(found.baths || 2),
        permitNumber: found.permitNumber
      }));
      return;
    }

    setIsLoading(true);
    setErrorBanner(null);
    try {
      const [optRes, detailRes] = await Promise.all([
        cmpConnectApi.getListingOptions(authToken),
        cmpConnectApi.getListing(id, authToken)
      ]);

      if (optRes?.data) setOptions(optRes.data);

      const d = detailRes?.data;
      if (d) {
        setListingData(d);

        // Prepopulate form fields
        setFormData({
          listingPurpose: d.purpose || 'SALE',
          propertyCategory: d.category || 'RESIDENTIAL',
          propertyPlan: d.plan || 'READY',
          propertyType: d.type || 'APARTMENT',
          propertyTitle: d.title || '',
          propertyTitleAr: d.titleAr || '',
          propertyDescription: d.description || '',
          propertyDescriptionAr: d.descriptionAr || '',
          listedBy: d.listedBy?.id || '',

          propertyLocation: d.location || '',
          propertyLatitude: d.coordinates?.latitude || 25.08,
          propertyLongitude: d.coordinates?.longitude || 55.14,

          propertyArea: d.area ?? '',
          propertyAreaUnit: d.areaUnit || 'sqft',
          propertyBuiltUpArea: d.builtUpArea ?? '',
          propertyBedrooms: d.bedrooms || '2',
          propertyBathrooms: d.bathrooms || '2',
          unitNumber: d.unitNumber || '',
          parkingSpaces: d.parkingSpaces ?? '1',
          furnishingStatus: d.furnishingStatus || 'SEMI',
          availability: d.availability || 'Vacant',
          referenceNumber: d.referenceNumber || '',

          propertyAmenities: Array.isArray(d.amenities) ? d.amenities : [],

          propertyPrice: d.price ?? '',
          downPayment: d.downPayment ?? '',
          rentalPeriod: d.rentalPeriod || 'PER_YEAR',
          permitNumber: d.permitNumber || '',

          propertyImages: Array.isArray(d.images) ? d.images : [],
          videoUrl: d.videoUrl || '',
          virtualTourUrl: d.virtualTourUrl || '',
          documents: Array.isArray(d.documents)
            ? d.documents.reduce((acc, doc) => {
                if (doc.url) acc[doc.key] = { url: doc.url, public_id: doc.public_id, fileName: doc.fileName };
                return acc;
              }, {})
            : {},
          otherDocuments: Array.isArray(d.otherDocuments) ? d.otherDocuments : []
        });
      }

      // Load active members if assignable
      if (can('listings.assign')) {
        const memRes = await cmpConnectApi.listMembers({ status: 'ACTIVE' }, authToken);
        if (Array.isArray(memRes?.data)) {
          setActiveMembers(memRes.data);
        }
      }
    } catch (err) {
      console.error('[EditProperty] Load error:', err);
      setErrorBanner(err.message || 'Failed to load listing.');
    } finally {
      setIsLoading(false);
    }
  }, [isLiveData, authToken, id, can, mockListings]);

  useEffect(() => {
    loadListingDetails();
  }, [loadListingDetails]);

  // Freshly reload listing details and compliance issues when arriving at Step 7
  useEffect(() => {
    if (currentStep === 7 && listingData?.id && isLiveData && authToken) {
      cmpConnectApi.getListing(listingData.id, authToken)
        .then((res) => {
          if (res?.data) {
            setListingData(res.data);
          }
        })
        .catch((err) => console.warn('[Review reload error]', err));
    }
  }, [currentStep, listingData?.id, isLiveData, authToken]);

  // Available property types
  const availableTypes = useMemo(() => {
    if (!options?.rules) {
      return [
        { key: 'APARTMENT', label: 'Apartment' },
        { key: 'VILLA', label: 'Villa' },
        { key: 'TOWNHOUSE', label: 'Townhouse' },
        { key: 'PENTHOUSE', label: 'Penthouse' },
        { key: 'DUPLEX', label: 'Duplex' }
      ];
    }
    const ruleBranch = options.rules[formData.listingPurpose]?.[formData.propertyCategory]?.[formData.propertyPlan] || {};
    const keys = Object.keys(ruleBranch);
    if (keys.length === 0 && options.typeLabels) {
      return Object.entries(options.typeLabels).map(([k, label]) => ({ key: k, label }));
    }
    return keys.map((k) => ({ key: k, label: options.typeLabels?.[k] || k }));
  }, [options, formData.listingPurpose, formData.propertyCategory, formData.propertyPlan]);

  // Available amenities (matches backend AMENITIES_CONFIG)
  const availableAmenities = useMemo(() => {
    if (options?.amenities?.[formData.propertyCategory]) {
      return options.amenities[formData.propertyCategory];
    }
    if (formData.propertyCategory === 'COMMERCIAL') {
      return [
        'Networked',
        'Covered Parking',
        'Shared Pool',
        'Shared Gym',
        'Dining in building',
        'Conference room',
        'Lobby in Building',
        'Vastu-compliant'
      ];
    }
    return [
      'Balcony',
      'Barbecue Area',
      'Built in Wardrobes',
      'Central A/C',
      'Covered Parking',
      'Private Gym',
      'Private Jacuzzi',
      'Kitchen Appliances',
      'Maids Room',
      'Pets Allowed',
      'Private Garden',
      'Private Pool',
      'Shared Pool',
      'Study',
      'View of Water',
      'Security',
      'Concierge',
      'Shared Spa',
      'Shared Gym',
      'Maid Service',
      'Walk-in Closet',
      'View of Landmark',
      "Children's Play Area",
      'Lobby in Building',
      "Children's Pool",
      'Vastu-compliant'
    ];
  }, [options, formData.propertyCategory]);

  const onHold = Boolean(listingData?.onHold || listingData?.adminHold?.active);
  const canActions = listingData?.can || {};
  const submitIssues = listingData?.submitIssues || [];
  const qualityTips = listingData?.qualityTips || [];
  const qualityScore = listingData?.qualityScore ?? 75;

  // Toggle amenity
  const handleToggleAmenity = (amenity) => {
    if (onHold) return;
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
    if (!files.length || onHold) return;

    setUploadingImage(true);
    setErrorBanner(null);

    try {
      const sigRes = await cmpConnectApi.getListingUploadSignature(listingData.id, authToken);
      const sig = sigRes?.data?.images;
      if (!sig) throw new Error('Could not get upload signature.');

      const uploads = files.map((file) => cmpConnectApi.uploadListingFileToCloudinary(file, sig));
      const results = await Promise.all(uploads);

      const newPhotos = results.map((r) => ({ url: r.url, public_id: r.public_id }));
      const updatedPhotos = [...formData.propertyImages, ...newPhotos];

      setFormData((prev) => ({ ...prev, propertyImages: updatedPhotos }));
      const res = await cmpConnectApi.updateListing(listingData.id, { propertyImages: updatedPhotos }, authToken);
      if (res?.data) setListingData(res.data);
      setSuccessBanner('Photos uploaded successfully.');
    } catch (err) {
      console.error('[Upload image error]', err);
      setErrorBanner(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (indexToRemove) => {
    if (onHold) return;
    const updatedPhotos = formData.propertyImages.filter((_, i) => i !== indexToRemove);
    setFormData((prev) => ({ ...prev, propertyImages: updatedPhotos }));
    try {
      const res = await cmpConnectApi.updateListing(listingData.id, { propertyImages: updatedPhotos }, authToken);
      if (res?.data) setListingData(res.data);
    } catch (err) {
      console.error('[Remove photo error]', err);
    }
  };

  // Cloudinary Direct Upload for Documents
  const handleDocUpload = async (docKey, e) => {
    const file = e.target.files?.[0];
    if (!file || onHold) return;

    setUploadingDocKey(docKey);
    setErrorBanner(null);

    try {
      const sigRes = await cmpConnectApi.getListingUploadSignature(listingData.id, authToken);
      const sig = sigRes?.data?.docs;
      if (!sig) throw new Error('Could not get doc upload signature.');

      const uploaded = await cmpConnectApi.uploadListingFileToCloudinary(file, sig);
      const updatedDocs = {
        ...formData.documents,
        [docKey]: { url: uploaded.url, public_id: uploaded.public_id, fileName: file.name }
      };

      setFormData((prev) => ({ ...prev, documents: updatedDocs }));
      const res = await cmpConnectApi.updateListing(
        listingData.id,
        {
          documents: {
            [docKey]: { url: uploaded.url, public_id: uploaded.public_id, fileName: file.name }
          }
        },
        authToken
      );
      if (res?.data) setListingData(res.data);
      setSuccessBanner('Document uploaded successfully.');
    } catch (err) {
      console.error('[Doc upload error]', err);
      setErrorBanner(err.message || 'Document upload failed.');
    } finally {
      setUploadingDocKey(null);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = async (docKey) => {
    if (onHold) return;
    const updatedDocs = { ...formData.documents };
    delete updatedDocs[docKey];
    setFormData((prev) => ({ ...prev, documents: updatedDocs }));

    try {
      const res = await cmpConnectApi.updateListing(listingData.id, { documents: { [docKey]: null } }, authToken);
      if (res?.data) setListingData(res.data);
    } catch (err) {
      console.error('[Remove doc error]', err);
    }
  };

  // Save current changes to backend
  const handleSaveChanges = async () => {
    if (onHold) {
      alert('This listing is on hold by CMP and cannot be edited.');
      return;
    }

    if (!isLiveData || !authToken) {
      alert('Changes saved in mock mode.');
      navigate('/properties');
      return;
    }

    setIsSaving(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    try {
      const payload = {
        listingPurpose: formData.listingPurpose,
        propertyCategory: formData.propertyCategory,
        propertyPlan: formData.propertyPlan,
        propertyType: formData.propertyType,
        propertyTitle: formData.propertyTitle.trim(),
        propertyTitleAr: formData.propertyTitleAr.trim() || undefined,
        propertyDescription: formData.propertyDescription.trim() || undefined,
        propertyDescriptionAr: formData.propertyDescriptionAr.trim() || undefined,

        propertyLocation: formData.propertyLocation,
        propertyLatitude: Number(formData.propertyLatitude) || undefined,
        propertyLongitude: Number(formData.propertyLongitude) || undefined,

        propertyArea: formData.propertyArea ? Number(formData.propertyArea) : null,
        propertyAreaUnit: formData.propertyAreaUnit || 'sqft',
        propertyBuiltUpArea: formData.propertyBuiltUpArea ? Number(formData.propertyBuiltUpArea) : null,
        propertyBedrooms: formData.propertyBedrooms,
        propertyBathrooms: formData.propertyBathrooms,
        unitNumber: formData.unitNumber || null,
        parkingSpaces: formData.parkingSpaces ? Number(formData.parkingSpaces) : null,
        furnishingStatus: formData.furnishingStatus,
        availability: formData.availability,
        referenceNumber: formData.referenceNumber || null,
        propertyAmenities: (formData.propertyAmenities || []).filter((a) => availableAmenities.includes(a)),

        propertyPrice: formData.propertyPrice ? Number(formData.propertyPrice) : null,
        downPayment: formData.downPayment ? Number(formData.downPayment) : null,
        rentalPeriod: formData.listingPurpose === 'RENT' ? formData.rentalPeriod : null,
        permitNumber: formData.permitNumber || null,

        videoUrl: formData.videoUrl || null,
        virtualTourUrl: formData.virtualTourUrl || null
      };

      const res = await cmpConnectApi.updateListing(listingData.id, payload, authToken);
      if (res?.data) {
        setListingData(res.data);
      }
      setSuccessBanner('Listing changes saved successfully.');
    } catch (err) {
      console.error('[Save error]', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save changes.';
      setErrorBanner(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Build step-specific payload according to API guide section 7.4
  const getStepPayload = (stepNum) => {
    switch (stepNum) {
      case 1: {
        const payload = {
          listingPurpose: formData.listingPurpose,
          propertyCategory: formData.propertyCategory,
          propertyPlan: formData.propertyPlan,
          propertyType: formData.propertyType,
          propertyTitle: formData.propertyTitle.trim(),
          propertyTitleAr: formData.propertyTitleAr.trim() || undefined,
          propertyDescription: formData.propertyDescription.trim() || undefined,
          propertyDescriptionAr: formData.propertyDescriptionAr.trim() || undefined
        };
        if (can('listings.assign') && formData.listedBy) {
          payload.listedBy = formData.listedBy;
        }
        return payload;
      }
      case 2:
        return {
          propertyLocation: formData.propertyLocation,
          propertyLatitude: Number(formData.propertyLatitude) || 25.08,
          propertyLongitude: Number(formData.propertyLongitude) || 55.14
        };
      case 3:
        return {
          propertyArea: formData.propertyArea ? Number(formData.propertyArea) : null,
          propertyAreaUnit: formData.propertyAreaUnit || 'sqft',
          propertyBuiltUpArea: formData.propertyBuiltUpArea ? Number(formData.propertyBuiltUpArea) : null,
          propertyBedrooms: formData.propertyBedrooms,
          propertyBathrooms: formData.propertyBathrooms,
          unitNumber: formData.unitNumber || null,
          parkingSpaces: formData.parkingSpaces ? Number(formData.parkingSpaces) : null,
          furnishingStatus: formData.furnishingStatus,
          availability: formData.availability,
          referenceNumber: formData.referenceNumber || null
        };
      case 4:
        return {
          propertyAmenities: (formData.propertyAmenities || []).filter((a) => availableAmenities.includes(a))
        };
      case 5:
        return {
          propertyPrice: formData.propertyPrice ? Number(formData.propertyPrice) : null,
          downPayment: formData.downPayment ? Number(formData.downPayment) : null,
          rentalPeriod: formData.listingPurpose === 'RENT' ? formData.rentalPeriod : null,
          permitNumber: formData.permitNumber || null
        };
      case 6:
        return {
          propertyImages: formData.propertyImages,
          videoUrl: formData.videoUrl || null,
          virtualTourUrl: formData.virtualTourUrl || null
        };
      default:
        return {};
    }
  };

  // Save current step to backend and advance to next step
  const handleSaveAndContinue = async () => {
    if (onHold) {
      setCurrentStep((prev) => Math.min(7, prev + 1));
      return;
    }

    if (!isLiveData || !authToken || !listingData?.id) {
      setCurrentStep((prev) => Math.min(7, prev + 1));
      return;
    }

    setIsSaving(true);
    setErrorBanner(null);

    try {
      if (currentStep === 1 && !formData.propertyTitle.trim()) {
        throw new Error('Listing title is required.');
      }

      const stepPayload = getStepPayload(currentStep);
      const res = await cmpConnectApi.updateListing(listingData.id, stepPayload, authToken);
      if (res?.data) {
        setListingData(res.data);
      }

      setCurrentStep((prev) => Math.min(7, prev + 1));
    } catch (err) {
      console.error('[Step save error]', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save step.';
      setErrorBanner(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Step navigator tab click handler (auto-saves current step)
  const handleNavigateToStep = async (targetStep) => {
    if (targetStep === currentStep) return;
    setErrorBanner(null);

    if (!onHold && isLiveData && authToken && listingData?.id && currentStep < 7) {
      try {
        const stepPayload = getStepPayload(currentStep);
        const res = await cmpConnectApi.updateListing(listingData.id, stepPayload, authToken);
        if (res?.data) {
          setListingData(res.data);
        }
      } catch (err) {
        console.warn('[Auto-save step error]', err);
      }
    }

    setCurrentStep(targetStep);
  };

  // Status Action Handlers
  const handleAction = async (actionFn, successMsg) => {
    setIsSaving(true);
    setErrorBanner(null);
    try {
      const res = await actionFn();
      if (res?.data) setListingData(res.data);
      setSuccessBanner(successMsg);
      await loadListingDetails();
    } catch (err) {
      console.error('[Action error]', err);
      setErrorBanner(err.message || 'Action failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = () => {
    handleAction(
      () => cmpConnectApi.submitListing(listingData.id, authToken),
      can('listings.approve') ? 'Listing approved and is now live!' : 'Listing submitted for approval.'
    );
  };

  const handleApprove = () => {
    handleAction(
      () => cmpConnectApi.approveListing(listingData.id, authToken),
      'Listing approved and live.'
    );
  };

  const handleConfirmReject = () => {
    if (!rejectModal.reason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    const reason = rejectModal.reason.trim();
    setRejectModal({ isOpen: false, reason: '' });
    handleAction(
      () => cmpConnectApi.rejectListing(listingData.id, reason, authToken),
      'Listing rejected.'
    );
  };

  const handlePublish = () => {
    handleAction(
      () => cmpConnectApi.publishListing(listingData.id, authToken),
      'Listing is now live.'
    );
  };

  const handleUnpublish = () => {
    handleAction(
      () => cmpConnectApi.unpublishListing(listingData.id, authToken),
      'Listing unpublished.'
    );
  };

  const handleArchive = () => {
    handleAction(
      () => cmpConnectApi.archiveListing(listingData.id, authToken),
      'Listing moved to archive.'
    );
  };

  const handleRestore = () => {
    handleAction(
      () => cmpConnectApi.restoreListing(listingData.id, authToken),
      'Listing restored to Draft.'
    );
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await cmpConnectApi.deleteListing(listingData.id, authToken);
      alert('Listing deleted.');
      navigate('/properties');
    } catch (err) {
      setErrorBanner(err.message || 'Failed to delete listing.');
    }
  };

  const handleAgentChange = async (newAgentId) => {
    if (!newAgentId) return;
    try {
      const res = await cmpConnectApi.assignListing(listingData.id, newAgentId, authToken);
      if (res?.data) setListingData(res.data);
      setFormData((prev) => ({ ...prev, listedBy: newAgentId }));
      setSuccessBanner('Agent assignment updated.');
    } catch (err) {
      setErrorBanner(err.message || 'Failed to change agent.');
    }
  };

  if (isLoading && !listingData) {
    return (
      <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--cmp-brand)', margin: '0 auto 12px' }} />
        <p className="muted" style={{ margin: 0, fontSize: '14px' }}>Loading listing details...</p>
      </div>
    );
  }

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
          <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
            <h1 style={{ fontSize: '24px', margin: 0, letterSpacing: '-0.02em' }}>
              Edit listing
            </h1>
            {listingData?.listingRef && (
              <span className="badge badge-brand" style={{ fontSize: '13px', fontWeight: 800 }}>
                {listingData.listingRef}
              </span>
            )}
            {listingData?.status && (
              <span
                className={`badge ${
                  onHold
                    ? 'badge-danger'
                    : listingData.status === 'LIVE'
                    ? 'badge-brand'
                    : listingData.status === 'REJECTED'
                    ? 'badge-danger'
                    : 'badge-neutral'
                }`}
              >
                {onHold ? 'ON HOLD' : listingData.status}
              </span>
            )}
          </div>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            Changes to a live listing reflect immediately on public portals and apps.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <NavLink to="/properties" className="btn btn-outline btn-sm">
            Back to portfolio
          </NavLink>

          {/* Submit */}
          {canActions.submit && !onHold && (
            <button
              type="button"
              className="btn btn-accent btn-sm"
              disabled={isSaving}
              onClick={handleSubmit}
            >
              <Send size={14} />
              <span>{can('listings.approve') ? 'Publish (Go Live)' : 'Submit for approval'}</span>
            </button>
          )}

          {/* Approve / Reject */}
          {canActions.approve && !onHold && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: 'var(--cmp-success)', color: '#FFF' }}
              disabled={isSaving}
              onClick={handleApprove}
            >
              <CheckCircle2 size={14} />
              <span>Approve</span>
            </button>
          )}

          {canActions.reject && !onHold && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: 'var(--cmp-danger)', color: '#FFF' }}
              disabled={isSaving}
              onClick={() => setRejectModal({ isOpen: true, reason: '' })}
            >
              <XCircle size={14} />
              <span>Reject</span>
            </button>
          )}

          {/* Publish / Unpublish */}
          {canActions.publish && !onHold && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={isSaving}
              onClick={handlePublish}
            >
              <CheckCircle2 size={14} />
              <span>Publish</span>
            </button>
          )}

          {canActions.unpublish && !onHold && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={isSaving}
              onClick={handleUnpublish}
            >
              <XCircle size={14} />
              <span>Unpublish</span>
            </button>
          )}

          {/* Save Button */}
          {!onHold && canActions.edit !== false && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={isSaving}
              onClick={handleSaveChanges}
            >
              {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
              <span>Save changes</span>
            </button>
          )}

          {/* Archive / Restore */}
          {canActions.archive && !onHold && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={isSaving}
              onClick={handleArchive}
              title="Archive listing"
            >
              <Archive size={14} />
            </button>
          )}

          {canActions.restore && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={isSaving}
              onClick={handleRestore}
              title="Restore to Draft"
            >
              <RotateCcw size={14} />
            </button>
          )}

          {/* Delete */}
          {canActions.delete && !onHold && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={isSaving}
              onClick={handleDelete}
              style={{ color: 'var(--cmp-danger)' }}
              title="Delete listing"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* On-Hold Banner */}
      {onHold && (
        <div
          className="card"
          style={{
            padding: '14px 18px',
            marginBottom: '18px',
            background: 'var(--cmp-danger-subtle)',
            border: '2px solid var(--cmp-danger)',
            color: 'var(--cmp-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <AlertOctagon size={24} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '15px' }}>On Hold by CMP Administration</strong>
            <p style={{ margin: '2px 0 0', fontSize: '13px' }}>
              {listingData?.holdReason || listingData?.adminHold?.reason || 'Contact CMP support for resolution.'}
            </p>
          </div>
        </div>
      )}

      {/* Rejection Note Banner */}
      {listingData?.status === 'REJECTED' && listingData?.rejectionReason && (
        <div
          className="card"
          style={{
            padding: '14px 18px',
            marginBottom: '18px',
            background: 'var(--cmp-danger-subtle)',
            border: '1px solid var(--cmp-danger)',
            color: 'var(--cmp-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '14px' }}>Listing was rejected by compliance</strong>
            <p style={{ margin: '2px 0 0', fontSize: '13px' }}>
              {listingData.rejectionReason}
            </p>
          </div>
        </div>
      )}

      {/* Error / Success Toast Alerts */}
      {errorBanner && (
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
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          <span style={{ fontSize: '13.5px' }}>{errorBanner}</span>
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
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{successBanner}</span>
        </div>
      )}

      <div
        className="wizard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Left Step Navigator & Quality Meter */}
        <aside style={{ display: 'grid', gap: '16px' }}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '4px' }}>
            {STEPS.map((s) => {
              const isActive = currentStep === s.num;
              return (
                <li key={s.num}>
                  <button
                    type="button"
                    onClick={() => handleNavigateToStep(s.num)}
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
                        background: isActive ? 'var(--cmp-brand)' : 'var(--cmp-border)',
                        color: isActive ? '#FFFFFF' : 'var(--cmp-text-faint)'
                      }}
                    >
                      {s.num}
                    </span>
                    <span>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Quality Score Meter */}
          <div className="card" style={{ padding: '16px' }}>
            <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Quality Score
            </p>
            <p style={{ margin: '6px 0 10px', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
              {qualityScore}
              <span className="faint" style={{ fontSize: '14px', fontWeight: 600 }}>/100</span>
            </p>
            <div style={{ height: '6px', borderRadius: '3px', background: 'var(--cmp-border)', overflow: 'hidden' }}>
              <div style={{ width: `${qualityScore}%`, height: '100%', background: 'var(--cmp-brand)', transition: 'width 0.3s ease' }} />
            </div>

            {qualityTips.length > 0 && (
              <ul className="muted" style={{ margin: '14px 0 0', paddingLeft: '16px', display: 'grid', gap: '6px', fontSize: '12px' }}>
                {qualityTips.map((tip, idx) => (
                  <li key={idx}>
                    {tip.tip} <span className="faint">+{tip.points}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Listed Agent Box */}
          {can('listings.assign') && (
            <div className="card" style={{ padding: '16px' }}>
              <label style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700 }}>
                Listing Assignment
              </label>
              <select
                disabled={onHold}
                value={formData.listedBy}
                onChange={(e) => handleAgentChange(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Unassigned / Current user --</option>
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} {m.compliance?.brn ? `(BRN: ${m.compliance.brn})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </aside>

        {/* Wizard Form Body */}
        <div className="card" style={{ padding: '24px' }}>
          {/* STEP 1: Purpose & Type */}
          {currentStep === 1 && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Purpose and Type
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label>Purpose</label>
                  <select
                    disabled={onHold}
                    value={formData.listingPurpose}
                    onChange={(e) => setFormData({ ...formData, listingPurpose: e.target.value })}
                  >
                    <option value="SALE">Sale (Buy)</option>
                    <option value="RENT">Rent</option>
                  </select>
                </div>

                <div>
                  <label>Category</label>
                  <select
                    disabled={onHold}
                    value={formData.propertyCategory}
                    onChange={(e) => setFormData({ ...formData, propertyCategory: e.target.value })}
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label>Plan</label>
                  <select
                    disabled={onHold}
                    value={formData.propertyPlan}
                    onChange={(e) => setFormData({ ...formData, propertyPlan: e.target.value })}
                  >
                    <option value="READY">Ready</option>
                    <option value="OFF_PLAN">Off-Plan</option>
                  </select>
                </div>

                <div>
                  <label>Property Type</label>
                  <select
                    disabled={onHold}
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  >
                    {availableTypes.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label>Listing Title (English)</label>
                <input
                  disabled={onHold}
                  placeholder="e.g. Upgraded 2 bed in Marina Gate"
                  value={formData.propertyTitle}
                  onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
                  maxLength={120}
                />
              </div>

              <div>
                <label>Listing Title (Arabic - Optional)</label>
                <input
                  dir="rtl"
                  disabled={onHold}
                  placeholder="عنوان الإعلان بالعربية..."
                  value={formData.propertyTitleAr}
                  onChange={(e) => setFormData({ ...formData, propertyTitleAr: e.target.value })}
                />
              </div>

              <div>
                <label>Description</label>
                <textarea
                  rows={5}
                  disabled={onHold}
                  placeholder="Full description..."
                  value={formData.propertyDescription}
                  onChange={(e) => setFormData({ ...formData, propertyDescription: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === 2 && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Location & Coordinates
              </h2>

              <div>
                <label>Property Location / Building</label>
                <GooglePlacesLocationInput
                  disabled={onHold}
                  placeholder="e.g. Marina Gate Tower 1, Dubai Marina, Dubai"
                  value={formData.propertyLocation}
                  onChange={(val) => setFormData((prev) => ({ ...prev, propertyLocation: val }))}
                  onSelectLocation={({ address, lat, lng }) => {
                    setFormData((prev) => ({
                      ...prev,
                      propertyLocation: address,
                      ...(lat != null ? { propertyLatitude: lat } : {}),
                      ...(lng != null ? { propertyLongitude: lng } : {})
                    }));
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label>Latitude Coordinates</label>
                  <input
                    type="number"
                    step="0.0001"
                    disabled={onHold}
                    value={formData.propertyLatitude}
                    onChange={(e) => setFormData({ ...formData, propertyLatitude: e.target.value })}
                  />
                </div>
                <div>
                  <label>Longitude Coordinates</label>
                  <input
                    type="number"
                    step="0.0001"
                    disabled={onHold}
                    value={formData.propertyLongitude}
                    onChange={(e) => setFormData({ ...formData, propertyLongitude: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Details */}
          {currentStep === 3 && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Property Specifications
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label>Bedrooms</label>
                  <select
                    disabled={onHold}
                    value={formData.propertyBedrooms}
                    onChange={(e) => setFormData({ ...formData, propertyBedrooms: e.target.value })}
                  >
                    {['0', '1', '2', '3', '4', '5', '6', '7+'].map((b) => (
                      <option key={b} value={b}>
                        {b === '0' ? 'Studio' : `${b} Bedroom`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Bathrooms</label>
                  <select
                    disabled={onHold}
                    value={formData.propertyBathrooms}
                    onChange={(e) => setFormData({ ...formData, propertyBathrooms: e.target.value })}
                  >
                    {['1', '2', '3', '4', '5', '6+'].map((b) => (
                      <option key={b} value={b}>
                        {b} Bathroom
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label>Area Size</label>
                  <input
                    type="number"
                    disabled={onHold}
                    value={formData.propertyArea}
                    onChange={(e) => setFormData({ ...formData, propertyArea: e.target.value })}
                  />
                </div>
                <div>
                  <label>Unit</label>
                  <select
                    disabled={onHold}
                    value={formData.propertyAreaUnit}
                    onChange={(e) => setFormData({ ...formData, propertyAreaUnit: e.target.value })}
                  >
                    <option value="sqft">sqft</option>
                    <option value="sqm">sqm</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label>Unit Number (Confidential)</label>
                  <input
                    disabled={onHold}
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label>Parking Spaces</label>
                  <input
                    type="number"
                    disabled={onHold}
                    value={formData.parkingSpaces}
                    onChange={(e) => setFormData({ ...formData, parkingSpaces: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label>Furnishing Status</label>
                  <select
                    disabled={onHold}
                    value={formData.furnishingStatus}
                    onChange={(e) => setFormData({ ...formData, furnishingStatus: e.target.value })}
                  >
                    <option value="SEMI">Semi-Furnished</option>
                    <option value="FULL">Fully Furnished</option>
                    <option value="NOT_FURNISHED">Unfurnished</option>
                  </select>
                </div>
                <div>
                  <label>Availability</label>
                  <select
                    disabled={onHold}
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  >
                    <option value="Vacant">Vacant</option>
                    <option value="Tenanted">Tenanted</option>
                    <option value="Owner Occupied">Owner Occupied</option>
                  </select>
                </div>
              </div>

              <div>
                <label>Internal Reference Number</label>
                <input
                  disabled={onHold}
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 4: Amenities */}
          {currentStep === 4 && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Amenities & Features
              </h2>
              <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                {availableAmenities.map((am) => {
                  const isActive = formData.propertyAmenities.includes(am);
                  return (
                    <button
                      key={am}
                      type="button"
                      disabled={onHold}
                      className={`chip ${isActive ? 'active' : ''}`}
                      onClick={() => handleToggleAmenity(am)}
                    >
                      {isActive && <Check size={12} />}
                      <span>{am}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Price */}
          {currentStep === 5 && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Price & Compliance
              </h2>

              <div>
                <label>Asking Price (AED)</label>
                <input
                  type="number"
                  disabled={onHold}
                  value={formData.propertyPrice}
                  onChange={(e) => setFormData({ ...formData, propertyPrice: e.target.value })}
                />
              </div>

              {formData.listingPurpose === 'RENT' && (
                <div>
                  <label>Rental Period</label>
                  <select
                    disabled={onHold}
                    value={formData.rentalPeriod}
                    onChange={(e) => setFormData({ ...formData, rentalPeriod: e.target.value })}
                  >
                    <option value="PER_YEAR">Per Year</option>
                    <option value="PER_MONTH">Per Month</option>
                    <option value="PER_WEEK">Per Week</option>
                    <option value="PER_DAY">Per Day</option>
                  </select>
                </div>
              )}

              <div>
                <label>Trakheesi / DLD Permit Number</label>
                <input
                  disabled={onHold}
                  value={formData.permitNumber}
                  onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 6: Media */}
          {currentStep === 6 && (
            <div style={{ display: 'grid', gap: '22px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Photos & Documents
              </h2>

              {/* Photos */}
              <div>
                <label>Property Photos ({formData.propertyImages.length} uploaded)</label>
                {!onHold && (
                  <label
                    style={{
                      display: 'block',
                      padding: '28px 16px',
                      border: '2px dashed var(--cmp-border)',
                      borderRadius: '10px',
                      textAlign: 'center',
                      background: 'var(--cmp-surface-sunken)',
                      cursor: uploadingImage ? 'wait' : 'pointer'
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                    />
                    {uploadingImage ? (
                      <div className="row" style={{ justifyContent: 'center', gap: '8px' }}>
                        <Loader2 size={20} className="spin" style={{ color: 'var(--cmp-brand)' }} />
                        <span>Uploading photos to Cloudinary...</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={28} style={{ color: 'var(--cmp-brand)', margin: '0 auto 6px', display: 'block' }} />
                        <span style={{ fontWeight: 600, fontSize: '13.5px' }}>Click to add more photos</span>
                      </>
                    )}
                  </label>
                )}

                {/* Grid */}
                {formData.propertyImages.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '10px',
                      marginTop: '12px'
                    }}
                  >
                    {formData.propertyImages.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          aspectRatio: '4 / 3',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: idx === 0 ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)'
                        }}
                      >
                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '4px',
                              left: '4px',
                              background: 'var(--cmp-brand)',
                              color: '#FFF',
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '2px 5px',
                              borderRadius: '4px'
                            }}
                          >
                            COVER
                          </span>
                        )}
                        {!onHold && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'rgba(0,0,0,0.65)',
                              color: '#FFF',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'grid',
                              placeItems: 'center'
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <label>Compliance Documents</label>
                <div style={{ display: 'grid', gap: '8px', marginTop: '6px' }}>
                  {[
                    { key: 'contractA', label: 'Form A (Listing Agreement)' },
                    { key: 'propertyTitleDeed', label: 'Property Title Deed' },
                    { key: 'propertyTrakheesi', label: 'Trakheesi Permit Certificate' },
                    { key: 'passportDocument', label: 'Owner Passport / Emirates ID' },
                    { key: 'propertyEid_Visa', label: 'Emirates ID / Visa Copy' },
                    { key: 'propertyFloorPlan', label: 'Floor Plan' }
                  ].map((doc) => {
                    const uploaded = formData.documents[doc.key];
                    const isUploading = uploadingDocKey === doc.key;

                    return (
                      <div
                        key={doc.key}
                        className="card"
                        style={{
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: uploaded ? 'var(--cmp-surface)' : 'var(--cmp-surface-sunken)'
                        }}
                      >
                        <div className="row" style={{ gap: '10px' }}>
                          <FileText size={18} style={{ color: uploaded ? 'var(--cmp-brand)' : 'var(--cmp-text-faint)' }} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{doc.label}</div>
                            {uploaded ? (
                              <a
                                href={uploaded.url}
                                target="_blank"
                                rel="noreferrer"
                                className="row"
                                style={{ gap: '4px', fontSize: '12px', color: 'var(--cmp-brand)' }}
                              >
                                <span>{uploaded.fileName || 'View file'}</span>
                                <ExternalLink size={11} />
                              </a>
                            ) : (
                              <span className="faint" style={{ fontSize: '12px' }}>Not uploaded</span>
                            )}
                          </div>
                        </div>

                        {!onHold && (
                          <div>
                            {uploaded ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--cmp-danger)' }}
                                onClick={() => handleRemoveDoc(doc.key)}
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <label className="btn btn-outline btn-sm" style={{ cursor: isUploading ? 'wait' : 'pointer', margin: 0 }}>
                                <input
                                  type="file"
                                  accept=".pdf,image/jpeg,image/png"
                                  style={{ display: 'none' }}
                                  disabled={isUploading}
                                  onChange={(e) => handleDocUpload(doc.key, e)}
                                />
                                {isUploading ? <Loader2 size={12} className="spin" /> : <Upload size={12} />}
                                <span>Upload</span>
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Review & Compliance */}
          {currentStep === 7 && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Review & Submission Status
              </h2>

              {submitIssues.length > 0 ? (
                <div
                  className="card"
                  style={{
                    padding: '16px',
                    background: 'var(--cmp-danger-subtle)',
                    border: '1px solid var(--cmp-danger)'
                  }}
                >
                  <div className="row" style={{ gap: '8px', color: 'var(--cmp-danger)', fontWeight: 700, marginBottom: '8px' }}>
                    <AlertTriangle size={18} />
                    <span>Compliance issues required before publishing:</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '6px', fontSize: '13px', color: 'var(--cmp-danger)' }}>
                    {submitIssues.map((issue, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{issue.message}</span>
                        {issue.step && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px 8px', fontSize: '12px', color: 'var(--cmp-danger)', textDecoration: 'underline' }}
                            onClick={() => setCurrentStep(issue.step)}
                          >
                            Fix in Step {issue.step}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div
                  className="card"
                  style={{
                    padding: '14px 18px',
                    background: 'var(--cmp-brand-subtle)',
                    border: '1px solid var(--cmp-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <ShieldCheck size={20} style={{ color: 'var(--cmp-brand)' }} />
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--cmp-brand)' }}>Ready to go live!</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--cmp-text-muted)' }}>
                      All requirements met.
                    </p>
                  </div>
                </div>
              )}

              {/* Summary Card */}
              <div className="card" style={{ padding: '16px', background: 'var(--cmp-surface-sunken)' }}>
                <strong>{formData.propertyTitle}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {formData.propertyLocation} · {formData.propertyBedrooms} Beds · {formData.propertyArea} {formData.propertyAreaUnit}
                </p>
                <p style={{ margin: '8px 0 0', fontWeight: 800, color: 'var(--cmp-brand)', fontSize: '16px' }}>
                  AED {Number(formData.propertyPrice || 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Step Navigation Footer */}
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
                disabled={isSaving}
                onClick={handleSaveAndContinue}
              >
                {isSaving ? <Loader2 size={15} className="spin" /> : null}
                <span>Next step</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              !onHold && canActions.submit && (
                <button
                  type="button"
                  className="btn btn-accent"
                  disabled={isSaving || submitIssues.length > 0}
                  onClick={handleSubmit}
                >
                  <Check size={16} />
                  <span>{can('listings.approve') ? 'Publish Property' : 'Submit for approval'}</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.5)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
        >
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>Reject listing</h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px' }}>
              State the reason this listing is rejected:
            </p>
            <textarea
              rows={4}
              placeholder="e.g. Please update photos and attach signed Form A..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              style={{ width: '100%', marginBottom: '16px' }}
            />
            <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setRejectModal({ isOpen: false, reason: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: 'var(--cmp-danger)', color: '#FFF' }}
                onClick={handleConfirmReject}
              >
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
