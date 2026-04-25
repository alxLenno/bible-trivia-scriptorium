import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Clock, Zap, LogOut } from 'lucide-react';
import { getTranslation } from '../../translations';
import './Gameplay.css';

const Gameplay = ({ 
  questions, 
  currentIndex, 
  revealed, 
  timeLeft, 
  config, 
  isMultiplayer, 
  roomData, 
  user, 
  score, 
  combo, 
  answered, 
  selectedAnswer, 
  handleAnswer, 
  nextQuestion, 
  gracefullyForfeit 
}) => {
  const currentQ = questions[currentIndex];
  const t = (key) => getTranslation(config.version, key);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="game-viewport"
    >
      {/* Offline/Warning Bar */}
      {currentQ?.isAI === false && (
        <div className="game-warning-bar animate-fade-in">
          ⚠️ AI service unavailable. Using Emergency Question Bank.
        </div>
      )}

      {/* Live Scoreboard for Multiplayer */}
      {isMultiplayer && roomData && (
        <div className="battle-hud glass-panel">
          <div className="hud-header">
            <span className="hud-label">{t('battleRankings')}</span>
            <button onClick={gracefullyForfeit} className="forfeit-link">{t('forfeit')}</button>
          </div>
          <div className="hud-players">
            <AnimatePresence>
              {[...roomData.players].sort((a,b) => b.score - a.score).map((p, i) => (
                <motion.div 
                  key={p.uid} 
                  layout
                  className={`hud-player-row ${p.uid === user?.uid ? 'is-user' : ''} ${p.forfeited ? 'is-forfeited' : ''}`}
                >
                  <span className="rank-idx">{i === 0 ? '👑' : i + 1}</span>
                  <img src={p.photo} alt={p.name} className="hud-avatar" referrerPolicy="no-referrer" />
                  <div className="hud-info">
                    <span className="hud-name">{p.name}</span>
                    <div className="hud-stats">
                      <span className="hud-score">{p.score}</span>
                      {p.combo > 2 && <span className="hud-combo">🔥 {p.combo}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Main Game Interface */}
      <div className="main-trial-area">
        <div className="trial-metrics">
          <div className="metric-pill index-pill">
            <Hash size={16}/> {currentIndex + 1} / {questions.length}
          </div>
          
          <div className="timer-track">
            <motion.div 
              className="timer-fill"
              key={`timer-${currentIndex}-${revealed}`}
              initial={{ width: revealed ? '0%' : '100%' }}
              animate={{ width: `${revealed ? 0 : (timeLeft / config.timePerQuestion) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }} 
            />
            <span className="timer-val"><Clock size={14}/> {revealed ? '0' : timeLeft}s</span>
          </div>

          <div className="metric-stack">
            <AnimatePresence>
              {combo > 2 && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 1.1, 1], opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="metric-pill combo-pill"
                >
                  🔥 {combo}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="metric-pill score-pill">
              <Zap size={16}/> {score}
            </div>
          </div>
        </div>

        {/* Question Panel */}
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div 
              key="q-phase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="trial-panel"
            >
              <div className="glass-panel question-container">
                <p className="question-text">{currentQ.question}</p>
              </div>

              <div className="options-grid">
                {currentQ.options.map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleAnswer(opt)}
                    className={`option-btn ${selectedAnswer === opt ? 'selected' : ''}`}
                    disabled={answered}
                  >
                    <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="opt-text">{opt}</span>
                  </button>
                ))}
              </div>

              {isMultiplayer && answered && (
                <div className="waiting-indicator animate-fade-in">
                  <span>{t('decisionRecorded')}</span>
                  <span className="sync-text">{t('syncing')} {timeLeft}s</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="r-phase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="trial-panel reveal-mode"
            >
              <div className="glass-panel question-container reveal-q">
                <p className="question-text">{currentQ.question}</p>
              </div>

              <div className="options-grid">
                {currentQ.options.map((opt, i) => {
                  let status = 'muted';
                  if (opt === currentQ.correct) status = 'correct';
                  else if (selectedAnswer === opt) status = 'wrong';
                  
                  return (
                    <div key={i} className={`option-display ${status}`}>
                      <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                      <span className="opt-text">{opt}</span>
                      {status === 'correct' && <span className="status-icon">✓</span>}
                      {status === 'wrong' && <span className="status-icon">✗</span>}
                    </div>
                  );
                })}
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.4 }} 
                className="explanation-box"
              >
                <div className="exp-content">
                  <span className="exp-label">{t('sacredInsight')}</span>
                  <p>{currentQ.explanation}</p>
                </div>
                
                {(!isMultiplayer || roomData?.hostId === user?.uid) ? (
                  <button className="btn-primary next-trial-btn" onClick={nextQuestion}>
                    {currentIndex === questions.length - 1 ? t('completeTrial') : t('nextQuestion')}
                  </button>
                ) : (
                  <div className="host-waiting-pill">{t('waitingForHost')}</div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Gameplay;
