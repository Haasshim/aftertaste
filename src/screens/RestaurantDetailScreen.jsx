import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurant } from '../lib/places';
import { getLoggedDishNames } from '../lib/dataClient';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import ErrorState from '../components/ErrorState';
import OfflineBanner from '../components/OfflineBanner';
import { colors, radius } from '../theme/theme';

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#E8F0EB"/></svg>`
  );

export default function RestaurantDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customDish, setCustomDish] = useState('');
  const [pastDishes, setPastDishes] = useState([]);

  const logCustomDish = () => {
    const name = customDish.trim();
    if (!name) return;
    navigate(`/log/${restaurant.id}/custom?name=${encodeURIComponent(name)}`);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRestaurant(await getRestaurant(id));
      getLoggedDishNames(id).then(setPastDishes);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.iconBtn} aria-label="Go back" onClick={() => navigate(-1)}>
          <Icon name="back" size={24} color={colors.white} />
        </button>
        <h2 style={styles.headerTitle}>{restaurant?.name || 'Restaurant'}</h2>
        <div style={{ width: '40px' }} />
      </div>

      <OfflineBanner />

      {loading ? (
        <div style={styles.center}><Spinner size={32} /></div>
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : !restaurant ? (
        <ErrorState error={{ message: 'Restaurant not found.' }} />
      ) : (
        <div style={styles.body}>
          <img
            src={restaurant.image || FALLBACK_IMG}
            alt={restaurant.name}
            style={styles.hero}
            onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
          />

          <div style={styles.infoSection}>
            <h2 style={styles.name}>{restaurant.name}</h2>
            {restaurant.location && (
              <p style={styles.location}>
                <Icon name="map-pin" size={16} color={colors.gray} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                {restaurant.location}
              </p>
            )}
            {restaurant.address && <p style={styles.address}>{restaurant.address}</p>}
            {restaurant.cuisine?.length > 0 && (
              <div style={styles.cuisineRow}>
                {restaurant.cuisine.map((c, i) => (
                  <span key={i} style={styles.cuisineChip}>{c}</span>
                ))}
              </div>
            )}
            {restaurant.priceForTwo && <p style={styles.price}>{'₹'}{restaurant.priceForTwo} for two</p>}
          </div>

          {restaurant.menuImage && (
            <div style={styles.menuSection}>
              <div style={styles.menuHeader}>
                <h3 style={styles.menuTitle}>Menu</h3>
                <span style={{ fontSize: '12px', color: colors.mediumGray }}>Tap a dish to log it</span>
              </div>
              <img
                src={restaurant.menuImage}
                alt="Menu"
                style={styles.menuImg}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          <div style={styles.dishesSection}>
            <h3 style={styles.dishesTitle}>Log a bite</h3>
            <p style={styles.dishesSub}>
              {restaurant.dishes?.length ? 'Pick a dish to rate and log' : 'What did you devour here?'}
            </p>
            {(restaurant.dishes || []).map((dish) => (
              <div key={dish.id} style={styles.dishRow} onClick={() => navigate(`/log/${restaurant.id}/${dish.id}`)}>
                <div>
                  <p style={styles.dishName}>{dish.name}</p>
                  {dish.category && <p style={styles.dishCat}>{dish.category}</p>}
                </div>
                <button style={styles.rateBtn}>
                  Rate
                  <Icon name="star" size={14} color={colors.brg} style={{ marginLeft: '4px' }} />
                </button>
              </div>
            ))}

            {/* Dishes you've logged here before — quick-pick to log again. */}
            {(() => {
              const menuNames = new Set((restaurant.dishes || []).map((d) => d.name));
              const remembered = pastDishes.filter((n) => !menuNames.has(n));
              if (!remembered.length) return null;
              return (
                <div style={styles.rememberedWrap}>
                  <p style={styles.rememberedLabel}>Your greatest hits here</p>
                  <div style={styles.rememberedChips}>
                    {remembered.map((name) => (
                      <button
                        key={name}
                        style={styles.rememberedChip}
                        onClick={() => navigate(`/log/${restaurant.id}/custom?name=${encodeURIComponent(name)}`)}
                      >
                        {name}
                        <Icon name="plus" size={13} color={colors.brg} style={{ marginLeft: '5px' }} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Log a dish that isn't in the list (always available; the only
                option for restaurants discovered via Places, which have no menu). */}
            <div style={styles.customRow}>
              <input
                style={styles.customInput}
                placeholder="Type it... (e.g. Mutton Biryani)"
                value={customDish}
                onChange={(e) => setCustomDish(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && logCustomDish()}
              />
              <button
                style={{ ...styles.customBtn, opacity: customDish.trim() ? 1 : 0.5 }}
                onClick={logCustomDish}
                disabled={!customDish.trim()}
              >
                Log
                <Icon name="plus" size={15} color={colors.white} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </div>

          <div style={{ height: '40px' }} />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', background: colors.redBlush },
  header: {
    background: `linear-gradient(135deg, ${colors.brg} 0%, ${colors.brgDeep} 100%)`,
    padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 16px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    borderBottom: `2px solid ${colors.gold}`,
  },
  iconBtn: { width: '40px', height: '40px', borderRadius: '20px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  headerTitle: { fontSize: '18px', fontWeight: 700, color: colors.white, margin: 0, flex: 1, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  center: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1, overflow: 'auto' },
  hero: { width: '100%', height: '200px', objectFit: 'cover', background: colors.lightGray, display: 'block' },
  infoSection: { background: colors.white, padding: '20px', borderRadius: '0 0 24px 24px', boxShadow: '0 4px 12px rgba(126,27,45,0.08)' },
  name: { fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 800, color: colors.dark, margin: 0 },
  location: { fontSize: '15px', color: colors.gray, marginTop: '6px', fontWeight: 500 },
  address: { fontSize: '13px', color: colors.mediumGray, marginTop: '4px', lineHeight: '18px' },
  cuisineRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' },
  cuisineChip: { background: colors.brgLight, color: colors.brg, fontSize: '12px', fontWeight: 600, padding: '5px 10px', borderRadius: radius.sm },
  price: { fontSize: '15px', fontWeight: 700, color: colors.brg, marginTop: '12px' },
  menuSection: { background: colors.white, padding: '20px', margin: '12px 12px 0', borderRadius: '20px', border: `1px solid ${colors.redTint}` },
  menuHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  menuTitle: { fontSize: '20px', fontWeight: 700, color: colors.dark, margin: 0 },
  menuImg: { width: '100%', height: '180px', borderRadius: radius.md, objectFit: 'cover', background: colors.lightGray },
  dishesSection: { background: colors.white, padding: '20px', margin: '12px 12px 0', borderRadius: '20px', border: `1px solid ${colors.redTint}` },
  dishesTitle: { fontSize: '20px', fontWeight: 700, color: colors.dark, margin: 0 },
  dishesSub: { fontSize: '13px', color: colors.gray, marginTop: '2px', marginBottom: '14px' },
  dishRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${colors.offWhite}`, cursor: 'pointer' },
  dishName: { fontSize: '16px', fontWeight: 600, color: colors.dark, margin: 0 },
  dishCat: { fontSize: '13px', color: colors.mediumGray, marginTop: '2px' },
  rateBtn: { display: 'flex', alignItems: 'center', background: colors.brgLight, border: 'none', padding: '8px 14px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: colors.brg, cursor: 'pointer', flexShrink: 0 },
  rememberedWrap: { marginTop: '16px' },
  rememberedLabel: { fontSize: '13px', fontWeight: 700, color: colors.gray, margin: '0 0 8px' },
  rememberedChips: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  rememberedChip: { display: 'inline-flex', alignItems: 'center', background: colors.redTint, color: colors.racingRedDeep, border: 'none', borderRadius: '20px', padding: '8px 14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' },
  customRow: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px' },
  customInput: { flex: 1, padding: '12px 14px', background: colors.offWhite, border: '1.5px solid #D0D0D0', borderRadius: '10px', fontSize: '14px', color: colors.dark, outline: 'none', minWidth: 0 },
  customBtn: { display: 'flex', alignItems: 'center', background: `linear-gradient(135deg, ${colors.racingRed} 0%, ${colors.racingRedDeep} 100%)`, color: colors.white, border: 'none', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, boxShadow: '0 3px 10px rgba(164,36,59,0.3)' },
};
