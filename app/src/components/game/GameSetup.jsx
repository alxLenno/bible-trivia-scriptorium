import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Hash, Clock, Search, Plus, X } from 'lucide-react';
import { bibleTopics } from '../../constants';
import { AVAILABLE_VERSIONS, getNativeBookNames } from '../../bibleLookup';
import { getTranslation } from '../../translations';
import './GameSetup.css';

const GameSetup = ({ 
  isMultiplayer, 
  config, 
  setConfig, 
  selectedBook, 
  setSelectedBook, 
  searchTerm, 
  setSearchTerm, 
  onStart, 
  loading 
}) => {
  const versions = AVAILABLE_VERSIONS;
  const [nativeBooks, setNativeBooks] = useState([]);
  const [customTopics, setCustomTopics] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', references: '' });

  // Load custom topics from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('scriptorium_custom_topics');
    if (saved) {
      try {
        setCustomTopics(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse custom topics", e);
      }
    }
  }, []);

  const saveCustomTopic = () => {
    if (!newTopic.name) return;
    const topic = {
      id: `custom_${Date.now()}`,
      name: newTopic.name,
      icon: 'Layers', // Default icon for custom topics
      references: newTopic.references.split(',').map(r => r.trim()).filter(r => r),
      isCustom: true
    };
    const updated = [...customTopics, topic];
    setCustomTopics(updated);
    localStorage.setItem('scriptorium_custom_topics', JSON.stringify(updated));
    setNewTopic({ name: '', references: '' });
    setShowAddModal(false);
  };

  const removeCustomTopic = (id, e) => {
    e.stopPropagation();
    const updated = customTopics.filter(t => t.id !== id);
    setCustomTopics(updated);
    localStorage.setItem('scriptorium_custom_topics', JSON.stringify(updated));
    if (config.target === id) setConfig({ ...config, target: null });
  };

  const allTopics = [...bibleTopics, ...customTopics];

  useEffect(() => {
    let isMounted = true;
    getNativeBookNames(config.version).then(books => {
      if (isMounted && books.length > 0) {
        // Map the names to include generic chapter counts (since we rely on structure, we just estimate 50 for max, or use the length of the book node)
        // Since getNativeBookNames only returns strings, we'll just map them. For chapters, we can use 50 as a safe upper bound for the selector.
        setNativeBooks(books.map(name => ({ name, chapters: 50 })));
      }
    });
    return () => { isMounted = false; };
  }, [config.version]);

  const t = (key) => getTranslation(config.version, key);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0 }} 
      className="setup-container"
    >
      <div className="glass-panel selection-card">
        <div className="setup-header">
          <div className="setup-badge">{isMultiplayer ? t('multiplayer') : t('soloTrial')}</div>
          <h2>{isMultiplayer ? `⚔️ ${t('configureBattle')}` : `📖 ${t('prepareStudy')}`}</h2>
        </div>

        <div className="version-bar">
          {versions.map(v => (
            <button 
              key={v} 
              className={`v-pill ${config.version === v ? 'active' : ''}`} 
              onClick={() => setConfig({ ...config, version: v })}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="setup-sections">
          <section className="setup-block">
            <label className="section-label"><Layers size={18} /> {t('challengeMode')}</label>
            <div className="mode-tabs">
              {['general', 'topic', 'book', 'chapter'].map(m => (
                <button 
                  key={m} 
                  className={`mode-tab ${config.mode === m ? 'active' : ''}`}
                  onClick={() => { setConfig({ ...config, mode: m, target: null }); setSelectedBook(null); }}
                >
                  {t(m)}
                </button>
              ))}
            </div>
          </section>

          <section className="setup-block content-area">
            {config.mode === 'topic' && (
              <div className="topics-grid">
                {allTopics.map(t => (
                  <button 
                    key={t.id} 
                    className={`topic-card ${config.target === t.id ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, target: t.id })}
                  >
                    {t.isCustom && (
                      <div className="remove-topic" onClick={(e) => removeCustomTopic(t.id, e)}>
                        <X size={12} />
                      </div>
                    )}
                    <span>{t.name}</span>
                  </button>
                ))}
                <button className="topic-card add-topic-btn" onClick={() => setShowAddModal(true)}>
                  <Plus size={24} />
                  <span>Add New</span>
                </button>
              </div>
            )}

            {/* Custom Topic Modal */}
            {showAddModal && (
              <div className="modal-overlay animate-fade-in">
                <div className="glass-panel modal-content">
                  <h3>Add Custom Topic</h3>
                  <div className="form-group">
                    <label>Topic Name</label>
                    <input 
                      placeholder="e.g. Parables" 
                      value={newTopic.name}
                      onChange={e => setNewTopic({ ...newTopic, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bible References (comma separated)</label>
                    <input 
                      placeholder="e.g. Luke 15:1, Matthew 13:1" 
                      value={newTopic.references}
                      onChange={e => setNewTopic({ ...newTopic, references: e.target.value })}
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button className="btn-primary" onClick={saveCustomTopic} disabled={!newTopic.name}>Save Topic</button>
                  </div>
                </div>
              </div>
            )}

            {config.mode === 'book' && (
              <div className="selector-box">
                <div className="search-bar">
                  <Search size={16} />
                  <input placeholder={t('searchBooks')} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="scroll-list">
                  {nativeBooks.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map(b => (
                    <button 
                      key={b.name} 
                      className={`list-item ${config.target === b.name ? 'active' : ''}`}
                      onClick={() => setConfig({ ...config, target: b.name })}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {config.mode === 'chapter' && (
              <div className="selector-box multi-col">
                <div className="book-picker">
                  <div className="search-bar">
                    <Search size={16} />
                    <input placeholder={t('searchBooks')} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="scroll-list">
                    {nativeBooks.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map(b => (
                      <button 
                        key={b.name} 
                        className={`list-item ${selectedBook === b.name ? 'active' : ''}`}
                        onClick={() => setSelectedBook(b.name)}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="chapter-picker">
                  {selectedBook ? (
                    <div className="chapters-container animate-fade-in">
                      <p className="sub-label">{t('chaptersIn')} {selectedBook}</p>
                      <div className="chapter-grid">
                        {Array.from({ length: nativeBooks.find(b => b.name === selectedBook)?.chapters || 50 }, (_, i) => i + 1).map(ch => (
                          <button 
                            key={ch}
                            className={`chapter-node ${config.target?.book === selectedBook && config.target?.chapter === ch ? 'active' : ''}`}
                            onClick={() => setConfig({ ...config, target: { book: selectedBook, chapter: ch } })}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-chapter-state">{t('selectBookFirst')}</div>
                  )}
                </div>
              </div>
            )}

            {config.mode === 'general' && (
              <div className="general-info-card">
                <p>{t('generalInfo')}</p>
              </div>
            )}
          </section>

          <div className="setup-footer-grid">
            <section className="setup-block">
              <label className="section-label"><Zap size={18} /> {t('intensity')}</label>
              <div className="difficulty-pills">
                {['easy', 'medium', 'hard', 'scriptorium'].map(d => (
                  <button 
                    key={d} 
                    className={`diff-pill ${config.difficulty === d ? 'active' : ''} d-${d}`}
                    onClick={() => setConfig({ 
                      ...config, 
                      difficulty: d,
                      ...(d === 'scriptorium' && config.timePerQuestion < 30 ? { timePerQuestion: 30 } : {})
                    })}
                  >
                    {d === 'scriptorium' ? '✦ DEEP' : t(d)}
                  </button>
                ))}
              </div>
            </section>

            <section className="setup-block stats-inputs">
              <div className="input-group">
                <label><Hash size={16} /> {t('count')}</label>
                <select value={config.numQuestions} onChange={e => setConfig({ ...config, numQuestions: parseInt(e.target.value) })}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>
              <div className="input-group">
                <label><Clock size={16} /> {t('time')}</label>
                <input type="number" value={config.timePerQuestion} onChange={e => setConfig({ ...config, timePerQuestion: parseInt(e.target.value) })} />
              </div>
            </section>
          </div>
        </div>

        <button 
          className="btn-primary start-game-btn"
          onClick={onStart}
          disabled={loading || (config.mode !== 'general' && !config.target)}
        >
          {loading ? t('preparingText') : isMultiplayer ? t('generateRoom') : t('beginTrial')}
        </button>
      </div>
    </motion.div>
  );
};

export default GameSetup;
