import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
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
  Upload,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X
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

const PURPOSE_OPTIONS = [
  { key: 'BUY_RES', label: 'Buy (Residential)', purpose: 'SALE', category: 'RESIDENTIAL' },
  { key: 'RENT_RES', label: 'Rent (Residential)', purpose: 'RENT', category: 'RESIDENTIAL' },
  { key: 'BUY_COMM', label: 'Commercial Buy', purpose: 'SALE', category: 'COMMERCIAL' },
  { key: 'RENT_COMM', label: 'Commercial Rent', purpose: 'RENT', category: 'COMMERCIAL' }
];

export default function AddPropertyPage() {
  const { addListing, isLiveData, authToken, can, team, account } = useApp();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [listingId, setListingId] = useState(null);
  const [listingRef, setListingRef] = useState(null);

  // Options from API
  const [options, setOptions] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);

  // For AGENCY accounts, only members with a BRN can have listings under them
  const brnEligibleMembers = useMemo(() => {
    if (account?.accountType === 'AGENCY') {
      return activeMembers.filter((m) => Boolean(m.compliance?.brn));
    }
    return activeMembers;
  }, [activeMembers, account?.accountType]);

  // Loading / saving states
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [isStepSaving, setIsStepSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState(null);
  const [stepError, setStepError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review step data from GET /listings/:id
  const [reviewDetail, setReviewDetail] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    purposeCategoryKey: '',
    listingPurpose: '',
    propertyCategory: '',
    propertyPlan: 'READY',
    propertyType: 'APARTMENT',
    propertyTitle: '',
    propertyTitleAr: '',
    propertyDescription: '',
    propertyDescriptionAr: '',
    listedBy: '',

    // Step 2
    propertyLocation: 'Dubai Marina, Dubai',
    propertyLatitude: 25.08,
    propertyLongitude: 55.14,

    // Step 3
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

    // Step 4
    propertyAmenities: [],

    // Step 5
    propertyPrice: '',
    downPayment: '',
    rentalPeriod: 'PER_YEAR',
    permitNumber: '',

    // Step 6
    propertyImages: [], // [{ url, public_id }]
    videoUrl: '',
    virtualTourUrl: '',
    documents: {}, // { [docKey]: { url, public_id, fileName } }
    otherDocuments: []
  });

  // Fetch listing options on mount
  useEffect(() => {
    if (isLiveData && authToken) {
      setIsOptionsLoading(true);
      cmpConnectApi.getListingOptions(authToken)
        .then((res) => {
          if (res?.data) {
            setOptions(res.data);
          }
        })
        .catch((err) => {
          console.error('[AddProperty] Options load error:', err);
        })
        .finally(() => {
          setIsOptionsLoading(false);
        });

      // Fetch team members if user has assign permission
      if (can('listings.assign')) {
        cmpConnectApi.listMembers({ status: 'ACTIVE' }, authToken)
          .then((res) => {
            if (Array.isArray(res?.data)) {
              setActiveMembers(res.data);
            }
          })
          .catch(() => {});
      }
    }
  }, [isLiveData, authToken, can, account]);

  // For agents without listings.assign permission, auto-bind listedBy to current account
  useEffect(() => {
    if (account?.id && !can('listings.assign')) {
      setFormData((prev) => (prev.listedBy !== account.id ? { ...prev, listedBy: account.id } : prev));
    }
  }, [account, can]);

  // Derived available property types based on options rules
  const availableTypes = useMemo(() => {
    if (!formData.listingPurpose || !formData.propertyCategory) {
      return [];
    }
    const { listingPurpose, propertyCategory, propertyPlan } = formData;
    const ruleBranch = options?.rules?.[listingPurpose]?.[propertyCategory]?.[propertyPlan] || {};
    let keys = Object.keys(ruleBranch);

    if (propertyCategory === 'COMMERCIAL' && (!keys.length || keys.length <= 1)) {
      const isRent = listingPurpose === 'RENT';
      keys = [
        'OFFICES', 'RETAIL', 'SHOP', 'SHOWROOM', 'WAREHOUSE',
        'VILLA', 'BUILDING', 'FULL_FLOOR', 'HALF_FLOOR', 'LAND',
        isRent ? 'BULK_RENT_UNIT' : 'BULK_SALE_UNIT',
        'FACTORY', 'LABOR_CAMP', 'STAFF_ACCOMMODATION',
        'BUSINESS_CENTRE', 'CO_WORKING_SPACE', 'FARM', 'HOTEL_APARTMENT'
      ];
    } else if (propertyCategory === 'RESIDENTIAL' && (!keys.length || (propertyPlan === 'OFF_PLAN' && keys.length <= 3))) {
      const isRent = listingPurpose === 'RENT';
      keys = [
        'APARTMENT', 'VILLA', 'TOWNHOUSE', 'PENTHOUSE', 'COMPOUND',
        'DUPLEX', 'FULL_FLOOR', 'HALF_FLOOR', 'BUILDING', 'LAND',
        isRent ? 'BULK_RENT_UNIT' : 'BULK_SALE_UNIT',
        'BUNGALOW', 'HOTEL_APARTMENT'
      ];
    } else if (keys.length === 0 && options?.typeLabels) {
      return Object.entries(options.typeLabels).map(([k, label]) => ({ key: k, label }));
    }

    const labelsMap = {
      APARTMENT: 'Apartment',
      VILLA: propertyCategory === 'COMMERCIAL' ? 'Commercial Villa' : 'Villa',
      TOWNHOUSE: 'Townhouse',
      PENTHOUSE: 'Penthouse',
      COMPOUND: 'Compound',
      DUPLEX: 'Duplex',
      FULL_FLOOR: 'Full Floor',
      HALF_FLOOR: 'Half Floor',
      BUILDING: 'Whole Building',
      LAND: propertyCategory === 'COMMERCIAL' ? 'Commercial Land' : 'Land',
      BULK_SALE_UNIT: 'Bulk Sale Unit',
      BULK_RENT_UNIT: 'Bulk Rent Unit',
      BUNGALOW: 'Bungalow',
      HOTEL_APARTMENT: 'Hotel & Hotel Apartment',
      OFFICES: 'Office Space',
      RETAIL: 'Retail',
      SHOP: 'Shop',
      SHOWROOM: 'Showroom',
      WAREHOUSE: 'Warehouse',
      FACTORY: 'Factory',
      LABOR_CAMP: 'Labor Camp',
      STAFF_ACCOMMODATION: 'Staff Accommodation',
      BUSINESS_CENTRE: 'Business Centre',
      CO_WORKING_SPACE: 'Co-working Space',
      FARM: 'Farm'
    };

    return keys.map((k) => ({
      key: k,
      label: labelsMap[k] || options?.typeLabels?.[k] || k
    }));
  }, [options, formData.listingPurpose, formData.propertyCategory, formData.propertyPlan]);

  // When availableTypes change, ensure current propertyType is valid
  useEffect(() => {
    if (availableTypes.length > 0) {
      const match = availableTypes.some((t) => t.key === formData.propertyType);
      if (!match) {
        setFormData((prev) => ({ ...prev, propertyType: availableTypes[0].key }));
      }
    }
  }, [availableTypes, formData.propertyType]);

  // Available amenities for category (matches backend AMENITIES_CONFIG)
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

  // Active type rules for fields and documents
  const currentRules = useMemo(() => {
    if (!options?.rules) return null;
    const { listingPurpose, propertyCategory, propertyPlan, propertyType } = formData;
    return options.rules[listingPurpose]?.[propertyCategory]?.[propertyPlan]?.[propertyType] || null;
  }, [options, formData.listingPurpose, formData.propertyCategory, formData.propertyPlan, formData.propertyType]);

  // Helper to determine field rules (required, forbidden, optional) per selected property type
  const getFieldRule = useCallback((fieldName) => {
    if (currentRules?.fields?.[fieldName]) {
      return currentRules.fields[fieldName]; // 'required' | 'forbidden' | 'optional'
    }
    const type = String(formData.propertyType || '').toUpperCase();
    if (fieldName === 'propertyBuiltUpArea') {
      const requiredTypes = [
        'VILLA', 'TOWNHOUSE', 'COMPOUND', 'COMMERCIAL_VILLA',
        'COMMERCIAL_BUILDING', 'RESIDENTIAL_BUILDING', 'LAND',
        'COMMERCIAL_PLOT', 'FARM'
      ];
      return requiredTypes.includes(type) ? 'required' : 'forbidden';
    }
    if (fieldName === 'propertyBedrooms') {
      const forbiddenTypes = [
        'LAND', 'COMMERCIAL_PLOT', 'COMMERCIAL_BUILDING', 'RESIDENTIAL_BUILDING',
        'COMMERCIAL_UNIT', 'OFFICE', 'RETAIL', 'WAREHOUSE', 'SHOWROOM', 'FLOOR',
        'COMMERCIAL_BULK', 'FARM'
      ];
      return forbiddenTypes.includes(type) ? 'forbidden' : 'required';
    }
    if (fieldName === 'propertyBathrooms') {
      const forbiddenTypes = [
        'LAND', 'COMMERCIAL_PLOT', 'COMMERCIAL_BUILDING', 'RESIDENTIAL_BUILDING',
        'COMMERCIAL_UNIT', 'OFFICE', 'RETAIL', 'WAREHOUSE', 'SHOWROOM', 'FLOOR',
        'COMMERCIAL_BULK', 'COMMERCIAL_VILLA', 'FARM'
      ];
      return forbiddenTypes.includes(type) ? 'forbidden' : 'required';
    }
    if (fieldName === 'unitNumber') {
      const forbiddenTypes = ['RESIDENTIAL_BUILDING', 'RESIDENTIAL_BULK', 'COMMERCIAL_BULK', 'FARM'];
      return forbiddenTypes.includes(type) ? 'forbidden' : 'required';
    }
    if (fieldName === 'furnishingStatus') {
      const forbiddenTypes = ['COMMERCIAL_PLOT', 'COMMERCIAL_BULK', 'FARM'];
      return forbiddenTypes.includes(type) ? 'forbidden' : 'required';
    }
    return 'optional';
  }, [currentRules, formData.propertyType]);

  // Load review step details
  const loadReviewDetails = useCallback(async () => {
    if (!isLiveData || !authToken || !listingId) return;
    try {
      const res = await cmpConnectApi.getListing(listingId, authToken);
      if (res?.data) {
        setReviewDetail(res.data);
      }
    } catch (err) {
      console.warn('[AddProperty] Failed to load review detail:', err);
    }
  }, [isLiveData, authToken, listingId]);

  useEffect(() => {
    if (currentStep === 7 && listingId) {
      loadReviewDetails();
    }
  }, [currentStep, listingId, loadReviewDetails]);

  // Purpose selector handler (Buy vs Rent)
  const handleSelectPurpose = (purpose) => {
    setFormData((prev) => {
      let key = '';
      if (purpose === 'SALE') {
        key = prev.propertyCategory === 'COMMERCIAL' ? 'BUY_COMM' : prev.propertyCategory === 'RESIDENTIAL' ? 'BUY_RES' : '';
      } else if (purpose === 'RENT') {
        key = prev.propertyCategory === 'COMMERCIAL' ? 'RENT_COMM' : prev.propertyCategory === 'RESIDENTIAL' ? 'RENT_RES' : '';
      }
      return {
        ...prev,
        listingPurpose: purpose,
        purposeCategoryKey: key
      };
    });
  };

  // Category selector handler (Residential vs Commercial)
  const handleSelectCategory = (category) => {
    setFormData((prev) => {
      const purpose = prev.listingPurpose || 'SALE';
      let key = '';
      if (purpose === 'SALE') {
        key = category === 'COMMERCIAL' ? 'BUY_COMM' : 'BUY_RES';
      } else {
        key = category === 'COMMERCIAL' ? 'RENT_COMM' : 'RENT_RES';
      }
      return {
        ...prev,
        propertyCategory: category,
        purposeCategoryKey: key
      };
    });
  };

  const handleSelectPurposeCategory = (item) => {
    setFormData((prev) => ({
      ...prev,
      purposeCategoryKey: item.key,
      listingPurpose: item.purpose,
      propertyCategory: item.category
    }));
  };

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
    if (!listingId) {
      setStepError('Please complete Step 1 first to initialize the property.');
      return;
    }

    setUploadingImage(true);
    setStepError(null);

    try {
      // 1. Get signed signature for this listing
      const sigRes = await cmpConnectApi.getListingUploadSignature(listingId, authToken);
      const sig = sigRes?.data?.images;
      if (!sig) throw new Error('Could not get upload signature.');

      // 2. Upload files in parallel to Cloudinary
      const uploads = files.map((file) => cmpConnectApi.uploadListingFileToCloudinary(file, sig));
      const results = await Promise.all(uploads);

      const newPhotos = results.map((r) => ({ url: r.url, public_id: r.public_id }));
      const updatedPhotos = [...formData.propertyImages, ...newPhotos];

      setFormData((prev) => ({ ...prev, propertyImages: updatedPhotos }));

      // 3. Save to listing
      await cmpConnectApi.updateListing(listingId, { propertyImages: updatedPhotos }, authToken);
    } catch (err) {
      console.error('[Upload error]', err);
      setStepError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (indexToRemove) => {
    const updatedPhotos = formData.propertyImages.filter((_, i) => i !== indexToRemove);
    setFormData((prev) => ({ ...prev, propertyImages: updatedPhotos }));
    if (listingId && isLiveData && authToken) {
      try {
        await cmpConnectApi.updateListing(listingId, { propertyImages: updatedPhotos }, authToken);
      } catch (err) {
        console.error('[Remove image error]', err);
      }
    }
  };

  // Cloudinary Direct Upload for Documents
  const handleDocUpload = async (docKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!listingId) {
      setStepError('Please complete Step 1 first to initialize the property.');
      return;
    }

    setUploadingDocKey(docKey);
    setStepError(null);

    try {
      const sigRes = await cmpConnectApi.getListingUploadSignature(listingId, authToken);
      const sig = sigRes?.data?.docs;
      if (!sig) throw new Error('Could not get doc upload signature.');

      const uploaded = await cmpConnectApi.uploadListingFileToCloudinary(file, sig);
      const updatedDocs = {
        ...formData.documents,
        [docKey]: { url: uploaded.url, public_id: uploaded.public_id, fileName: file.name }
      };

      setFormData((prev) => ({ ...prev, documents: updatedDocs }));

      await cmpConnectApi.updateListing(
        listingId,
        {
          documents: {
            [docKey]: { url: uploaded.url, public_id: uploaded.public_id, fileName: file.name }
          }
        },
        authToken
      );
    } catch (err) {
      console.error('[Doc upload error]', err);
      setStepError(err.message || 'Document upload failed.');
    } finally {
      setUploadingDocKey(null);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = async (docKey) => {
    const updatedDocs = { ...formData.documents };
    delete updatedDocs[docKey];
    setFormData((prev) => ({ ...prev, documents: updatedDocs }));

    if (listingId && isLiveData && authToken) {
      try {
        await cmpConnectApi.updateListing(listingId, { documents: { [docKey]: null } }, authToken);
      } catch (err) {
        console.error('[Remove doc error]', err);
      }
    }
  };

  // Save current step data and advance
  const handleContinue = async () => {
    setStepError(null);

    // Mock Mode fallback
    if (!isLiveData || !authToken) {
      if (currentStep < 7) {
        setCurrentStep((prev) => prev + 1);
      }
      return;
    }

    setIsStepSaving(true);
    try {
      if (currentStep === 1) {
        // Validation
        if (!formData.listingPurpose) {
          throw new Error('Please select whether this listing is for Buy or Rent.');
        }
        if (!formData.propertyCategory) {
          throw new Error('Please select a property category (Residential or Commercial).');
        }
        if (!formData.propertyTitle.trim()) {
          throw new Error('Listing title is required.');
        }

        // Agency admin without BRN must assign listing to an agent with BRN
        if (can('listings.assign') && account?.accountType === 'AGENCY' && !account?.compliance?.brn && !account?.brn && !formData.listedBy) {
          throw new Error('As an agency administrator without a broker licence (BRN), you must assign this listing to an agent.');
        }

        const step1Payload = {
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
          step1Payload.listedBy = formData.listedBy;
        }

        if (!listingId) {
          // POST /listings
          const res = await cmpConnectApi.createListing(step1Payload, authToken);
          const newId = res?.data?.id;
          const newRef = res?.data?.listingRef;
          setListingId(newId);
          setListingRef(newRef);
        } else {
          // PATCH /listings/:id
          await cmpConnectApi.updateListing(listingId, step1Payload, authToken);
        }
      } else if (currentStep === 2) {
        // Step 2 Location
        await cmpConnectApi.updateListing(
          listingId,
          {
            propertyLocation: formData.propertyLocation,
            propertyLatitude: Number(formData.propertyLatitude) || 25.08,
            propertyLongitude: Number(formData.propertyLongitude) || 55.14
          },
          authToken
        );
      } else if (currentStep === 3) {
        // Step 3 Validation
        if (!formData.propertyArea || Number(formData.propertyArea) <= 0) {
          throw new Error('Area size is required.');
        }
        if (getFieldRule('propertyBuiltUpArea') === 'required' && (!formData.propertyBuiltUpArea || Number(formData.propertyBuiltUpArea) <= 0)) {
          throw new Error('Built-Up Area (BUA) is required for this property type.');
        }
        if (getFieldRule('propertyBedrooms') === 'required' && !formData.propertyBedrooms) {
          throw new Error('Bedrooms count is required.');
        }
        if (getFieldRule('propertyBathrooms') === 'required' && !formData.propertyBathrooms) {
          throw new Error('Bathrooms count is required.');
        }

        const bAreaRule = getFieldRule('propertyBuiltUpArea');
        const bedsRule = getFieldRule('propertyBedrooms');
        const bathsRule = getFieldRule('propertyBathrooms');
        const unitRule = getFieldRule('unitNumber');
        const furnRule = getFieldRule('furnishingStatus');

        // Step 3 Details
        await cmpConnectApi.updateListing(
          listingId,
          {
            propertyArea: formData.propertyArea ? Number(formData.propertyArea) : null,
            propertyAreaUnit: formData.propertyAreaUnit || 'sqft',
            propertyBuiltUpArea: bAreaRule !== 'forbidden' && formData.propertyBuiltUpArea ? Number(formData.propertyBuiltUpArea) : null,
            propertyBedrooms: bedsRule !== 'forbidden' ? formData.propertyBedrooms : null,
            propertyBathrooms: bathsRule !== 'forbidden' ? formData.propertyBathrooms : null,
            unitNumber: unitRule !== 'forbidden' ? (formData.unitNumber || null) : null,
            parkingSpaces: formData.parkingSpaces ? Number(formData.parkingSpaces) : 0,
            furnishingStatus: furnRule !== 'forbidden' ? formData.furnishingStatus : null,
            availability: formData.availability,
            referenceNumber: formData.referenceNumber || null
          },
          authToken
        );
      } else if (currentStep === 4) {
        // Step 4 Amenities - ensure only valid category amenities are sent
        const safeAmenities = (formData.propertyAmenities || []).filter((a) => availableAmenities.includes(a));
        setFormData((prev) => ({ ...prev, propertyAmenities: safeAmenities }));
        await cmpConnectApi.updateListing(
          listingId,
          {
            propertyAmenities: safeAmenities
          },
          authToken
        );
      } else if (currentStep === 5) {
        // Step 5 Price
        await cmpConnectApi.updateListing(
          listingId,
          {
            propertyPrice: formData.propertyPrice ? Number(formData.propertyPrice) : null,
            downPayment: formData.downPayment ? Number(formData.downPayment) : null,
            rentalPeriod: formData.listingPurpose === 'RENT' ? formData.rentalPeriod : null,
            permitNumber: formData.permitNumber || null
          },
          authToken
        );
      } else if (currentStep === 6) {
        // Step 6 Media
        await cmpConnectApi.updateListing(
          listingId,
          {
            propertyImages: formData.propertyImages,
            videoUrl: formData.videoUrl || null,
            virtualTourUrl: formData.virtualTourUrl || null
          },
          authToken
        );
      }

      // Step saved successfully, go to next step
      setCurrentStep((prev) => Math.min(7, prev + 1));
    } catch (err) {
      console.error('[Step save error]', err);
      setStepError(err.message || 'Failed to save step.');
    } finally {
      setIsStepSaving(false);
    }
  };

  // Final Submit on Step 7
  const handleFinalSubmit = async () => {
    setStepError(null);
    setIsSubmitting(true);

    if (!isLiveData || !authToken) {
      // Mock submit
      const newProp = {
        id: `CMP-S-00${Math.floor(Math.random() * 8999 + 1000)}`,
        title: formData.propertyTitle || 'Untitled Property',
        community: formData.propertyLocation,
        purpose: formData.listingPurpose === 'SALE' ? 'Sale' : 'Rent',
        type: formData.propertyType,
        category: formData.propertyCategory,
        beds: Number(formData.propertyBedrooms) || 2,
        baths: Number(formData.propertyBathrooms) || 2,
        areaSqft: Number(formData.propertyArea) || 1200,
        price: Number(formData.propertyPrice) || 2500000,
        priceLabel: `AED ${(Number(formData.propertyPrice || 2500000) / 1000000).toFixed(2)}M`,
        leads: 0,
        views: 0,
        qualityScore: 88,
        status: 'Live',
        agent: 'Karim Saleh',
        agentInitials: 'KS',
        permitNumber: formData.permitNumber || 'DLD-712839',
        permitStatus: 'Valid',
        image: formData.propertyImages[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=70',
        attentionCount: 0
      };
      addListing(newProp);
      navigate('/properties');
      return;
    }

    try {
      if (!listingId) throw new Error('Listing ID is missing.');
      const res = await cmpConnectApi.submitListing(listingId, authToken);
      const isLiveNow = res?.data?.status === 'LIVE';
      alert(
        isLiveNow
          ? `Listing ${listingRef || ''} has been approved and is now LIVE on CMP portal!`
          : `Listing ${listingRef || ''} submitted for approval!`
      );
      navigate('/properties');
    } catch (err) {
      console.error('[Final Submit Error]', err);
      setStepError(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Local quality calculation fallback
  const qualityScore = useMemo(() => {
    if (reviewDetail?.qualityScore !== undefined) {
      return reviewDetail.qualityScore;
    }
    let score = 20;
    if (formData.propertyTitle.length > 15) score += 15;
    if (formData.propertyDescription.length > 50) score += 15;
    if (formData.permitNumber.length > 4) score += 20;
    if (formData.propertyArea && Number(formData.propertyArea) > 0) score += 15;
    if (formData.propertyImages.length >= 8) score += 15;
    return Math.min(100, score);
  }, [reviewDetail, formData]);

  const submitIssues = reviewDetail?.submitIssues || [];
  const qualityTips = reviewDetail?.qualityTips || [];

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '24px', margin: 0, letterSpacing: '-0.02em' }}>
          Add a property {listingRef && <span style={{ color: 'var(--cmp-brand)', fontSize: '18px' }}>({listingRef})</span>}
        </h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
          7-step compliant listing wizard. Real-time validation against Dubai Land Department compliance rules.
        </p>
      </div>

      {/* Global Step Error Alert */}
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Left Sidebar: Step Indicators & Quality Meter */}
        <aside style={{ display: 'grid', gap: '16px' }}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '4px' }}>
            {STEPS.map((st) => (
              <li key={st.num}>
                <button
                  type="button"
                  disabled={isStepSaving || (st.num > 1 && !listingId && isLiveData)}
                  onClick={() => setCurrentStep(st.num)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: 'var(--cmp-radius-md)',
                    border: 'none',
                    cursor: st.num > 1 && !listingId && isLiveData ? 'not-allowed' : 'pointer',
                    opacity: st.num > 1 && !listingId && isLiveData ? 0.5 : 1,
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
              Listing Quality
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

            {qualityTips.length > 0 ? (
              <ul className="muted" style={{ margin: '12px 0 0', paddingLeft: '16px', display: 'grid', gap: '6px', fontSize: '12px' }}>
                {qualityTips.map((tip, idx) => (
                  <li key={idx}>
                    {tip.tip} <span className="faint">+{tip.points}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="muted" style={{ margin: '12px 0 0', paddingLeft: '16px', display: 'grid', gap: '6px', fontSize: '12px' }}>
                <li>Add at least 8 photos <span className="faint">+20</span></li>
                <li>Description 300+ chars <span className="faint">+15</span></li>
                <li>Add valid DLD permit <span className="faint">+20</span></li>
                <li>Pin location coordinates <span className="faint">+15</span></li>
              </ul>
            )}
          </div>
        </aside>

        {/* Wizard Form Area */}
        <div className="card" style={{ padding: '24px' }}>
          {/* STEP 1: Purpose & Type */}
          {currentStep === 1 && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Step 1: Purpose & Type
              </h2>

              {/* Responsible Agent ("Listed under") */}
              {can('listings.assign') ? (
                <div>
                  <label>
                    Responsible Agent ("Listed under")
                    {account?.accountType === 'AGENCY' && !account?.compliance?.brn && !account?.brn && (
                      <span style={{ color: 'var(--cmp-danger)', marginLeft: '4px' }}>*</span>
                    )}
                  </label>
                  <select
                    value={formData.listedBy}
                    onChange={(e) => setFormData({ ...formData, listedBy: e.target.value })}
                  >
                    {account?.accountType === 'AGENCY' && !account?.compliance?.brn && !account?.brn ? (
                      <option value="">-- Select an agent with BRN (Required) --</option>
                    ) : (
                      <option value="">
                        -- Current user ({account?.fullName || 'Myself'}) {account?.compliance?.brn || account?.brn ? `(BRN: ${account.compliance?.brn || account.brn})` : ''} --
                      </option>
                    )}
                    {brnEligibleMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} {m.compliance?.brn ? `(BRN: ${m.compliance.brn})` : ''} - {m.role?.name || m.role}
                      </option>
                    ))}
                  </select>
                  <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                    {account?.accountType === 'AGENCY' && !account?.compliance?.brn && !account?.brn
                      ? 'As an agency administrator without a broker licence (BRN), you must assign this listing to an agent.'
                      : 'Agent must have an in-date, CMP-verified BRN to publish live.'}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'var(--cmp-surface-sunken)',
                    border: '1px solid var(--cmp-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--cmp-brand-subtle)',
                        color: 'var(--cmp-brand)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}
                    >
                      {account?.fullName
                        ? account.fullName.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
                        : 'AG'}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--cmp-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Listing Agent
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--cmp-text)' }}>
                        {account?.fullName || 'Current User'}
                        {(account?.compliance?.brn || account?.brn) && (
                          <span style={{ marginLeft: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--cmp-brand)' }}>
                            (BRN: {account.compliance?.brn || account.brn})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-brand" style={{ fontSize: '11px' }}>
                    Assigned to your profile
                  </span>
                </div>
              )}

              {/* Purpose & Category */}
              <div>
                <label>
                  Listing Purpose & Category <span style={{ color: 'var(--cmp-danger)' }}>*</span>
                </label>
                {/* Level 1: Purpose Capsules (Buy / Rent) */}
                <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`chip ${formData.listingPurpose === 'SALE' ? 'active' : ''}`}
                    onClick={() => handleSelectPurpose('SALE')}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    className={`chip ${formData.listingPurpose === 'RENT' ? 'active' : ''}`}
                    onClick={() => handleSelectPurpose('RENT')}
                  >
                    Rent
                  </button>
                </div>

                {/* Level 2: Category Capsules (Residential / Commercial) - opens when Buy or Rent is selected */}
                {formData.listingPurpose && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'var(--cmp-surface-sunken)',
                      border: '1px solid var(--cmp-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>
                      Select {formData.listingPurpose === 'SALE' ? 'Buy' : 'Rent'} Category:
                    </div>
                    <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`chip ${formData.propertyCategory === 'RESIDENTIAL' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('RESIDENTIAL')}
                      >
                        Residential
                      </button>
                      <button
                        type="button"
                        className={`chip ${formData.propertyCategory === 'COMMERCIAL' ? 'active' : ''}`}
                        onClick={() => handleSelectCategory('COMMERCIAL')}
                      >
                        Commercial
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Plan (Ready vs Off-plan) */}
              <div>
                <label>Completion Plan</label>
                <div className="row" style={{ gap: '8px' }}>
                  <button
                    type="button"
                    className={`chip ${formData.propertyPlan === 'READY' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, propertyPlan: 'READY' })}
                  >
                    Ready
                  </button>
                  <button
                    type="button"
                    className={`chip ${formData.propertyPlan === 'OFF_PLAN' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, propertyPlan: 'OFF_PLAN' })}
                  >
                    Off-Plan
                  </button>
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label>Property Type</label>
                {availableTypes.length > 0 ? (
                  <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {availableTypes.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        className={`chip ${formData.propertyType === t.key ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, propertyType: t.key })}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="faint" style={{ fontSize: '12.5px', margin: '4px 0' }}>
                    Select purpose (Buy / Rent) and category (Residential / Commercial) above to view property types.
                  </p>
                )}
              </div>

              {/* Listing Title */}
              <div>
                <label>Listing Title (English) <span style={{ color: 'var(--cmp-danger)' }}>*</span></label>
                <input
                  placeholder="e.g. Upgraded 2 bed with full marina view in Marina Gate"
                  value={formData.propertyTitle}
                  onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
                  maxLength={120}
                />
                <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                  {formData.propertyTitle.length}/120 characters. Lead with key selling features.
                </p>
              </div>

              {/* Title Arabic (optional) */}
              <div>
                <label>Listing Title (Arabic - Optional)</label>
                <input
                  dir="rtl"
                  placeholder="عنوان الإعلان بالعربية..."
                  value={formData.propertyTitleAr}
                  onChange={(e) => setFormData({ ...formData, propertyTitleAr: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label>Property Description</label>
                <textarea
                  rows={5}
                  placeholder="Describe the layout, views, upgraded features, condition, and community amenities..."
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
                Step 2: Location & Building
              </h2>

              <div>
                <label>Location / Community / Building <span style={{ color: 'var(--cmp-danger)' }}>*</span></label>
                <GooglePlacesLocationInput
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
                    placeholder="e.g. 25.0805"
                    value={formData.propertyLatitude}
                    onChange={(e) => setFormData({ ...formData, propertyLatitude: e.target.value })}
                  />
                </div>
                <div>
                  <label>Longitude Coordinates</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 55.1403"
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
                Step 3: Property Details
              </h2>

              {/* Bedrooms & Bathrooms - only shown when not forbidden */}
              {(getFieldRule('propertyBedrooms') !== 'forbidden' || getFieldRule('propertyBathrooms') !== 'forbidden') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {getFieldRule('propertyBedrooms') !== 'forbidden' && (
                    <div>
                      <label>
                        Bedrooms {getFieldRule('propertyBedrooms') === 'required' && <span style={{ color: 'var(--cmp-danger)' }}>*</span>}
                      </label>
                      <select
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
                  )}

                  {getFieldRule('propertyBathrooms') !== 'forbidden' && (
                    <div>
                      <label>
                        Bathrooms {getFieldRule('propertyBathrooms') === 'required' && <span style={{ color: 'var(--cmp-danger)' }}>*</span>}
                      </label>
                      <select
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
                  )}
                </div>
              )}

              {/* Area Size & Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label>
                    {getFieldRule('propertyBuiltUpArea') !== 'forbidden' ? 'Plot / Total Area Size' : 'Area Size'}{' '}
                    <span style={{ color: 'var(--cmp-danger)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1420"
                    value={formData.propertyArea}
                    onChange={(e) => setFormData({ ...formData, propertyArea: e.target.value })}
                  />
                  {getFieldRule('propertyBuiltUpArea') !== 'forbidden' && (
                    <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                      Plot / land area size for this property.
                    </p>
                  )}
                </div>
                <div>
                  <label>Unit</label>
                  <select
                    value={formData.propertyAreaUnit}
                    onChange={(e) => setFormData({ ...formData, propertyAreaUnit: e.target.value })}
                  >
                    <option value="sqft">sqft</option>
                    <option value="sqm">sqm</option>
                  </select>
                </div>
              </div>

              {/* Built-Up Area (BUA) - rendered when required or optional for the selected property type */}
              {getFieldRule('propertyBuiltUpArea') !== 'forbidden' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                  <div>
                    <label>
                      Built-Up Area (BUA){' '}
                      {getFieldRule('propertyBuiltUpArea') === 'required' ? (
                        <span style={{ color: 'var(--cmp-danger)' }}>*</span>
                      ) : (
                        <span className="faint" style={{ fontSize: '12px', fontWeight: 'normal' }}>(Optional)</span>
                      )}
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 3400"
                      value={formData.propertyBuiltUpArea}
                      onChange={(e) => setFormData({ ...formData, propertyBuiltUpArea: e.target.value })}
                    />
                    <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                      Total built-up area across all floors and structures.
                    </p>
                  </div>
                  <div>
                    <label>Unit</label>
                    <input
                      disabled
                      value={formData.propertyAreaUnit || 'sqft'}
                      style={{ background: 'var(--cmp-surface-sunken)', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {getFieldRule('unitNumber') !== 'forbidden' && (
                  <div>
                    <label>
                      Unit Number (Confidential){' '}
                      {getFieldRule('unitNumber') === 'required' && <span style={{ color: 'var(--cmp-danger)' }}>*</span>}
                    </label>
                    <input
                      placeholder="e.g. 2104"
                      value={formData.unitNumber}
                      onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    />
                    <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                      Never displayed publicly to buyers.
                    </p>
                  </div>
                )}

                <div>
                  <label>Parking Spaces</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={formData.parkingSpaces}
                    onChange={(e) => setFormData({ ...formData, parkingSpaces: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {getFieldRule('furnishingStatus') !== 'forbidden' && (
                  <div>
                    <label>
                      Furnishing Status{' '}
                      {getFieldRule('furnishingStatus') === 'required' && <span style={{ color: 'var(--cmp-danger)' }}>*</span>}
                    </label>
                    <select
                      value={formData.furnishingStatus}
                      onChange={(e) => setFormData({ ...formData, furnishingStatus: e.target.value })}
                    >
                      <option value="SEMI">Semi-Furnished</option>
                      <option value="FULL">Fully Furnished</option>
                      <option value="NOT_FURNISHED">Unfurnished</option>
                    </select>
                  </div>
                )}

                <div>
                  <label>Availability</label>
                  <select
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
                <label>Internal Reference Number (Optional)</label>
                <input
                  placeholder="e.g. MG-2104"
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
                Step 4: Amenities
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
                Select all features and facilities available for this {formData.propertyCategory.toLowerCase()} property.
              </p>

              <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                {availableAmenities.map((am) => {
                  const isActive = formData.propertyAmenities.includes(am);
                  return (
                    <button
                      key={am}
                      type="button"
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

          {/* STEP 5: Price & Terms */}
          {currentStep === 5 && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Step 5: Price & Compliance
              </h2>

              <div>
                <label>Asking Price (AED) <span style={{ color: 'var(--cmp-danger)' }}>*</span></label>
                <input
                  type="number"
                  placeholder="e.g. 2850000"
                  value={formData.propertyPrice}
                  onChange={(e) => setFormData({ ...formData, propertyPrice: e.target.value })}
                />
              </div>

              {formData.listingPurpose === 'RENT' && (
                <div>
                  <label>Rental Payment Period</label>
                  <select
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
                <label>Dubai Land Department (DLD) / Trakheesi Permit Number</label>
                <input
                  placeholder="e.g. 7134567890"
                  value={formData.permitNumber}
                  onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                />
                <p className="faint" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                  Mandatory for advertising under RERA / DLD Trakheesi regulations.
                </p>
              </div>
            </div>
          )}

          {/* STEP 6: Photos & Documents */}
          {currentStep === 6 && (
            <div style={{ display: 'grid', gap: '22px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Step 6: Photos & Compliance Documents
              </h2>

              {/* Photos Upload Section */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Property Photos ({formData.propertyImages.length} uploaded)</span>
                  <span className="faint" style={{ fontSize: '12px' }}>Min 8, Max 25 photos</span>
                </label>

                {/* Upload Trigger Area */}
                <label
                  style={{
                    display: 'block',
                    padding: '36px 20px',
                    border: '2px dashed var(--cmp-border)',
                    borderRadius: '12px',
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
                      <Loader2 size={24} className="spin" style={{ color: 'var(--cmp-brand)' }} />
                      <span style={{ fontWeight: 600 }}>Uploading photos to secure Cloudinary storage...</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={32} style={{ color: 'var(--cmp-brand)', margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>Click to upload property photos</p>
                      <span className="faint" style={{ fontSize: '12px' }}>JPG, PNG or WebP up to 5MB each. First photo is cover.</span>
                    </>
                  )}
                </label>

                {/* Photos Grid */}
                {formData.propertyImages.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '10px',
                      marginTop: '14px'
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
                          background: 'var(--cmp-surface-sunken)',
                          border: idx === 0 ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)'
                        }}
                      >
                        <img
                          src={img.url}
                          alt={`Uploaded photo ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
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
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#FFF',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents Section */}
              <div>
                <label>Compliance Documents (Form A, Title Deed, Passports)</label>
                <div style={{ display: 'grid', gap: '10px', marginTop: '6px' }}>
                  {[
                    { key: 'contractA', label: 'Form A (Listing Agreement)', required: true },
                    { key: 'propertyTitleDeed', label: 'Property Title Deed', required: true },
                    { key: 'propertyTrakheesi', label: 'Trakheesi Permit Certificate', required: false },
                    { key: 'passportDocument', label: 'Owner Passport / Emirates ID', required: true },
                    { key: 'propertyEid_Visa', label: 'Emirates ID / Visa Copy', required: false },
                    { key: 'propertyFloorPlan', label: 'Floor Plan', required: false }
                  ].map((doc) => {
                    const uploadedDoc = formData.documents[doc.key];
                    const isDocUploading = uploadingDocKey === doc.key;

                    return (
                      <div
                        key={doc.key}
                        className="card"
                        style={{
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: uploadedDoc ? 'var(--cmp-surface)' : 'var(--cmp-surface-sunken)'
                        }}
                      >
                        <div className="row" style={{ gap: '10px' }}>
                          <FileText size={18} style={{ color: uploadedDoc ? 'var(--cmp-brand)' : 'var(--cmp-text-faint)' }} />
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 600 }}>
                              {doc.label} {doc.required && <span style={{ color: 'var(--cmp-danger)' }}>*</span>}
                            </div>
                            {uploadedDoc ? (
                              <a
                                href={uploadedDoc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="row"
                                style={{ gap: '4px', fontSize: '12px', color: 'var(--cmp-brand)', textDecoration: 'underline' }}
                              >
                                <span>{uploadedDoc.fileName || 'View uploaded document'}</span>
                                <ExternalLink size={11} />
                              </a>
                            ) : (
                              <span className="faint" style={{ fontSize: '12px' }}>Not uploaded yet</span>
                            )}
                          </div>
                        </div>

                        <div>
                          {uploadedDoc ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--cmp-danger)', padding: '4px 8px' }}
                              onClick={() => handleRemoveDoc(doc.key)}
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <label className="btn btn-outline btn-sm" style={{ cursor: isDocUploading ? 'wait' : 'pointer', margin: 0 }}>
                              <input
                                type="file"
                                accept=".pdf,image/jpeg,image/png"
                                style={{ display: 'none' }}
                                disabled={isDocUploading}
                                onChange={(e) => handleDocUpload(doc.key, e)}
                              />
                              {isDocUploading ? (
                                <Loader2 size={13} className="spin" />
                              ) : (
                                <Upload size={13} />
                              )}
                              <span>Upload</span>
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

          {/* STEP 7: Review and Publish */}
          {currentStep === 7 && (
            <div style={{ display: 'grid', gap: '20px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '12px', margin: 0 }}>
                Step 7: Review & Compliance Validation
              </h2>

              {/* Submit Issues (Blocking list) */}
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
                    <span>Please fix the following issues before submitting:</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '6px', fontSize: '13px', color: 'var(--cmp-danger)' }}>
                    {submitIssues.map((issue, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{issue.message}</span>
                        {issue.step && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px 8px', fontSize: '12px', height: '24px', color: 'var(--cmp-danger)', textDecoration: 'underline' }}
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
                    <strong style={{ fontSize: '14px', color: 'var(--cmp-brand)' }}>Ready for submission!</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--cmp-text-muted)' }}>
                      All required fields, photos, and compliance documents are satisfied.
                    </p>
                  </div>
                </div>
              )}

              {/* Property Summary Card */}
              <div className="card" style={{ padding: '18px', background: 'var(--cmp-surface-sunken)', display: 'grid', gap: '10px' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="badge badge-brand">{formData.listingPurpose} · {formData.propertyCategory}</span>
                  <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--cmp-brand)' }}>
                    AED {Number(formData.propertyPrice || 0).toLocaleString()}
                  </span>
                </div>
                <strong style={{ fontSize: '16px' }}>{formData.propertyTitle || 'Untitled Property'}</strong>
                <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
                  {formData.propertyLocation}
                  {formData.propertyBedrooms && getFieldRule('propertyBedrooms') !== 'forbidden' ? ` · ${formData.propertyBedrooms === '0' ? 'Studio' : `${formData.propertyBedrooms} Beds`}` : ''}
                  {formData.propertyArea ? ` · Area: ${formData.propertyArea} ${formData.propertyAreaUnit}` : ''}
                  {formData.propertyBuiltUpArea && getFieldRule('propertyBuiltUpArea') !== 'forbidden' ? ` · BUA: ${formData.propertyBuiltUpArea} ${formData.propertyAreaUnit}` : ''}
                </p>
                <div className="row" style={{ gap: '8px', fontSize: '12.5px', color: 'var(--cmp-text-muted)' }}>
                  <span>Permit: {formData.permitNumber || 'None'}</span>
                  <span>·</span>
                  <span>Photos: {formData.propertyImages.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons Footer */}
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
              disabled={currentStep === 1 || isStepSaving}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={isStepSaving}
                onClick={handleContinue}
              >
                {isStepSaving ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Saving step...</span>
                  </>
                ) : (
                  <>
                    <span>Save & Continue</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-accent"
                disabled={isSubmitting || (submitIssues.length > 0 && isLiveData)}
                onClick={handleFinalSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Submit for approval</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
