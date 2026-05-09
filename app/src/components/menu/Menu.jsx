import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Sparkles } from 'lucide-react';
import './Menu.css';

const Menu = ({ onSolo, onMulti, onChat, onScriptorium, joinCode, setJoinCode, onJoin, isJoining, nickname, setNickname, onConfirmJoin, onCancelJoin }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="hero-section"
    >
      <div className="hero-badge animate-fade-in">DIVINE CHALLENGE</div>
      <h2 className="hero-title">Test Your Sacred Knowledge</h2>
      <p className="hero-subtitle">Compete in the ultimate Bible trivia challenge across the ages.</p>
      
      <div className="menu-grid">
        <button className="menu-card solo" onClick={onSolo}>
          <div className="card-icon"><BookOpen size={32} /></div>
          <div className="card-info">
            <h3>Solo Trial</h3>
            <p>Personal study & growth</p>
          </div>
        </button>

        <button className="menu-card multi" onClick={onMulti}>
          <div className="card-icon"><Users size={32} /></div>
          <div className="card-info">
            <h3>Multiplayer</h3>
            <p>Battle other scholars</p>
          </div>
        </button>

        <button className="menu-card chat" onClick={onChat}>
          <div className="card-icon"><Sparkles size={32} /></div>
          <div className="card-info">
            <h3>AI Scribe</h3>
            <p>Ask & learn anything</p>
          </div>
        </button>

        <button className="menu-card scriptorium-mode" onClick={onScriptorium} style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <div className="card-icon"><BookOpen size={32} color="#818cf8" /></div>
          <div className="card-info">
            <h3 style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Scriptorium</h3>
            <p style={{ color: '#94a3b8' }}>Deep Theological Study</p>
          </div>
        </button>
      </div>

      <div className="join-container glass-panel">
        <h3 className="join-title">Join Existing Session</h3>
        {!isJoining ? (
          <div className="join-form">
            <input 
              placeholder="ROOM CODE" 
              value={joinCode} 
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="join-input"
            />
            <button 
              className="btn-primary" 
              onClick={onJoin} 
              disabled={joinCode.length < 6}
            >
              Enter Room
            </button>
          </div>
        ) : (
          <div className="join-confirm-flow animate-fade-in">
            <p className="confirm-label">Your Scholar Alias:</p>
            <input 
              className="nickname-input-large"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              autoFocus
            />
            <div className="confirm-actions">
              <button className="btn-primary" onClick={onConfirmJoin}>Begin Journey</button>
              <button className="btn-outline" onClick={onCancelJoin}>Go Back</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Menu;
