import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = ({ adminUsers, adminLoading, onExit }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0 }} 
      className="admin-viewport"
    >
      <div className="glass-panel admin-card">
        <header className="admin-header">
          <div className="admin-title-group">
            <Sparkles size={24} className="razz-icon" />
            <h2>Administrative Override</h2>
          </div>
          <button className="btn-outline compact" onClick={onExit}>Return to Profile</button>
        </header>
        
        <div className="admin-content">
          {adminLoading ? (
            <div className="loading-state">Syncing with user archives...</div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Scholar</th>
                    <th>UID Reference</th>
                    <th className="text-right">Total Score</th>
                    <th className="text-right">Trials</th>
                    <th className="text-right">Victories</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">Max Combo</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u, i) => (
                    <tr key={i}>
                      <td className="cell-user">
                        <div className="user-info">
                          {u.photo ? (
                            <img src={u.photo} alt="" className="user-thumb" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="user-thumb-placeholder">{u.nickname?.charAt(0) || '?'}</div>
                          )}
                          <span className="user-nick">{u.nickname}</span>
                        </div>
                      </td>
                      <td className="cell-uid"><code>{u.uid}</code></td>
                      <td className="cell-val text-right gold">{u.total_score}</td>
                      <td className="cell-val text-right">{u.games_played}</td>
                      <td className="cell-val text-right">{u.games_won}</td>
                      <td className="cell-val text-right">
                        {u.games_played > 0 ? Math.round((u.games_won / u.games_played) * 100) : 0}%
                      </td>
                      <td className="cell-val text-right razz">🔥 {u.highest_combo}</td>
                    </tr>
                  ))}
                  {adminUsers.length === 0 && (
                    <tr><td colSpan="7" className="empty-row">No records discovered in this sector.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPanel;
