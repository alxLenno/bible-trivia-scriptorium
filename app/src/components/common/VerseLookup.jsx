import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import { localLookupVerses, AVAILABLE_VERSIONS } from '../../bibleLookup';
import './VerseLookup.css';

const CARD_W = 360;
const CARD_H = 320;

const VerseLookup = ({ reference, version, position, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [verses, setVerses] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(version || 'KJV');
  const cardRef = useRef(null);

  const fetchVerse = async (ver) => {
    setLoading(true);
    setError(null);
    try {
      const results = await localLookupVerses(reference, ver);
      if (results && results.length > 0) {
        setVerses(results);
      } else {
        setError("Scripture not found in the archives.");
      }
    } catch (err) {
      setError("Connection to the archives interrupted.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reference) fetchVerse(selectedVersion);
  }, [reference]);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    const handleClick = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        // Don't close if clicking another bible-ref-link
        if (!e.target.closest('.bible-ref-link')) {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 150);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
      clearTimeout(timer);
    };
  }, [onClose]);

  // Smart positioning: prefer below, then above, then side
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clickX = position?.x ?? vw / 2;
  const clickY = position?.y ?? vh / 2;
  const pad = 12;

  let left, top;

  // Horizontal: try to center on the click, clamp to viewport
  left = Math.max(pad, Math.min(clickX - CARD_W / 2, vw - CARD_W - pad));

  // Vertical: prefer below the click
  if (clickY + CARD_H + pad < vh) {
    top = clickY; // fits below
  } else if (clickX > CARD_H + pad) {
    top = clickY - CARD_H - pad; // fits above (use clickX as proxy for clickY before offset)
  } else {
    top = vh - CARD_H - pad; // fallback: pin to bottom
  }
  // Final clamp
  top = Math.max(pad, Math.min(top, vh - CARD_H - pad));

  const card = (
    <motion.div 
      ref={cardRef}
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      drag
      dragMomentum={false}
      className="lookup-popover"
      style={{ left: `${left}px`, top: `${top}px` }}
    >
      <div className="lookup-header drag-handle" style={{ cursor: 'grab' }}>
        <div className="lookup-title">
          <BookOpen size={14} className="gold-icon" />
          <h4>{reference}</h4>
        </div>
        <button 
          className="close-lookup-btn" 
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when clicking close
        >
          <X size={14} />
        </button>
      </div>

      <div className="version-pills">
        {AVAILABLE_VERSIONS.map(v => (
          <button
            key={v}
            className={`version-pill ${selectedVersion === v ? 'active' : ''}`}
            onClick={() => { setSelectedVersion(v); fetchVerse(v); }}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="lookup-content">
        {loading ? (
          <div className="lookup-loading">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
            <p>Illuminating the scroll...</p>
          </div>
        ) : error ? (
          <div className="lookup-error">
            <p>{error}</p>
          </div>
        ) : (
          <div className="verses-display">
            {verses.map((v, i) => (
              <div key={i} className="verse-row">
                <span className="verse-num">{v.verse}</span>
                <p className="verse-text">{v.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  // Portal: render directly on document.body so position:fixed works correctly
  return ReactDOM.createPortal(card, document.body);
};

export default VerseLookup;
