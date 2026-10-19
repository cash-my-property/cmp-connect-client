import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X, AlertCircle } from 'lucide-react';

/**
 * Google Places Location Autocomplete & Geocoding Input
 * Automatically fetches suggestions on change and sets address + latitude/longitude coordinates.
 */
export default function GooglePlacesLocationInput({
  value = '',
  onChange,
  onSelectLocation,
  placeholder = 'Search community, building or address in Dubai/UAE...',
  disabled = false,
  required = false,
  className = '',
  style = {}
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);

  // Read Google Maps API Key from Vite env with direct fallback to ensure it works even if Vite wasn't restarted
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_PLACES_API_KEY ||
    import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (typeof window !== 'undefined' ? window.GOOGLE_MAPS_API_KEY : '') ||
    'AIzaSyAa6MFidWTUkHvqhB5tDI_gl_JXccsOWoo';

  // Keep internal state in sync with external value
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Dynamically load Google Maps script if API key is provided
  useEffect(() => {
    if (!apiKey) return;

    if (window.google?.maps?.places) {
      setIsScriptLoaded(true);
      return;
    }

    // Global Google Maps callback
    window.__onGoogleMapsApiLoaded = () => {
      console.log('[GooglePlacesLocationInput] Google Maps callback fired successfully');
      if (window.google?.maps?.places) {
        setIsScriptLoaded(true);
      }
    };

    window.gm_authFailure = () => {
      console.error('[GooglePlacesLocationInput] Google Maps API Authentication failed. Check API key permissions/restrictions.');
      setScriptError('Google Maps API authentication failed. Verify API key permissions.');
    };

    const scriptId = 'google-maps-places-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      if (window.google?.maps?.places) {
        setIsScriptLoaded(true);
      } else {
        existingScript.addEventListener('load', () => {
          if (window.google?.maps?.places) setIsScriptLoaded(true);
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__onGoogleMapsApiLoaded`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps?.places) {
        setIsScriptLoaded(true);
      }
    };

    script.onerror = () => {
      setScriptError('Failed to load Google Maps API script.');
      console.error('[GooglePlacesLocationInput] Script load error');
    };

    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize AutocompleteService and Geocoder once script is ready
  useEffect(() => {
    if (isScriptLoaded && window.google?.maps) {
      try {
        if (window.google.maps.places?.AutocompleteService) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
        if (window.google.maps.Geocoder) {
          geocoderRef.current = new window.google.maps.Geocoder();
        }
        console.log('[GooglePlacesLocationInput] AutocompleteService & Geocoder initialized!');
      } catch (err) {
        console.warn('[GooglePlacesLocationInput] Service init error:', err);
      }
    }
  }, [isScriptLoaded]);

  // Fetch predictions function
  const fetchPredictions = useCallback((query) => {
    if (!query || query.length < 2 || !autocompleteServiceRef.current) {
      return;
    }

    setIsLoading(true);
    console.log('[GooglePlacesLocationInput] Querying predictions for:', query);

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'ae' } // UAE restriction
      },
      (predictions, status) => {
        console.log('[GooglePlacesLocationInput] UAE Predictions result:', { status, count: predictions?.length });

        if (
          (status === 'OK' || status === window.google?.maps?.places?.PlacesServiceStatus?.OK) &&
          Array.isArray(predictions) &&
          predictions.length > 0
        ) {
          setIsLoading(false);
          setSuggestions(predictions);
          setIsOpen(true);
          setScriptError(null);
        } else {
          // Fallback: search globally without restriction if 0 results
          autocompleteServiceRef.current.getPlacePredictions(
            { input: query },
            (globalPredictions, globalStatus) => {
              setIsLoading(false);
              console.log('[GooglePlacesLocationInput] Global Predictions fallback:', { status: globalStatus, count: globalPredictions?.length });

              if (
                (globalStatus === 'OK' || globalStatus === window.google?.maps?.places?.PlacesServiceStatus?.OK) &&
                Array.isArray(globalPredictions) &&
                globalPredictions.length > 0
              ) {
                setSuggestions(globalPredictions);
                setIsOpen(true);
                setScriptError(null);
              } else {
                setSuggestions([]);
                if (globalStatus === 'REQUEST_DENIED') {
                  setScriptError('Google API Request Denied: Please enable "Places API" in Google Cloud Console.');
                }
              }
            }
          );
        }
      }
    );
  }, []);

  // Debounced search predictions for user typing
  useEffect(() => {
    const query = inputValue.trim();

    if (!query || query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchPredictions(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [inputValue, isScriptLoaded, fetchPredictions]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    onChange?.(text);
  };

  const handleSelectPrediction = (prediction) => {
    const placeId = prediction.place_id;
    const fullAddress = prediction.description;

    setInputValue(fullAddress);
    onChange?.(fullAddress);
    setIsOpen(false);
    setSuggestions([]);

    if (!geocoderRef.current) {
      onSelectLocation?.({ address: fullAddress, lat: null, lng: null });
      return;
    }

    setIsLoading(true);
    geocoderRef.current.geocode({ placeId }, (results, status) => {
      setIsLoading(false);
      if (status === 'OK' && results && results[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const lat = Number(loc.lat().toFixed(6));
        const lng = Number(loc.lng().toFixed(6));

        console.log('[GooglePlacesLocationInput] Location selected:', { address: fullAddress, lat, lng });

        onSelectLocation?.({
          address: fullAddress,
          lat,
          lng,
          placeId,
          formattedAddress: results[0].formatted_address
        });
      } else {
        console.warn('[GooglePlacesLocationInput] Geocode failed:', status);
        onSelectLocation?.({ address: fullAddress, lat: null, lng: null });
      }
    });
  };

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    } else if (inputValue && inputValue.trim().length >= 2) {
      fetchPredictions(inputValue.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={className}
          style={{
            width: '100%',
            paddingRight: '68px'
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isLoading && (
            <Loader2
              size={16}
              className="spin"
              style={{ color: 'var(--cmp-brand)', pointerEvents: 'none' }}
            />
          )}

          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: 'var(--cmp-text-faint)',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%'
              }}
              title="Clear input"
            >
              <X size={15} />
            </button>
          )}

          <MapPin size={17} style={{ color: 'var(--cmp-text-faint)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Script error or API Notice */}
      {scriptError && (
        <p
          style={{
            fontSize: '11.5px',
            margin: '5px 0 0',
            color: 'var(--cmp-danger, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>{scriptError}</span>
        </p>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            background: 'var(--cmp-surface)',
            border: '1px solid var(--cmp-border)',
            borderRadius: '10px',
            boxShadow: '0 12px 28px -4px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.08)',
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '4px 0'
          }}
        >
          {suggestions.map((item) => {
            const mainText = item.structured_formatting?.main_text || item.description;
            const secondaryText = item.structured_formatting?.secondary_text || '';

            return (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelectPrediction(item)}
                style={{
                  width: '100%',
                  textAlign: 'start',
                  padding: '9px 14px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--cmp-brand-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <MapPin
                  size={15}
                  style={{
                    color: 'var(--cmp-brand)',
                    marginTop: '2px',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: 'var(--cmp-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {mainText}
                  </div>
                  {secondaryText && (
                    <div
                      className="faint"
                      style={{
                        fontSize: '11.5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {secondaryText}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
