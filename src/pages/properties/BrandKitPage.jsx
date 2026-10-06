import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Image, Type, Check, Sliders } from 'lucide-react';

export default function BrandKitPage() {
  const { agency } = useApp();
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkType, setWatermarkType] = useState('text'); // 'text' | 'image'
  const [watermarkText, setWatermarkText] = useState(agency.name);
  const [opacity, setOpacity] = useState(50);
  const [scale, setScale] = useState(50);
  const [position, setPosition] = useState('center'); // 'top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'
  const [saved, setSaved] = useState(false);

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: '12%', left: '8%', transform: 'translate(0, 0)' };
      case 'top':
        return { top: '12%', left: '50%', transform: 'translate(-50%, 0)' };
      case 'top-right':
        return { top: '12%', right: '8%', transform: 'translate(0, 0)' };
      case 'left':
        return { top: '50%', left: '8%', transform: 'translate(0, -50%)' };
      case 'right':
        return { top: '50%', right: '8%', transform: 'translate(0, -50%)' };
      case 'bottom-left':
        return { bottom: '12%', left: '8%', transform: 'translate(0, 0)' };
      case 'bottom':
        return { bottom: '12%', left: '50%', transform: 'translate(-50%, 0)' };
      case 'bottom-right':
        return { bottom: '12%', right: '8%', transform: 'translate(0, 0)' };
      case 'center':
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '24px' }}>Brand kit</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
          Your agency watermark on every property photo, ensuring your photos stay yours wherever shared.
        </p>
      </div>

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
              aria-checked={watermarkEnabled}
              onClick={() => setWatermarkEnabled(!watermarkEnabled)}
              style={{
                position: 'relative',
                width: '38px',
                height: '22px',
                borderRadius: '999px',
                border: `1px solid ${watermarkEnabled ? 'var(--cmp-brand)' : 'var(--cmp-border)'}`,
                background: watermarkEnabled ? 'var(--cmp-brand)' : 'var(--cmp-surface-sunken)',
                cursor: 'pointer',
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

          {/* Watermark Type Selector */}
          <div>
            <label>Watermark Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="card"
                onClick={() => setWatermarkType('image')}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'grid',
                  justifyItems: 'center',
                  gap: '6px',
                  border: watermarkType === 'image' ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                  background: watermarkType === 'image' ? 'var(--cmp-brand-subtle)' : 'var(--cmp-surface)'
                }}
              >
                <Image size={18} style={{ color: 'var(--cmp-brand)' }} />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Logo Image</span>
              </button>

              <button
                type="button"
                className="card"
                onClick={() => setWatermarkType('text')}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'grid',
                  justifyItems: 'center',
                  gap: '6px',
                  border: watermarkType === 'text' ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                  background: watermarkType === 'text' ? 'var(--cmp-brand-subtle)' : 'var(--cmp-surface)'
                }}
              >
                <Type size={18} style={{ color: 'var(--cmp-brand)' }} />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Agency Text</span>
              </button>
            </div>
          </div>

          {/* Text Input */}
          {watermarkType === 'text' && (
            <div>
              <label>Watermark Text</label>
              <input
                maxLength={40}
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
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              style={{ height: '24px', accentColor: 'var(--cmp-brand)', cursor: 'pointer' }}
            />
          </div>

          {/* Size / Scale Slider */}
          <div>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>Proportions & Scale</label>
              <span className="muted" style={{ fontSize: '13px' }}>{scale}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              style={{ height: '24px', accentColor: 'var(--cmp-brand)', cursor: 'pointer' }}
            />
          </div>

          <p className="faint" style={{ margin: 0, fontSize: '12px' }}>
            Choose where the watermark sits by clicking any circle hotspot on the photo preview.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
          >
            {saved ? <Check size={16} /> : null}
            <span>{saved ? 'Changes saved!' : 'Apply watermark changes'}</span>
          </button>
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
                  color: '#FFFFFF',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontSize: `${(scale / 50) * 15}px`,
                  textShadow: '0 1px 8px rgba(0,0,0,0.7)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  ...getPositionStyles()
                }}
              >
                {watermarkText}
              </div>
            )}

            {/* 9 Hotspot Buttons */}
            {[
              { pos: 'top-left', style: { top: '8%', left: '6%' } },
              { pos: 'top', style: { top: '8%', left: '50%', transform: 'translateX(-50%)' } },
              { pos: 'top-right', style: { top: '8%', right: '6%' } },
              { pos: 'left', style: { top: '50%', left: '6%', transform: 'translateY(-50%)' } },
              { pos: 'center', style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } },
              { pos: 'right', style: { top: '50%', right: '6%', transform: 'translateY(-50%)' } },
              { pos: 'bottom-left', style: { bottom: '8%', left: '6%' } },
              { pos: 'bottom', style: { bottom: '8%', left: '50%', transform: 'translateX(-50%)' } },
              { pos: 'bottom-right', style: { bottom: '8%', right: '6%' } }
            ].map((spot) => (
              <button
                key={spot.pos}
                type="button"
                onClick={() => setPosition(spot.pos)}
                title={`Position: ${spot.pos}`}
                style={{
                  position: 'absolute',
                  width: '22px',
                  height: '22px',
                  borderRadius: position === spot.pos ? '6px' : '50%',
                  border: '2px solid #FFFFFF',
                  background: position === spot.pos ? 'var(--cmp-accent)' : 'rgba(255,255,255,0.3)',
                  boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
                  cursor: 'pointer',
                  zIndex: 10,
                  ...spot.style
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
