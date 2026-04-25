import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogOut, X } from 'lucide-react';
import SacredReview from '../game/SacredReview';
import './ProfileDashboard.css';

const ProfileDashboard = ({ 
  user, 
  nickname, 
  setNickname, 
  userStats, 
  userHistory, 
  dashboardLoading, 
  onEnterAdmin, 
  onExit, 
  onSignOut 
}) => {
  const [selectedHistory, setSelectedHistory] = useState(null);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0 }} 
      className="profile-hub"
    >
      <header className="profile-hero glass-panel">
        <div className="hero-identity">
          <div className="avatar-frame">
            <img src={user?.photoURL} alt="" className="user-large-avatar" referrerPolicy="no-referrer" />
          </div>
          <div className="identity-details">
            <input 
              className="nickname-edit-input"
              value={nickname}
              onChange={e => {
                setNickname(e.target.value);
                localStorage.setItem('aby_nickname', e.target.value);
              }}
              placeholder="Enter Your Alias"
            />
            <p className="user-email">{user?.email}</p>
            <div className="rank-tag">Senior Scholar</div>
          </div>
        </div>

        <div className="hero-actions">
          {user?.email === 'lennockahati@gmail.com' && (
            <button className="admin-access-btn" onClick={onEnterAdmin}>
              <Sparkles size={16} /> Override Panel
            </button>
          )}
          <button className="btn-outline compact" onClick={onExit}>Return to Sanctum</button>
          <button className="icon-btn-danger" onClick={onSignOut} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="stats-dashboard-grid">
        <div className="stat-metric-card glass-panel">
          <span className="metric-val">{userStats?.total_score || 0}</span>
          <span className="metric-label">SACRED POINTS</span>
        </div>
        <div className="stat-metric-card glass-panel">
          <span className="metric-val">{userStats?.games_won || 0}</span>
          <span className="metric-label">TRIALS WON</span>
        </div>
        <div className="stat-metric-card glass-panel">
          <span className="metric-val">{userStats?.games_played || 0}</span>
          <span className="metric-label">TOTAL TRIALS</span>
        </div>
      </div>

      <div className="glass-panel activity-section">
        <div className="section-header">
          <h3>CHRONICLES OF TRIALS</h3>
          <span className="activity-count">{userHistory.length} Recorded Sessions</span>
        </div>
        
        <div className="history-timeline">
          {dashboardLoading ? (
            <div className="loading-history">Channeling historical records...</div>
          ) : userHistory.length > 0 ? (
            userHistory.map((h, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.05 }}
                className="timeline-item"
              >
                <div className="item-meta">
                  <span className={`status-badge ${h.won ? 'victory' : 'complete'}`}>
                    {h.won ? 'VICTORY' : 'COMPLETE'}
                  </span>
                  <span className="item-date">{new Date(h.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="item-stats">
                  <span className="item-points">{h.score} pts</span>
                  {h.multiplayer && <span className="item-multi-tag">MULTIPLAYER</span>}
                </div>
                {h.questions && h.questions.length > 0 && (
                  <button className="btn-outline compact review-btn" onClick={() => setSelectedHistory(h)}>
                    Review Misses
                  </button>
                )}
              </motion.div>
            ))
          ) : (
            <div className="empty-history">No trials recorded yet. Your journey begins today.</div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedHistory && (
          <motion.div 
            className="history-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHistory(null)}
          >
            <motion.div 
              className="history-modal-content glass-panel"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={() => setSelectedHistory(null)}>
                <X size={24} />
              </button>
              <h2>Reviewing: {new Date(selectedHistory.timestamp).toLocaleString()}</h2>
              <SacredReview 
                questions={selectedHistory.questions || []} 
                userAnswers={selectedHistory.userAnswers || []} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileDashboard;
