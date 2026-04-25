import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Sparkles, Send } from 'lucide-react';
import BibleTextWithRefs from '../common/BibleTextWithRefs';
import VerseLookup from '../common/VerseLookup';
import './AIChat.css';

const AIChat = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  chatSessions, 
  activeSessionId, 
  handleSelectSession, 
  handleDeleteSession, 
  startNewSession, 
  chatMessages, 
  chatLoading, 
  chatInput, 
  setChatInput, 
  chatModel,
  setChatModel,
  handleSendMessage, 
  handleVerseLookup,
  lookupRef,
  closeLookup,
  chatScrollRef, 
  onExit 
}) => {
  const [visibleCount, setVisibleCount] = useState(10);

  return (
    <div className="chat-layout">
      {/* Sessions Sidebar */}
      <aside className={`chat-history-sidebar glass-panel ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <h3>ARCHIVES</h3>
            <button onClick={startNewSession} className="new-chat-btn" title="New Session">
              <MessageSquare size={16}/>
            </button>
          </div>
          <div className="sessions-list">
            {chatSessions.slice(0, visibleCount).map(s => (
              <div 
                key={s.session_id} 
                className={`session-item ${activeSessionId === s.session_id ? 'active' : ''}`} 
                onClick={() => handleSelectSession(s.session_id)}
              >
                <MessageSquare size={14} className="session-icon" />
                <span className="session-title">{s.title || 'Divine Dialogue'}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.session_id); }} 
                  className="delete-session-btn"
                >
                  &times;
                </button>
              </div>
            ))}
            {chatSessions.length > visibleCount && (
              <button 
                className="load-more-btn" 
                onClick={() => setVisibleCount(prev => prev + 10)}
              >
                Load More Archives
              </button>
            )}
            {chatSessions.length === 0 && <p className="empty-sessions">No previous records.</p>}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="chat-container glass-panel"
      >
        <header className="chat-interface-header">
          <div className="chat-meta">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Search size={18}/>
            </button>
            <div className="scribe-info">
              <Sparkles size={20} className="gold-icon" />
              <h3>AI SCRIBE</h3>
            </div>
          </div>
          <button className="exit-chat-btn" onClick={onExit}>Exit</button>
        </header>
        
        <div className="chat-messages" ref={chatScrollRef}>
          {chatMessages.map((m, i) => (
            <div key={i} className={`msg-bubble ${m.role}`}>
              <div className="msg-content">
                <BibleTextWithRefs 
                  text={m.text} 
                  onLookup={handleVerseLookup} 
                  onSuggestionClick={m.role === 'ai' ? (text) => setChatInput(text) : null}
                />
                {m.audio && (
                  <button className="play-audio-btn" onClick={() => new Audio(m.audio).play()}>
                    🔊 Listen to Insight
                  </button>
                )}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="msg-bubble ai loading-bubble">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Verse Popover — positioned at click location */}
        <AnimatePresence>
          {lookupRef && (
            <VerseLookup 
              reference={lookupRef.ref} 
              version="KJV" 
              position={{ x: lookupRef.x, y: lookupRef.y }}
              onClose={closeLookup} 
            />
          )}
        </AnimatePresence>
        
        <div className="chat-input-wrapper">
          <div className="chat-input-controls">
            <select 
              value={chatModel} 
              onChange={(e) => setChatModel(e.target.value)}
              className="chat-model-select-bottom"
              disabled={chatLoading}
            >
              <option value="llama-3-8b">Llama 3 (8B)</option>
              <option value="llama-3-70b">Llama 3 (70B)</option>
              <option value="mixtral">Mixtral</option>
              <option value="gemma">Gemma 2</option>
            </select>
          </div>
          <div className="input-field-area">
            <input 
              placeholder="Ask a question about the sacred texts..." 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            />
            <button className="send-msg-btn" onClick={() => handleSendMessage()} disabled={chatLoading || !chatInput.trim()}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AIChat;
