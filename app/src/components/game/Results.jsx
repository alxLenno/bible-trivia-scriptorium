import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, BarChart3, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
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

  const handleExport = async (format) => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      const response = await fetch(`${API_BASE}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          score,
          questions,
          userAnswers,
          config
        })
      });

      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header if possible
      let filename = `Sacred_Review.${format}`;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        filename = contentDisposition.split('filename=')[1].replace(/["']/g, '');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export results. Please try again.");
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
          {questions?.length <= 5 && (
            <button className="btn-outline" onClick={() => handleExport('png')} disabled={isExporting}>
              {isExporting ? <Loader2 size={18} className="spin" /> : <ImageIcon size={18} />} Download PNG
            </button>
          )}
          <button className="btn-outline" onClick={() => handleExport('pdf')} disabled={isExporting}>
            {isExporting ? <Loader2 size={18} className="spin" /> : <Download size={18} />} Download PDF
          </button>
        </div>
      </div>

      {/* Answer Review Section */}
      <SacredReview questions={questions} userAnswers={userAnswers} />
    </motion.div>
  );
};

export default Results;
