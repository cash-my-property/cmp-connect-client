import React from 'react';

/**
 * CMP Custom Range Slider
 * Automatically fills the track with the brand color up to the current value.
 * Guaranteed 100% fill at max value with zero unfilled gap at the end.
 */
export default function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value = 0,
  onChange,
  disabled = false,
  className = '',
  style = {}
}) {
  const numVal = Number(value ?? 0);
  const numMin = Number(min);
  const numMax = Number(max);
  const pct =
    numMax > numMin
      ? Math.min(100, Math.max(0, ((numVal - numMin) / (numMax - numMin)) * 100))
      : 100;

  return (
    <input
      type="range"
      min={numMin}
      max={numMax}
      step={step}
      disabled={disabled}
      value={numVal}
      onChange={onChange}
      className={`cmp-range-slider ${className}`.trim()}
      style={{
        background: `linear-gradient(to right, var(--cmp-brand) 0%, var(--cmp-brand) ${pct}%, var(--cmp-border) ${pct}%, var(--cmp-border) 100%)`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style
      }}
    />
  );
}
