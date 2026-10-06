import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building, Shield, Check, Save } from 'lucide-react';

export default function AgencyProfilePage() {
  const { agency, setAgency } = useApp();
  const [formData, setFormData] = useState({ ...agency });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAgency(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '24px' }}>Agency Profile & Government Registrations</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
          Details shown on your public agency portal, printed on marketing brochures and verified by RERA.
        </p>
      </div>

      <div className="card" style={{ padding: '24px', maxWidth: '880px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label>Agency Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label>RERA Office Reg. Number (ORN)</label>
              <input
                value={formData.orn}
                onChange={(e) => setFormData({ ...formData, orn: e.target.value })}
              />
              <p className="faint" style={{ fontSize: '11.5px', margin: '4px 0 0' }}>Required for portal verification</p>
            </div>
            <div>
              <label>Trade License Number</label>
              <input
                value={formData.tradeLicense}
                onChange={(e) => setFormData({ ...formData, tradeLicense: e.target.value })}
              />
            </div>
            <div>
              <label>Dubai Economy (DED) License</label>
              <input
                value={formData.ded}
                onChange={(e) => setFormData({ ...formData, ded: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label>Agency Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label>Office Phone</label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label>Official WhatsApp Number</label>
              <input
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label>Office Address</label>
            <input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label>Agency Website URL</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          <div className="row" style={{ gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary">
              {saved ? <Check size={16} /> : <Save size={16} />}
              <span>{saved ? 'Changes saved!' : 'Save changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
