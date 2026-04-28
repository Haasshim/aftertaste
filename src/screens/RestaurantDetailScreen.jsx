import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import restaurants from '../data/restaurants';

export default function RestaurantDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurant = restaurants.find((r) => r.id === id);

  if (!restaurant) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Restaurant not found</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={styles.headerTitle}>{restaurant.name}</h2>
        <div style={{ width: '40px' }} />
      </div>

      <div style={styles.body}>
        <img src={restaurant.image} alt={restaurant.name} style={styles.hero} />

        <div style={styles.infoSection}>
          <h2 style={styles.name}>{restaurant.name}</h2>
          <p style={styles.location}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {restaurant.location}
          </p>
          <p style={styles.address}>{restaurant.address}</p>
          <div style={styles.cuisineRow}>
            {restaurant.cuisine.map((c, i) => (
              <span key={i} style={styles.cuisineChip}>{c}</span>
            ))}
          </div>
          <p style={styles.price}>{'\u20B9'}{restaurant.priceForTwo} for two</p>
        </div>

        <div style={styles.menuSection}>
          <div style={styles.menuHeader}>
            <h3 style={styles.menuTitle}>Menu</h3>
            <span style={{ fontSize: '12px', color: '#9E9E9E' }}>Tap a dish to log it</span>
          </div>
          <img src={restaurant.menuImage} alt="Menu" style={styles.menuImg} />
        </div>

        <div style={styles.dishesSection}>
          <h3 style={styles.dishesTitle}>Dishes</h3>
          <p style={styles.dishesSub}>Select a dish to rate and log</p>
          {restaurant.dishes.map((dish) => (
            <div
              key={dish.id}
              style={styles.dishRow}
              onClick={() => navigate(`/log/${restaurant.id}/${dish.id}`)}
            >
              <div>
                <p style={styles.dishName}>{dish.name}</p>
                <p style={styles.dishCat}>{dish.category}</p>
              </div>
              <button style={styles.rateBtn}>
                Rate
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#004225" strokeWidth="2" style={{ marginLeft: '4px' }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div style={styles.addDish}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
          <span style={{ fontSize: '14px', color: '#9E9E9E', marginLeft: '6px', fontWeight: 500 }}>
            Add a dish not on this list (Coming Soon)
          </span>
        </div>

        <div style={{ height: '40px' }} />
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
    flex: 1,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  body: {
    flex: 1,
    overflow: 'auto',
  },
  hero: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    background: '#E0E0E0',
    display: 'block',
  },
  infoSection: {
    background: '#FFF',
    padding: '20px',
  },
  name: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#1A1A1A',
    margin: 0,
  },
  location: {
    fontSize: '15px',
    color: '#6B6B6B',
    marginTop: '6px',
    fontWeight: 500,
  },
  address: {
    fontSize: '13px',
    color: '#9E9E9E',
    marginTop: '4px',
    lineHeight: '18px',
  },
  cuisineRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '12px',
  },
  cuisineChip: {
    background: '#E8F0EB',
    color: '#004225',
    fontSize: '12px',
    fontWeight: 600,
    padding: '5px 10px',
    borderRadius: '8px',
  },
  price: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#004225',
    marginTop: '12px',
  },
  menuSection: {
    background: '#FFF',
    padding: '20px',
    marginTop: '10px',
  },
  menuHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  menuTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: 0,
  },
  menuImg: {
    width: '100%',
    height: '180px',
    borderRadius: '12px',
    objectFit: 'cover',
    background: '#E0E0E0',
  },
  dishesSection: {
    background: '#FFF',
    padding: '20px',
    marginTop: '10px',
  },
  dishesTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: 0,
  },
  dishesSub: {
    fontSize: '13px',
    color: '#6B6B6B',
    marginTop: '2px',
    marginBottom: '14px',
  },
  dishRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid #F8F8F6',
    cursor: 'pointer',
  },
  dishName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: 0,
  },
  dishCat: {
    fontSize: '13px',
    color: '#9E9E9E',
    marginTop: '2px',
  },
  rateBtn: {
    display: 'flex',
    alignItems: 'center',
    background: '#E8F0EB',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#004225',
    cursor: 'pointer',
    flexShrink: 0,
  },
  addDish: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '10px',
    padding: '16px',
    background: '#FFF',
    opacity: 0.6,
  },
};
