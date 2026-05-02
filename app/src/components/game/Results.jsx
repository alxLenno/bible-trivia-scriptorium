import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, BarChart3, Download, Image as ImageIcon, Loader2, ChevronDown } from 'lucide-react';
import SacredReview from './SacredReview';
import { API_BASE } from '../../gameRoom';
import './Results.css';

const Results = ({ 
  score, 
  isMultiplayer, 
  roomData, 
  questions, 
  userAnswers, 
  config,
  resetGame, 
  onShowGlobalStats 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleExport = async (format) => {
    if (isExporting) return;
    setIsExporting(true);
    setShowExportOptions(false);
    
    console.log(`[EXPORT] Starting ${format} export...`);
    console.log(`[EXPORT] API_BASE: ${API_BASE}`);
    
    try {
      const payload = {
        format,
        score,
        questions,
        userAnswers,
        config
      };
      console.log("[EXPORT] Payload:", payload);

      const response = await fetch(`${API_BASE}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log(`[EXPORT] Response status: ${response.status}`);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Export failed (${response.status}): ${errText}`);
      }
      
      const blob = await response.blob();
      console.log(`[EXPORT] Blob received: ${blob.size} bytes`);
      
      let filename = `Sacred_Review.${format}`;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        filename = contentDisposition.split('filename=')[1].replace(/["']/g, '');
      }
      console.log(`[EXPORT] Filename: ${filename}`);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log("[EXPORT] Download triggered successfully");
    } catch (error) {
      console.error("[EXPORT] Error:", error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="results-viewport"
    >
      <div className="glass-panel summary-card">
        <div className="victory-crown">
          <Trophy size={100} className="trophy-icon" />
        </div>
        
        <h2 className="summary-title">Trial Complete</h2>
        <div className="points-display">
          <span className="points-val">{score}</span>
          <span className="points-label">SACRED POINTS</span>
        </div>

        {isMultiplayer && roomData && (
          <div className="battle-standings">
            <h3>⚔️ Battle Results</h3>
            <div className="standings-list">
              {[...roomData.players].sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.uid} className={`standing-row ${i === 0 ? 'is-winner' : ''}`}>
                  <span className="row-rank">{i === 0 ? '🏆' : `#${i + 1}`}</span>
                  <img src={p.photo} alt={p.name} className="row-avatar" referrerPolicy="no-referrer" />
                  <span className="row-name">{p.name}</span>
                  <span className="row-points">{p.score} pts</span>
                  {!p.finished && <span className="row-status">Finalizing...</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="results-actions">
          <button className="btn-primary" onClick={resetGame}>
            <ArrowLeft size={18} /> Return to Sanctum
          </button>
          <button className="btn-outline" onClick={onShowGlobalStats}>
            <BarChart3 size={18} /> Global Rankings
          </button>
          
          <div className="export-dropdown-container">
            <button 
              className="btn-outline export-toggle" 
              onClick={() => setShowExportOptions(!showExportOptions)}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
              <span>Export Results</span>
              <ChevronDown size={16} className={`chevron ${showExportOptions ? 'open' : ''}`} />
            </button>

            <AnimatePresence>
              {showExportOptions && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="export-menu glass-panel"
                >
                  <button className="export-option" onClick={() => handleExport('pdf')}>
                    <Download size={16} /> Save as PDF
                  </button>
                  {questions?.length <= 5 && (
                    <button className="export-option" onClick={() => handleExport('png')}>
                      <ImageIcon size={16} /> Save as PNG Image
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Answer Review Section */}
      <SacredReview questions={questions} userAnswers={userAnswers} />
    </motion.div>
  );
};

export default Results;
