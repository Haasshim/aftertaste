import React from 'react';
import { colors, font } from '../theme/theme';

// Catches render-time crashes so a thrown error shows a branded recovery
// screen instead of a blank white page.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '32px',
          background: colors.offWhite,
        }}
      >
        <h1 style={{ fontFamily: font.brand, fontSize: '32px', color: colors.brg, margin: 0 }}>
          aftertaste
        </h1>
        <p style={{ fontSize: '17px', fontWeight: 700, color: colors.dark, marginTop: '20px' }}>
          Something broke unexpectedly
        </p>
        <p style={{ fontSize: '14px', color: colors.gray, marginTop: '8px', maxWidth: 300 }}>
          The app hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '24px',
            background: colors.brg,
            color: colors.white,
            border: 'none',
            borderRadius: '12px',
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
