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
    `<svg xmlns="http://www.w3.org/2000/svg" width="65" height="65"><rect width="65" height="65" fill="#E4EBE7"/></svg>`
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = useCallback(async (q, loc) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { restaurants } = await searchRestaurants(q, loc);
      setResults(restaurants);
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
        <button className="press" style={styles.iconBtn} aria-label="Go back" onClick={() => navigate(-1)}>
          <Icon name="back" size={24} color={colors.white} />
        </button>
        <h2 style={styles.headerTitle}>Where did you eat?</h2>
        <div style={{ width: '40px' }} />
      </div>

      <OfflineBanner />

      <div style={styles.searchBar} className="fade-up">
        <Icon name="search" size={20} color={colors.racingRed} />
        <input
          style={styles.searchInput}
          placeholder="Restaurant name or cuisine..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button className="press" style={styles.clearBtn} aria-label="Clear search" onClick={() => setQuery('')}>
            <Icon name="x-circle" size={18} color={colors.mediumGray} />
          </button>
        )}
      </div>

      {/* Location row: type an area or use device GPS */}
      <div style={styles.locationBar} className="fade-up">
        <Icon name="map-pin" size={18} color={colors.racingRed} />
        <input
          style={styles.locationInput}
          placeholder="Area or city (e.g. T. Nagar, Chennai)"
          value={location}
          onChange={onLocationType}
        />
        <button
          className="press"
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
          <ErrorState error={error} onRetry={() => runSearch(query, effectiveLocation)} />
        ) : !query.trim() ? (
          <div style={styles.empty} className="fade-up">
            <div style={styles.emptyBlob}>
              <Icon name="search" size={40} color={colors.racingRed} strokeWidth={1.5} />
            </div>
            <h3 style={styles.emptyTitle}>Find your spot</h3>
            <p style={styles.emptyText}>
              Just type a restaurant and we will find the best match for you! Drop a city or hit Use GPS to keep it local.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div style={styles.empty} className="fade-up">
            <div style={styles.emptyBlob}>
              <Icon name="menu" size={40} color={colors.racingRed} strokeWidth={1.5} />
            </div>
            <h3 style={styles.emptyTitle}>Nothing on the radar</h3>
            <p style={styles.emptyText}>Try a different name, spelling, or area.</p>
          </div>
        ) : (
          results.map((r, i) => (
            <div
              key={r.id}
              className="card-pop fade-up"
              style={{ ...styles.card, animationDelay: `${Math.min(i * 50, 300)}ms` }}
              onClick={() => navigate(`/restaurant/${r.id}`)}
            >
              <img
                src={r.image || FALLBACK_IMG}
                alt={r.name}
                style={styles.cardImg}
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
              />
              <div style={styles.cardContent}>
                <h3 style={styles.cardName}>{r.name}</h3>
                {r.location && (
                  <p style={styles.cardLocation}>
                    <Icon name="map-pin" size={13} color={colors.gray} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px' }} />
                    {r.location}
                  </p>
                )}
                {r.cuisine?.length > 0 && <p style={styles.cardCuisine}>{r.cuisine.join(' • ')}</p>}
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
  container: { height: 'var(--app-h)', display: 'flex', flexDirection: 'column', background: colors.redBlush },
  header: {
    background: `linear-gradient(135deg, ${colors.brg} 0%, ${colors.brgDeep} 100%)`,
    padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 16px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    borderBottom: `2px solid ${colors.gold}`,
  },
  iconBtn: { width: '40px', height: '40px', borderRadius: '20px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  headerTitle: { fontFamily: font.brand, fontSize: '19px', fontWeight: 700, color: colors.white, margin: 0 },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: colors.white,
    margin: '16px 16px 8px',
    borderRadius: '16px',
    padding: '4px 14px',
    boxShadow: shadow.card,
    border: `1px solid ${colors.redTint}`,
    flexShrink: 0,
  },
  searchInput: { flex: 1, border: 'none', fontSize: '16px', color: colors.dark, padding: '12px 4px', background: 'transparent' },
  clearBtn: { background: 'none', border: 'none', display: 'flex', padding: '4px' },
  locationBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: colors.white,
    margin: '0 16px 4px',
    borderRadius: '16px',
    padding: '2px 12px',
    boxShadow: shadow.card,
    border: `1px solid ${colors.redTint}`,
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
    flexShrink: 0,
  },
  gpsBtnText: { fontSize: '12px', fontWeight: 700, color: colors.brg },
  locError: { fontSize: '12px', color: colors.red, margin: '0 16px 4px', fontWeight: 500 },
  list: { flex: 1, overflow: 'auto', padding: '8px 16px', paddingBottom: '40px' },
  center: { display: 'flex', justifyContent: 'center', paddingTop: '50px' },
  card: {
    display: 'flex',
    alignItems: 'center',
    background: colors.white,
    borderRadius: '16px',
    padding: '12px',
    marginBottom: '12px',
    boxShadow: shadow.card,
    border: `1px solid ${colors.redTint}`,
    cursor: 'pointer',
  },
  cardImg: { width: '65px', height: '65px', borderRadius: '14px', objectFit: 'cover', background: colors.redTint, flexShrink: 0 },
  cardContent: { flex: 1, marginLeft: '14px', minWidth: 0 },
  cardName: { fontSize: '16px', fontWeight: 700, color: colors.dark, margin: 0 },
  cardLocation: { fontSize: '13px', color: colors.gray, marginTop: '2px' },
  cardCuisine: { fontSize: '12px', color: colors.mediumGray, marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px', padding: '0 36px', textAlign: 'center' },
  emptyBlob: {
    width: '96px',
    height: '96px',
    borderRadius: '42% 58% 55% 45% / 50% 44% 56% 50%',
    background: colors.redTint,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  emptyTitle: { fontFamily: font.brand, fontSize: '21px', color: colors.dark, margin: 0 },
  emptyText: { fontSize: '14px', color: colors.gray, marginTop: '8px', lineHeight: '21px' },
};
