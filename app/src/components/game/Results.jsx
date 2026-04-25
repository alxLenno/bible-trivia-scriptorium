import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, BarChart3, Download } from 'lucide-react';
import SacredReview from './SacredReview';
import './Results.css';

const Results = ({ 
  score, 
  isMultiplayer, 
  roomData, 
  questions, 
  userAnswers, 
  resetGame, 
  onShowGlobalStats 
}) => {
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
          <button className="btn-outline" onClick={() => window.print()} title="Download as PDF">
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>

      {/* Answer Review Section */}
      <SacredReview questions={questions} userAnswers={userAnswers} />
    </motion.div>
  );
};

export default Results;
