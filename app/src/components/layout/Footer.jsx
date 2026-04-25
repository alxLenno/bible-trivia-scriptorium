import React from 'react';

const Footer = () => {
  return (
    <footer style={{ 
      textAlign: 'center', 
      padding: '3rem 1rem', 
      marginTop: '4rem', 
      borderTop: '1px solid var(--glass-border)',
      color: 'var(--text-muted)'
    }}>
      <p style={{ fontSize: '0.85rem', margin: 0, fontFamily: 'Outfit', letterSpacing: '0.05em' }}>
        &copy; {new Date().getFullYear()} <strong style={{ color: 'var(--primary-gold)' }}>AβY SCRIPTORIUM</strong>. All rights reserved.
      </p>
      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.5 }}>
        Divine Knowledge for the Modern Scholar
      </div>
    </footer>
  );
};

export default Footer;
