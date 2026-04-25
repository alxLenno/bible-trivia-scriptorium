import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Hash, Clock, Search } from 'lucide-react';
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
                {bibleTopics.map(t => (
                  <button 
                    key={t.id} 
                    className={`topic-card ${config.target === t.id ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, target: t.id })}
                  >
                    <span>{t.name}</span>
                  </button>
                ))}
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
                {['easy', 'medium', 'hard'].map(d => (
                  <button 
                    key={d} 
                    className={`diff-pill ${config.difficulty === d ? 'active' : ''} d-${d}`}
                    onClick={() => setConfig({ ...config, difficulty: d })}
                  >
                    {t(d)}
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
