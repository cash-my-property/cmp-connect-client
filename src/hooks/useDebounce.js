import { useState, useEffect } from 'react';

/**
 * Hook to debounce any fast-changing value
 * @param {any} value
 * @param {number} delay In milliseconds (default 250ms)
 * @returns {any} debouncedValue
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
