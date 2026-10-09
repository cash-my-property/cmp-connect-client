import React from 'react';

export default function DocumentsStage({
  accountType,
  details,
  documents,
  onUploadFile,
  onRemoveFile,
  onContinue,
  onBack
}) {
  const isDeveloper = accountType === 'DEVELOPER';

  // Compute applicable docs according to backend rules
  const isAbuDhabi = details.emirate === 'Abu Dhabi';
  const hasTrn = Boolean(details.trnNumber && details.trnNumber.trim());
  const isSignatoryNotOwner = details.signatoryIsOwner === 'No';
  const isSubDeveloper = isDeveloper && details.developerType === 'Sub developer';

  // Filter doc items
  const companyDocDefs = [
    { key: 'tradeLicence', label: 'Trade licence', hint: isDeveloper ? 'Valid and in date, showing the right activity on it.' : 'Valid and in date, showing the right activity on it.', group: 'company' },
    ...(!isDeveloper ? [{ key: 'reraOrnCertificate', label: 'RERA ORN certificate', hint: 'Office Registration Number certificate from RERA.', group: 'company' }] : []),
    ...(isDeveloper ? [{ key: 'dldDeveloperRegistration', label: 'DLD developer registration', hint: 'Your developer registration certificate from the Dubai Land Department.', group: 'company' }] : []),
    ...(!isDeveloper && isAbuDhabi ? [{ key: 'adrecRegistration', label: 'ADREC registration', hint: 'Needed because the company is registered in Abu Dhabi.', group: 'company' }] : []),
    ...(hasTrn ? [{ key: 'trnVatCertificate', label: 'TRN / VAT certificate', hint: 'Tax registration certificate, or tell us you are not registered.', group: 'company' }] : []),
    ...(isDeveloper ? [{ key: 'memorandumOfAssociation', label: 'Memorandum of association', hint: 'Shows the shareholders and who can sign.', group: 'company' }] : []),
    { key: 'companyLogo', label: 'Company logo', hint: 'PNG or SVG, at least 1000 × 1000, transparent background preferred.', group: 'company' }
  ];

  const projectDocDefs = isDeveloper ? [
    { key: 'reraProjectRegistration', label: 'RERA project registration', hint: 'Project registration certificate for the project you will list.', group: 'project' },
    { key: 'escrowAccountLetter', label: 'Escrow account letter', hint: 'Bank letter confirming the project escrow account.', group: 'project' },
    { key: 'landTitleDeed', label: 'Land title deed', hint: 'Title deed for the plot the project sits on.', group: 'project' },
    ...(isSubDeveloper ? [{ key: 'masterDeveloperNoc', label: 'NOC from the master developer', hint: 'Needed because you are a sub developer on someone else’s master plan.', group: 'project' }] : []),
    { key: 'projectBrochure', label: 'Project brochure', hint: 'Optional, but it helps us set your project page up quickly.', group: 'project', optional: true }
  ] : [];

  const signatoryDocDefs = [
    { key: 'emiratesIdFront', label: 'Emirates ID, front', hint: 'The signatory’s Emirates ID, front side.', group: 'signatory' },
    { key: 'emiratesIdBack', label: 'Emirates ID, back', hint: 'The same card, back side.', group: 'signatory' },
    { key: 'passport', label: 'Passport copy', hint: 'Photo page, in date.', group: 'signatory' },
    ...(isSignatoryNotOwner ? [
      { key: 'powerOfAttorney', label: 'Power of attorney', hint: 'Needed because the signatory is not the owner or a listed manager.', group: 'signatory' },
      { key: 'ownerEmiratesIdFront', label: 'Owner Emirates ID, front', hint: 'Emirates ID of the owner who gave the power of attorney, front side.', group: 'signatory' },
      { key: 'ownerEmiratesIdBack', label: 'Owner Emirates ID, back', hint: 'The same card, back side.', group: 'signatory' }
    ] : []),
    { key: 'subscriptionContract', label: 'Signed subscription contract', hint: 'Download it, sign and stamp it, then upload the PDF.', group: 'signatory' }
  ];

  const allApplicable = [...companyDocDefs, ...projectDocDefs, ...signatoryDocDefs];
  const requiredDocs = allApplicable.filter(d => !d.optional);
  const uploadedRequired = requiredDocs.filter(d => Boolean(documents[d.key]));
  const missingCount = requiredDocs.length - uploadedRequired.length;

  const handleFileChange = (key, event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      onUploadFile(key, {
        name: file.name,
        size: sizeStr,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        fileObject: file
      });
    }
  };

  const renderDocRow = (doc) => {
    const fileInfo = documents[doc.key];
    const isUploaded = Boolean(fileInfo);

    return (
      <li
        key={doc.key}
        className="doc-row"
        data-state={isUploaded ? 'uploaded' : 'missing'}
      >
        <span className="doc-icon">
          {isUploaded ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M12 15V3m0 0L8 7m4-4 4 4M4 17v3h16v-3" />
            </svg>
          )}
        </span>

        <div className="doc-main">
          <strong>
            {doc.label} {doc.optional && <span className="faint">(optional)</span>}
          </strong>
          <span className="muted">{doc.hint}</span>
          {isUploaded && (
            <span className="faint">
              {fileInfo.name} · {fileInfo.size} · uploaded {fileInfo.date}
            </span>
          )}
        </div>

        <div className="doc-actions">
          {isUploaded ? (
            <>
              <span className="status-pill uploaded">Uploaded</span>
              <label className="btn btn-outline btn-sm">
                Replace
                <input
                  type="file"
                  accept={doc.key === 'companyLogo' ? 'image/png,image/svg+xml,image/jpeg' : 'application/pdf,image/*'}
                  className="visually-hidden"
                  onChange={(e) => handleFileChange(doc.key, e)}
                />
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onRemoveFile(doc.key)}
                style={{ padding: '0 8px' }}
                title="Remove uploaded file"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <label className="btn btn-outline btn-sm">
                Upload
                <input
                  type="file"
                  accept={doc.key === 'companyLogo' ? 'image/png,image/svg+xml,image/jpeg' : 'application/pdf,image/*'}
                  className="visually-hidden"
                  onChange={(e) => handleFileChange(doc.key, e)}
                />
              </label>
              {doc.key === 'subscriptionContract' && (
                <a
                  className="btn btn-ghost btn-sm"
                  href="#blank-contract"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Sample CMP subscription contract opened for download.');
                  }}
                >
                  Blank contract
                </a>
              )}
            </>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      <h2>Your documents</h2>
      <p className="sub">
        Original PDFs or clear scans, not screenshots. Each file up to 10 MB. {missingCount > 0 ? `${missingCount} still needed.` : 'All required documents are in.'}
      </p>

      {/* Company documents */}
      <section className="form-section">
        <h3>Company documents</h3>
        <ul className="doc-list">
          {companyDocDefs.map(renderDocRow)}
        </ul>
      </section>

      {/* Project documents (Developer only) */}
      {isDeveloper && projectDocDefs.length > 0 && (
        <section className="form-section">
          <h3>Project documents</h3>
          <ul className="doc-list">
            {projectDocDefs.map(renderDocRow)}
          </ul>
        </section>
      )}

      {/* Signatory documents */}
      <section className="form-section">
        <h3>Signatory documents</h3>
        <ul className="doc-list">
          {signatoryDocDefs.map(renderDocRow)}
        </ul>
      </section>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onContinue}
        >
          Continue
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  );
}
