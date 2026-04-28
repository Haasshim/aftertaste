import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import restaurants from '../data/restaurants';

export default function SearchRestaurantScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.location.toLowerCase().includes(query.toLowerCase()) ||
      r.cuisine.some((c) => c.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={styles.headerTitle}>Find a Restaurant</h2>
        <div style={{ width: '40px' }} />
      </div>

      <div style={styles.searchBar}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          style={styles.searchInput}
          placeholder="Search by name, location, or cuisine..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button style={styles.clearBtn} onClick={() => setQuery('')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#9E9E9E">
              <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
            </svg>
          </button>
        )}
      </div>

      <div style={styles.list}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="1.5">
              <path d="M3 7c0-1.1.9-2 2-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              <path d="M8 12h8M8 16h4"/>
            </svg>
            <h3 style={{ fontSize: '18px', color: '#1A1A1A', marginTop: '12px' }}>
              No restaurants found
            </h3>
            <p style={{ fontSize: '14px', color: '#6B6B6B', textAlign: 'center', marginTop: '8px', lineHeight: '20px' }}>
              Can't find your restaurant? In the full version, you'll be able to add it manually.
            </p>
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              style={styles.card}
              onClick={() => navigate(`/restaurant/${r.id}`)}
            >
              <img src={r.image} alt={r.name} style={styles.cardImg} />
              <div style={styles.cardContent}>
                <h3 style={styles.cardName}>{r.name}</h3>
                <p style={styles.cardLocation}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '3px' }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {r.location}
                </p>
                <p style={styles.cardCuisine}>{r.cuisine.join(' \u2022 ')}</p>
                <p style={styles.cardPrice}>{'\u20B9'}{r.priceForTwo} for two</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          ))
        )}
      </div>

      <div style={styles.addBar}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
        <span style={{ fontSize: '14px', color: '#9E9E9E', marginLeft: '6px', fontWeight: 600 }}>
          Add New Restaurant (Coming Soon)
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#F8F8F6',
  },
  header: {
    background: '#004225',
    padding: '50px 16px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  backBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#FFF',
    margin: 0,
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    background: '#FFF',
    margin: '16px 16px 8px',
    borderRadius: '14px',
    padding: '4px 14px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    fontSize: '16px',
    color: '#1A1A1A',
    padding: '12px 10px',
    background: 'transparent',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    padding: '4px',
  },
  list: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 16px',
    paddingBottom: '80px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    background: '#FFF',
    borderRadius: '14px',
    padding: '12px',
    marginBottom: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  cardImg: {
    width: '65px',
    height: '65px',
    borderRadius: '12px',
    objectFit: 'cover',
    background: '#E0E0E0',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    marginLeft: '14px',
  },
  cardName: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: 0,
  },
  cardLocation: {
    fontSize: '13px',
    color: '#6B6B6B',
    marginTop: '2px',
  },
  cardCuisine: {
    fontSize: '12px',
    color: '#9E9E9E',
    marginTop: '3px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardPrice: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#004225',
    marginTop: '2px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '60px',
    padding: '0 40px',
  },
  addBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    borderTop: '1px solid #E0E0E0',
    background: '#FFF',
    opacity: 0.6,
    flexShrink: 0,
  },
};
