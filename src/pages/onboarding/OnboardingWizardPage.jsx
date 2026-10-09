import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import StageProgressBar from './components/StageProgressBar';
import DetailsStage from './components/DetailsStage';
import DocumentsStage from './components/DocumentsStage';
import ReviewStage from './components/ReviewStage';
import SubmittedStage from './components/SubmittedStage';
import VerifiedStage from './components/VerifiedStage';
import { cmpConnectApi } from '../../services/cmpConnectApi';

export default function OnboardingWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const initialType = searchParams.get('type') === 'developer' ? 'DEVELOPER' : 'AGENCY';
  const paramStage = parseInt(searchParams.get('stage') || '2', 10);

  const [token, setToken] = useState(tokenParam);
  const [accountType, setAccountType] = useState(initialType);
  const [currentStage, setCurrentStage] = useState(paramStage >= 2 && paramStage <= 6 ? paramStage : 2);
  const [apiFeedback, setApiFeedback] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Agency form initial state
  const agencyInitial = {
    contactFirstName: 'Layla',
    contactLastName: 'Haddad',
    contactEmail: 'layla@cmpprime.ae',
    contactPhone: '+971 50 412 7781',
    companyName: 'CMP Prime Real Estate',
    companyType: 'Real estate brokerage',
    emirate: 'Abu Dhabi',
    tradeLicenceNumber: '771204',
    tradeLicenceStatus: 'Valid and active',
    reraOrnNumber: 'ORN-28841',
    trnNumber: '100412887600003',
    numberOfAgents: '6 to 20',
    officeAddress: 'Office 1402, Marina Plaza, Dubai Marina',
    officialEmail: 'info@cmpprime.ae',
    officialPhone: '+971 4 455 0142',
    website: 'cmpprime.ae',
    signatoryName: 'Layla Haddad',
    signatoryDesignation: 'Managing Director',
    signatoryIsOwner: 'Yes',
    ownerName: 'Layla Haddad',
    ownerEmail: 'layla@cmpprime.ae',
    ownerMobile: '+971 50 412 7781',
    adminName: 'Karim Saleh',
    adminEmail: 'karim@cmpprime.ae',
    adminMobile: '+971 55 318 2240'
  };

  // Developer form initial state
  const developerInitial = {
    contactFirstName: 'Nasser',
    contactLastName: 'Al Ali',
    contactEmail: 'nasser@auroradev.ae',
    contactPhone: '+971 55 990 3312',
    companyName: 'Aurora Developments',
    developerType: 'Sub developer',
    emirate: 'Dubai',
    tradeLicenceNumber: '845112',
    dldDeveloperNumber: 'DLD-DEV-4417',
    trnNumber: '100412887600003',
    officeAddress: 'Office 2201, Burj Daman, DIFC, Dubai',
    officialEmail: 'info@auroradev.ae',
    officialPhone: '+971 4 332 0099',
    website: 'auroradev.ae',
    projectName: 'Aurora Heights',
    projectCommunity: 'Dubai Hills Estate',
    projectRegistrationNumber: 'RERA-P-7781',
    projectUnits: 214,
    projectHandover: 'Q4 2028',
    escrowBank: 'Emirates NBD',
    escrowNumber: 'AE07 0331 2345 6789 0123 456',
    signatoryName: 'Nasser Al Ali',
    signatoryDesignation: 'Managing Director',
    signatoryIsOwner: 'No',
    ownerName: 'Aurora Holding LLC',
    ownerEmail: 'owner@auroradev.ae',
    ownerMobile: '+971 55 990 3300',
    adminName: 'Mariam Haddad',
    adminEmail: 'mariam@auroradev.ae',
    adminMobile: '+971 50 772 3318'
  };

  const [details, setDetails] = useState(initialType === 'DEVELOPER' ? developerInitial : agencyInitial);

  // Pre-seed documents with sample uploaded files
  const [documents, setDocuments] = useState({
    tradeLicence: { name: 'trade-licence.pdf', size: '402 KB', date: '7 Oct' },
    reraOrnCertificate: { name: 'orn.pdf', size: '402 KB', date: '7 Oct' },
    dldDeveloperRegistration: { name: 'dev-registration.pdf', size: '402 KB', date: '7 Oct' },
    adrecRegistration: { name: 'adrec.pdf', size: '402 KB', date: '7 Oct' },
    trnVatCertificate: { name: 'trn.pdf', size: '402 KB', date: '7 Oct' },
    memorandumOfAssociation: { name: 'moa.pdf', size: '402 KB', date: '7 Oct' },
    companyLogo: { name: 'logo.pdf', size: '402 KB', date: '7 Oct' },
    reraProjectRegistration: { name: 'project-registration.pdf', size: '402 KB', date: '7 Oct' },
    escrowAccountLetter: { name: 'escrow.pdf', size: '402 KB', date: '7 Oct' },
    landTitleDeed: { name: 'title-deed.pdf', size: '402 KB', date: '7 Oct' },
    masterDeveloperNoc: { name: 'noc.pdf', size: '402 KB', date: '7 Oct' },
    emiratesIdFront: { name: 'eid-front.pdf', size: '402 KB', date: '7 Oct' },
    emiratesIdBack: { name: 'eid-back.pdf', size: '402 KB', date: '7 Oct' },
    passport: { name: 'passport.pdf', size: '402 KB', date: '7 Oct' },
    powerOfAttorney: { name: 'poa.pdf', size: '402 KB', date: '7 Oct' },
    subscriptionContract: { name: 'contract.pdf', size: '402 KB', date: '7 Oct' }
  });

  // API #4: Load Portal State from token on mount if present
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    async function loadPortalData() {
      try {
        setIsApiLoading(true);
        const res = await cmpConnectApi.getPortal(token);
        if (!isMounted || !res?.data) return;

        const data = res.data;
        setAccountType(data.type);
        setApiFeedback(`Connected to live backend. Application: ${data.code || data.companyName}`);

        // Update details from server fields
        if (Array.isArray(data.fields)) {
          setDetails(prev => {
            const updated = { ...prev };
            data.fields.forEach(f => {
              if (f.path && f.value !== null && f.value !== undefined) {
                if (f.path.includes('.')) {
                  const [parent, child] = f.path.split('.');
                  if (parent === 'firstProject') {
                    if (child === 'name') updated.projectName = f.value;
                    if (child === 'community') updated.projectCommunity = f.value;
                    if (child === 'reraProjectNumber') updated.projectRegistrationNumber = f.value;
                    if (child === 'units') updated.projectUnits = f.value;
                    if (child === 'expectedHandover') updated.projectHandover = f.value;
                    if (child === 'escrowBank') updated.escrowBank = f.value;
                    if (child === 'escrowAccountNumber') updated.escrowNumber = f.value;
                  }
                } else {
                  updated[f.path] = f.value;
                }
              }
            });
            if (data.companyName) updated.companyName = data.companyName;
            if (data.emirate) updated.emirate = data.emirate;
            if (data.orn) updated.reraOrnNumber = data.orn;
            return updated;
          });
        }

        // Update uploaded docs
        if (Array.isArray(data.docs)) {
          setDocuments(prev => {
            const docMap = { ...prev };
            data.docs.forEach(d => {
              if (d.uploaded) {
                docMap[d.key] = {
                  name: d.uploaded.fileName || `${d.key}.pdf`,
                  size: 'Cloudinary Hosted',
                  date: d.uploaded.uploadedAt ? new Date(d.uploaded.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Uploaded',
                  status: d.uploaded.status
                };
              }
            });
            return docMap;
          });
        }

        // Auto-advance stage based on onboarding status
        if (data.onboardingStatus === 'DOCS_SUBMITTED') {
          setCurrentStage(5);
        } else if (data.onboardingStatus === 'VERIFIED') {
          setCurrentStage(6);
        }
      } catch (err) {
        console.warn('Could not load live portal data via token:', err.message);
        setApiFeedback('Running in offline / local draft mode.');
      } finally {
        if (isMounted) setIsApiLoading(false);
      }
    }

    loadPortalData();
    return () => { isMounted = false; };
  }, [token]);

  // Handle switching account type
  const handleSwitchType = (type) => {
    if (type === accountType) return;
    setAccountType(type);
    if (type === 'DEVELOPER') {
      setDetails(developerInitial);
    } else {
      setDetails(agencyInitial);
    }
  };

  // API #5: Save Details step to backend
  const handleDetailsContinue = async () => {
    if (token) {
      try {
        setIsApiLoading(true);
        const payload = {
          tradeLicenceNumber: details.tradeLicenceNumber,
          trnNumber: details.trnNumber,
          officeAddress: details.officeAddress,
          officialEmail: details.officialEmail,
          officialPhone: details.officialPhone,
          website: details.website,
          signatoryFullName: details.signatoryName,
          signatoryDesignation: details.signatoryDesignation,
          signatoryIsOwner: details.signatoryIsOwner === 'Yes',
          ...(accountType === 'AGENCY' && {
            numberOfAgents: details.numberOfAgents
          }),
          ...(accountType === 'DEVELOPER' && {
            'firstProject.name': details.projectName,
            'firstProject.community': details.projectCommunity,
            'firstProject.reraProjectNumber': details.projectRegistrationNumber,
            'firstProject.units': Number(details.projectUnits),
            'firstProject.expectedHandover': details.projectHandover,
            'firstProject.escrowBank': details.escrowBank,
            'firstProject.escrowAccountNumber': details.escrowNumber
          })
        };
        await cmpConnectApi.saveDetails(token, payload);
        setApiFeedback('Details saved to backend.');
      } catch (err) {
        console.warn('Backend saveDetails error (continuing with local state):', err.message);
      } finally {
        setIsApiLoading(false);
      }
    }
    setCurrentStage(3);
  };

  // API #6: Upload document (single file multipart)
  const handleUploadFile = async (docKey, fileData) => {
    // Immediate UI update
    setDocuments(prev => ({
      ...prev,
      [docKey]: fileData
    }));

    if (token && fileData.fileObject) {
      try {
        setIsApiLoading(true);
        const res = await cmpConnectApi.uploadDocument(token, docKey, fileData.fileObject);
        if (res?.data) {
          setApiFeedback(`${fileData.name} uploaded to Cloudinary successfully.`);
        }
      } catch (err) {
        console.warn(`Backend upload for ${docKey} failed:`, err.message);
        setApiFeedback(`Upload saved locally. (Backend: ${err.message})`);
      } finally {
        setIsApiLoading(false);
      }
    }
  };

  // Remove file
  const handleRemoveFile = (docKey) => {
    setDocuments(prev => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
  };

  // API #7: Submit documents for review
  const handleSubmitReview = async () => {
    if (token) {
      try {
        setIsApiLoading(true);
        const res = await cmpConnectApi.submit(token);
        if (res?.status === 'success') {
          setApiFeedback('Documents successfully submitted for CMP compliance review.');
        }
      } catch (err) {
        console.warn('Backend submit error (continuing to submitted screen):', err.message);
      } finally {
        setIsApiLoading(false);
      }
    }
    setCurrentStage(5);
  };

  // Calculate percentage
  const percentage = useMemo(() => {
    if (currentStage >= 4) return 100;
    if (currentStage === 3) {
      return accountType === 'DEVELOPER' ? 85 : 78;
    }
    return accountType === 'DEVELOPER' ? 67 : 72;
  }, [currentStage, accountType]);

  const companyDisplayName = details.companyName || (accountType === 'DEVELOPER' ? 'Aurora Developments' : 'CMP Prime Real Estate');

  return (
    <OnboardingLayout
      title={accountType === 'DEVELOPER' ? 'Developer registration' : 'Company registration'}
      subtitle={`${accountType === 'DEVELOPER' ? 'Developer' : 'Real estate company'} · ${companyDisplayName}`}
      points={[
        "Everything saves as you go",
        "Come back any time with your email and password",
        "We check your documents against the official records",
        "You are told at every change of status"
      ]}
    >
      <div className="reg-card wide">
        {/* API Status Feedback */}
        {apiFeedback && (
          <div
            className="note note-green"
            style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>{apiFeedback}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setApiFeedback('')}
              style={{ padding: '0 6px', height: '24px' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Stepper Bar & Progress Meter */}
        <StageProgressBar
          currentStage={currentStage}
          onStageClick={(targetStage) => setCurrentStage(targetStage)}
          percentage={percentage}
          onSignOut={() => navigate('/signin')}
        />

        {/* Account Type Switcher */}
        {currentStage <= 3 && (
          <div className="type-switch">
            <span className="faint">Registering as</span>
            <div role="group" aria-label="What you are registering">
              <button
                type="button"
                aria-pressed={accountType === 'AGENCY'}
                onClick={() => handleSwitchType('AGENCY')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m14 10v-2a4 4 0 0 0-3-3.87" />
                </svg>
                Real estate company
              </button>
              <button
                type="button"
                aria-pressed={accountType === 'DEVELOPER'}
                onClick={() => handleSwitchType('DEVELOPER')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M4 21V10l8-6 8 6v11M9 21v-6h6v6" />
                </svg>
                Developer
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Stage Views */}
        {currentStage === 2 && (
          <DetailsStage
            accountType={accountType}
            details={details}
            onChange={setDetails}
            onContinue={handleDetailsContinue}
            onSaveLater={() => alert('Registration draft saved! You can resume any time by signing in.')}
          />
        )}

        {currentStage === 3 && (
          <DocumentsStage
            accountType={accountType}
            details={details}
            documents={documents}
            onUploadFile={handleUploadFile}
            onRemoveFile={handleRemoveFile}
            onContinue={() => setCurrentStage(4)}
            onBack={() => setCurrentStage(2)}
          />
        )}

        {currentStage === 4 && (
          <ReviewStage
            accountType={accountType}
            details={details}
            documents={documents}
            onEditSection={(stageNum) => setCurrentStage(stageNum)}
            onSubmit={handleSubmitReview}
            onBack={() => setCurrentStage(3)}
          />
        )}

        {currentStage === 5 && (
          <SubmittedStage
            documents={documents}
            onChangeDocument={() => setCurrentStage(3)}
            onDemoApprove={() => setCurrentStage(6)}
          />
        )}

        {currentStage === 6 && (
          <VerifiedStage
            accountType={accountType}
            details={details}
            documentsCount={Object.keys(documents).length}
            onSignOut={() => navigate('/onboarding')}
          />
        )}
      </div>
    </OnboardingLayout>
  );
}
