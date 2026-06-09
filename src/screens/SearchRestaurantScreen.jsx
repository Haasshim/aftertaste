import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchRestaurants } from '../lib/places';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import OfflineBanner from '../components/OfflineBanner';
import { colors, font, radius, shadow } from '../theme/theme';

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="65" height="65"><rect width="65" height="65" fill="#E8F0EB"/></svg>`
  );

const LOCATION_KEY = 'aftertaste:lastLocation';

export default function SearchRestaurantScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem(LOCATION_KEY) || '';
    // Don't pre-fill raw GPS coords into the visible text field.
    return /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(saved) ? '' : saved;
  });
  const [coords, setCoords] = useState(null); // "lat,lng" when GPS is used
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('static');

  const runSearch = useCallback(async (q, loc) => {
    setLoading(true);
    setError(null);
    try {
      const { restaurants, source: src } = await searchRestaurants(q, loc);
      setResults(restaurants);
      setSource(src);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Location is not available on this device.');
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
        setCoords(c);
        setLocation('My current location');
        localStorage.setItem(LOCATION_KEY, c);
        setLocating(false);
      },
      () => {
        setLocError('Could not get your location. Type an area instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const onLocationType = (e) => {
    setLocation(e.target.value);
    setCoords(null); // typing overrides GPS
    localStorage.setItem(LOCATION_KEY, e.target.value);
  };

  // The location actually sent: GPS coords take priority over typed text.
  const effectiveLocation = coords || (location === 'My current location' ? '' : location);

  // Debounce the query + location.
  useEffect(() => {
    const t = setTimeout(() => runSearch(query, effectiveLocation), 350);
    return () => clearTimeout(t);
  }, [query, effectiveLocation, runSearch]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.iconBtn} aria-label="Go back" onClick={() => navigate(-1)}>
          <Icon name="back" size={24} color={colors.white} />
        </button>
        <h2 style={styles.headerTitle}>Find a Restaurant</h2>
        <div style={{ width: '40px' }} />
      </div>

      <OfflineBanner />

      <div style={styles.searchBar}>
        <Icon name="search" size={20} color={colors.mediumGray} />
        <input
          style={styles.searchInput}
          placeholder="Search by name, location, or cuisine..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button style={styles.clearBtn} aria-label="Clear search" onClick={() => setQuery('')}>
            <Icon name="x-circle" size={18} color={colors.mediumGray} />
          </button>
        )}
      </div>

      {/* Location row: type an area or use device GPS */}
      <div style={styles.locationBar}>
        <Icon name="map-pin" size={18} color={colors.mediumGray} />
        <input
          style={styles.locationInput}
          placeholder="Area or city (e.g. T. Nagar, Chennai)"
          value={location}
          onChange={onLocationType}
        />
        <button
          style={styles.gpsBtn}
          aria-label="Use my current location"
          onClick={useMyLocation}
          disabled={locating}
        >
          {locating ? <Spinner size={16} /> : <Icon name="map-pin" size={16} color={colors.brg} />}
          <span style={styles.gpsBtnText}>{coords ? 'Located' : 'Use GPS'}</span>
        </button>
      </div>
      {locError && <p style={styles.locError}>{locError}</p>}

      <div style={styles.list}>
        {loading ? (
          <div style={styles.center}><Spinner size={30} /></div>
        ) : error ? (
          <ErrorState error={error} onRetry={() => runSearch(query)} />
        ) : results.length === 0 ? (
          <div style={styles.empty}>
            <Icon name="menu" size={48} color={colors.mediumGray} strokeWidth={1.5} />
            <h3 style={{ fontSize: '18px', color: colors.dark, marginTop: '12px' }}>No restaurants found</h3>
            <p style={{ fontSize: '14px', color: colors.gray, textAlign: 'center', marginTop: '8px', lineHeight: '20px' }}>
              Try a different name, location, or cuisine.
            </p>
          </div>
        ) : (
          results.map((r) => (
            <div key={r.id} style={styles.card} onClick={() => navigate(`/restaurant/${r.id}`)}>
              <img
                src={r.image || FALLBACK_IMG}
                alt={r.name}
                style={styles.cardImg}
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
              />
              <div style={styles.cardContent}>
                <h3 style={styles.cardName}>{r.name}</h3>
                <p style={styles.cardLocation}>
                  <Icon name="map-pin" size={13} color={colors.gray} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }} />
                  {r.location}
                </p>
                {r.cuisine?.length > 0 && <p style={styles.cardCuisine}>{r.cuisine.join(' • ')}</p>}
                {r.priceForTwo && <p style={styles.cardPrice}>{'₹'}{r.priceForTwo} for two</p>}
              </div>
              <Icon name="chevron-right" size={20} color={colors.mediumGray} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', background: colors.offWhite },
  header: {
    background: colors.brg,
    padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 16px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  iconBtn: { width: '40px', height: '40px', borderRadius: '20px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  headerTitle: { fontSize: '18px', fontWeight: 700, color: colors.white, margin: 0 },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: colors.white,
    margin: '16px 16px 8px',
    borderRadius: '14px',
    padding: '4px 14px',
    boxShadow: shadow.card,
    flexShrink: 0,
  },
  searchInput: { flex: 1, border: 'none', fontSize: '16px', color: colors.dark, padding: '12px 4px', background: 'transparent' },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' },
  locationBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: colors.white,
    margin: '0 16px 4px',
    borderRadius: '14px',
    padding: '2px 12px',
    boxShadow: shadow.card,
    flexShrink: 0,
  },
  locationInput: { flex: 1, border: 'none', fontSize: '14px', color: colors.dark, padding: '12px 4px', background: 'transparent', minWidth: 0 },
  gpsBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: colors.brgLight,
    border: 'none',
    borderRadius: '10px',
    padding: '8px 10px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  gpsBtnText: { fontSize: '12px', fontWeight: 700, color: colors.brg },
  locError: { fontSize: '12px', color: colors.red, margin: '0 16px 4px', fontWeight: 500 },
  list: { flex: 1, overflow: 'auto', padding: '8px 16px', paddingBottom: '40px' },
  center: { display: 'flex', justifyContent: 'center', paddingTop: '50px' },
  card: { display: 'flex', alignItems: 'center', background: colors.white, borderRadius: '14px', padding: '12px', marginBottom: '12px', boxShadow: shadow.card, cursor: 'pointer' },
  cardImg: { width: '65px', height: '65px', borderRadius: '12px', objectFit: 'cover', background: colors.lightGray, flexShrink: 0 },
  cardContent: { flex: 1, marginLeft: '14px', minWidth: 0 },
  cardName: { fontSize: '16px', fontWeight: 700, color: colors.dark, margin: 0 },
  cardLocation: { fontSize: '13px', color: colors.gray, marginTop: '2px' },
  cardCuisine: { fontSize: '12px', color: colors.mediumGray, marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardPrice: { fontSize: '12px', fontWeight: 600, color: colors.brg, marginTop: '2px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px', padding: '0 40px' },
};
