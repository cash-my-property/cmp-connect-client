import React from 'react';

export default function SubmittedStage({
  documents,
  onChangeDocument,
  onDemoApprove
}) {
  const uploadedDocs = Object.entries(documents).filter(([_, info]) => Boolean(info));

  const formatDocName = (key) => {
    const map = {
      tradeLicence: 'Trade licence',
      reraOrnCertificate: 'RERA ORN certificate',
      adrecRegistration: 'ADREC registration',
      dldDeveloperRegistration: 'DLD developer registration',
      trnVatCertificate: 'TRN / VAT certificate',
      memorandumOfAssociation: 'Memorandum of association',
      companyLogo: 'Company logo',
      reraProjectRegistration: 'RERA project registration',
      escrowAccountLetter: 'Escrow account letter',
      landTitleDeed: 'Land title deed',
      masterDeveloperNoc: 'NOC from the master developer',
      projectBrochure: 'Project brochure',
      emiratesIdFront: 'Emirates ID, front',
      emiratesIdBack: 'Emirates ID, back',
      passport: 'Passport copy',
      powerOfAttorney: 'Power of attorney',
      ownerEmiratesIdFront: 'Owner Emirates ID, front',
      ownerEmiratesIdBack: 'Owner Emirates ID, back',
      subscriptionContract: 'Signed subscription contract'
    };
    return map[key] || key;
  };

  return (
    <div>
      <span className="success-mark">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>

      <h2>With our team</h2>
      <p className="sub">Sent Today. Most registrations are checked within one working day.</p>

      <ul className="doc-list">
        {uploadedDocs.map(([key, info]) => (
          <li key={key} className="doc-row" data-state="uploaded">
            <span className="doc-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="14 3 14 9 20 9" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <div className="doc-main">
              <strong>{formatDocName(key)}</strong>
              <span className="faint">{info.name}</span>
            </div>
            <span className="status-pill in-review">In review</span>
          </li>
        ))}
      </ul>

      <div className="note note-green" style={{ marginTop: 16 }}>
        We check your trade licence, RERA ORN and licence activity against the official records, then activate your account.
      </div>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onChangeDocument}
        >
          Change a document
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onDemoApprove}
        >
          Demo: mark as approved
        </button>
      </div>
    </div>
  );
}
