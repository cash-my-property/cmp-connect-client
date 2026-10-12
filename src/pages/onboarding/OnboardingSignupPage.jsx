import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { cmpConnectApi } from '../../services/cmpConnectApi';

// UAE Phone Number Validation Regex
// Matches: +971 50 412 7781, 050 412 7781, 00971504127781, 504127781, landlines 04, 02 etc.
const UAE_PHONE_REGEX = /^(?:\+971|00971|971|0)?(?:50|52|54|55|56|58|2|3|4|6|7|9)\d{7}$/;

// Standard email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUaePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return UAE_PHONE_REGEX.test(cleaned);
}

// UAE Phone Formatter for clean input display
function formatUaePhoneDisplay(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.replace(/[\s-]/g, '');
  if (!cleaned) return phone;
  let digits = cleaned;
  if (digits.startsWith('+971')) digits = digits.slice(4);
  else if (digits.startsWith('00971')) digits = digits.slice(5);
  else if (digits.startsWith('971')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.length === 8 || digits.length === 9) {
    const prefix = digits.slice(0, 2);
    if (['50', '52', '54', '55', '56', '58'].includes(prefix)) {
      return `+971 ${prefix} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    } else {
      const area = digits.slice(0, 1);
      return `+971 ${area} ${digits.slice(1, 4)} ${digits.slice(4)}`;
    }
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
}

// Calculate Trade Licence Status based on expiryDate vs Date.now()
// > 30 days -> 'Active', <= 30 days & >= 0 -> 'Expires soon', < 0 days -> 'Expired'
function calculateTradeLicenceStatus(expiryDateStr) {
  if (!expiryDateStr || typeof expiryDateStr !== 'string') return 'Active';

  try {
    const cleanStr = expiryDateStr.trim().split('T')[0];
    const parts = cleanStr.split(/[-/]/);
    let expiryDate;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        expiryDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        expiryDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else {
        expiryDate = new Date(cleanStr);
      }
    } else {
      expiryDate = new Date(cleanStr);
    }

    if (isNaN(expiryDate.getTime())) return 'Active';

    const now = new Date();
    const nowStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const expiryStartOfDay = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate()).getTime();

    const diffDays = Math.round((expiryStartOfDay - nowStartOfDay) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays <= 30) {
      return 'Expires soon';
    } else {
      return 'Active';
    }
  } catch (err) {
    return 'Active';
  }
}

// UAE Date/Time Formatter (Asia/Dubai)
function formatUaeDateTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
    const clean = formatted.replace(' at ', ', ');
    return `Link valid until ${clean} (Asia/Dubai)`;
  } catch (err) {
    return `Link valid until ${isoString} (Asia/Dubai)`;
  }
}

// Form validation helper matching backend Joi constraints
function validateForm(formData, accountType) {
  const errors = {};

  // Contact person
  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required.';
  } else if (formData.firstName.trim().length < 2 || formData.firstName.trim().length > 80) {
    errors.firstName = 'First name must be 2 to 80 characters.';
  }

  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  } else if (formData.lastName.trim().length < 2 || formData.lastName.trim().length > 80) {
    errors.lastName = 'Last name must be 2 to 80 characters.';
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(formData.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!formData.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!isValidUaePhone(formData.phone)) {
    errors.phone = 'Please provide a valid UAE phone number (e.g., +971501234567)';
  }

  // Company / Developer details
  const compLabel = accountType === 'DEVELOPER' ? 'Developer' : 'Company';
  if (!formData.companyName.trim()) {
    errors.companyName = `${compLabel} name is required.`;
  } else if (formData.companyName.trim().length < 2 || formData.companyName.trim().length > 150) {
    errors.companyName = `${compLabel} name must be 2 to 150 characters.`;
  }

  if (!formData.emirate) {
    errors.emirate = 'Emirate is required.';
  }

  if (!formData.tradeLicenceNumber.trim()) {
    errors.tradeLicenceNumber = 'Trade licence number is required.';
  } else if (formData.tradeLicenceNumber.trim().length < 1 || formData.tradeLicenceNumber.trim().length > 50) {
    errors.tradeLicenceNumber = 'Trade licence number must be 1 to 50 characters.';
  }

  if (formData.trnNumber && formData.trnNumber.trim().length > 30) {
    errors.trnNumber = 'TRN number cannot exceed 30 characters.';
  }

  if (!formData.officeAddress.trim()) {
    errors.officeAddress = accountType === 'DEVELOPER' ? 'Head office address is required.' : 'Office address is required.';
  } else if (formData.officeAddress.trim().length < 3 || formData.officeAddress.trim().length > 300) {
    errors.officeAddress = 'Address must be 3 to 300 characters.';
  }

  if (!formData.officialEmail.trim()) {
    errors.officialEmail = 'Official company email is required.';
  } else if (!EMAIL_REGEX.test(formData.officialEmail.trim())) {
    errors.officialEmail = 'Please enter a valid company email address.';
  }

  if (!formData.officialPhone.trim()) {
    errors.officialPhone = 'Official company phone is required.';
  } else if (!isValidUaePhone(formData.officialPhone)) {
    errors.officialPhone = 'Please provide a valid UAE phone/landline number.';
  }

  if (formData.website && formData.website.trim().length > 200) {
    errors.website = 'Website URL cannot exceed 200 characters.';
  }

  // Agency specific
  if (accountType === 'AGENCY') {
    if (!formData.companyType) {
      errors.companyType = 'Company type is required.';
    }
    if (!formData.tradeLicenceStatus) {
      errors.tradeLicenceStatus = 'Trade licence status is required.';
    }
    if (!formData.orn.trim()) {
      errors.orn = 'RERA ORN number is required.';
    } else if (formData.orn.trim().length < 1 || formData.orn.trim().length > 50) {
      errors.orn = 'RERA ORN number must be 1 to 50 characters.';
    }
    if (!formData.numberOfAgents) {
      errors.numberOfAgents = 'Number of agents is required.';
    }
  }

  // Developer specific
  if (accountType === 'DEVELOPER') {
    if (!formData.developerType) {
      errors.developerType = 'Developer type is required.';
    }

    // firstProject object validation
    const proj = formData.firstProject || {};
    if (!proj.name?.trim() || proj.name.trim().length < 2 || proj.name.trim().length > 150) {
      errors['firstProject.name'] = 'Project name must be 2 to 150 characters.';
    }
    if (!proj.community?.trim() || proj.community.trim().length < 2 || proj.community.trim().length > 150) {
      errors['firstProject.community'] = 'Community must be 2 to 150 characters.';
    }
    if (!proj.reraProjectNumber?.trim() || proj.reraProjectNumber.trim().length < 1 || proj.reraProjectNumber.trim().length > 50) {
      errors['firstProject.reraProjectNumber'] = 'RERA project number is required (1 to 50 characters).';
    }
    const unitsNum = parseInt(proj.units, 10);
    if (!proj.units || isNaN(unitsNum) || unitsNum < 1) {
      errors['firstProject.units'] = 'Units must be an integer of 1 or more.';
    }
    if (!proj.expectedHandover?.trim() || proj.expectedHandover.trim().length < 2 || proj.expectedHandover.trim().length > 30) {
      errors['firstProject.expectedHandover'] = 'Expected handover is required (e.g. Q4 2028).';
    }
    if (!proj.escrowBank?.trim() || proj.escrowBank.trim().length < 2 || proj.escrowBank.trim().length > 100) {
      errors['firstProject.escrowBank'] = 'Escrow bank is required (2 to 100 characters).';
    }
    if (!proj.escrowAccountNumber?.trim() || proj.escrowAccountNumber.trim().length < 4 || proj.escrowAccountNumber.trim().length > 50) {
      errors['firstProject.escrowAccountNumber'] = 'Escrow account number is required (4 to 50 characters).';
    }
  }

  // Signatory
  if (!formData.signatoryFullName.trim()) {
    errors.signatoryFullName = 'Signatory full name is required.';
  } else if (formData.signatoryFullName.trim().length < 2 || formData.signatoryFullName.trim().length > 80) {
    errors.signatoryFullName = 'Signatory full name must be 2 to 80 characters.';
  }

  if (!formData.signatoryDesignation.trim()) {
    errors.signatoryDesignation = 'Signatory position is required.';
  } else if (formData.signatoryDesignation.trim().length < 2 || formData.signatoryDesignation.trim().length > 80) {
    errors.signatoryDesignation = 'Signatory position must be 2 to 80 characters.';
  }

  // Owner
  if (!formData.ownerFullName.trim()) {
    errors.ownerFullName = 'Owner full name is required.';
  } else if (formData.ownerFullName.trim().length < 2 || formData.ownerFullName.trim().length > 80) {
    errors.ownerFullName = 'Owner full name must be 2 to 80 characters.';
  }

  if (!formData.ownerEmail.trim()) {
    errors.ownerEmail = 'Owner email is required.';
  } else if (!EMAIL_REGEX.test(formData.ownerEmail.trim())) {
    errors.ownerEmail = 'Please enter a valid email address.';
  }

  if (!formData.ownerMobile.trim()) {
    errors.ownerMobile = 'Owner mobile is required.';
  } else if (!isValidUaePhone(formData.ownerMobile)) {
    errors.ownerMobile = 'Please provide a valid UAE phone number (e.g., +971501234567)';
  }

  // Admin
  if (!formData.adminFullName.trim()) {
    errors.adminFullName = 'Admin full name is required.';
  } else if (formData.adminFullName.trim().length < 2 || formData.adminFullName.trim().length > 80) {
    errors.adminFullName = 'Admin full name must be 2 to 80 characters.';
  }

  if (!formData.adminEmail.trim()) {
    errors.adminEmail = 'Admin email is required.';
  } else if (!EMAIL_REGEX.test(formData.adminEmail.trim())) {
    errors.adminEmail = 'Please enter a valid email address.';
  }

  if (!formData.adminMobile.trim()) {
    errors.adminMobile = 'Admin mobile is required.';
  } else if (!isValidUaePhone(formData.adminMobile)) {
    errors.adminMobile = 'Please provide a valid UAE phone number (e.g., +971501234567)';
  }

  return errors;
}

export default function OnboardingSignupPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'developer' ? 'DEVELOPER' : 'AGENCY';

  // 1. "Registering as" toggle: Real estate company (AGENCY) / Developer (DEVELOPER)
  const [accountType, setAccountType] = useState(initialType);

  // 2. Form state with all details
  const [formData, setFormData] = useState({
    // Contact person
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Company / Developer
    companyName: '',
    emirate: 'Dubai',
    tradeLicenceNumber: '',
    trnNumber: '',
    officeAddress: '',
    officialEmail: '',
    officialPhone: '',
    website: '',
    // Agency only
    companyType: 'Real estate brokerage',
    tradeLicenceStatus: 'Active',
    orn: '',
    numberOfAgents: '1 to 5',
    // Developer only
    developerType: 'Master developer',
    firstProject: {
      name: '',
      community: '',
      reraProjectNumber: '',
      units: '',
      expectedHandover: '',
      escrowBank: '',
      escrowAccountNumber: ''
    },
    // Signatory
    signatoryFullName: '',
    signatoryDesignation: '',
    signatoryIsOwner: true,
    // Owner
    ownerFullName: '',
    ownerEmail: '',
    ownerMobile: '',
    // Admin
    adminFullName: '',
    adminEmail: '',
    adminMobile: '',
    // DLD pre-fill metadata (editable)
    expiryDate: '',
    issueDate: '',
    companyLogo: ''
  });

  // 3. User interaction tracking
  const [touched, setTouched] = useState({});

  // Flag indicating if details were pre-filled from official DLD/RERA records
  const [autofilledFromDld, setAutofilledFromDld] = useState(false);

  // 4. Pre-check states
  const [agencyPrecheck, setAgencyPrecheck] = useState({
    loading: false,
    checkedOrn: '',
    result: null, // { canSubmit, whitelisted, registeredOnApp, message }
    error: null
  });

  const [devPrecheck, setDevPrecheck] = useState({
    loading: false,
    checkedKey: '', // `${companyName}:::${email}`
    result: null, // { canSubmit, message }
    error: null
  });

  // 5. Backend response errors
  const [backendErrors, setBackendErrors] = useState({
    orn: '',
    companyName: '',
    general: '',
    network: false
  });

  // 6. Submission status & rate limit timer
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  // 7. Success state (HTTP 201)
  const [successData, setSuccessData] = useState(null);

  // Timers & refs for debouncing and rate limiting
  const agencyDebounceRef = useRef(null);
  const devDebounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (agencyDebounceRef.current) clearTimeout(agencyDebounceRef.current);
      if (devDebounceRef.current) clearTimeout(devDebounceRef.current);
    };
  }, []);

  // 429 countdown ticker
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const interval = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setBackendErrors((b) => ({ ...b, general: '' }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitCountdown]);

  // Handle Account Type Change & Prune Other Type's Fields
  const handleAccountTypeChange = (newType) => {
    if (newType === accountType) return;
    setAccountType(newType);

    // Clear backend error states & autofill flag
    setBackendErrors({ orn: '', companyName: '', general: '', network: false });
    setAutofilledFromDld(false);

    // Reset pre-checks
    setAgencyPrecheck({ loading: false, checkedOrn: '', result: null, error: null });
    setDevPrecheck({ loading: false, checkedKey: '', result: null, error: null });

    // When switching, reset other type's specific values
    if (newType === 'DEVELOPER') {
      setFormData((prev) => ({
        ...prev,
        orn: '',
        companyType: 'Real estate brokerage',
        tradeLicenceStatus: 'Valid and active',
        numberOfAgents: '1 to 5',
        developerType: prev.developerType || 'Master developer'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        developerType: 'Master developer',
        firstProject: {
          name: '',
          community: '',
          reraProjectNumber: '',
          units: '',
          expectedHandover: '',
          escrowBank: '',
          escrowAccountNumber: ''
        }
      }));
    }
  };

  // -------------------------------------------------------------
  // AGENCY Pre-check: debounced 400ms on ORN change & on blur
  // Auto-fills form when official DLD / RERA company data is returned
  // -------------------------------------------------------------
  const runAgencyCheck = async (ornVal) => {
    const trimmed = (ornVal || '').trim();
    if (!trimmed) {
      setAgencyPrecheck({ loading: false, checkedOrn: '', result: null, error: null });
      setAutofilledFromDld(false);
      return;
    }

    setAgencyPrecheck((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await cmpConnectApi.checkExistence({
        type: 'AGENCY',
        orn: trimmed
      });

      const data = res?.data || res;
      setAgencyPrecheck({
        loading: false,
        checkedOrn: trimmed,
        result: data || null,
        error: null
      });

      // 🔍 AUTO-FILL FROM DLD COMPANY DATA (if available)
      const company = data?.company || res?.company || null;
      if (company) {
        setAutofilledFromDld(true);
        setFormData((prev) => {
          const updated = { ...prev };

          // ONLY autofill official company details
          if (company.companyName) updated.companyName = company.companyName;
          if (company.tradeLicenceNumber) updated.tradeLicenceNumber = String(company.tradeLicenceNumber);
          if (company.expiryDate) {
            updated.expiryDate = company.expiryDate;
            updated.tradeLicenceStatus = calculateTradeLicenceStatus(company.expiryDate);
          } else if (company.tradeLicenceStatus) {
            updated.tradeLicenceStatus = company.tradeLicenceStatus;
          }
          if (company.companyType) updated.companyType = company.companyType;
          if (company.officialPhone) updated.officialPhone = formatUaePhoneDisplay(company.officialPhone);
          if (company.officialEmail) updated.officialEmail = company.officialEmail;
          if (company.issueDate) updated.issueDate = company.issueDate;
          if (company.companyLogo) updated.companyLogo = company.companyLogo;
          if (company.activities) updated.activities = company.activities;

          // Contact Person, Signatory, Owner & Admin are filled manually by the user
          return updated;
        });
      }
    } catch (err) {
      const msg = err.message || 'Error checking ORN';
      if (err.status === 429) {
        setAgencyPrecheck({
          loading: false,
          checkedOrn: trimmed,
          result: { canSubmit: false, message: 'Too many checks. Please wait a minute before trying again.' },
          error: 'Too many checks. Please wait a minute before trying again.'
        });
      } else {
        setAgencyPrecheck({
          loading: false,
          checkedOrn: trimmed,
          result: { canSubmit: false, message: msg },
          error: msg
        });
      }
    }
  };

  const handleOrnChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, orn: val }));

    setBackendErrors((prev) => ({ ...prev, orn: '' }));
    setAgencyPrecheck({ loading: false, checkedOrn: '', result: null, error: null });
    setAutofilledFromDld(false);

    if (agencyDebounceRef.current) clearTimeout(agencyDebounceRef.current);
    if (val.trim()) {
      agencyDebounceRef.current = setTimeout(() => {
        runAgencyCheck(val);
      }, 400);
    }
  };

  const handleOrnBlur = () => {
    setTouched((prev) => ({ ...prev, orn: true }));
    if (agencyDebounceRef.current) clearTimeout(agencyDebounceRef.current);
    if (formData.orn.trim()) {
      runAgencyCheck(formData.orn);
    }
  };

  // -------------------------------------------------------------
  // DEVELOPER Pre-check: once both name & email are filled
  // -------------------------------------------------------------
  const runDeveloperCheck = async (nameVal, emailVal) => {
    const trimmedName = (nameVal || '').trim();
    const trimmedEmail = (emailVal || '').trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setDevPrecheck({ loading: false, checkedKey: '', result: null, error: null });
      return;
    }

    const key = `${trimmedName}:::${trimmedEmail}`;
    setDevPrecheck((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await cmpConnectApi.checkExistence({
        type: 'DEVELOPER',
        companyName: trimmedName,
        email: trimmedEmail
      });

      setDevPrecheck({
        loading: false,
        checkedKey: key,
        result: res?.data || null,
        error: null
      });
    } catch (err) {
      const msg = err.message || 'Error checking developer';
      setDevPrecheck({
        loading: false,
        checkedKey: key,
        result: { canSubmit: false, message: msg },
        error: msg
      });
    }
  };

  const handleDevNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, companyName: val }));

    setBackendErrors((prev) => ({ ...prev, companyName: '' }));
    setDevPrecheck({ loading: false, checkedKey: '', result: null, error: null });

    if (devDebounceRef.current) clearTimeout(devDebounceRef.current);
    if (val.trim() && formData.email.trim()) {
      devDebounceRef.current = setTimeout(() => {
        runDeveloperCheck(val, formData.email);
      }, 400);
    }
  };

  const handleDevNameBlur = () => {
    setTouched((prev) => ({ ...prev, companyName: true }));
    if (devDebounceRef.current) clearTimeout(devDebounceRef.current);
    if (formData.companyName.trim() && formData.email.trim()) {
      runDeveloperCheck(formData.companyName, formData.email);
    }
  };

  const handleContactEmailChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, email: val }));

    if (accountType === 'DEVELOPER') {
      setBackendErrors((prev) => ({ ...prev, companyName: '' }));
      setDevPrecheck({ loading: false, checkedKey: '', result: null, error: null });

      if (devDebounceRef.current) clearTimeout(devDebounceRef.current);
      if (formData.companyName.trim() && val.trim()) {
        devDebounceRef.current = setTimeout(() => {
          runDeveloperCheck(formData.companyName, val);
        }, 400);
      }
    }
  };

  const handleContactEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    if (accountType === 'DEVELOPER') {
      if (devDebounceRef.current) clearTimeout(devDebounceRef.current);
      if (formData.companyName.trim() && formData.email.trim()) {
        runDeveloperCheck(formData.companyName, formData.email);
      }
    }
  };

  // General field handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('firstProject.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        firstProject: {
          ...prev.firstProject,
          [field]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'expiryDate') {
      const calculatedStatus = calculateTradeLicenceStatus(value);
      setFormData((prev) => ({
        ...prev,
        expiryDate: value,
        tradeLicenceStatus: calculatedStatus
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Validation state
  const formErrors = useMemo(() => {
    return validateForm(formData, accountType);
  }, [formData, accountType]);

  // RULE: Submit is enabled ONLY when canSubmit === true
  const canSubmitFromPrecheck = useMemo(() => {
    if (accountType === 'AGENCY') {
      if (!formData.orn.trim()) return false;
      return agencyPrecheck.result?.canSubmit === true;
    } else {
      if (!formData.companyName.trim() || !formData.email.trim()) return false;
      return devPrecheck.result?.canSubmit === true;
    }
  }, [accountType, formData.orn, formData.companyName, formData.email, agencyPrecheck.result, devPrecheck.result]);

  const isFormValid = Object.keys(formErrors).length === 0;

  // -------------------------------------------------------------
  // Form Submission
  // -------------------------------------------------------------
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach((k) => {
      allTouched[k] = true;
    });
    if (accountType === 'DEVELOPER') {
      ['name', 'community', 'reraProjectNumber', 'units', 'expectedHandover', 'escrowBank', 'escrowAccountNumber'].forEach((f) => {
        allTouched[`firstProject.${f}`] = true;
      });
    }
    setTouched(allTouched);

    const currentErrors = validateForm(formData, accountType);
    if (Object.keys(currentErrors).length > 0) {
      return;
    }

    if (!canSubmitFromPrecheck || isSubmitting || rateLimitCountdown > 0) {
      return;
    }

    setIsSubmitting(true);
    setBackendErrors({ orn: '', companyName: '', general: '', network: false });

    // Send only the selected type's fields (remove other type's fields to avoid 400)
    let payload;
    if (accountType === 'AGENCY') {
      payload = {
        type: 'AGENCY',
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim().replace(/[\s-]/g, ''),
        companyName: formData.companyName.trim(),
        companyType: formData.companyType,
        emirate: formData.emirate,
        tradeLicenceStatus: (() => {
          if (formData.tradeLicenceStatus === 'Active') return 'Valid and active';
          if (formData.tradeLicenceStatus === 'Expires soon' || formData.tradeLicenceStatus === 'Expired') return 'Under renewal';
          return formData.tradeLicenceStatus || 'Valid and active';
        })(),
        orn: formData.orn.trim(),
        tradeLicenceNumber: formData.tradeLicenceNumber.trim(),
        trnNumber: formData.trnNumber.trim(),
        numberOfAgents: formData.numberOfAgents,
        officeAddress: formData.officeAddress.trim(),
        officialEmail: formData.officialEmail.trim().toLowerCase(),
        officialPhone: formData.officialPhone.trim().replace(/[\s-]/g, ''),
        website: formData.website.trim(),
        signatoryFullName: formData.signatoryFullName.trim(),
        signatoryDesignation: formData.signatoryDesignation.trim(),
        signatoryIsOwner: Boolean(formData.signatoryIsOwner),
        ownerFullName: formData.ownerFullName.trim(),
        ownerEmail: formData.ownerEmail.trim().toLowerCase(),
        ownerMobile: formData.ownerMobile.trim().replace(/[\s-]/g, ''),
        adminFullName: formData.adminFullName.trim(),
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminMobile: formData.adminMobile.trim().replace(/[\s-]/g, '')
      };
    } else {
      payload = {
        type: 'DEVELOPER',
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim().replace(/[\s-]/g, ''),
        companyName: formData.companyName.trim(),
        developerType: formData.developerType,
        emirate: formData.emirate,
        tradeLicenceNumber: formData.tradeLicenceNumber.trim(),
        trnNumber: formData.trnNumber.trim(),
        officeAddress: formData.officeAddress.trim(),
        officialEmail: formData.officialEmail.trim().toLowerCase(),
        officialPhone: formData.officialPhone.trim().replace(/[\s-]/g, ''),
        website: formData.website.trim(),
        firstProject: {
          name: formData.firstProject.name.trim(),
          community: formData.firstProject.community.trim(),
          reraProjectNumber: formData.firstProject.reraProjectNumber.trim(),
          units: parseInt(formData.firstProject.units, 10),
          expectedHandover: formData.firstProject.expectedHandover.trim(),
          escrowBank: formData.firstProject.escrowBank.trim(),
          escrowAccountNumber: formData.firstProject.escrowAccountNumber.trim()
        },
        signatoryFullName: formData.signatoryFullName.trim(),
        signatoryDesignation: formData.signatoryDesignation.trim(),
        signatoryIsOwner: Boolean(formData.signatoryIsOwner),
        ownerFullName: formData.ownerFullName.trim(),
        ownerEmail: formData.ownerEmail.trim().toLowerCase(),
        ownerMobile: formData.ownerMobile.trim().replace(/[\s-]/g, ''),
        adminFullName: formData.adminFullName.trim(),
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminMobile: formData.adminMobile.trim().replace(/[\s-]/g, '')
      };
    }

    try {
      const response = await cmpConnectApi.register(payload);
      if (response?.status === 'success' && response?.data) {
        setSuccessData(response.data);
      } else {
        throw new Error(response?.message || 'Registration failed.');
      }
    } catch (err) {
      const status = err.status;
      const msg = err.message || 'An error occurred during registration.';

      if (status === 400) {
        setBackendErrors((prev) => ({ ...prev, general: msg }));
      } else if (status === 403) {
        setBackendErrors((prev) => ({ ...prev, orn: msg }));
        if (accountType === 'AGENCY') {
          setAgencyPrecheck((prev) => ({
            ...prev,
            result: { ...(prev.result || {}), canSubmit: false, message: msg }
          }));
        }
      } else if (status === 409) {
        if (accountType === 'AGENCY') {
          setBackendErrors((prev) => ({ ...prev, orn: msg }));
          setAgencyPrecheck((prev) => ({
            ...prev,
            result: { ...(prev.result || {}), canSubmit: false, message: msg }
          }));
        } else {
          setBackendErrors((prev) => ({ ...prev, companyName: msg }));
          setDevPrecheck((prev) => ({
            ...prev,
            result: { ...(prev.result || {}), canSubmit: false, message: msg }
          }));
        }
      } else if (status === 429) {
        setBackendErrors((prev) => ({
          ...prev,
          general: 'Please wait a minute and try again.'
        }));
        setRateLimitCountdown(60);
      } else {
        setBackendErrors((prev) => ({
          ...prev,
          general: msg || 'Unable to connect to the server. Please check your connection and retry.',
          network: true
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: SUCCESS SCREEN
  // -------------------------------------------------------------
  if (successData) {
    return (
      <OnboardingLayout
        title="CMP Connect"
        subtitle="Registration request submitted."
        points={[
          "Your request is with our verification team",
          "Upload link sent to your registered email",
          "Link is active for 3 days to complete document uploads",
          "Account login details issued upon verification"
        ]}
      >
        <div className="reg-card wide">
          <div className="success-mark" style={{ margin: '0 auto 20px', width: 64, height: 64 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <p className="eyebrow" style={{ textAlign: 'center' }}>Registration received</p>
          <h2 style={{ textAlign: 'center', fontSize: '26px', marginBottom: 12 }}>
            Your registration is in.
          </h2>

          <p className="sub" style={{ textAlign: 'center', fontSize: '15px', maxWidth: '580px', margin: '0 auto 24px' }}>
            We have emailed you a link to upload your documents. The link is valid for 3 days.
          </p>

          <div
            className="summary"
            style={{
              background: 'var(--cmp-surface-sunken)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--cmp-border)',
              margin: '24px 0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}
          >
            <div>
              <dt style={{ fontSize: '12px', color: 'var(--cmp-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration code</dt>
              <dd style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cmp-brand)', marginTop: 4 }}>
                {successData.code}
              </dd>
            </div>

            <div>
              <dt style={{ fontSize: '12px', color: 'var(--cmp-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sent to email</dt>
              <dd style={{ fontSize: '15px', fontWeight: 600, marginTop: 4, wordBreak: 'break-all' }}>
                {successData.email}
              </dd>
            </div>

            <div>
              <dt style={{ fontSize: '12px', color: 'var(--cmp-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Link expiry</dt>
              <dd style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cmp-text-muted)', marginTop: 4 }}>
                {formatUaeDateTime(successData.linkExpiresAt)}
              </dd>
            </div>
          </div>

          {successData.linkEmailStatus === 'FAILED' && (
            <div
              className="note"
              style={{
                background: 'color-mix(in srgb, var(--cmp-warning) 12%, transparent)',
                border: '1px solid var(--cmp-warning)',
                color: 'var(--cmp-warning)',
                marginBottom: 20
              }}
            >
              ⚠️ Your request is saved, but we could not send the email yet. Our team will send the link shortly.
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p className="faint" style={{ fontSize: '13px' }}>
              Didn't receive the email? Check your spam folder or contact support at{' '}
              <a href="mailto:info@cmpdubai.com" style={{ color: 'var(--cmp-brand)', textDecoration: 'underline' }}>
                info@cmpdubai.com
              </a>.
            </p>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // -------------------------------------------------------------
  // RENDER: REGISTRATION FORM
  // -------------------------------------------------------------
  return (
    <OnboardingLayout
      title="Join CMP Connect"
      subtitle="Public partner registration for real estate brokerages and property developers."
      points={[
        "Register your company or your developments",
        "Upload verification documents directly from your email link",
        "Transparent real-time RERA & compliance validation",
        "Go live on CMP Connect once verified by our team"
      ]}
    >
      <div className="reg-card wide">
        <div className="reg-card-header">
          <p className="eyebrow">CMP Connect</p>
          <h2>Registration form</h2>
          <p className="sub">
            Submit your company registration request. Once received, we will send an upload link to complete your verification documents.
          </p>

          {/* 1. Registering as Toggle */}
          <div className="type-grid">
            <button
              type="button"
              className="type-card"
              aria-pressed={accountType === 'AGENCY'}
              onClick={() => handleAccountTypeChange('AGENCY')}
            >
              <span className="type-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m14 10v-2a4 4 0 0 0-3-3.87" />
                </svg>
              </span>
              <strong>Real estate company</strong>
              <span className="muted">Brokerages and agencies marketing and selling property.</span>
              <span className="faint">Brokerage, agency, property management, holiday homes</span>
            </button>

            <button
              type="button"
              className="type-card"
              aria-pressed={accountType === 'DEVELOPER'}
              onClick={() => handleAccountTypeChange('DEVELOPER')}
            >
              <span className="type-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M4 21V10l8-6 8 6v11M9 21v-6h6v6" />
                </svg>
              </span>
              <strong>Developer</strong>
              <span className="muted">Developers building and selling their own projects.</span>
              <span className="faint">Master developer, sub developer</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="reg-card-form">
          {/* 2. Contact Person Section */}
          <section className="form-section">
            <h3>Contact person</h3>
            <p className="section-sub" style={{ fontSize: '13px', color: 'var(--cmp-text-muted)', marginBottom: 14 }}>
              The upload link and login details are sent here; this email becomes your login username.
            </p>
            <div className="form-grid">
              <div className="field half" data-invalid={touched.firstName && formErrors.firstName ? true : undefined}>
                <label htmlFor="reg-first-name">First name *</label>
                <input
                  id="reg-first-name"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.firstName && formErrors.firstName && (
                  <span className="error-text">{formErrors.firstName}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.lastName && formErrors.lastName ? true : undefined}>
                <label htmlFor="reg-last-name">Last name *</label>
                <input
                  id="reg-last-name"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.lastName && formErrors.lastName && (
                  <span className="error-text">{formErrors.lastName}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.email && formErrors.email ? true : undefined}>
                <label htmlFor="reg-contact-email">Email *</label>
                <input
                  id="reg-contact-email"
                  name="email"
                  type="email"
                  placeholder="name@company.ae"
                  value={formData.email}
                  onChange={handleContactEmailChange}
                  onBlur={handleContactEmailBlur}
                  required
                />
                <span className="hint">We send the upload link and login username here.</span>
                {touched.email && formErrors.email && (
                  <span className="error-text">{formErrors.email}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.phone && formErrors.phone ? true : undefined}>
                <label htmlFor="reg-contact-phone">Phone number *</label>
                <input
                  id="reg-contact-phone"
                  name="phone"
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                <span className="hint">UAE mobile number.</span>
                {touched.phone && formErrors.phone && (
                  <span className="error-text">{formErrors.phone}</span>
                )}
              </div>
            </div>
          </section>

          {/* 3. Company Section */}
          <section className="form-section">
            <h3>{accountType === 'AGENCY' ? 'Company details' : 'Developer details'}</h3>
            <div className="form-grid">
              <div className="field" data-invalid={touched.companyName && formErrors.companyName ? true : undefined}>
                <label htmlFor="reg-company-name">{accountType === 'DEVELOPER' ? 'Developer name *' : 'Company name *'}</label>
                <input
                  id="reg-company-name"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={accountType === 'DEVELOPER' ? handleDevNameChange : handleChange}
                  onBlur={accountType === 'DEVELOPER' ? handleDevNameBlur : handleBlur}
                  required
                />
                <span className="hint">As it appears on the official trade licence.</span>
                {touched.companyName && formErrors.companyName && (
                  <span className="error-text">{formErrors.companyName}</span>
                )}
                {backendErrors.companyName && (
                  <span className="error-text">{backendErrors.companyName}</span>
                )}
              </div>

              {/* AGENCY specific: ORN, Company Type, Licence Status, Number of Agents */}
              {accountType === 'AGENCY' && (
                <>
                  <div className="field half" data-invalid={(touched.orn && formErrors.orn) || backendErrors.orn ? true : undefined}>
                    <label htmlFor="reg-orn">RERA ORN number *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="reg-orn"
                        name="orn"
                        type="text"
                        placeholder="e.g. 28841"
                        value={formData.orn}
                        onChange={handleOrnChange}
                        onBlur={handleOrnBlur}
                        style={{ paddingRight: agencyPrecheck.loading ? 36 : undefined }}
                        required
                      />
                      {agencyPrecheck.loading && (
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--cmp-text-muted)' }}>
                          ⏳
                        </span>
                      )}
                    </div>

                    {/* Pre-check hints & badges for ORN */}
                    {agencyPrecheck.result && (
                      <div style={{ marginTop: 6 }}>
                        {agencyPrecheck.result.canSubmit && agencyPrecheck.result.whitelisted && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--cmp-success)' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            <span>Verified RERA ORN</span>
                          </div>
                        )}

                        {autofilledFromDld && (
                          <div
                            className="note"
                            style={{
                              background: 'var(--cmp-brand-subtle)',
                              border: '1px solid var(--cmp-brand-border)',
                              color: 'var(--cmp-brand)',
                              marginTop: 8,
                              fontSize: 12.5,
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              borderRadius: 8
                            }}
                          >
                            {formData.companyLogo && (
                              <img
                                src={formData.companyLogo}
                                alt="Company Logo"
                                style={{
                                  width: 38,
                                  height: 38,
                                  objectFit: 'contain',
                                  borderRadius: 6,
                                  background: '#fff',
                                  border: '1px solid var(--cmp-border)',
                                  padding: 2,
                                  flexShrink: 0
                                }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <div>
                              <strong>DLD records matched:</strong> Company details pre-filled below. All fields remain fully editable.
                              {formData.expiryDate && (
                                <span style={{ display: 'block', marginTop: 2, fontSize: 12, opacity: 0.9 }}>
                                  Licence valid until: {formData.expiryDate} ({formData.tradeLicenceStatus})
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {agencyPrecheck.result.canSubmit && agencyPrecheck.result.whitelisted === false && (
                          <div className="note" style={{ background: 'color-mix(in srgb, var(--cmp-warning) 10%, transparent)', border: '1px solid var(--cmp-warning)', color: 'var(--cmp-warning)', marginTop: 6, fontSize: 12.5, padding: '8px 12px' }}>
                            ⚠️ We could not find this ORN in the RERA list. You can still submit. Our team will verify it.
                          </div>
                        )}

                        {agencyPrecheck.result.registeredOnApp && (
                          <div className="note" style={{ background: 'var(--cmp-brand-subtle)', border: '1px solid var(--cmp-brand)', color: 'var(--cmp-brand)', marginTop: 6, fontSize: 12.5, padding: '8px 12px' }}>
                            ℹ️ This agency already uses the CMP app. Registering here adds your documents to the same account.
                          </div>
                        )}

                        {!agencyPrecheck.result.canSubmit && (
                          <div className="note" style={{ background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)', border: '1px solid var(--cmp-danger)', color: 'var(--cmp-danger)', marginTop: 6, fontSize: 12.5, padding: '8px 12px' }}>
                            ⛔ {agencyPrecheck.result.message || 'Registration is blocked for this ORN.'}
                          </div>
                        )}
                      </div>
                    )}

                    {touched.orn && formErrors.orn && (
                      <span className="error-text">{formErrors.orn}</span>
                    )}
                    {backendErrors.orn && (
                      <span className="error-text">{backendErrors.orn}</span>
                    )}
                  </div>

                  <div className="field half" data-invalid={touched.companyType && formErrors.companyType ? true : undefined}>
                    <label htmlFor="reg-company-type">Company type *</label>
                    <select
                      id="reg-company-type"
                      name="companyType"
                      value={formData.companyType}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    >
                      <option value="Real estate brokerage">Real estate brokerage</option>
                      <option value="Property management">Property management</option>
                      <option value="Holiday homes operator">Holiday homes operator</option>
                      <option value="Other">Other</option>
                    </select>
                    {touched.companyType && formErrors.companyType && (
                      <span className="error-text">{formErrors.companyType}</span>
                    )}
                  </div>

                  <div className="field half" data-invalid={touched.tradeLicenceStatus && formErrors.tradeLicenceStatus ? true : undefined}>
                    <label htmlFor="reg-licence-status">Trade licence status *</label>
                    <select
                      id="reg-licence-status"
                      name="tradeLicenceStatus"
                      value={formData.tradeLicenceStatus}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Expires soon">Expires soon</option>
                      <option value="Expired">Expired</option>
                      <option value="Valid and active">Valid and active</option>
                      <option value="Under renewal">Under renewal</option>
                      <option value="New application">New application</option>
                    </select>
                    {formData.tradeLicenceStatus === 'Expires soon' && (
                      <span className="hint" style={{ color: 'var(--cmp-warning, #d97706)', fontWeight: 500 }}>
                        ⚠️ Licence expires within 30 days
                      </span>
                    )}
                    {formData.tradeLicenceStatus === 'Expired' && (
                      <span className="hint" style={{ color: 'var(--cmp-danger, #dc2626)', fontWeight: 500 }}>
                        ⛔ Licence has expired
                      </span>
                    )}
                    {formData.tradeLicenceStatus === 'Active' && formData.expiryDate && (
                      <span className="hint" style={{ color: 'var(--cmp-success, #16a34a)', fontWeight: 500 }}>
                        ✓ Licence is active
                      </span>
                    )}
                    {touched.tradeLicenceStatus && formErrors.tradeLicenceStatus && (
                      <span className="error-text">{formErrors.tradeLicenceStatus}</span>
                    )}
                  </div>

                  <div className="field half" data-invalid={touched.numberOfAgents && formErrors.numberOfAgents ? true : undefined}>
                    <label htmlFor="reg-number-of-agents">Number of agents *</label>
                    <select
                      id="reg-number-of-agents"
                      name="numberOfAgents"
                      value={formData.numberOfAgents}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    >
                      <option value="1 to 5">1 to 5</option>
                      <option value="6 to 20">6 to 20</option>
                      <option value="21 to 50">21 to 50</option>
                      <option value="More than 50">More than 50</option>
                    </select>
                    {touched.numberOfAgents && formErrors.numberOfAgents && (
                      <span className="error-text">{formErrors.numberOfAgents}</span>
                    )}
                  </div>
                </>
              )}

              {/* DEVELOPER specific: Developer Type */}
              {accountType === 'DEVELOPER' && (
                <>
                  <div className="field half" data-invalid={touched.developerType && formErrors.developerType ? true : undefined}>
                    <label htmlFor="reg-developer-type">Developer type *</label>
                    <select
                      id="reg-developer-type"
                      name="developerType"
                      value={formData.developerType}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    >
                      <option value="Master developer">Master developer</option>
                      <option value="Sub developer">Sub developer</option>
                    </select>
                    {touched.developerType && formErrors.developerType && (
                      <span className="error-text">{formErrors.developerType}</span>
                    )}
                  </div>

                  {/* Pre-check notice for Developer */}
                  {devPrecheck.result && !devPrecheck.result.canSubmit && (
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <div className="note" style={{ background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)', border: '1px solid var(--cmp-danger)', color: 'var(--cmp-danger)', fontSize: 13, padding: '8px 12px' }}>
                        ⛔ {devPrecheck.result.message || 'Registration is already in progress for this developer.'}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Common company details */}
              <div className="field half" data-invalid={touched.emirate && formErrors.emirate ? true : undefined}>
                <label htmlFor="reg-emirate">Emirate *</label>
                <select
                  id="reg-emirate"
                  name="emirate"
                  value={formData.emirate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                >
                  <option value="Dubai">Dubai</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Sharjah">Sharjah</option>
                  <option value="Ajman">Ajman</option>
                  <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                  <option value="Fujairah">Fujairah</option>
                  <option value="Umm Al Quwain">Umm Al Quwain</option>
                </select>
                {touched.emirate && formErrors.emirate && (
                  <span className="error-text">{formErrors.emirate}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.tradeLicenceNumber && formErrors.tradeLicenceNumber ? true : undefined}>
                <label htmlFor="reg-licence-number">Trade licence number *</label>
                <input
                  id="reg-licence-number"
                  name="tradeLicenceNumber"
                  type="text"
                  placeholder="e.g. 771204"
                  value={formData.tradeLicenceNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.tradeLicenceNumber && formErrors.tradeLicenceNumber && (
                  <span className="error-text">{formErrors.tradeLicenceNumber}</span>
                )}
              </div>

              {accountType === 'AGENCY' && formData.expiryDate && (
                <div className="field half">
                  <label htmlFor="reg-licence-expiry">Trade licence expiry</label>
                  <input
                    id="reg-licence-expiry"
                    name="expiryDate"
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <span className="hint">As registered with official DLD / licensing authority.</span>
                </div>
              )}

              <div className="field half" data-invalid={touched.trnNumber && formErrors.trnNumber ? true : undefined}>
                <label htmlFor="reg-trn-number">TRN number (optional)</label>
                <input
                  id="reg-trn-number"
                  name="trnNumber"
                  type="text"
                  placeholder="e.g. 100412887600003"
                  value={formData.trnNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <span className="hint">Leave empty if you are not VAT registered.</span>
                {touched.trnNumber && formErrors.trnNumber && (
                  <span className="error-text">{formErrors.trnNumber}</span>
                )}
              </div>

              <div className="field" data-invalid={touched.officeAddress && formErrors.officeAddress ? true : undefined}>
                <label htmlFor="reg-office-address">{accountType === 'DEVELOPER' ? 'Head office address *' : 'Office address *'}</label>
                <input
                  id="reg-office-address"
                  name="officeAddress"
                  type="text"
                  placeholder="Building, Suite, Area, City"
                  value={formData.officeAddress}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.officeAddress && formErrors.officeAddress && (
                  <span className="error-text">{formErrors.officeAddress}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.officialEmail && formErrors.officialEmail ? true : undefined}>
                <label htmlFor="reg-official-email">Official company email *</label>
                <input
                  id="reg-official-email"
                  name="officialEmail"
                  type="email"
                  placeholder="info@company.ae"
                  value={formData.officialEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.officialEmail && formErrors.officialEmail && (
                  <span className="error-text">{formErrors.officialEmail}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.officialPhone && formErrors.officialPhone ? true : undefined}>
                <label htmlFor="reg-official-phone">Official company phone *</label>
                <input
                  id="reg-official-phone"
                  name="officialPhone"
                  type="tel"
                  placeholder="+971 4 455 0142"
                  value={formData.officialPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                <span className="hint">Landline or office number.</span>
                {touched.officialPhone && formErrors.officialPhone && (
                  <span className="error-text">{formErrors.officialPhone}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.website && formErrors.website ? true : undefined}>
                <label htmlFor="reg-website">Website (optional)</label>
                <input
                  id="reg-website"
                  name="website"
                  type="text"
                  placeholder="company.ae"
                  value={formData.website}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.website && formErrors.website && (
                  <span className="error-text">{formErrors.website}</span>
                )}
              </div>
            </div>
          </section>

          {/* 4. DEVELOPER First Project Section */}
          {accountType === 'DEVELOPER' && (
            <section className="form-section">
              <h3>First project</h3>
              <p className="section-sub" style={{ fontSize: '13px', color: 'var(--cmp-text-muted)', marginBottom: 14 }}>
                Enter details for your primary or active project to list on CMP Connect.
              </p>
              <div className="form-grid">
                <div className="field half" data-invalid={touched['firstProject.name'] && formErrors['firstProject.name'] ? true : undefined}>
                  <label htmlFor="reg-proj-name">Project name *</label>
                  <input
                    id="reg-proj-name"
                    name="firstProject.name"
                    type="text"
                    placeholder="e.g. Aurora Heights"
                    value={formData.firstProject.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched['firstProject.name'] && formErrors['firstProject.name'] && (
                    <span className="error-text">{formErrors['firstProject.name']}</span>
                  )}
                </div>

                <div className="field half" data-invalid={touched['firstProject.community'] && formErrors['firstProject.community'] ? true : undefined}>
                  <label htmlFor="reg-proj-community">Community / Location *</label>
                  <input
                    id="reg-proj-community"
                    name="firstProject.community"
                    type="text"
                    placeholder="e.g. Dubai Hills Estate"
                    value={formData.firstProject.community}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched['firstProject.community'] && formErrors['firstProject.community'] && (
                    <span className="error-text">{formErrors['firstProject.community']}</span>
                  )}
                </div>

                <div className="field half" data-invalid={touched['firstProject.reraProjectNumber'] && formErrors['firstProject.reraProjectNumber'] ? true : undefined}>
                  <label htmlFor="reg-proj-rera">RERA project number *</label>
                  <input
                    id="reg-proj-rera"
                    name="firstProject.reraProjectNumber"
                    type="text"
                    placeholder="e.g. RERA-P-7781"
                    value={formData.firstProject.reraProjectNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched['firstProject.reraProjectNumber'] && formErrors['firstProject.reraProjectNumber'] && (
                    <span className="error-text">{formErrors['firstProject.reraProjectNumber']}</span>
                  )}
                </div>

                <div className="field half" data-invalid={touched['firstProject.units'] && formErrors['firstProject.units'] ? true : undefined}>
                  <label htmlFor="reg-proj-units">Total units *</label>
                  <input
                    id="reg-proj-units"
                    name="firstProject.units"
                    type="number"
                    min="1"
                    placeholder="e.g. 214"
                    value={formData.firstProject.units}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched['firstProject.units'] && formErrors['firstProject.units'] && (
                    <span className="error-text">{formErrors['firstProject.units']}</span>
                  )}
                </div>

                <div className="field half" data-invalid={touched['firstProject.expectedHandover'] && formErrors['firstProject.expectedHandover'] ? true : undefined}>
                  <label htmlFor="reg-proj-handover">Expected handover *</label>
                  <input
                    id="reg-proj-handover"
                    name="firstProject.expectedHandover"
                    type="text"
                    placeholder="e.g. Q4 2028"
                    value={formData.firstProject.expectedHandover}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched['firstProject.expectedHandover'] && formErrors['firstProject.expectedHandover'] && (
                    <span className="error-text">{formErrors['firstProject.expectedHandover']}</span>
                  )}
                </div>

                <div className="field half" data-invalid={touched['firstProject.escrowBank'] && formErrors['firstProject.escrowBank'] ? true : undefined}>
                  <label htmlFor="reg-proj-bank">Escrow bank *</label>
                  <input
                    id="reg-proj-bank"
                    name="firstProject.escrowBank"
                    type="text"
                    placeholder="e.g. Emirates NBD"
                    value={formData.firstProject.escrowBank}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched['firstProject.escrowBank'] && formErrors['firstProject.escrowBank'] && (
                    <span className="error-text">{formErrors['firstProject.escrowBank']}</span>
                  )}
                </div>

                <div className="field" data-invalid={touched['firstProject.escrowAccountNumber'] && formErrors['firstProject.escrowAccountNumber'] ? true : undefined}>
                  <label htmlFor="reg-proj-escrow-acc">Escrow account number *</label>
                  <input
                    id="reg-proj-escrow-acc"
                    name="firstProject.escrowAccountNumber"
                    type="text"
                    placeholder="e.g. AE07 0331 2345 6789 0123 456"
                    value={formData.firstProject.escrowAccountNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched['firstProject.escrowAccountNumber'] && formErrors['firstProject.escrowAccountNumber'] && (
                    <span className="error-text">{formErrors['firstProject.escrowAccountNumber']}</span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 5. Signatory Section */}
          <section className="form-section">
            <h3>Signatory</h3>
            <div className="form-grid">
              <div className="field half" data-invalid={touched.signatoryFullName && formErrors.signatoryFullName ? true : undefined}>
                <label htmlFor="reg-signatory-name">Signatory full name *</label>
                <input
                  id="reg-signatory-name"
                  name="signatoryFullName"
                  type="text"
                  placeholder="Exactly as printed on Emirates ID"
                  value={formData.signatoryFullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                <span className="hint">Exactly as printed on the Emirates ID.</span>
                {touched.signatoryFullName && formErrors.signatoryFullName && (
                  <span className="error-text">{formErrors.signatoryFullName}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.signatoryDesignation && formErrors.signatoryDesignation ? true : undefined}>
                <label htmlFor="reg-signatory-designation">Position *</label>
                <input
                  id="reg-signatory-designation"
                  name="signatoryDesignation"
                  type="text"
                  placeholder="e.g. Managing Director"
                  value={formData.signatoryDesignation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.signatoryDesignation && formErrors.signatoryDesignation && (
                  <span className="error-text">{formErrors.signatoryDesignation}</span>
                )}
              </div>

              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                  Is the signatory the owner or a listed manager? *
                </label>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 4 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 'normal' }}>
                    <input
                      type="radio"
                      name="signatoryIsOwner"
                      checked={formData.signatoryIsOwner === true}
                      onChange={() => setFormData((prev) => ({ ...prev, signatoryIsOwner: true }))}
                    />
                    <span>Yes</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 'normal' }}>
                    <input
                      type="radio"
                      name="signatoryIsOwner"
                      checked={formData.signatoryIsOwner === false}
                      onChange={() => setFormData((prev) => ({ ...prev, signatoryIsOwner: false }))}
                    />
                    <span>No</span>
                  </label>
                </div>
                {formData.signatoryIsOwner === false && (
                  <span className="hint" style={{ color: 'var(--cmp-warning)', marginTop: 4, display: 'block' }}>
                    ℹ️ If not, you will need to upload a Power of Attorney on the documents portal.
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* 6. Owner Section */}
          <section className="form-section">
            <h3>Owner</h3>
            <div className="form-grid">
              <div className="field" data-invalid={touched.ownerFullName && formErrors.ownerFullName ? true : undefined}>
                <label htmlFor="reg-owner-name">Owner full name *</label>
                <input
                  id="reg-owner-name"
                  name="ownerFullName"
                  type="text"
                  value={formData.ownerFullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.ownerFullName && formErrors.ownerFullName && (
                  <span className="error-text">{formErrors.ownerFullName}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.ownerEmail && formErrors.ownerEmail ? true : undefined}>
                <label htmlFor="reg-owner-email">Owner email *</label>
                <input
                  id="reg-owner-email"
                  name="ownerEmail"
                  type="email"
                  placeholder="owner@company.ae"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.ownerEmail && formErrors.ownerEmail && (
                  <span className="error-text">{formErrors.ownerEmail}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.ownerMobile && formErrors.ownerMobile ? true : undefined}>
                <label htmlFor="reg-owner-mobile">Owner mobile *</label>
                <input
                  id="reg-owner-mobile"
                  name="ownerMobile"
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={formData.ownerMobile}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.ownerMobile && formErrors.ownerMobile && (
                  <span className="error-text">{formErrors.ownerMobile}</span>
                )}
              </div>
            </div>
          </section>

          {/* 7. Admin Section */}
          <section className="form-section">
            <h3>Admin</h3>
            <p className="section-sub" style={{ fontSize: '13px', color: 'var(--cmp-text-muted)', marginBottom: 14 }}>
              The person who runs the account day to day.
            </p>
            <div className="form-grid">
              <div className="field" data-invalid={touched.adminFullName && formErrors.adminFullName ? true : undefined}>
                <label htmlFor="reg-admin-name">Admin full name *</label>
                <input
                  id="reg-admin-name"
                  name="adminFullName"
                  type="text"
                  value={formData.adminFullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.adminFullName && formErrors.adminFullName && (
                  <span className="error-text">{formErrors.adminFullName}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.adminEmail && formErrors.adminEmail ? true : undefined}>
                <label htmlFor="reg-admin-email">Admin email *</label>
                <input
                  id="reg-admin-email"
                  name="adminEmail"
                  type="email"
                  placeholder="admin@company.ae"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.adminEmail && formErrors.adminEmail && (
                  <span className="error-text">{formErrors.adminEmail}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.adminMobile && formErrors.adminMobile ? true : undefined}>
                <label htmlFor="reg-admin-mobile">Admin mobile *</label>
                <input
                  id="reg-admin-mobile"
                  name="adminMobile"
                  type="tel"
                  placeholder="+971 55 123 4567"
                  value={formData.adminMobile}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.adminMobile && formErrors.adminMobile && (
                  <span className="error-text">{formErrors.adminMobile}</span>
                )}
              </div>
            </div>
          </section>

          {/* General backend error banner */}
          {backendErrors.general && (
            <div
              className="note"
              style={{
                background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)',
                border: '1px solid var(--cmp-danger)',
                color: 'var(--cmp-danger)',
                marginBottom: 16
              }}
            >
              {backendErrors.general}
              {backendErrors.network && (
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={handleSubmit}
                    style={{ borderColor: 'var(--cmp-danger)', color: 'var(--cmp-danger)' }}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submit Action */}
          <div className="form-actions" style={{ marginTop: 24 }}>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting || !canSubmitFromPrecheck || rateLimitCountdown > 0}
              style={{ padding: '14px 20px', fontSize: '15px', fontWeight: 600 }}
            >
              {isSubmitting
                ? 'Submitting registration...'
                : rateLimitCountdown > 0
                ? `Please wait ${rateLimitCountdown}s...`
                : 'Submit registration request'}
            </button>

            {!canSubmitFromPrecheck && (
              <p className="faint" style={{ textAlign: 'center', marginTop: 10, fontSize: '12px' }}>
                {accountType === 'AGENCY'
                  ? 'Enter a valid, verified RERA ORN number above to enable registration submission.'
                  : 'Enter developer name and contact email above to verify eligibility and enable submission.'}
              </p>
            )}
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
}
