import React, { useState } from 'react';

export default function ReviewStage({
  accountType,
  details,
  documents,
  onEditSection,
  onSubmit,
  onBack
}) {
  const isDeveloper = accountType === 'DEVELOPER';
  const [confirmed, setConfirmed] = useState(false);

  // Compute uploaded docs to show in review summary
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
      <h2>Check and send</h2>
      <p className="sub">Have a last look. You can still change anything before you send it.</p>

      {/* Contact person */}
      <section className="form-section">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Contact person</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onEditSection(2)}
          >
            Edit
          </button>
        </div>
        <dl className="summary">
          <div>
            <dt>First name</dt>
            <dd>{details.contactFirstName || '—'}</dd>
          </div>
          <div>
            <dt>Last name</dt>
            <dd>{details.contactLastName || '—'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{details.contactEmail || '—'}</dd>
          </div>
          <div>
            <dt>Phone number</dt>
            <dd>{details.contactPhone || '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Company / Developer */}
      <section className="form-section">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>{isDeveloper ? 'Developer' : 'Company'}</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onEditSection(2)}
          >
            Edit
          </button>
        </div>
        <dl className="summary">
          <div>
            <dt>{isDeveloper ? 'Developer name' : 'Company name'}</dt>
            <dd>{details.companyName || '—'}</dd>
          </div>
          <div>
            <dt>{isDeveloper ? 'Developer type' : 'Company type'}</dt>
            <dd>{isDeveloper ? details.developerType : details.companyType || '—'}</dd>
          </div>
          <div>
            <dt>Emirate</dt>
            <dd>{details.emirate || '—'}</dd>
          </div>
          <div>
            <dt>Trade licence number</dt>
            <dd>{details.tradeLicenceNumber || '—'}</dd>
          </div>
          {!isDeveloper ? (
            <div>
              <dt>Trade licence status</dt>
              <dd>{details.tradeLicenceStatus || '—'}</dd>
            </div>
          ) : (
            <div>
              <dt>DLD developer registration number</dt>
              <dd>{details.dldDeveloperNumber || '—'}</dd>
            </div>
          )}
          {!isDeveloper && (
            <div>
              <dt>RERA ORN number</dt>
              <dd>{details.reraOrnNumber || '—'}</dd>
            </div>
          )}
          <div>
            <dt>TRN number</dt>
            <dd>{details.trnNumber || '—'}</dd>
          </div>
          {!isDeveloper && (
            <div>
              <dt>Number of agents</dt>
              <dd>{details.numberOfAgents || '—'}</dd>
            </div>
          )}
          <div>
            <dt>Office address</dt>
            <dd>{details.officeAddress || '—'}</dd>
          </div>
          <div>
            <dt>Official company email</dt>
            <dd>{details.officialEmail || '—'}</dd>
          </div>
          <div>
            <dt>Official company phone</dt>
            <dd>{details.officialPhone || '—'}</dd>
          </div>
          <div>
            <dt>Website</dt>
            <dd>{details.website || '—'}</dd>
          </div>
        </dl>
      </section>

      {/* First project (Developer) */}
      {isDeveloper && (
        <section className="form-section">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>First project</h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onEditSection(2)}
            >
              Edit
            </button>
          </div>
          <dl className="summary">
            <div>
              <dt>First project name</dt>
              <dd>{details.projectName || '—'}</dd>
            </div>
            <div>
              <dt>Community</dt>
              <dd>{details.projectCommunity || '—'}</dd>
            </div>
            <div>
              <dt>RERA project number</dt>
              <dd>{details.projectRegistrationNumber || '—'}</dd>
            </div>
            <div>
              <dt>Number of units</dt>
              <dd>{details.projectUnits || '—'}</dd>
            </div>
            <div>
              <dt>Expected handover</dt>
              <dd>{details.projectHandover || '—'}</dd>
            </div>
            <div>
              <dt>Escrow bank</dt>
              <dd>{details.escrowBank || '—'}</dd>
            </div>
            <div>
              <dt>Escrow account number</dt>
              <dd>{details.escrowNumber || '—'}</dd>
            </div>
          </dl>
        </section>
      )}

      {/* Signatory */}
      <section className="form-section">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Signatory</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onEditSection(2)}
          >
            Edit
          </button>
        </div>
        <dl className="summary">
          <div>
            <dt>Signatory full name</dt>
            <dd>{details.signatoryName || '—'}</dd>
          </div>
          <div>
            <dt>Position</dt>
            <dd>{details.signatoryDesignation || '—'}</dd>
          </div>
          <div>
            <dt>Is the signatory the owner or a listed manager?</dt>
            <dd>{details.signatoryIsOwner || 'Yes'}</dd>
          </div>
        </dl>
      </section>

      {/* Owner and admin */}
      <section className="form-section">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Owner and admin</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onEditSection(2)}
          >
            Edit
          </button>
        </div>
        <dl className="summary">
          <div>
            <dt>Owner full name</dt>
            <dd>{details.ownerName || '—'}</dd>
          </div>
          <div>
            <dt>Owner email</dt>
            <dd>{details.ownerEmail || '—'}</dd>
          </div>
          <div>
            <dt>Owner mobile</dt>
            <dd>{details.ownerMobile || '—'}</dd>
          </div>
          <div>
            <dt>Admin full name</dt>
            <dd>{details.adminName || '—'}</dd>
          </div>
          <div>
            <dt>Admin email</dt>
            <dd>{details.adminEmail || '—'}</dd>
          </div>
          <div>
            <dt>Admin mobile</dt>
            <dd>{details.adminMobile || '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Documents */}
      <section className="form-section">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Documents</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onEditSection(3)}
          >
            Edit
          </button>
        </div>
        <ul className="doc-list">
          {uploadedDocs.map(([key, info]) => (
            <li key={key} className="doc-row" data-state="uploaded">
              <span className="doc-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <div className="doc-main">
                <strong>{formatDocName(key)}</strong>
                <span className="faint">{info.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <label className="check">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <span>
          I confirm these details and documents are genuine, in date and belong to this company.
        </span>
      </label>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!confirmed}
          onClick={onSubmit}
        >
          Send for review
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
