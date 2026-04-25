import React from 'react';
import { Trophy, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import './Header.css';

const Header = ({ user, gameState, setGameState, onSignIn, resetGame, onOpenDashboard }) => {
  return (
    <header className="main-header glass-panel">
      <div className="header-content">
        <div className="logo-area" onClick={() => setGameState('menu')} style={{ cursor: 'pointer' }}>
          <div className="logo-main">
            <Trophy className="gold-icon" size={24} />
            <h1 className="nav-title">SCRIPTORIUM</h1>
          </div>
          <span className="brand-subtitle">by AβY</span>
        </div>
        
        <nav className="header-nav">
          <button 
            className={`nav-link ${gameState === 'stats' ? 'active' : ''}`}
            onClick={onOpenDashboard}
          >
            Leaderboards
          </button>
        </nav>

        <div className="auth-zone">
          {user ? (
            <div className="user-nav">
              <button 
                className={`profile-toggle ${gameState === 'profile' ? 'active' : ''}`}
                onClick={() => setGameState('profile')}
                title="Your Profile & Stats"
              >
                <img src={user.photoURL} alt="profile" referrerPolicy="no-referrer" />
              </button>
              <button 
                onClick={() => { signOut(auth); resetGame(); }} 
                className="icon-btn logout" 
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={onSignIn} className="btn-outline compact">Sign In</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
