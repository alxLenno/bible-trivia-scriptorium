import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Volume2, Search, X } from 'lucide-react';
import { sendScriptoriumChat } from './scriptoriumService';
import { generateTTS } from '../aiService';
import BibleTextWithRefs from '../components/common/BibleTextWithRefs';
import VerseLookup from '../components/common/VerseLookup';
import { AnimatePresence } from 'framer-motion';
import './ScriptoriumChat.css';

const ScriptoriumChat = ({ onClose, initialContext = {}, handleVerseLookup, lookupRef, closeLookup }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      text: "Peace be with you. I am your Scriptorium Partner. Let us search the Scriptures together. What passage shall we study today?", 
      isScriptorium: true 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState(initialContext);
  const messagesEndRef = useRef(null);
  
  const audioQueueRef = useRef([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleReadAloud = async (text) => {
    if (isPlaying) {
      window.speechSynthesis.cancel(); // Safety stop
      audioQueueRef.current.forEach(audio => audio.pause());
      audioQueueRef.current = [];
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    
    // 1. Split text into chunks (sentences)
    const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    const playNext = async (index) => {
      if (index >= chunks.length) {
        setIsPlaying(false);
        return;
      }

      const audioUrl = await generateTTS(chunks[index]);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioQueueRef.current.push(audio);
        audio.onended = () => playNext(index + 1);
        audio.play().catch(e => {
          console.error("Playback failed", e);
          playNext(index + 1);
        });
      } else {
        // Fallback to Web Speech if AI TTS fails for a chunk
        const speech = new SpeechSynthesisUtterance(chunks[index]);
        speech.onend = () => playNext(index + 1);
        window.speechSynthesis.speak(speech);
      }
    };

    playNext(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Build history for context
      const history = messages.map(m => ({ 
        role: m.role === 'ai' ? 'assistant' : 'user', 
        content: m.text 
      }));

      // Calculate turn count for Father's Heart Rule
      const turnCount = Math.floor(messages.length / 2);
      const currentContext = { ...context, turn_count: turnCount };

      const response = await sendScriptoriumChat(userMessage, history, currentContext);
      
      if (response.error) {
        setMessages(prev => [...prev, { role: 'ai', text: response.text, error: true }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: response.text, 
          isScriptorium: response.scriptoriumActive,
          genre: response.genreDetected
        }]);
        
        // Update context if genre detected
        if (response.genreDetected && !context.genre) {
          setContext(prev => ({ ...prev, genre: response.genreDetected }));
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "A connection error occurred. Please try again.", error: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="scriptorium-chat-container">
      <div className="scriptorium-header">
        <div className="scriptorium-title">
          <BookOpen className="scriptorium-icon" />
          <div>
            <h2>Scriptorium Study</h2>
            {context.genre && <span className="genre-badge">{context.genre.toUpperCase()}</span>}
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X /></button>
      </div>

      <div className="scriptorium-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-wrapper ${msg.role}`}>
            <div className={`message-bubble ${msg.role} ${msg.isScriptorium ? 'scriptorium-ai' : ''} ${msg.error ? 'error' : ''}`}>
              {msg.isScriptorium && msg.role === 'ai' && (
                <div className="scriptorium-badge">Scriptorium Partner</div>
              )}
              <div className="message-text">
                <BibleTextWithRefs 
                  text={msg.text} 
                  onLookup={handleVerseLookup} 
                  onSuggestionClick={msg.role === 'ai' ? (text) => setInput(text) : null}
                />
                {msg.role === 'ai' && !msg.error && (
                  <button 
                    className={`play-audio-btn ${isPlaying ? 'playing' : ''}`} 
                    onClick={() => handleReadAloud(msg.text)}
                    style={{ marginTop: '12px' }}
                  >
                    {isPlaying ? '⏹ Stop Scribe' : '🔊 Listen to Scribe'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper ai">
            <div className="message-bubble ai loading">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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

      <div className="scriptorium-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask a question, share an insight, or cite a passage..."
          rows="2"
        />
        <button 
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ScriptoriumChat;
