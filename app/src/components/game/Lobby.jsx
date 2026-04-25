import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import './Lobby.css';

const Lobby = ({ roomCode, roomData, user, onCopyLink, copied, onStartMultiplayer }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="lobby-container"
    >
      <div className="glass-panel lobby-card">
        <div className="lobby-header">
          <div className="lobby-badge">WAITING ROOM</div>
          <h2>⚔️ Battle Assembly</h2>
          <p className="lobby-subtitle">Scholars are gathering for the trial.</p>
        </div>

        <div className="room-code-section">
          <div className="code-box">
            <span className="code-label">ROOM CODE</span>
            <span className="code-value">{roomCode}</span>
          </div>
          <button className="copy-action-btn" onClick={onCopyLink}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>

        {!roomData?.questions?.length && (
          <div className="lobby-prep-status">
            <div className="prep-loader">
              <div className="prep-fill"></div>
            </div>
            <p>Scribes are preparing the questions...</p>
          </div>
        )}

        <div className="players-registry">
          <div className="registry-header">
            <h3>Registered Scholars</h3>
            <span className="player-count">{roomData?.players?.length || 0} / 8</span>
          </div>
          <div className="players-list">
            {roomData?.players?.map((p, i) => (
              <motion.div 
                key={p.uid} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`player-entry ${p.uid === user?.uid ? 'is-me' : ''}`}
              >
                <div className="player-avatar-wrapper">
                  <img src={p.photo} alt={p.name} className="player-avatar" referrerPolicy="no-referrer" />
                  {p.uid === roomData.hostId && <div className="host-crown">👑</div>}
                </div>
                <span className="player-name">{p.name} {p.uid === user?.uid && '(You)'}</span>
                {p.uid === roomData.hostId && <span className="host-tag">HOST</span>}
              </motion.div>
            ))}
            {(!roomData?.players || roomData.players.length === 0) && (
              <div className="empty-lobby-state">Waiting for connection...</div>
            )}
          </div>
        </div>

        <div className="lobby-actions">
          {roomData?.hostId === user?.uid ? (
            <button 
              className="btn-primary start-battle-btn" 
              onClick={onStartMultiplayer}
              disabled={!roomData?.players || roomData.players.length < 2 || !roomData?.questions?.length}
            >
              {!roomData?.questions?.length ? 'Preparing Trial...' :
               roomData?.players?.length < 2 ? 'Waiting for Opponents...' : 'Start Battle!'}
            </button>
          ) : (
            <div className="waiting-pill">
              <span className="pulse-dot"></span>
              Waiting for host to commence...
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Lobby;
