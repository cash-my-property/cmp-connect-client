import React, { useState, useRef, useEffect } from 'react';
import { cmpConnectApi } from '../../../services/cmpConnectApi';

export default function DetailsStage({
  accountType,
  details,
  onChange,
  onContinue,
  onSaveLater
}) {
  const isDeveloper = accountType === 'DEVELOPER';

  // RERA ORN check-existence on onChange
  const [ornLoading, setOrnLoading] = useState(false);
  const [ornMessage, setOrnMessage] = useState('');
  const [ornStatus, setOrnStatus] = useState('idle'); // 'idle' | 'valid' | 'invalid'
  const ornDebounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (ornDebounceRef.current) clearTimeout(ornDebounceRef.current);
    };
  }, []);

  const handleChange = (field, value) => {
    onChange({ ...details, [field]: value });
  };

  const handleOrnChange = (e) => {
    const val = e.target.value;
    handleChange('reraOrnNumber', val);

    if (ornDebounceRef.current) {
      clearTimeout(ornDebounceRef.current);
    }

    if (!val || val.trim().length === 0) {
      setOrnLoading(false);
      setOrnMessage('');
      setOrnStatus('idle');
      return;
    }

    setOrnLoading(true);
    setOrnMessage('');

    // Debounce by 450ms to avoid spamming the rate-limited API
    ornDebounceRef.current = setTimeout(async () => {
      try {
        const res = await cmpConnectApi.checkExistence({
          type: 'AGENCY',
          orn: val.trim()
        });

        if (res?.data?.exists) {
          setOrnStatus('invalid');
          setOrnMessage(res.data.message || 'This agency (ORN) is already registered with CMP Connect.');
        } else if (res?.data?.canSubmit === false) {
          setOrnStatus('invalid');
          setOrnMessage(res.data.message || 'This ORN cannot be registered.');
        } else {
          setOrnStatus('valid');
          setOrnMessage('ORN is available for registration.');
        }
      } catch (err) {
        if (err.status === 429) {
          setOrnStatus('invalid');
          setOrnMessage('Too many checks. Please wait a minute.');
        } else {
          console.warn('ORN checkExistence error:', err.message);
          setOrnStatus('idle');
          setOrnMessage('');
        }
      } finally {
        setOrnLoading(false);
      }
    }, 450);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isDeveloper && ornStatus === 'invalid') {
      return;
    }
    onContinue();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isDeveloper ? 'Your development company' : 'Your company'}</h2>
      <p className="sub">
        These details go on your listings, contracts and invoices. Everything saves as you type.
      </p>

      {/* Contact person */}
      <section className="form-section">
        <h3>Contact person</h3>
        <div className="form-grid">
          <div className="field half">
            <label htmlFor="f-contact_first">First name</label>
            <input
              id="f-contact_first"
              type="text"
              value={details.contactFirstName || ''}
              onChange={(e) => handleChange('contactFirstName', e.target.value)}
              required
            />
          </div>
          <div className="field half">
            <label htmlFor="f-contact_last">Last name</label>
            <input
              id="f-contact_last"
              type="text"
              value={details.contactLastName || ''}
              onChange={(e) => handleChange('contactLastName', e.target.value)}
              required
            />
          </div>
          <div className="field half">
            <label htmlFor="f-contact_email">Email</label>
            <input
              id="f-contact_email"
              type="email"
              value={details.contactEmail || ''}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              required
            />
            <span className="hint">We send the upload link and all updates here.</span>
          </div>
          <div className="field half">
            <label htmlFor="f-contact_phone">Phone number</label>
            <input
              id="f-contact_phone"
              type="tel"
              value={details.contactPhone || ''}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              required
            />
          </div>
        </div>
      </section>

      {/* Company / Developer Section */}
      <section className="form-section">
        <h3>{isDeveloper ? 'Developer' : 'Company'}</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="f-company_name">
              {isDeveloper ? 'Developer name' : 'Company name'}
            </label>
            <input
              id="f-company_name"
              type="text"
              value={details.companyName || ''}
              onChange={(e) => handleChange('companyName', e.target.value)}
              required
            />
            <span className="hint">As it appears on the trade licence.</span>
          </div>

          {isDeveloper ? (
            <div className="field half">
              <label htmlFor="f-developer_kind">Developer type</label>
              <select
                id="f-developer_kind"
                value={details.developerType || 'Master developer'}
                onChange={(e) => handleChange('developerType', e.target.value)}
                required
              >
                <option value="Master developer">Master developer</option>
                <option value="Sub developer">Sub developer</option>
              </select>
            </div>
          ) : (
            <div className="field half">
              <label htmlFor="f-company_kind">Company type</label>
              <select
                id="f-company_kind"
                value={details.companyType || 'Real estate brokerage'}
                onChange={(e) => handleChange('companyType', e.target.value)}
                required
              >
                <option value="Real estate brokerage">Real estate brokerage</option>
                <option value="Property management">Property management</option>
                <option value="Holiday homes operator">Holiday homes operator</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className="field half">
            <label htmlFor="f-city">Emirate</label>
            <select
              id="f-city"
              value={details.emirate || 'Dubai'}
              onChange={(e) => handleChange('emirate', e.target.value)}
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
          </div>

          <div className="field half">
            <label htmlFor="f-licence_number">Trade licence number</label>
            <input
              id="f-licence_number"
              type="text"
              value={details.tradeLicenceNumber || ''}
              onChange={(e) => handleChange('tradeLicenceNumber', e.target.value)}
              required
            />
          </div>

          {!isDeveloper ? (
            <div className="field half">
              <label htmlFor="f-licence_state">Trade licence status</label>
              <select
                id="f-licence_state"
                value={details.tradeLicenceStatus || 'Valid and active'}
                onChange={(e) => handleChange('tradeLicenceStatus', e.target.value)}
                required
              >
                <option value="Valid and active">Valid and active</option>
                <option value="Under renewal">Under renewal</option>
                <option value="New application">New application</option>
              </select>
            </div>
          ) : (
            <div className="field half">
              <label htmlFor="f-dev_number">DLD developer registration number</label>
              <input
                id="f-dev_number"
                type="text"
                value={details.dldDeveloperNumber || ''}
                onChange={(e) => handleChange('dldDeveloperNumber', e.target.value)}
                required
              />
            </div>
          )}

          {!isDeveloper && (
            <div className="field half" data-invalid={ornStatus === 'invalid' || undefined}>
              <label htmlFor="f-orn_number">RERA ORN number</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="f-orn_number"
                  type="text"
                  placeholder="ORN-XXXXX"
                  value={details.reraOrnNumber || ''}
                  onChange={handleOrnChange}
                  required
                />
                {ornLoading && (
                  <span style={{ position: 'absolute', right: 12, top: 12, fontSize: 12, color: 'var(--cmp-text-faint)' }}>
                    Checking...
                  </span>
                )}
              </div>
              {ornMessage && (
                <span
                  className={ornStatus === 'invalid' ? 'error-text' : 'hint'}
                  style={{
                    display: 'block',
                    marginTop: 4,
                    color: ornStatus === 'valid' ? 'var(--cmp-success)' : undefined,
                    fontWeight: ornStatus === 'valid' ? 600 : undefined
                  }}
                >
                  {ornStatus === 'valid' ? `✓ ${ornMessage}` : ornMessage}
                </span>
              )}
            </div>
          )}

          <div className="field half">
            <label htmlFor="f-trn_number">
              TRN number<span className="faint"> (optional)</span>
            </label>
            <input
              id="f-trn_number"
              type="text"
              value={details.trnNumber || ''}
              onChange={(e) => handleChange('trnNumber', e.target.value)}
            />
            <span className="hint">Leave empty if you are not VAT registered.</span>
          </div>

          {!isDeveloper && (
            <div className="field half">
              <label htmlFor="f-agents">Number of agents</label>
              <select
                id="f-agents"
                value={details.numberOfAgents || '6 to 20'}
                onChange={(e) => handleChange('numberOfAgents', e.target.value)}
                required
              >
                <option value="1 to 5">1 to 5</option>
                <option value="6 to 20">6 to 20</option>
                <option value="21 to 50">21 to 50</option>
                <option value="More than 50">More than 50</option>
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor="f-address">
              {isDeveloper ? 'Head office address' : 'Office address'}
            </label>
            <input
              id="f-address"
              type="text"
              value={details.officeAddress || ''}
              onChange={(e) => handleChange('officeAddress', e.target.value)}
              required
            />
          </div>

          <div className="field half">
            <label htmlFor="f-official_email">Official company email</label>
            <input
              id="f-official_email"
              type="email"
              value={details.officialEmail || ''}
              onChange={(e) => handleChange('officialEmail', e.target.value)}
              required
            />
          </div>

          <div className="field half">
            <label htmlFor="f-official_phone">Official company phone</label>
            <input
              id="f-official_phone"
              type="tel"
              value={details.officialPhone || ''}
              onChange={(e) => handleChange('officialPhone', e.target.value)}
              required
            />
          </div>

          <div className="field half">
            <label htmlFor="f-website">
              Website<span className="faint"> (optional)</span>
            </label>
            <input
              id="f-website"
              type="text"
              value={details.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* First project (Developer only) */}
      {isDeveloper && (
        <section className="form-section">
          <h3>First project</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="f-project_name">First project name</label>
              <input
                id="f-project_name"
                type="text"
                value={details.projectName || 'Aurora Heights'}
                onChange={(e) => handleChange('projectName', e.target.value)}
                required
              />
            </div>

            <div className="field half">
              <label htmlFor="f-project_community">Community</label>
              <input
                id="f-project_community"
                type="text"
                value={details.projectCommunity || 'Dubai Hills Estate'}
                onChange={(e) => handleChange('projectCommunity', e.target.value)}
                required
              />
            </div>

            <div className="field half">
              <label htmlFor="f-project_registration_number">RERA project number</label>
              <input
                id="f-project_registration_number"
                type="text"
                value={details.projectRegistrationNumber || 'RERA-P-7781'}
                onChange={(e) => handleChange('projectRegistrationNumber', e.target.value)}
                required
              />
            </div>

            <div className="field half">
              <label htmlFor="f-project_units">Number of units</label>
              <input
                id="f-project_units"
                type="number"
                value={details.projectUnits || 214}
                onChange={(e) => handleChange('projectUnits', e.target.value)}
                required
              />
            </div>

            <div className="field half">
              <label htmlFor="f-project_handover">Expected handover</label>
              <input
                id="f-project_handover"
                type="text"
                value={details.projectHandover || 'Q4 2028'}
                onChange={(e) => handleChange('projectHandover', e.target.value)}
                required
              />
              <span className="hint">For example Q4 2028.</span>
            </div>

            <div className="field half">
              <label htmlFor="f-escrow_bank">Escrow bank</label>
              <input
                id="f-escrow_bank"
                type="text"
                value={details.escrowBank || 'Emirates NBD'}
                onChange={(e) => handleChange('escrowBank', e.target.value)}
                required
              />
            </div>

            <div className="field half">
              <label htmlFor="f-escrow_number">Escrow account number</label>
              <input
                id="f-escrow_number"
                type="text"
                value={details.escrowNumber || 'AE07 0331 2345 6789 0123 456'}
                onChange={(e) => handleChange('escrowNumber', e.target.value)}
                required
              />
            </div>
          </div>
        </section>
      )}

      {/* Signatory */}
      <section className="form-section">
        <h3>Signatory</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="f-signatory_name">Signatory full name</label>
            <input
              id="f-signatory_name"
              type="text"
              value={details.signatoryName || ''}
              onChange={(e) => handleChange('signatoryName', e.target.value)}
              required
            />
            <span className="hint">Exactly as printed on the Emirates ID.</span>
          </div>

          <div className="field half">
            <label htmlFor="f-signatory_designation">Position</label>
            <input
              id="f-signatory_designation"
              type="text"
              value={details.signatoryDesignation || ''}
              onChange={(e) => handleChange('signatoryDesignation', e.target.value)}
              required
            />
          </div>

          <div className="field half">
            <label htmlFor="f-signatory_is_owner">Is the signatory the owner or a listed manager?</label>
            <select
              id="f-signatory_is_owner"
              value={details.signatoryIsOwner || 'Yes'}
              onChange={(e) => handleChange('signatoryIsOwner', e.target.value)}
              required
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            <span className="hint">If not, we need a power of attorney.</span>
          </div>
        </div>
      </section>

      {/* Owner and admin */}
      <section className="form-section">
        <h3>Owner and admin</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="f-owner_name">Owner full name</label>
            <input
              id="f-owner_name"
              type="text"
              value={details.ownerName || ''}
              onChange={(e) => handleChange('ownerName', e.target.value)}
              required
            />
          </div>

          <div className="field half">
            <label htmlFor="f-owner_email">Owner email</label>
            <input
              id="f-owner_email"
              type="email"
              value={details.ownerEmail || ''}
              onChange={(e) => handleChange('ownerEmail', e.target.value)}
              required
            />
          </div>

          <div className="field half">
            <label htmlFor="f-owner_mobile">Owner mobile</label>
            <input
              id="f-owner_mobile"
              type="tel"
              value={details.ownerMobile || ''}
              onChange={(e) => handleChange('ownerMobile', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="f-admin_name">Admin full name</label>
            <input
              id="f-admin_name"
              type="text"
              value={details.adminName || ''}
              onChange={(e) => handleChange('adminName', e.target.value)}
              required
            />
            <span className="hint">The person who runs the account day to day.</span>
          </div>

          <div className="field half">
            <label htmlFor="f-admin_email">Admin email</label>
            <input
              id="f-admin_email"
              type="email"
              value={details.adminEmail || ''}
              onChange={(e) => handleChange('adminEmail', e.target.value)}
              required
            />
          </div>

          <div className="field half">
            <label htmlFor="f-admin_mobile">Admin mobile</label>
            <input
              id="f-admin_mobile"
              type="tel"
              value={details.adminMobile || ''}
              onChange={(e) => handleChange('adminMobile', e.target.value)}
              required
            />
          </div>
        </div>
      </section>

      <div className="btn-row">
        <button type="submit" className="btn btn-primary">
          Continue to documents
        </button>
        <button type="button" className="btn btn-ghost" onClick={onSaveLater}>
          Save and finish later
        </button>
      </div>
    </form>
  );
}
