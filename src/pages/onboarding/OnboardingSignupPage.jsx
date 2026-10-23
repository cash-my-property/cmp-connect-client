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
function calculateTradeLicenceStatus(expiryDateStr) {
  if (!expiryDateStr || typeof expiryDateStr !== 'string') return 'Active';

  try {
    const cleanStr = expiryDateStr.trim().split('T')[0];
    const parts = cleanStr.split(/[-/]/);
    let expiryDate;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        expiryDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else if (parts[2].length === 4) {
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
  } catch {
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
  } catch {
    return `Link valid until ${isoString} (Asia/Dubai)`;
  }
}

// Validation: Step 1 (Company & Licence)
function validateStep1(formData, accountType) {
  const errors = {};
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

  if (accountType === 'AGENCY') {
    if (!formData.orn.trim()) {
      errors.orn = 'RERA ORN number is required.';
    } else if (formData.orn.trim().length < 1 || formData.orn.trim().length > 50) {
      errors.orn = 'RERA ORN number must be 1 to 50 characters.';
    }
    if (!formData.companyType) {
      errors.companyType = 'Company type is required.';
    }
  }

  if (accountType === 'DEVELOPER') {
    if (!formData.developerType) {
      errors.developerType = 'Developer type is required.';
    }
    if (!formData.dldDeveloperNumber.trim()) {
      errors.dldDeveloperNumber = 'DLD developer registration number is required.';
    } else if (formData.dldDeveloperNumber.trim().length < 1 || formData.dldDeveloperNumber.trim().length > 50) {
      errors.dldDeveloperNumber = 'DLD developer number must be 1 to 50 characters.';
    }
  }

  return errors;
}

// Validation: Step 2 (Account Holder & Contacts)
function validateStep2(formData) {
  const errors = {};

  // Account Holder (Owner login)
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
    errors.phone = 'Please provide a valid UAE phone number (e.g. +971501234567)';
  }

  // Contact Person (if not same as Account Holder)
  if (!formData.contactSameAsAccount) {
    if (!formData.ownerFullName.trim()) {
      errors.ownerFullName = 'Contact person full name is required.';
    } else if (formData.ownerFullName.trim().length < 2 || formData.ownerFullName.trim().length > 80) {
      errors.ownerFullName = 'Full name must be 2 to 80 characters.';
    }

    if (!formData.ownerEmail.trim()) {
      errors.ownerEmail = 'Contact person email is required.';
    } else if (!EMAIL_REGEX.test(formData.ownerEmail.trim())) {
      errors.ownerEmail = 'Please enter a valid email address.';
    }

    if (!formData.ownerMobile.trim()) {
      errors.ownerMobile = 'Contact person phone is required.';
    } else if (!isValidUaePhone(formData.ownerMobile)) {
      errors.ownerMobile = 'Please provide a valid UAE phone number (e.g. +971501234567)';
    }
  }

  // Authorised Signatory
  if (!formData.signatoryFullName.trim()) {
    errors.signatoryFullName = 'Signatory full name is required.';
  } else if (formData.signatoryFullName.trim().length < 2 || formData.signatoryFullName.trim().length > 80) {
    errors.signatoryFullName = 'Signatory full name must be 2 to 80 characters.';
  }

  return errors;
}

// Validation: Step 3 (Office & Optional Details)
function validateStep3(formData, accountType) {
  const errors = {};

  if (formData.officialEmail && !EMAIL_REGEX.test(formData.officialEmail.trim())) {
    errors.officialEmail = 'Please enter a valid company email address.';
  }

  if (formData.officialPhone && !isValidUaePhone(formData.officialPhone)) {
    errors.officialPhone = 'Please provide a valid UAE phone/landline number.';
  }

  if (formData.trnNumber && formData.trnNumber.trim().length > 30) {
    errors.trnNumber = 'TRN number cannot exceed 30 characters.';
  }

  if (formData.website && formData.website.trim().length > 200) {
    errors.website = 'Website URL cannot exceed 200 characters.';
  }

  if (accountType === 'DEVELOPER' && formData.firstProject?.name?.trim()) {
    const proj = formData.firstProject;
    if (proj.units && (isNaN(parseInt(proj.units, 10)) || parseInt(proj.units, 10) < 1)) {
      errors['firstProject.units'] = 'Units must be an integer of 1 or more.';
    }
  }

  return errors;
}

