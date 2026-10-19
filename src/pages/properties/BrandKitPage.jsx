import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';
import { Image, Type, Check, Sliders, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RangeSlider } from '../../components/ui';

const POSITION_MAP = {
  TOP_LEFT: { top: '8%', left: '6%', transform: 'none' },
  TOP: { top: '8%', left: '50%', transform: 'translateX(-50%)' },
  TOP_RIGHT: { top: '8%', right: '6%', transform: 'none' },
  LEFT: { top: '50%', left: '6%', transform: 'translateY(-50%)' },
  CENTER: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  RIGHT: { top: '50%', right: '6%', transform: 'translateY(-50%)' },
  BOTTOM_LEFT: { bottom: '8%', left: '6%', transform: 'none' },
  BOTTOM: { bottom: '8%', left: '50%', transform: 'translateX(-50%)' },
  BOTTOM_RIGHT: { bottom: '8%', right: '6%', transform: 'none' }
};

export default function BrandKitPage() {
  const { agency, isLiveData, authToken, can } = useApp();

  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkType, setWatermarkType] = useState('IMAGE'); // 'IMAGE' | 'TEXT'
  const [watermarkText, setWatermarkText] = useState(agency?.name || 'CMP Prime');
  const [imageUrl, setImageUrl] = useState(null);
  const [usingCompanyLogo, setUsingCompanyLogo] = useState(true);
  const [opacity, setOpacity] = useState(50);
  const [scale, setScale] = useState(50);
  const [position, setPosition] = useState('BOTTOM_RIGHT');
  const [applied, setApplied] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const canEdit = isLiveData ? can('company.watermark') : true;

  // Load Brand Kit from API
  useEffect(() => {
    if (isLiveData && authToken) {
      setIsLoading(true);
      cmpConnectApi.getBrandKit(authToken)
        .then((res) => {
          const b = res?.data;
          if (b) {
            setWatermarkEnabled(Boolean(b.enabled));
            setWatermarkType(b.type || 'IMAGE');
            setWatermarkText(b.text || agency?.name || 'CMP Prime');
            setImageUrl(b.imageUrl || null);
            setUsingCompanyLogo(Boolean(b.usingCompanyLogo));
            setOpacity(b.opacity ?? 50);
            setScale(b.size ?? 50);
            setPosition(b.position || 'BOTTOM_RIGHT');
            setApplied(b.applied !== false);
          }
        })
        .catch((err) => {
          console.warn('[BrandKit] Fetch error:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isLiveData, authToken, agency]);

  // Handle Logo Upload to Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const sigRes = await cmpConnectApi.getBrandKitUploadSignature(authToken);
      const sig = sigRes?.data;
      if (!sig) throw new Error('Could not get upload signature.');

      const uploaded = await cmpConnectApi.uploadListingFileToCloudinary(file, sig);
      setImageUrl(uploaded.url);
      setUsingCompanyLogo(false);

      // Save image to backend
      await cmpConnectApi.updateBrandKit(
        {
          image: { url: uploaded.url, public_id: uploaded.public_id }
        },
        authToken
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('[BrandKit upload error]', err);
      setErrorMsg(err.message || 'Image upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleUseCompanyLogo = async () => {
    if (!canEdit) return;
    try {
      const res = await cmpConnectApi.updateBrandKit({ image: null }, authToken);
      if (res?.data) {
        setImageUrl(res.data.imageUrl);
        setUsingCompanyLogo(true);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to revert to company logo.');
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;

    if (!isLiveData || !authToken) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        enabled: watermarkEnabled,
        type: watermarkType,
        text: watermarkType === 'TEXT' ? watermarkText.trim() : null,
        opacity: Number(opacity),
        size: Number(scale),
        position
      };

      const res = await cmpConnectApi.updateBrandKit(payload, authToken);
      if (res?.data) {
        setWatermarkEnabled(Boolean(res.data.enabled));
        setWatermarkType(res.data.type);
        setWatermarkText(res.data.text || '');
        setImageUrl(res.data.imageUrl);
        setOpacity(res.data.opacity);
        setScale(res.data.size);
        setPosition(res.data.position);
        setApplied(res.data.applied !== false);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('[BrandKit save error]', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save brand kit.';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '24px', margin: 0, letterSpacing: '-0.02em' }}>
          Brand kit & Watermark
        </h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
          Configure your company logo or text watermark to protect listing photos across portals.
        </p>
      </div>

      {!canEdit && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            background: 'var(--cmp-surface-sunken)',
            border: '1px solid var(--cmp-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}
        >
          <AlertCircle size={16} className="muted" />
          <span>You have read-only access. Only users with the <strong>company.watermark</strong> permission can change watermark settings.</span>
        </div>
      )}

      {errorMsg && (
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
            gap: '8px',
            fontSize: '13.5px'
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div
        className="card"
        style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)',
          gap: '28px'
        }}
      >
        {/* Controls Column */}
        <div style={{ display: 'grid', gap: '20px', alignContent: 'start' }}>
          {/* Watermark Active Toggle */}
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>Watermark on listing photos</span>
            <button
              type="button"
              role="switch"
              disabled={!canEdit}
              aria-checked={watermarkEnabled}
              onClick={() => setWatermarkEnabled(!watermarkEnabled)}
              style={{
                position: 'relative',
                width: '38px',
                height: '22px',
                borderRadius: '999px',
                border: `1px solid ${watermarkEnabled ? 'var(--cmp-brand)' : 'var(--cmp-border)'}`,
                background: watermarkEnabled ? 'var(--cmp-brand)' : 'var(--cmp-surface-sunken)',
                cursor: canEdit ? 'pointer' : 'not-allowed',
                padding: 0
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: watermarkEnabled ? '18px' : '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  transition: 'left 0.15s ease'
                }}
              />
            </button>
          </div>

          {/* Warning banner when watermark enabled but not applied */}
          {watermarkEnabled && !applied && (
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid var(--cmp-danger)',
                borderRadius: 'var(--cmp-radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <AlertCircle size={17} style={{ color: 'var(--cmp-danger)', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '12.5px', color: 'var(--cmp-text)' }}>
                <strong style={{ color: 'var(--cmp-danger)' }}>Watermark not currently active:</strong> Photos are not being watermarked yet because a valid logo or text watermark is missing. Please upload a logo or enter text below.
              </div>
            </div>
          )}

          {/* Watermark Type Selector */}
          <div>
            <label>Watermark Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="card"
                disabled={!canEdit}
                onClick={() => setWatermarkType('IMAGE')}
                style={{
                  padding: '12px',
                  cursor: canEdit ? 'pointer' : 'not-allowed',
                  display: 'grid',
                  justifyItems: 'center',
                  gap: '6px',
                  border: watermarkType === 'IMAGE' ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                  background: watermarkType === 'IMAGE' ? 'var(--cmp-brand-subtle)' : 'var(--cmp-surface)'
                }}
              >
                <Image size={18} style={{ color: 'var(--cmp-brand)' }} />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Logo Image</span>
              </button>

              <button
                type="button"
                className="card"
                disabled={!canEdit}
                onClick={() => setWatermarkType('TEXT')}
                style={{
                  padding: '12px',
                  cursor: canEdit ? 'pointer' : 'not-allowed',
                  display: 'grid',
                  justifyItems: 'center',
                  gap: '6px',
                  border: watermarkType === 'TEXT' ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                  background: watermarkType === 'TEXT' ? 'var(--cmp-brand-subtle)' : 'var(--cmp-surface)'
                }}
              >
                <Type size={18} style={{ color: 'var(--cmp-brand)' }} />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Company Text</span>
              </button>
            </div>
          </div>

          {/* Logo image controls */}
          {watermarkType === 'IMAGE' && (
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>Watermark Image</label>
              <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Current watermark"
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      background: 'var(--cmp-surface-sunken)',
                      padding: '4px',
                      border: '1px solid var(--cmp-border)'
                    }}
                  />
                )}
                {canEdit && (
                  <label className="btn btn-outline btn-sm" style={{ cursor: isUploading ? 'wait' : 'pointer' }}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: 'none' }}
                      disabled={isUploading}
                      onChange={handleImageUpload}
                    />
                    {isUploading ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
                    <span>Upload Custom Watermark</span>
                  </label>
                )}
              </div>
              {!usingCompanyLogo && canEdit && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '12px', justifyContent: 'flex-start', padding: 0 }}
                  onClick={handleUseCompanyLogo}
                >
                  Use company profile logo instead
                </button>
              )}
            </div>
          )}

          {/* Text Input */}
          {watermarkType === 'TEXT' && (
            <div>
              <label>Watermark Text (Max 40 chars)</label>
              <input
                maxLength={40}
                disabled={!canEdit}
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
              />
            </div>
          )}

          {/* Opacity Range Slider */}
          <div>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>Opacity</label>
              <span className="muted" style={{ fontSize: '13px' }}>{opacity}%</span>
            </div>
            <RangeSlider
              min={0}
              max={100}
              step={1}
              disabled={!canEdit}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
            />
          </div>

          {/* Size / Scale Slider */}
          <div>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>Size & Scale</label>
              <span className="muted" style={{ fontSize: '13px' }}>{scale}%</span>
            </div>
            <RangeSlider
              min={10}
              max={100}
              step={1}
              disabled={!canEdit}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
          </div>

          {canEdit && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSaving || isUploading}
              onClick={handleSave}
            >
              {isSaving ? <Loader2 size={16} className="spin" /> : saved ? <Check size={16} /> : null}
              <span>{saved ? 'Changes saved!' : 'Apply watermark changes'}</span>
            </button>
          )}
        </div>

        {/* Live Photo Preview with 9-point hotspot grid */}
        <div>
          <label style={{ marginBottom: '8px' }}>Live Watermark Preview</label>
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--cmp-radius-lg)',
              overflow: 'hidden',
              aspectRatio: '16 / 9',
              background: '#04150E',
              boxShadow: 'var(--cmp-shadow-md)'
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=900&q=70"
              alt="Sample Listing Watermark Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Dynamic Watermark Element */}
            {watermarkEnabled && (
              <div
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  opacity: opacity / 100,
                  width: `${scale * 0.4}%`,
                  maxWidth: '45%',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: position.includes('RIGHT') ? 'flex-end' : position.includes('LEFT') ? 'flex-start' : 'center',
                  ...(POSITION_MAP[position] || POSITION_MAP.BOTTOM_RIGHT)
                }}
              >
                {watermarkType === 'IMAGE' && imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Watermark preview"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '130px',
                      objectFit: 'contain',
                      display: 'block',
                      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.75))'
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      fontSize: `${Math.max(12, scale * 0.28)}px`,
                      letterSpacing: '0.04em',
                      textShadow: '0 2px 6px rgba(0,0,0,0.85)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {watermarkText}
                  </span>
                )}
              </div>
            )}

            {/* 9 Hotspot Buttons */}
            {Object.entries(POSITION_MAP).map(([posKey, posStyle]) => (
              <button
                key={posKey}
                type="button"
                disabled={!canEdit}
                onClick={() => setPosition(posKey)}
                title={`Position: ${posKey}`}
                style={{
                  position: 'absolute',
                  width: '22px',
                  height: '22px',
                  borderRadius: position === posKey ? '6px' : '50%',
                  border: '2px solid #FFFFFF',
                  background: position === posKey ? 'var(--cmp-accent)' : 'rgba(255,255,255,0.3)',
                  boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
                  cursor: canEdit ? 'pointer' : 'default',
                  zIndex: 10,
                  ...posStyle
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
