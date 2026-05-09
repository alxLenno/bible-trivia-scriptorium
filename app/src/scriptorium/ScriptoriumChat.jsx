import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Volume2, Search, X } from 'lucide-react';
import { sendScriptoriumChat } from './scriptoriumService';
import './ScriptoriumChat.css';

const ScriptoriumChat = ({ onClose, initialContext = {} }) => {
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
                {msg.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i !== msg.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
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
