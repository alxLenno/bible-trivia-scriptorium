import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Award, Home, Swords, Zap, BookOpen, User } from 'lucide-react';
import './GlobalDashboard.css';

// Sample data so the dashboard always looks populated
const SAMPLE_LEADERBOARD = [
  { uid: '1', nickname: 'Benjamin K.', photo: 'https://randomuser.me/api/portraits/men/32.jpg', total_score: 18750, highest_combo: 12, games_won: 187, games_played: 191, flag: '🇺🇸' },
  { uid: '2', nickname: 'Esther L.', photo: 'https://randomuser.me/api/portraits/women/44.jpg', total_score: 17210, highest_combo: 10, games_won: 168, games_played: 174, flag: '🇺🇸' },
  { uid: '3', nickname: 'Joseph R.', photo: 'https://randomuser.me/api/portraits/men/75.jpg', total_score: 16800, highest_combo: 14, games_won: 159, games_played: 167, flag: '🇨🇿' },
  { uid: '4', nickname: 'Naomi C.', photo: 'https://randomuser.me/api/portraits/women/68.jpg', total_score: 15400, highest_combo: 9, games_won: 142, games_played: 155, flag: '🇺🇸' },
  { uid: '5', nickname: 'Caleb M.', photo: 'https://randomuser.me/api/portraits/men/22.jpg', total_score: 15400, highest_combo: 7, games_won: 138, games_played: 150, flag: '🇺🇸' },
  { uid: '6', nickname: 'Miriam P.', photo: 'https://randomuser.me/api/portraits/women/33.jpg', total_score: 15400, highest_combo: 11, games_won: 130, games_played: 145, flag: '🇨🇿' },
  { uid: '7', nickname: 'Henry A.', photo: 'https://randomuser.me/api/portraits/men/45.jpg', total_score: 15400, highest_combo: 9, games_won: 125, games_played: 140, flag: '🇨🇿' },
  { uid: '8', nickname: 'Joseph R.', photo: 'https://randomuser.me/api/portraits/men/55.jpg', total_score: 15400, highest_combo: 8, games_won: 120, games_played: 138, flag: '🇺🇸' },
  { uid: '9', nickname: 'Brirams M.', photo: 'https://randomuser.me/api/portraits/men/60.jpg', total_score: 15400, highest_combo: 6, games_won: 115, games_played: 135, flag: '🇨🇿' },
  { uid: '10', nickname: 'Naomi J.', photo: 'https://randomuser.me/api/portraits/women/22.jpg', total_score: 15400, highest_combo: 11, games_won: 110, games_played: 130, flag: '🇨🇿' },
];

// Derive badges from user stats — not random
const getUserBadges = (stats) => {
  const badges = [];
  if (!stats) return ['New Scholar'];
  if (stats.games_played >= 100) badges.push('Century Scholar');
  else if (stats.games_played >= 50) badges.push('Dedicated Student');
  else if (stats.games_played >= 10) badges.push('Rising Scholar');
  if (stats.games_won >= 50) badges.push('Victory Master');
  else if (stats.games_won >= 20) badges.push('Faithful Winner');
  if (stats.highest_combo >= 10) badges.push('Combo Legend');
  else if (stats.highest_combo >= 5) badges.push('Streak Builder');
  if (stats.total_score >= 10000) badges.push('Sacred Sage');
  else if (stats.total_score >= 5000) badges.push('Scripture Expert');
  else if (stats.total_score >= 1000) badges.push('Devoted Learner');
  if (stats.games_played > 0 && (stats.games_won / stats.games_played) >= 0.8) badges.push('Proverbs Master');
  return badges.length > 0 ? badges : ['New Scholar'];
};

// Derive user level from total score
const getUserLevel = (stats) => {
  if (!stats) return { level: 1, title: 'Novice' };
  const s = stats.total_score || 0;
  if (s >= 50000) return { level: 30, title: 'Archon' };
  if (s >= 20000) return { level: 22, title: 'Elder' };
  if (s >= 10000) return { level: 18, title: 'Scholar' };
  if (s >= 5000) return { level: 12, title: 'Disciple' };
  if (s >= 1000) return { level: 6, title: 'Acolyte' };
  return { level: 1, title: 'Novice' };
};