export default function OnboardingSignupPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'developer' ? 'DEVELOPER' : 'AGENCY';

  // 1. Account Type
  const [accountType, setAccountType] = useState(initialType);

  // 2. Wizard Step (1: Company & Licence, 2: Account Holder & Contacts, 3: Office & Review)
  const [currentStep, setCurrentStep] = useState(1);

  // 3. Form State
  const [formData, setFormData] = useState({
    // Account Holder (whose email will be the Owner login username)
    firstName: '',
    lastName: '',
    email: '',
    phone: '',

    // Contact Person (Liaison for company onboarding)
    contactSameAsAccount: true,
    ownerFullName: '',
    ownerEmail: '',
    ownerMobile: '',

    // Signatory
    signatoryFullName: '',
    signatoryDesignation: 'Managing Director',
    signatoryIsOwner: true,

    // Company / Developer Entity Details
    companyName: '',
    emirate: 'Dubai',
    tradeLicenceNumber: '',
    expiryDate: '',
    tradeLicenceStatus: 'Active',
    trnNumber: '',
    officeAddress: '',
    officialEmail: '',
    officialPhone: '',
    website: '',

    // Agency Specific
    orn: '',
    companyType: 'Real estate brokerage',
    numberOfAgents: '1 to 5',

    // Developer Specific
    developerType: 'Master developer',
    dldDeveloperNumber: '',
    firstProject: {
      name: '',
      community: '',
      reraProjectNumber: '',
      units: '',
      expectedHandover: '',
      escrowBank: '',
      escrowAccountNumber: ''
    }
  });

  const [touched, setTouched] = useState({});
  const [autofilledFromDld, setAutofilledFromDld] = useState(false);

  // Pre-check state
  const [agencyPrecheck, setAgencyPrecheck] = useState({
    loading: false,
    checkedOrn: '',
    result: null,
    error: null
  });

  const [devPrecheck, setDevPrecheck] = useState({
    loading: false,
    checkedKey: '',
    result: null,
    error: null
  });

  // Backend response errors & loading
  const [backendErrors, setBackendErrors] = useState({
    orn: '',
    companyName: '',
    general: '',
    network: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [successData, setSuccessData] = useState(null);

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

  // Handle Account Type Change
  const handleAccountTypeChange = (newType) => {
    if (newType === accountType) return;
    setAccountType(newType);
    setBackendErrors({ orn: '', companyName: '', general: '', network: false });
    setAutofilledFromDld(false);
    setAgencyPrecheck({ loading: false, checkedOrn: '', result: null, error: null });
    setDevPrecheck({ loading: false, checkedKey: '', result: null, error: null });

    if (newType === 'DEVELOPER') {
      setFormData((prev) => ({
        ...prev,
        orn: '',
        companyType: 'Real estate brokerage',
        tradeLicenceStatus: 'Active',
        numberOfAgents: '1 to 5',
        developerType: prev.developerType || 'Master developer',
        dldDeveloperNumber: prev.dldDeveloperNumber || ''
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        developerType: 'Master developer',
        dldDeveloperNumber: '',
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

  // AGENCY Pre-check: debounced 400ms on ORN change
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

      // Auto-fill official DLD company data if available
      const company = data?.company || res?.company || null;
      if (company) {
        setAutofilledFromDld(true);
        setFormData((prev) => {
          const updated = { ...prev };
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

  // DEVELOPER Pre-check: once both name & email are filled
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

  const handleAccountEmailChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, email: val };
      if (prev.contactSameAsAccount) {
        updated.ownerEmail = val;
      }
      return updated;
    });

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

  const handleAccountEmailBlur = () => {
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
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        // Sync contact person if checkbox is active
        if (prev.contactSameAsAccount) {
          if (name === 'firstName' || name === 'lastName') {
            const f = name === 'firstName' ? value : prev.firstName;
            const l = name === 'lastName' ? value : prev.lastName;
            next.ownerFullName = `${f.trim()} ${l.trim()}`.trim();
          }
          if (name === 'phone') {
            next.ownerMobile = value;
          }
        }
        return next;
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Validation errors for each step
  const step1Errors = useMemo(() => validateStep1(formData, accountType), [formData, accountType]);
  const step2Errors = useMemo(() => validateStep2(formData), [formData]);
  const step3Errors = useMemo(() => validateStep3(formData, accountType), [formData, accountType]);

  // Pre-check condition
  const canSubmitFromPrecheck = useMemo(() => {
    if (accountType === 'AGENCY') {
      if (!formData.orn.trim()) return false;
      return agencyPrecheck.result?.canSubmit === true;
    } else {
      if (!formData.companyName.trim() || !formData.email.trim()) return false;
      return devPrecheck.result?.canSubmit === true;
    }
  }, [accountType, formData.orn, formData.companyName, formData.email, agencyPrecheck.result, devPrecheck.result]);

  // Step 1 -> Step 2 Navigation
  const handleGoToStep2 = () => {
    const s1Touched = {
      companyName: true,
      emirate: true,
      tradeLicenceNumber: true,
      ...(accountType === 'AGENCY' ? { orn: true, companyType: true, tradeLicenceStatus: true } : { developerType: true, dldDeveloperNumber: true })
    };
    setTouched((prev) => ({ ...prev, ...s1Touched }));

    if (Object.keys(step1Errors).length > 0) return;
    if (accountType === 'AGENCY' && agencyPrecheck.result?.canSubmit === false) return;
    if (accountType === 'DEVELOPER' && devPrecheck.result?.canSubmit === false) return;

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 -> Step 3 Navigation
  const handleGoToStep3 = () => {
    const s2Touched = {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      signatoryFullName: true,
      ...(!formData.contactSameAsAccount ? { ownerFullName: true, ownerEmail: true, ownerMobile: true } : {})
    };
    setTouched((prev) => ({ ...prev, ...s2Touched }));

    if (Object.keys(step2Errors).length > 0) return;

    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Form Submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const allErrors = { ...step1Errors, ...step2Errors, ...step3Errors };
    if (Object.keys(allErrors).length > 0) {
      if (Object.keys(step1Errors).length > 0) setCurrentStep(1);
      else if (Object.keys(step2Errors).length > 0) setCurrentStep(2);
      return;
    }

    if (!canSubmitFromPrecheck || isSubmitting || rateLimitCountdown > 0) {
      return;
    }

    setIsSubmitting(true);
    setBackendErrors({ orn: '', companyName: '', general: '', network: false });

    // Derive Account Holder & Contact Person accurately
    const accountHolderFullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    const contactFullName = (formData.contactSameAsAccount ? accountHolderFullName : formData.ownerFullName).trim();
    const contactEmail = (formData.contactSameAsAccount ? formData.email : formData.ownerEmail).trim().toLowerCase();
    const contactMobile = (formData.contactSameAsAccount ? formData.phone : formData.ownerMobile).trim().replace(/[\s-]/g, '');

    const payload = {
      type: accountType,
      // Account Holder (signup): Owner login is issued to this email
      fullName: accountHolderFullName,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim().replace(/[\s-]/g, ''),

      // Company details
      companyName: formData.companyName.trim(),
      emirate: formData.emirate,
      tradeLicenceNumber: formData.tradeLicenceNumber.trim(),
      signatoryFullName: formData.signatoryFullName.trim(),
      signatoryDesignation: formData.signatoryDesignation.trim() || 'Managing Director',
      signatoryIsOwner: Boolean(formData.signatoryIsOwner),

      // Contact Person (owner fields in backend)
      ownerFullName: contactFullName,
      ownerEmail: contactEmail,
      ownerMobile: contactMobile,

      // Admin (legacy fallback - synced with contact person)
      adminFullName: contactFullName,
      adminEmail: contactEmail,
      adminMobile: contactMobile,

      // Can wait / optional fields
      ...(formData.trnNumber.trim() ? { trnNumber: formData.trnNumber.trim() } : {}),
      ...(formData.officeAddress.trim() ? { officeAddress: formData.officeAddress.trim() } : {}),
      ...(formData.officialEmail.trim() ? { officialEmail: formData.officialEmail.trim().toLowerCase() } : {}),
      ...(formData.officialPhone.trim() ? { officialPhone: formData.officialPhone.trim().replace(/[\s-]/g, '') } : {}),
      ...(formData.website.trim() ? { website: formData.website.trim() } : {}),

      // Agency specific
      ...(accountType === 'AGENCY' ? {
        companyType: formData.companyType,
        tradeLicenceStatus: formData.tradeLicenceStatus === 'Active' ? 'Valid and active' : formData.tradeLicenceStatus,
        orn: formData.orn.trim(),
        ...(formData.numberOfAgents ? { numberOfAgents: formData.numberOfAgents } : {})
      } : {}),

      // Developer specific
      ...(accountType === 'DEVELOPER' ? {
        developerType: formData.developerType,
        dldDeveloperNumber: formData.dldDeveloperNumber.trim(),
        ...(formData.firstProject.name.trim() ? {
          firstProject: {
            name: formData.firstProject.name.trim(),
            community: formData.firstProject.community.trim(),
            reraProjectNumber: formData.firstProject.reraProjectNumber.trim(),
            units: parseInt(formData.firstProject.units, 10) || undefined,
            expectedHandover: formData.firstProject.expectedHandover.trim(),
            escrowBank: formData.firstProject.escrowBank.trim(),
            escrowAccountNumber: formData.firstProject.escrowAccountNumber.trim()
          }
        } : {})
      } : {})
    };

    try {
      const response = await cmpConnectApi.register(payload);
      const data = response?.data || response;
      setSuccessData({
        code: data?.code || data?.registrationCode || 'CMP-REQ',
        email: contactEmail || formData.email,
        linkExpiresAt: data?.linkExpiresAt || data?.expiresAt || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        linkEmailStatus: data?.linkEmailStatus || 'SENT'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const status = err.status || err.response?.status;
      const msg = err.message || err.response?.data?.message || 'Registration failed';

      if (status === 400) {
        setBackendErrors((prev) => ({
          ...prev,
          general: msg || 'Please check the form for errors.'
        }));
        if (msg.toLowerCase().includes('orn') && accountType === 'AGENCY') {
          setBackendErrors((prev) => ({ ...prev, orn: msg }));
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
  // RENDER: STEP-BY-STEP REGISTRATION FORM
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
        <div className="reg-card-header" style={{ marginBottom: 20 }}>
          <p className="eyebrow">CMP Connect</p>
          <h2>Registration form</h2>
          <p className="sub">
            Submit your partner registration in 3 quick steps. Once received, an upload link will be emailed to complete verification documents.
          </p>
        </div>

        {/* ── STEP PROGRESS BAR ── */}
        <div
          className="signup-stepper"
          style={{
            marginBottom: '32px',
            padding: '16px 20px',
            background: 'var(--cmp-surface-sunken)',
            borderRadius: '12px',
            border: '1px solid var(--cmp-border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Connecting line */}
            <div
              style={{
                position: 'absolute',
                top: '18px',
                left: '48px',
                right: '48px',
                height: '3px',
                background: 'var(--cmp-border)',
                zIndex: 0
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'var(--cmp-brand)',
                  width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                  transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>

            {/* Step 1: Company & Licence */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1,
                gap: '6px'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: currentStep >= 1 ? 'var(--cmp-brand)' : 'var(--cmp-surface)',
                  color: currentStep >= 1 ? '#FFFFFF' : 'var(--cmp-text-faint)',
                  border: currentStep === 1 ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                  boxShadow: currentStep === 1 ? '0 0 0 4px var(--cmp-brand-subtle)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: currentStep === 1 ? 700 : 500,
                  color: currentStep === 1 ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)'
                }}
              >
                1. Company &amp; Licence
              </span>
            </button>

            {/* Step 2: Account Holder & Contacts */}
            <button
              type="button"
              onClick={() => {
                if (currentStep > 2 || Object.keys(step1Errors).length === 0) {
                  setCurrentStep(2);
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: currentStep >= 2 ? 'pointer' : 'default',
                position: 'relative',
                zIndex: 1,
                gap: '6px'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: currentStep >= 2 ? 'var(--cmp-brand)' : 'var(--cmp-surface)',
                  color: currentStep >= 2 ? '#FFFFFF' : 'var(--cmp-text-faint)',
                  border: currentStep >= 2 ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                  boxShadow: currentStep === 2 ? '0 0 0 4px var(--cmp-brand-subtle)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: currentStep === 2 ? 700 : 500,
                  color: currentStep === 2 ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)'
                }}
              >
                2. Account Holder &amp; Contacts
              </span>
            </button>

            {/* Step 3: Office & Review */}
            <button
              type="button"
              onClick={() => {
                if (Object.keys(step1Errors).length === 0 && Object.keys(step2Errors).length === 0) {
                  setCurrentStep(3);
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: currentStep === 3 ? 'pointer' : 'default',
                position: 'relative',
                zIndex: 1,
                gap: '6px'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: currentStep === 3 ? 'var(--cmp-brand)' : 'var(--cmp-surface)',
                  color: currentStep === 3 ? '#FFFFFF' : 'var(--cmp-text-faint)',
                  border: currentStep === 3 ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                  boxShadow: currentStep === 3 ? '0 0 0 4px var(--cmp-brand-subtle)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                3
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: currentStep === 3 ? 700 : 500,
                  color: currentStep === 3 ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)'
                }}
              >
                3. Office &amp; Review
              </span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="reg-card-form">
          {/* ═════════════════════════════════════════════════════════ */}
          {/* STEP 1: COMPANY & LICENSING                              */}
          {/* ═════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div>
              {/* Account Type Toggle */}
              <div className="type-grid" style={{ marginBottom: 24 }}>
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
                  <span className="faint">Brokerage, agency, property management</span>
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

              <section className="form-section">
                <h3>{accountType === 'AGENCY' ? 'Agency details' : 'Developer details'}</h3>
                <p className="section-sub" style={{ fontSize: '13px', color: 'var(--cmp-text-muted)', marginBottom: 14 }}>
                  Official registration credentials verified with the government regulatory authority.
                </p>

                <div className="form-grid">
                  {/* Company Name */}
                  <div className="field" data-invalid={touched.companyName && step1Errors.companyName ? true : undefined}>
                    <label htmlFor="reg-company-name">
                      {accountType === 'DEVELOPER' ? 'Developer company name *' : 'Company name *'}
                    </label>
                    <input
                      id="reg-company-name"
                      name="companyName"
                      type="text"
                      placeholder="e.g. CMP Prime Real Estate LLC"
                      value={formData.companyName}
                      onChange={accountType === 'DEVELOPER' ? handleDevNameChange : handleChange}
                      onBlur={accountType === 'DEVELOPER' ? handleDevNameBlur : handleBlur}
                      required
                    />
                    <span className="hint">As it appears on the official trade licence.</span>
                    {touched.companyName && step1Errors.companyName && (
                      <span className="error-text">{step1Errors.companyName}</span>
                    )}
                    {backendErrors.companyName && (
                      <span className="error-text">{backendErrors.companyName}</span>
                    )}
                  </div>

                  {/* AGENCY SPECIFIC: ORN */}
                  {accountType === 'AGENCY' && (
                    <>
                      <div className="field half" data-invalid={(touched.orn && step1Errors.orn) || backendErrors.orn ? true : undefined}>
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
                            required
                            style={{ paddingRight: agencyPrecheck.loading ? 38 : 12 }}
                          />
                          {agencyPrecheck.loading && (
                            <span
                              style={{
                                position: 'absolute',
                                right: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '12px',
                                color: 'var(--cmp-brand)'
                              }}
                            >
                              Checking...
                            </span>
                          )}
                        </div>
                        <span className="hint">Official RERA Office Registration Number.</span>
                        {touched.orn && step1Errors.orn && (
                          <span className="error-text">{step1Errors.orn}</span>
                        )}
                        {backendErrors.orn && (
                          <span className="error-text">{backendErrors.orn}</span>
                        )}
                      </div>

                      {/* Agency Company Type */}
                      <div className="field half" data-invalid={touched.companyType && step1Errors.companyType ? true : undefined}>
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
                          <option value="Sole establishment">Sole establishment</option>
                          <option value="Branch of foreign company">Branch of foreign company</option>
                          <option value="Free zone establishment">Free zone establishment</option>
                          <option value="Other">Other</option>
                        </select>
                        {touched.companyType && step1Errors.companyType && (
                          <span className="error-text">{step1Errors.companyType}</span>
                        )}
                      </div>

                      {/* Agency Trade Licence Expiry */}
                      <div className="field half">
                        <label htmlFor="reg-licence-expiry">Trade licence expiry</label>
                        <input
                          id="reg-licence-expiry"
                          name="expiryDate"
                          type="text"
                          placeholder="YYYY-MM-DD"
                          value={formData.expiryDate || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <span className="hint">As registered with official DLD / licensing authority.</span>
                      </div>

                      {/* Agency Trade Licence Status (Auto-calculated readOnly) */}
                      <div className="field half">
                        <label htmlFor="reg-licence-status">Trade licence status</label>
                        <input
                          id="reg-licence-status"
                          name="tradeLicenceStatus"
                          type="text"
                          value={formData.tradeLicenceStatus || 'Active'}
                          readOnly
                          style={{
                            backgroundColor: 'var(--cmp-surface-sunken, #f8fafc)',
                            cursor: 'default',
                            fontWeight: 600,
                            color: formData.tradeLicenceStatus === 'Expired'
                              ? 'var(--cmp-danger, #dc2626)'
                              : formData.tradeLicenceStatus === 'Expires soon'
                              ? 'var(--cmp-warning, #d97706)'
                              : 'var(--cmp-success, #16a34a)'
                          }}
                        />
                        {formData.tradeLicenceStatus === 'Expires soon' && (
                          <span className="hint" style={{ color: 'var(--cmp-warning, #d97706)', fontWeight: 500 }}>
                            ⚠️ Licence expires within 30 days (Auto-calculated)
                          </span>
                        )}
                        {formData.tradeLicenceStatus === 'Expired' && (
                          <span className="hint" style={{ color: 'var(--cmp-danger, #dc2626)', fontWeight: 500 }}>
                            ⛔ Licence has expired (Auto-calculated)
                          </span>
                        )}
                        {(!formData.tradeLicenceStatus || formData.tradeLicenceStatus === 'Active') && (
                          <span className="hint" style={{ color: 'var(--cmp-success, #16a34a)', fontWeight: 500 }}>
                            ✓ Licence is active (Auto-calculated)
                          </span>
                        )}
                      </div>

                      {/* Number of agents (can wait / optional) */}
                      <div className="field half">
                        <label htmlFor="reg-agents-count">Number of active agents</label>
                        <select
                          id="reg-agents-count"
                          name="numberOfAgents"
                          value={formData.numberOfAgents}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        >
                          <option value="1 to 5">1 to 5 agents</option>
                          <option value="6 to 20">6 to 20 agents</option>
                          <option value="21 to 50">21 to 50 agents</option>
                          <option value="50+">50+ agents</option>
                        </select>
                        <span className="hint">Optional estimate of licensed brokers.</span>
                      </div>
                    </>
                  )}

                  {/* DEVELOPER SPECIFIC: DLD Registration Number & Developer Type */}
                  {accountType === 'DEVELOPER' && (
                    <>
                      <div className="field half" data-invalid={touched.dldDeveloperNumber && step1Errors.dldDeveloperNumber ? true : undefined}>
                        <label htmlFor="reg-dev-number">DLD developer registration number *</label>
                        <input
                          id="reg-dev-number"
                          name="dldDeveloperNumber"
                          type="text"
                          placeholder="e.g. DLD-DEV-4417"
                          value={formData.dldDeveloperNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                        />
                        <span className="hint">Official DLD developer licence / registration code.</span>
                        {touched.dldDeveloperNumber && step1Errors.dldDeveloperNumber && (
                          <span className="error-text">{step1Errors.dldDeveloperNumber}</span>
                        )}
                      </div>

                      <div className="field half" data-invalid={touched.developerType && step1Errors.developerType ? true : undefined}>
                        <label htmlFor="reg-dev-type">Developer classification *</label>
                        <select
                          id="reg-dev-type"
                          name="developerType"
                          value={formData.developerType}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                        >
                          <option value="Master developer">Master developer</option>
                          <option value="Sub developer">Sub developer</option>
                        </select>
                        {touched.developerType && step1Errors.developerType && (
                          <span className="error-text">{step1Errors.developerType}</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Common: Emirate & Trade Licence Number */}
                  <div className="field half" data-invalid={touched.emirate && step1Errors.emirate ? true : undefined}>
                    <label htmlFor="reg-emirate">Emirate of licence *</label>
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
                    {touched.emirate && step1Errors.emirate && (
                      <span className="error-text">{step1Errors.emirate}</span>
                    )}
                  </div>

                  <div className="field half" data-invalid={touched.tradeLicenceNumber && step1Errors.tradeLicenceNumber ? true : undefined}>
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
                    {touched.tradeLicenceNumber && step1Errors.tradeLicenceNumber && (
                      <span className="error-text">{step1Errors.tradeLicenceNumber}</span>
                    )}
                  </div>


                  <div className="field half">
                    <label htmlFor="reg-trn-number">TRN / Tax number (Optional)</label>
                    <input
                      id="reg-trn-number"
                      name="trnNumber"
                      type="text"
                      placeholder="e.g. 100412887600003"
                      value={formData.trnNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <span className="hint">Can wait: leave empty if not VAT registered.</span>
                  </div>
                </div>

                {/* Precheck Notification Banners */}
                {accountType === 'AGENCY' && agencyPrecheck.result && (
                  <div style={{ marginTop: 14 }}>
                    {agencyPrecheck.result.canSubmit === false ? (
                      <div className="note" style={{ background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)', border: '1px solid var(--cmp-danger)', color: 'var(--cmp-danger)', fontSize: 13, padding: '10px 14px' }}>
                        ⛔ {agencyPrecheck.result.message || 'This ORN cannot be registered at this time.'}
                      </div>
                    ) : (
                      <div className="note" style={{ background: 'color-mix(in srgb, var(--cmp-success) 12%, transparent)', border: '1px solid var(--cmp-success)', color: 'var(--cmp-success)', fontSize: 13, padding: '10px 14px' }}>
                        ✓ <strong>Verified:</strong> ORN {formData.orn} is eligible for CMP Connect onboarding.
                        {autofilledFromDld && ' Company details auto-filled from official regulatory records.'}
                      </div>
                    )}
                  </div>
                )}
              </section>

              <div className="form-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGoToStep2}
                  style={{ padding: '12px 24px', fontSize: '14.5px', fontWeight: 600 }}
                >
                  Continue to Contacts &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* STEP 2: ACCOUNT HOLDER & CONTACTS                         */}
          {/* ═════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div>
              {/* CARD 1: ACCOUNT HOLDER (PORTAL OWNER) */}
              <section
                className="form-section"
                style={{
                  background: 'var(--cmp-surface-sunken)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--cmp-border)',
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Account Holder</span>
                  </h3>
                  <span className="badge badge-brand" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                    Portal Owner Login
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--cmp-text-muted)', margin: '0 0 16px', lineHeight: 1.45 }}>
                  The primary administrator of this CMP Connect account. <strong>Your official Owner login credentials and portal access will be issued to this email.</strong>
                </p>

                <div className="form-grid">
                  <div className="field half" data-invalid={touched.firstName && step2Errors.firstName ? true : undefined}>
                    <label htmlFor="reg-first-name">First name *</label>
                    <input
                      id="reg-first-name"
                      name="firstName"
                      type="text"
                      placeholder="e.g. Layla"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                    {touched.firstName && step2Errors.firstName && (
                      <span className="error-text">{step2Errors.firstName}</span>
                    )}
                  </div>

                  <div className="field half" data-invalid={touched.lastName && step2Errors.lastName ? true : undefined}>
                    <label htmlFor="reg-last-name">Last name *</label>
                    <input
                      id="reg-last-name"
                      name="lastName"
                      type="text"
                      placeholder="e.g. Haddad"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                    {touched.lastName && step2Errors.lastName && (
                      <span className="error-text">{step2Errors.lastName}</span>
                    )}
                  </div>

                  <div className="field half" data-invalid={touched.email && step2Errors.email ? true : undefined}>
                    <label htmlFor="reg-contact-email">Account Holder email (Owner Login) *</label>
                    <input
                      id="reg-contact-email"
                      name="email"
                      type="email"
                      placeholder="layla@cmpprime.ae"
                      value={formData.email}
                      onChange={handleAccountEmailChange}
                      onBlur={handleAccountEmailBlur}
                      required
                    />
                    <span className="hint">This email will be your portal login username.</span>
                    {touched.email && step2Errors.email && (
                      <span className="error-text">{step2Errors.email}</span>
                    )}
                  </div>

                  <div className="field half" data-invalid={touched.phone && step2Errors.phone ? true : undefined}>
                    <label htmlFor="reg-contact-phone">Account Holder mobile *</label>
                    <input
                      id="reg-contact-phone"
                      name="phone"
                      type="tel"
                      placeholder="+971 50 412 7781"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                    <span className="hint">UAE mobile number (+971).</span>
                    {touched.phone && step2Errors.phone && (
                      <span className="error-text">{step2Errors.phone}</span>
                    )}
                  </div>
                </div>
              </section>

              {/* CARD 2: CONTACT PERSON (VERIFICATION LIAISON) */}
              <section
                className="form-section"
                style={{
                  background: 'var(--cmp-surface-sunken)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--cmp-border)',
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Contact Person</span>
                  </h3>
                  <span className="badge badge-neutral" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                    Company Liaison
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--cmp-text-muted)', margin: '0 0 14px', lineHeight: 1.45 }}>
                  The person CMP compliance contacts for verification questions, document upload assistance, and contract signing.
                </p>

                {/* "Same as Account Holder" toggle */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background: 'var(--cmp-surface)',
                    border: '1px solid var(--cmp-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: 16
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.contactSameAsAccount}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
                        ...prev,
                        contactSameAsAccount: checked,
                        ...(checked
                          ? {
                              ownerFullName: `${prev.firstName.trim()} ${prev.lastName.trim()}`.trim(),
                              ownerEmail: prev.email,
                              ownerMobile: prev.phone
                            }
                          : {})
                      }));
                    }}
                    style={{ width: 17, height: 17, accentColor: 'var(--cmp-brand)' }}
                  />
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
                    Contact Person is the same as the Account Holder
                  </span>
                </label>

                {!formData.contactSameAsAccount ? (
                  <div className="form-grid">
                    <div className="field" data-invalid={touched.ownerFullName && step2Errors.ownerFullName ? true : undefined}>
                      <label htmlFor="reg-owner-name">Contact Person full name *</label>
                      <input
                        id="reg-owner-name"
                        name="ownerFullName"
                        type="text"
                        placeholder="e.g. Karim Saleh"
                        value={formData.ownerFullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                      />
                      {touched.ownerFullName && step2Errors.ownerFullName && (
                        <span className="error-text">{step2Errors.ownerFullName}</span>
                      )}
                    </div>

                    <div className="field half" data-invalid={touched.ownerEmail && step2Errors.ownerEmail ? true : undefined}>
                      <label htmlFor="reg-owner-email">Contact Person email *</label>
                      <input
                        id="reg-owner-email"
                        name="ownerEmail"
                        type="email"
                        placeholder="karim@cmpprime.ae"
                        value={formData.ownerEmail}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                      />
                      {touched.ownerEmail && step2Errors.ownerEmail && (
                        <span className="error-text">{step2Errors.ownerEmail}</span>
                      )}
                    </div>

                    <div className="field half" data-invalid={touched.ownerMobile && step2Errors.ownerMobile ? true : undefined}>
                      <label htmlFor="reg-owner-mobile">Contact Person mobile *</label>
                      <input
                        id="reg-owner-mobile"
                        name="ownerMobile"
                        type="tel"
                        placeholder="+971 55 318 2240"
                        value={formData.ownerMobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                      />
                      {touched.ownerMobile && step2Errors.ownerMobile && (
                        <span className="error-text">{step2Errors.ownerMobile}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--cmp-success)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓</span>
                    <span>
                      Using <strong>{formData.firstName ? `${formData.firstName} ${formData.lastName}` : 'Account Holder'}</strong> ({formData.email || 'account email'}) as the primary contact person.
                    </span>
                  </p>
                )}
              </section>

              {/* CARD 3: AUTHORISED SIGNATORY */}
              <section
                className="form-section"
                style={{
                  background: 'var(--cmp-surface-sunken)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--cmp-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0 }}>Authorised Signatory</h3>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      const name = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
                      if (name) {
                        setFormData((prev) => ({ ...prev, signatoryFullName: name }));
                      }
                    }}
                    style={{ fontSize: '12px', color: 'var(--cmp-brand)' }}
                  >
                    Use Account Holder name
                  </button>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--cmp-text-muted)', margin: '0 0 14px', lineHeight: 1.45 }}>
                  The authorized signatory signing the CMP platform subscription contract.
                </p>

                <div className="form-grid">
                  <div className="field half" data-invalid={touched.signatoryFullName && step2Errors.signatoryFullName ? true : undefined}>
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
                    <span className="hint">As printed on Emirates ID or Power of Attorney.</span>
                    {touched.signatoryFullName && step2Errors.signatoryFullName && (
                      <span className="error-text">{step2Errors.signatoryFullName}</span>
                    )}
                  </div>

                  <div className="field half">
                    <label htmlFor="reg-signatory-designation">Position / Title</label>
                    <input
                      id="reg-signatory-designation"
                      name="signatoryDesignation"
                      type="text"
                      placeholder="e.g. Managing Director"
                      value={formData.signatoryDesignation}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <span className="hint">Optional: can be confirmed on document upload.</span>
                  </div>
                </div>
              </section>

              <div className="form-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentStep(1)}
                  style={{ padding: '12px 20px', fontSize: '14px' }}
                >
                  &larr; Back to Company
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGoToStep3}
                  style={{ padding: '12px 24px', fontSize: '14.5px', fontWeight: 600 }}
                >
                  Continue to Office &amp; Review &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* STEP 3: OFFICE DETAILS & REVIEW & SUBMIT                  */}
          {/* ═════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div>
              {/* Optional Office Details */}
              <section className="form-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h3 style={{ margin: 0 }}>Office &amp; Contact channels</h3>
                  <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Can wait / Optional</span>
                </div>
                <p className="section-sub" style={{ fontSize: '13px', color: 'var(--cmp-text-muted)', marginBottom: 14 }}>
                  You can complete these now or fill them later through your secure document upload link.
                </p>

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="reg-office-address">Head office address</label>
                    <input
                      id="reg-office-address"
                      name="officeAddress"
                      type="text"
                      placeholder="e.g. Office 1402, Marina Plaza, Dubai Marina, Dubai"
                      value={formData.officeAddress}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>

                  <div className="field half" data-invalid={touched.officialEmail && step3Errors.officialEmail ? true : undefined}>
                    <label htmlFor="reg-official-email">Official company email</label>
                    <input
                      id="reg-official-email"
                      name="officialEmail"
                      type="email"
                      placeholder="info@company.ae"
                      value={formData.officialEmail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.officialEmail && step3Errors.officialEmail && (
                      <span className="error-text">{step3Errors.officialEmail}</span>
                    )}
                  </div>

                  <div className="field half" data-invalid={touched.officialPhone && step3Errors.officialPhone ? true : undefined}>
                    <label htmlFor="reg-official-phone">Official company phone / landline</label>
                    <input
                      id="reg-official-phone"
                      name="officialPhone"
                      type="tel"
                      placeholder="+971 4 455 0142"
                      value={formData.officialPhone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.officialPhone && step3Errors.officialPhone && (
                      <span className="error-text">{step3Errors.officialPhone}</span>
                    )}
                  </div>

                  <div className="field half">
                    <label htmlFor="reg-website">Website</label>
                    <input
                      id="reg-website"
                      name="website"
                      type="text"
                      placeholder="company.ae"
                      value={formData.website}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>
              </section>

              {/* Developer First Project (Optional) */}
              {accountType === 'DEVELOPER' && (
                <section className="form-section">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h3 style={{ margin: 0 }}>Initial development project</h3>
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Can wait / Optional</span>
                  </div>
                  <p className="section-sub" style={{ fontSize: '13px', color: 'var(--cmp-text-muted)', marginBottom: 14 }}>
                    Details for your primary active project. Can also be added on your documents portal.
                  </p>

                  <div className="form-grid">
                    <div className="field half">
                      <label htmlFor="reg-proj-name">Project name</label>
                      <input
                        id="reg-proj-name"
                        name="firstProject.name"
                        type="text"
                        placeholder="e.g. Aurora Heights"
                        value={formData.firstProject.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    <div className="field half">
                      <label htmlFor="reg-proj-community">Community / Location</label>
                      <input
                        id="reg-proj-community"
                        name="firstProject.community"
                        type="text"
                        placeholder="e.g. Dubai Hills Estate"
                        value={formData.firstProject.community}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    <div className="field half">
                      <label htmlFor="reg-proj-rera">RERA project number</label>
                      <input
                        id="reg-proj-rera"
                        name="firstProject.reraProjectNumber"
                        type="text"
                        placeholder="e.g. RERA-P-7781"
                        value={formData.firstProject.reraProjectNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    <div className="field half" data-invalid={step3Errors['firstProject.units'] ? true : undefined}>
                      <label htmlFor="reg-proj-units">Total units</label>
                      <input
                        id="reg-proj-units"
                        name="firstProject.units"
                        type="number"
                        min="1"
                        placeholder="e.g. 214"
                        value={formData.firstProject.units}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {step3Errors['firstProject.units'] && (
                        <span className="error-text">{step3Errors['firstProject.units']}</span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* REVIEW SUMMARY CARD */}
              <section
                className="form-section"
                style={{
                  background: 'var(--cmp-surface-sunken)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--cmp-border)'
                }}
              >
                <h3 style={{ margin: '0 0 14px' }}>Review &amp; Confirmation</h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ background: 'var(--cmp-surface)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--cmp-border)' }}>
                    <div style={{ color: 'var(--cmp-text-faint)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entity</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginTop: 2 }}>{formData.companyName || '—'}</div>
                    <div style={{ color: 'var(--cmp-text-muted)', fontSize: '12px', marginTop: 2 }}>
                      {accountType === 'AGENCY' ? `ORN: ${formData.orn || '—'}` : `DLD: ${formData.dldDeveloperNumber || '—'}`} · {formData.emirate}
                    </div>
                  </div>

                  <div style={{ background: 'var(--cmp-surface)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--cmp-border)' }}>
                    <div style={{ color: 'var(--cmp-brand)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                      Account Holder (Login)
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginTop: 2 }}>
                      {formData.firstName} {formData.lastName}
                    </div>
                    <div style={{ color: 'var(--cmp-text-muted)', fontSize: '12px', marginTop: 2, wordBreak: 'break-all' }}>
                      {formData.email} · {formData.phone}
                    </div>
                  </div>

                  <div style={{ background: 'var(--cmp-surface)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--cmp-border)' }}>
                    <div style={{ color: 'var(--cmp-text-faint)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Contact Person
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginTop: 2 }}>
                      {formData.contactSameAsAccount
                        ? `${formData.firstName} ${formData.lastName}`
                        : formData.ownerFullName || '—'}
                    </div>
                    <div style={{ color: 'var(--cmp-text-muted)', fontSize: '12px', marginTop: 2, wordBreak: 'break-all' }}>
                      {formData.contactSameAsAccount ? formData.email : formData.ownerEmail}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'color-mix(in srgb, var(--cmp-brand) 8%, transparent)',
                    border: '1px solid var(--cmp-brand-subtle)',
                    color: 'var(--cmp-brand)',
                    fontSize: '12.5px',
                    marginTop: 14
                  }}
                >
                  <span>✓</span>
                  <span>
                    Upon submission, an instant verification upload link will be emailed to <strong>{formData.email}</strong>.
                  </span>
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
                    marginTop: 16,
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

              {/* Submit Buttons */}
              <div className="form-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentStep(2)}
                  style={{ padding: '12px 20px', fontSize: '14px' }}
                >
                  &larr; Back to Contacts
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !canSubmitFromPrecheck || rateLimitCountdown > 0}
                  style={{ padding: '14px 28px', fontSize: '15px', fontWeight: 700 }}
                >
                  {isSubmitting
                    ? 'Submitting registration...'
                    : rateLimitCountdown > 0
                    ? `Please wait ${rateLimitCountdown}s...`
                    : 'Submit registration request'}
                </button>
              </div>

              {!canSubmitFromPrecheck && (
                <p className="faint" style={{ textAlign: 'center', marginTop: 10, fontSize: '12px' }}>
                  {accountType === 'AGENCY'
                    ? 'Enter a valid, verified RERA ORN number in Step 1 to enable registration submission.'
                    : 'Enter developer name and contact email in Step 1 to verify eligibility and enable submission.'}
                </p>
              )}
            </div>
          )}
        </form>
      </div>
    </OnboardingLayout>
  );
}
