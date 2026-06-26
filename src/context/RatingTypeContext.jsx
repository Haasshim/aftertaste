import React, { createContext, useContext, useState, useEffect } from 'react';

const RatingTypeContext = createContext();

const RATING_TYPES = {
  '3facet': '3-Faceted (Taste, Ambience, Service)',
  'single_10': 'Single Rating (1-10)',
  'stars_5': '5 Stars',
  '100': 'Out of 100',
};

export function RatingTypeProvider({ children }) {
  const [ratingType, setRatingTypeState] = useState('3facet');
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aftertaste_rating_type');
      if (saved && RATING_TYPES[saved]) {
        setRatingTypeState(saved);
      }
    } catch (e) {
      console.warn('Could not load rating type from localStorage:', e);
    }
    setIsLoading(false);
  }, []);

  const setRatingType = (type) => {
    if (RATING_TYPES[type]) {
      setRatingTypeState(type);
      try {
        localStorage.setItem('aftertaste_rating_type', type);
      } catch (e) {
        console.warn('Could not save rating type to localStorage:', e);
      }
    }
  };

  return (
    <RatingTypeContext.Provider value={{ ratingType, setRatingType, ratingTypeLabel: RATING_TYPES[ratingType], isLoading }}>
      {children}
    </RatingTypeContext.Provider>
  );
}

export function useRatingType() {
  const ctx = useContext(RatingTypeContext);
  if (!ctx) {
    throw new Error('useRatingType must be used within RatingTypeProvider');
  }
  return ctx;
}