const GlobalDashboard = ({ 
  leaderboardData = [], 
  userStats, 
  user, 
  onBack, 
  onRefresh,
  onNavigate // new: navigate to other parts of the app
}) => {
  const displayData = leaderboardData.length > 0 ? leaderboardData : SAMPLE_LEADERBOARD;
  const top3 = displayData.slice(0, 3);
  const others = displayData.slice(3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumRanks = top3.length >= 3 ? [2, 1, 3] : [1, 2, 3];

  const badges = getUserBadges(userStats);
  const { level, title } = getUserLevel(userStats);
  const accuracy = userStats?.games_played > 0 ? Math.round((userStats.games_won / userStats.games_played) * 100) : 0;

  const navigate = (target) => {
    if (onNavigate) onNavigate(target);
    else if (onBack) onBack();
  };

  return (
    <div className="gd-overlay">
      <div className="gd-body">
        {/* Left Sidebar */}
        <aside className="gd-sidebar">
          <nav className="gd-sidenav">
            <button className="gd-nav-item" onClick={() => navigate('menu')}>
              <Home size={18} /> <span>Home</span>
            </button>
            <div className="gd-nav-group-label">Game Modes</div>
            <button className="gd-nav-item" onClick={() => navigate('setup-classic')}>
              <Swords size={18} /> <span>Classic</span>
            </button>
            <button className="gd-nav-item" onClick={() => navigate('setup-blitz')}>
              <Zap size={18} /> <span>Blitz</span>
            </button>
            <button className="gd-nav-item" onClick={() => navigate('setup-theme')}>
              <BookOpen size={18} /> <span>Theme</span>
            </button>
            <button className="gd-nav-item active">
              <Trophy size={18} /> <span>Global Leaderboard</span>
            </button>
            <button className="gd-nav-item" onClick={() => navigate('profile')}>
              <Award size={18} /> <span>Achievements</span>
            </button>
            <button className="gd-nav-item" onClick={() => navigate('profile')}>
              <User size={18} /> <span>Profile</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="gd-main">
          <div className="gd-main-header">
            <div>
              <h1 className="gd-title">GLOBAL LEADERBOARD</h1>
              <p className="gd-subtitle">Top Scholars</p>
            </div>
          </div>

          {/* Podium */}
          <div className="gd-podium">
            {podiumOrder.map((p, idx) => {
              const rank = podiumRanks[idx];
              const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
              return (
                <motion.div 
                  key={p.uid + '-' + rank}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className={`gd-podium-card rank-${rank}`}
                >
                  <div className="gd-medal">{medalEmoji}</div>
                  <img src={p.photo} alt={p.nickname} className="gd-podium-avatar" referrerPolicy="no-referrer" />
                  <h3 className="gd-podium-name">{rank}. {p.nickname}</h3>
                  <div className="gd-podium-rate">
                    {p.games_played > 0 ? ((p.games_won / p.games_played) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="gd-podium-score">
                    {p.total_score.toLocaleString()} <span className="gd-fire">🔥</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Table */}
          <div className="gd-table-wrapper">
            <table className="gd-table">
              <thead>
                <tr>
                  <th>Rank ⇅</th>
                  <th>Player</th>
                  <th className="text-right">Points</th>
                  <th className="text-right">Combo ⇅ 📋</th>
                </tr>
              </thead>
              <tbody>
                {others.map((p, i) => (
                  <motion.tr 
                    key={p.uid + '-' + i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className={p.uid === user?.uid ? 'is-me' : ''}
                  >
                    <td className="cell-rank">{i + 4}</td>
                    <td className="cell-player">
                      <img src={p.photo} alt="" className="gd-tbl-avatar" referrerPolicy="no-referrer" />
                      <span className="gd-tbl-name">{p.nickname}</span>
                      <span className="gd-tbl-flag">{p.flag || '🏳️'}</span>
                    </td>
                    <td className="cell-points text-right">{p.total_score.toLocaleString()}</td>
                    <td className="cell-combo text-right">🔥 {p.highest_combo}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* Right: My Stats (data-driven) */}
        <aside className="gd-stats-sidebar">
          <h3 className="gd-stats-title">MY STATS</h3>
          <div className="gd-stats-profile">
            <img 
              src={user?.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
              alt="" className="gd-stats-avatar" referrerPolicy="no-referrer" 
            />
            <div className="gd-stats-profile-info">
              <span className="gd-stats-name">{user?.displayName || 'Guest'}</span>
              <span className="gd-stats-rank">{title} • Level {level}</span>
              <span className="gd-stats-xp">{(userStats?.total_score || 0).toLocaleString()} XP</span>
            </div>
          </div>
          <div className="gd-xp-bar">
            <div className="gd-xp-fill" style={{ width: `${Math.min((userStats?.total_score || 0) / 500, 100)}%` }}></div>
          </div>

          <div className="gd-stats-rows">
            <div className="gd-stat-row">
              <span className="gd-stat-label">Total Games</span>
              <span className="gd-stat-value">{userStats?.games_played || 0}</span>
            </div>
            <div className="gd-stat-row">
              <span className="gd-stat-label">Wins</span>
              <span className="gd-stat-value">{userStats?.games_won || 0}</span>
            </div>
            <div className="gd-stat-row">
              <span className="gd-stat-label">Accuracy</span>
              <span className="gd-stat-value gd-bold">{accuracy}%</span>
            </div>
            <div className="gd-stat-row">
              <span className="gd-stat-label">High Score</span>
              <span className="gd-stat-value gd-bold">{(userStats?.total_score || 0).toLocaleString()}</span>
            </div>
            <div className="gd-stat-row">
              <span className="gd-stat-label">Best Combo</span>
              <span className="gd-stat-value gd-combo">{userStats?.highest_combo || 0} 🔥</span>
            </div>
          </div>

          <div className="gd-badges-section">
            <span className="gd-badges-label">Badges</span>
            <div className="gd-badges-list">
              {badges.map((b, i) => <span key={i} className="gd-badge">{b}</span>)}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GlobalDashboard;
