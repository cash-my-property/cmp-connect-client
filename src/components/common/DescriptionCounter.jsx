import React from 'react';

// Server rules (cmpConnectListingRules / validations): at least 20 characters to submit, at most 5000.
const MIN_CHARS = 20;
const MAX_CHARS = 5000;

const countWords = (text) => {
  const trimmed = String(text || '').trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

/**
 * Live word + character count shown under a description textarea.
 */
export default function DescriptionCounter({ text = '', min = MIN_CHARS, max = MAX_CHARS }) {
  const chars = String(text || '').trim().length;
  const words = countWords(text);
  const tooShort = chars > 0 && chars < min;
  const tooLong = chars > max;

  return (
    <div
      className="faint"
      aria-live="polite"
      style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '11.5px', marginTop: 4 }}
    >
      <span style={{ color: tooShort || tooLong ? 'var(--cmp-danger)' : undefined }}>
        {tooShort && `At least ${min} characters needed to submit.`}
        {tooLong && `Too long: maximum ${max.toLocaleString()} characters.`}
      </span>
      <span style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {words} {words === 1 ? 'word' : 'words'} · {chars.toLocaleString()} / {max.toLocaleString()} characters
      </span>
    </div>
  );
}
