import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Trophy, Sparkles } from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ user, onSignIn, onEnter }) => {
  return (
    <div className="landing-container">
      {/* Decorative background blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <nav className="landing-nav">
        <div className="logo-area">
          <BookOpen className="nav-icon" size={24} />
          <span>Scriptorium</span>
        </div>
        {user ? (
          <button onClick={onEnter} className="btn-outline sign-in-btn">
            Enter Sanctuary
          </button>
        ) : (
          <button onClick={onSignIn} className="btn-outline sign-in-btn">
            Sign In
          </button>
        )}
      </nav>

      <main className="landing-main">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="badge-pill">
            <Sparkles size={14} /> Glassmorphism 3.0 Edition
          </div>
          <h1 className="hero-title">Divine Knowledge,<br/><span>Elevated.</span></h1>
          <p className="hero-subtitle">
            Experience the ultimate AI-powered Bible trivia. Journey through the scriptures, compete globally, and deepen your faith in real-time.
          </p>
          {user ? (
            <button onClick={onEnter} className="btn-primary cta-btn">
              Enter the Sanctuary
            </button>
          ) : (
            <button onClick={onSignIn} className="btn-primary cta-btn">
              Begin Your Trial
            </button>
          )}
        </motion.div>

        <motion.div 
          className="features-grid"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <div className="feature-card glass-panel">
            <div className="icon-wrapper"><BookOpen size={24} /></div>
            <h3>AI-Crafted Trivia</h3>
            <p>Endless, intelligently generated questions tailored to any book, chapter, or topic with full biblical explanations.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="icon-wrapper"><Users size={24} /></div>
            <h3>Real-time Multiplayer</h3>
            <p>Challenge friends in synchronized lobbies. May the most knowledgeable scribe win the sacred points.</p>
          </div>
          <div className="feature-card glass-panel">
            <div className="icon-wrapper"><Trophy size={24} /></div>
            <h3>Global Leaderboards</h3>
            <p>Track your wins, perfect combos, and rise through the ranks of the Scriptorium community.</p>
          </div>
        </motion.div>
      </main>
      
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} AβY Scriptorium. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
